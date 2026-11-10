import { activeVariant, isModuleEnabled } from '../config/variants.js';
import { moduleHref } from '../config/modules.js';
import { getDataForVariant, getProject } from '../data/mock-data.js';
import { COST_SOURCES, projectCostModel } from '../data/cost-data.js';
import { formatDate } from './project-views.js';
import { formatMoney, writeProjectId } from './shell.js';

const data = getDataForVariant(activeVariant);
const sourceIds = COST_SOURCES.map((item) => item.id);

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
    formatMoney,
    formatDate,
    sourcesCatalog: COST_SOURCES,
    hasWarehouse: isModuleEnabled('warehouse'),
    moduleHref,
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
    get alerts() {
      const alerts = [];
      if (this.financials.executionPercent >= 80)
        alerts.push({
          level: 'warning',
          text: `La ejecución alcanza ${this.financials.executionPercent} % del presupuesto de ${this.project.id}.`,
        });
      for (const part of this.parts.filter((item) => item.executionPercent > 100))
        alerts.push({
          level: 'warning',
          text: `${part.label} supera su asignación referencial en ${formatMoney(-part.variation)}.`,
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
      document.title = `Costos por Proyecto · ${activeVariant.company.shortName}`;
      if (this.projectId) writeProjectId(this.projectId);
      this.$nextTick(() => this.renderChart());
    },
    selectProject(id) {
      if (!getProject(data, id)) return;
      this.projectId = id;
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
    async renderChart() {
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
