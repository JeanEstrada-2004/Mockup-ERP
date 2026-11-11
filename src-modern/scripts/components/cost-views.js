import { activeVariant, isModuleEnabled, variantRule } from '../config/variants.js';
import { moduleHref } from '../config/modules.js';
import { getDataForVariant, getProject } from '../data/mock-data.js';
import { COST_SOURCES, projectCostModel } from '../data/cost-data.js';
import { formatAmount } from '../data/commercial-data.js';
import {
  GROUPINGS,
  TREATMENT_COLUMNS,
  costLines,
  groupLines,
  treatmentTotals,
} from '../data/cost-treatment.js';
import { formatDate, projectFlowData } from './project-views.js';
import { formatMoney, writeProjectId } from './shell.js';

const data = getDataForVariant(activeVariant);
const sourceIds = COST_SOURCES.map((item) => item.id);
// R3: J&Y Demo shows only confirmed rules and adds J&Y Real vs. formal treatment.
const hasProgress = variantRule('physicalProgress');
const alertPercent = variantRule('budgetAlertPercent');
const hasTreatment = variantRule('costTreatment');

export function costWorkspace() {
  const params = new URLSearchParams(location.search);
  const linkedOperation = data.operations.find(
    (item) => `COST-${item.id}` === params.get('record') || item.id === params.get('operation')
  );
  const initialProject =
    getProject(data, params.get('project')) ||
    getProject(data, params.get('id')) ||
    getProject(data, linkedOperation?.projectId) ||
    data.projects[0];
  const initialSource = sourceIds.includes(params.get('source'))
    ? params.get('source')
    : linkedOperation?.costSource || '';
  return {
    projects: data.projects,
    projectId: initialProject?.id || '',
    sourceFilter: initialSource,
    operationId: linkedOperation?.id || '',
    budgetChart: null,
    flowChart: null,
    formatMoney,
    formatDate,
    sourcesCatalog: COST_SOURCES,
    hasWarehouse: isModuleEnabled('warehouse'),
    hasProgress,
    hasTreatment,
    hasControlParts: variantRule('controlAllocation'),
    moduleHref,
    formatAmount,
    treatmentColumns: TREATMENT_COLUMNS,
    groupings: GROUPINGS,
    grouping: GROUPINGS.some((item) => item.id === params.get('group'))
      ? params.get('group')
      : 'category',
    consolidationScope: params.get('scope') === 'all' ? 'all' : 'project',
    consolidationGroup: '',
    treatmentChart: null,
    categoryChart: null,
    // ---- J&Y Real and formal treatment (R3) ----------------------------
    get lines() {
      return hasTreatment ? costLines(data, this.projectId) : [];
    },
    get treatment() {
      return treatmentTotals(this.lines);
    },
    get treatmentLabel() {
      return `Costo J&Y Real ${formatAmount(this.treatment.total)}: ${TREATMENT_COLUMNS.map(
        (column) => `${column.label} ${formatAmount(this.treatment[column.id])}`
      ).join(', ')}`;
    },
    get categories() {
      return groupLines(data, this.lines, 'category');
    },
    get scopedLines() {
      if (!hasTreatment) return [];
      return this.consolidationScope === 'all' ? costLines(data) : this.lines;
    },
    get consolidation() {
      return groupLines(data, this.scopedLines, this.grouping);
    },
    get consolidationTotals() {
      return treatmentTotals(this.scopedLines);
    },
    get consolidationLines() {
      return this.consolidation.find((group) => group.key === this.consolidationGroup)?.lines || [];
    },
    lineHref(line) {
      if (line.source === 'expenses' && line.itemId)
        return `./expense.html?id=${encodeURIComponent(line.operationId)}&item=${encodeURIComponent(line.itemId)}`;
      return this.entryHrefFor(line.projectId, line.source, line.operationId);
    },
    entryHrefFor(projectId, source, operationId) {
      return `./costs.html?${new URLSearchParams({ project: projectId, source, operation: operationId })}`;
    },
    get project() {
      return getProject(data, this.projectId);
    },
    get model() {
      return projectCostModel(data, this.projectId);
    },
    get financials() {
      return this.model?.financials;
    },
    get sources() {
      return this.model?.sources || [];
    },
    get parts() {
      return this.model?.parts || [];
    },
    get commitments() {
      return this.model?.commitments || [];
    },
    get sourceTotal() {
      return this.sources.reduce((sum, item) => sum + item.amount, 0);
    },
    get visibleEntries() {
      return (this.model?.entries || [])
        .filter((item) => !this.sourceFilter || item.source === this.sourceFilter)
        .sort((a, b) => b.date.localeCompare(a.date) || a.operationId.localeCompare(b.operationId));
    },
    get selectedEntry() {
      return this.model?.entries.find((item) => item.operationId === this.operationId) || null;
    },
    get sourceTitle() {
      return (
        this.sources.find((item) => item.id === this.sourceFilter)?.label || 'Todas las fuentes'
      );
    },
    // Spending more than 5 points ahead of physical progress (same rule as
    // "Ejecución frente al avance" in the Panel).
    get executionAhead() {
      if (!hasProgress) return false;
      return this.financials.executionPercent > (this.project?.progressPercent ?? 100) + 5;
    },
    get alerts() {
      const alerts = [];
      const pct = (value) => `${(Math.round(value * 10) / 10).toString().replace('.', ',')} %`;
      if (
        this.executionAhead ||
        (alertPercent !== null && this.financials.executionPercent >= alertPercent)
      )
        alerts.push({
          level: 'warning',
          text: hasProgress
            ? `${this.project.id} ha consumido ${pct(this.financials.executionPercent)} del presupuesto con ${this.project.progressPercent} % de avance.`
            : `${this.project.id} ha consumido ${pct(this.financials.executionPercent)} del presupuesto.`,
        });
      for (const part of this.hasControlParts
        ? this.parts.filter((item) => item.executionPercent > 100)
        : [])
        alerts.push({
          level: 'warning',
          text: `Partida ${part.label} supera el presupuesto referencial en ${pct(part.executionPercent - 100)} (${formatMoney(-part.variation)}).`,
        });
      if (this.financials.availableToCommit < 0)
        alerts.push({
          level: 'danger',
          text: 'Los compromisos abiertos superan el saldo del presupuesto.',
        });
      return alerts;
    },
    get projectHref() {
      return moduleHref('projects', this.projectId);
    },
    operationHref(entry) {
      if (!entry) return null;
      const moduleId = {
        purchases: 'purchases',
        expenses: 'expenses',
        personnel: 'personnel',
        materials: 'warehouse',
      }[entry.source];
      if (!moduleId) return null;
      const params = new URLSearchParams({
        from: 'costs',
        project: this.projectId,
        source: entry.source,
        operation: entry.operationId,
      });
      return `${moduleHref(moduleId, entry.operationId)}&${params}`.replace('.html&', '.html?');
    },
    documentHref(entry) {
      if (!entry) return null;
      const params = new URLSearchParams({
        id: entry.documentId,
        from: 'costs',
        project: this.projectId,
        source: entry.source,
        operation: entry.operationId,
      });
      return `./document.html?${params}`;
    },
    sourceHref(id) {
      const params = new URLSearchParams({ project: this.projectId, source: id });
      return `./costs.html?${params}`;
    },
    entryHref(entry) {
      const params = new URLSearchParams({
        project: this.projectId,
        source: entry.source,
        operation: entry.operationId,
      });
      return `./costs.html?${params}`;
    },
    supplierName(id) {
      return data.suppliers.find((item) => item.id === id)?.name || '—';
    },
    workerName(id) {
      return data.workers.find((item) => item.id === id)?.name || '—';
    },
    materialName(id) {
      return data.materials.find((item) => item.id === id)?.name || '—';
    },
    init() {
      document.title = `${hasTreatment ? 'Costos y Control Contable' : 'Costos por Proyecto'} · ${activeVariant.company.shortName}`;
      if (this.projectId) writeProjectId(this.projectId);
      this.$nextTick(() => this.renderChart());
    },
    selectProject(id) {
      if (!getProject(data, id)) return;
      this.projectId = id;
      this.consolidationGroup = '';
      this.sourceFilter = '';
      this.operationId = '';
      writeProjectId(id);
      this.updateUrl();
      this.$nextTick(() => this.renderChart());
    },
    selectSource(id) {
      this.sourceFilter = sourceIds.includes(id) ? id : '';
      this.operationId = '';
      this.updateUrl();
    },
    selectOperation(entry) {
      this.sourceFilter = entry.source;
      this.operationId = entry.operationId;
      this.updateUrl();
    },
    closeOperation() {
      this.operationId = '';
      this.updateUrl();
    },
    updateUrl() {
      const next = new URL(location.href);
      for (const key of ['id', 'record', 'project', 'source', 'operation'])
        next.searchParams.delete(key);
      next.searchParams.set('project', this.projectId);
      if (this.sourceFilter) next.searchParams.set('source', this.sourceFilter);
      if (this.operationId) next.searchParams.set('operation', this.operationId);
      history.replaceState(null, '', next);
    },
    async renderFlow() {
      const element = document.getElementById('cost-flow-chart');
      const flowData = projectFlowData(this.projectId);
      if (!element || !flowData) return;
      if (this.flowChart) {
        this.flowChart.update(flowData);
        return;
      }
      const { render } = await import('../charts/flow.js');
      this.flowChart = render(element, flowData, {
        height: 300,
        label: `Trazabilidad del costo de ${this.projectId}: fuentes, ejecutado y presupuesto`,
      });
    },
    async renderTreatment() {
      if (!hasTreatment) return;
      const barElement = document.getElementById('cost-treatment-bar');
      const chartElement = document.getElementById('cost-category-chart');
      const barData = TREATMENT_COLUMNS.map((column) => ({
        label: column.label,
        value: this.treatment[column.id],
        color: column.color,
      }));
      const categoryData = {
        categories: this.categories.map((item) => item.label),
        series: [
          { label: 'Costo', color: '--s1', values: this.categories.map((item) => item.total) },
        ],
      };
      const [split, bars] = await Promise.all([
        import('../charts/split-bar.js'),
        import('../charts/bars.js'),
      ]);
      if (barElement) {
        if (this.treatmentChart?.update) this.treatmentChart.update(barData);
        else
          this.treatmentChart = split.render(barElement, barData, { label: this.treatmentLabel });
      }
      if (chartElement) {
        this.categoryChart?.destroy?.();
        chartElement.replaceChildren();
        this.categoryChart = bars.render(chartElement, categoryData, {
          orientation: 'horizontal',
          labelWidth: 210,
          height: Math.max(160, this.categories.length * 34 + 40),
          label: `Costo por categoría de ${this.projectId}, en soles`,
          table: false,
        });
      }
    },
    async renderChart() {
      this.renderFlow();
      this.renderTreatment();
      const element = document.getElementById('cost-budget-chart');
      if (!element || !this.financials) return;
      const { render } = await import('../charts/bars.js');
      // Same series slots as the Panel: budget --s1, executed --s2;
      // committed uses --s3 like the flow chart.
      const chartData = {
        categories: ['Presupuesto', 'Comprometido total', 'Ejecutado'],
        series: [
          {
            label: 'Soles',
            color: '--s1',
            values: [
              this.financials.budgetAmount,
              this.financials.committedCost,
              this.financials.executedCost,
            ],
          },
        ],
        colors: ['--s1', '--s3', '--s2'],
      };
      if (this.budgetChart?.update) {
        this.budgetChart.update(chartData);
        return;
      }
      element.replaceChildren();
      this.budgetChart = render(element, chartData, {
        orientation: 'horizontal',
        labelWidth: 140,
        label: 'Presupuesto, costo comprometido total y costo ejecutado del proyecto, en soles',
        table: false,
      });
    },
  };
}
