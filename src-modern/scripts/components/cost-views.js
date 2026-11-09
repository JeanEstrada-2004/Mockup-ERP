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
      const { default: ApexCharts } = await import('apexcharts');
      this.budgetChart?.destroy();
      element.replaceChildren();
      const dark = document.documentElement.getAttribute('data-bs-theme') === 'dark';
      const styles = getComputedStyle(document.documentElement);
      this.budgetChart = new ApexCharts(element, {
        chart: {
          type: 'bar',
          height: 260,
          toolbar: { show: false },
          animations: { enabled: false },
          background: 'transparent',
          foreColor: styles.getPropertyValue('--bs-secondary-color').trim(),
        },
        series: [
          {
            name: 'Soles',
            data: [
              this.financials.budgetAmount,
              this.financials.committedCost,
              this.financials.executedCost,
            ],
          },
        ],
        colors: [
          styles.getPropertyValue('--brand-accent').trim() || '#2563eb',
          '#f59e0b',
          '#0ea5e9',
        ],
        plotOptions: { bar: { horizontal: true, distributed: true, borderRadius: 4 } },
        xaxis: {
          categories: ['Presupuesto', 'Comprometido total', 'Ejecutado'],
          labels: { formatter: (value) => `S/ ${Math.round(value / 1000)} mil` },
        },
        dataLabels: { enabled: false },
        legend: { show: false },
        grid: { borderColor: styles.getPropertyValue('--bs-border-color').trim() },
        tooltip: { theme: dark ? 'dark' : 'light', y: { formatter: formatMoney } },
      });
      await this.budgetChart.render();
    },
  };
}
