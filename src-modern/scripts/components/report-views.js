import { activeVariant, isModuleEnabled } from '../config/variants.js';
import { moduleHref } from '../config/modules.js';
import {
  getCostBySource,
  getDataForVariant,
  getDocuments,
  getProjectFinancials,
} from '../data/mock-data.js';
import { COST_SOURCES } from '../data/cost-data.js';
import { COST_SOURCE_TOKENS, formatDate } from './project-views.js';
import { formatMoney, writeProjectId } from './shell.js';

const data = getDataForVariant(activeVariant);
const REPORT_STATUSES = ['Planificado', 'Activo', 'En riesgo', 'Suspendido', 'Cerrado'];
const IN_EXECUTION = ['Activo', 'En riesgo'];
const allowed = isModuleEnabled('reports');
const hasBI = isModuleEnabled('bi');
const reportDefs = [
  { id: 'projects', label: 'Proyectos', description: 'Avance, presupuesto y ejecución.' },
  { id: 'budgets', label: 'Presupuestos', description: 'Cotizaciones vinculadas a proyectos.' },
  { id: 'purchases', label: 'Compras', description: 'Órdenes y compromisos abiertos.' },
  { id: 'expenses', label: 'Rendiciones', description: 'Gastos y estados de revisión.' },
  { id: 'personnel', label: 'Tareo', description: 'Operaciones laborales de ejemplo.' },
  { id: 'costs', label: 'Costos', description: 'Operaciones ejecutadas por fuente.' },
  ...(isModuleEnabled('warehouse')
    ? [{ id: 'warehouse', label: 'Almacén', description: 'Salidas de material a proyectos.' }]
    : []),
  { id: 'documents', label: 'Documentos', description: 'Referencias y versiones documentales.' },
];
const months = [
  ...new Set(data.operations.map((item) => item.date?.slice(0, 7)).filter(Boolean)),
].sort();
function projectName(id) {
  return data.projects.find((item) => item.id === id)?.name || '—';
}
function operationHref(item) {
  const module = {
    purchase: 'purchases',
    expense: 'expenses',
    timesheet: 'personnel',
    material_issue: 'warehouse',
    other: 'costs',
  }[item.type];
  return item.type === 'other'
    ? moduleHref('costs', `COST-${item.id}`)
    : moduleHref(module, item.id);
}

export function reportsWorkspace() {
  const params = new URLSearchParams(location.search);
  return {
    allowed,
    hasBI,
    projects: data.projects,
    clients: data.clients,
    reportDefs,
    months,
    tab: hasBI && params.get('tab') === 'bi' ? 'bi' : 'reports',
    reportId: reportDefs.some((item) => item.id === params.get('report'))
      ? params.get('report')
      : 'projects',
    projectFilter: data.projects.some((item) => item.id === params.get('project'))
      ? params.get('project')
      : '',
    clientFilter: data.clients.some((item) => item.id === params.get('client'))
      ? params.get('client')
      : '',
    // Default scope = projects in execution, the same set the Panel General sums.
    statusFilter: [...REPORT_STATUSES, 'todos'].includes(params.get('status'))
      ? params.get('status')
      : 'ejecucion',
    periodFilter: months.includes(params.get('period')) ? params.get('period') : '',
    selectedSource: '',
    budgetChart: null,
    sourceChart: null,
    formatMoney,
    formatDate,
    projectName,
    moduleHref,
    getProjectFinancials: (id) => getProjectFinancials(data, id),
    get scopedProjects() {
      return this.projects.filter(
        (item) =>
          (!this.projectFilter || item.id === this.projectFilter) &&
          (!this.clientFilter || item.clientId === this.clientFilter) &&
          (this.statusFilter === 'todos' ||
            (this.statusFilter === 'ejecucion'
              ? IN_EXECUTION.includes(item.status)
              : item.status === this.statusFilter))
      );
    },
    get projectIds() {
      return new Set(this.scopedProjects.map((item) => item.id));
    },
    get scopeFinancials() {
      const rows = this.scopedProjects.map((item) => getProjectFinancials(data, item.id));
      return {
        projects: rows.length,
        budget: rows.reduce((sum, item) => sum + item.budgetAmount, 0),
        executed: rows.reduce((sum, item) => sum + item.executedCost, 0),
        committed: rows.reduce((sum, item) => sum + item.committedCost, 0),
        risk: this.scopedProjects.filter((item) => item.status === 'En riesgo').length,
        pendingExpenses: data.operations.filter(
          (item) =>
            this.projectIds.has(item.projectId) &&
            item.type === 'expense' &&
            item.status === 'En revisión'
        ).length,
      };
    },
    get sourceRows() {
      return COST_SOURCES.map((source) => ({
        ...source,
        amount: this.scopedProjects.reduce(
          (sum, item) => sum + (getCostBySource(data, item.id)[source.id] || 0),
          0
        ),
      }));
    },
    get sourceProjects() {
      return this.scopedProjects
        .map((item) => ({
          projectId: item.id,
          name: item.name,
          amount: getCostBySource(data, item.id)[this.selectedSource] || 0,
        }))
        .filter((item) => item.amount > 0);
    },
    get reportTitle() {
      return reportDefs.find((item) => item.id === this.reportId)?.label || 'Proyectos';
    },
    get reportRows() {
      const projectIds = this.projectIds;
      const period = this.periodFilter;
      if (this.reportId === 'projects')
        return this.scopedProjects.map((item) => ({
          id: item.id,
          label: item.name,
          projectId: item.id,
          date: item.startDate,
          detail: `${item.progressPercent} % de avance · ${item.status}`,
          amount: getProjectFinancials(data, item.id).executedCost,
          href: moduleHref('projects', item.id),
        }));
      if (this.reportId === 'budgets')
        return data.budgets
          .filter((item) => projectIds.has(item.projectId))
          .map((item) => ({
            id: item.id,
            label: `Presupuesto V${item.version}`,
            projectId: item.projectId,
            date: data.projects.find((p) => p.id === item.projectId).startDate,
            detail: item.status,
            amount: item.amount,
            href: moduleHref('budgets', item.id),
          }));
      if (this.reportId === 'documents')
        return getDocuments(data)
          .filter(
            (item) => projectIds.has(item.projectId) && (!period || item.date.startsWith(period))
          )
          .map((item) => ({
            id: item.id,
            label: item.type,
            projectId: item.projectId,
            date: item.date,
            detail: `V${item.version} · ${item.operationId}`,
            amount: null,
            href: moduleHref('documents', item.id),
          }));
      const types = {
        purchases: (item) => item.type === 'purchase',
        expenses: (item) => item.type === 'expense',
        personnel: (item) => item.type === 'timesheet',
        costs: (item) => Boolean(item.costSource),
        warehouse: (item) => item.type === 'material_issue',
      };
      return data.operations
        .filter(
          (item) =>
            projectIds.has(item.projectId) &&
            (!period || item.date.startsWith(period)) &&
            types[this.reportId]?.(item)
        )
        .map((item) => ({
          id: item.id,
          label:
            item.type === 'purchase' && item.inventoryLine
              ? 'Compra para inventario · sin costo ejecutado'
              : item.status,
          projectId: item.projectId,
          date: item.date,
          detail: item.costSource || item.status,
          amount: item.amount,
          href: operationHref(item),
        }))
        .sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
    },
    get monthlyCosts() {
      return months
        .filter((month) => !this.periodFilter || month === this.periodFilter)
        .map((month) => ({
          month,
          amount: data.operations
            .filter(
              (item) =>
                this.projectIds.has(item.projectId) &&
                item.costSource &&
                item.date.startsWith(month)
            )
            .reduce((sum, item) => sum + item.amount, 0),
        }));
    },
    init() {
      if (!allowed) return;
      document.title = `${hasBI ? 'Reportes y BI' : 'Reportes'} · ${activeVariant.company.shortName}`;
      if (this.projectFilter) writeProjectId(this.projectFilter);
      if (this.tab === 'bi') this.$nextTick(() => this.renderCharts());
    },
    setTab(id) {
      if (id === 'bi' && !hasBI) return;
      this.tab = id;
      this.updateUrl();
      if (id === 'bi') this.$nextTick(() => this.renderCharts());
    },
    setReport(id) {
      this.reportId = id;
      this.tab = 'reports';
      this.updateUrl();
    },
    setSource(id) {
      this.selectedSource = id;
    },
    updateFilters() {
      if (this.projectFilter) writeProjectId(this.projectFilter);
      this.selectedSource = '';
      this.updateUrl();
      if (this.tab === 'bi') this.$nextTick(() => this.renderCharts());
    },
    clearFilters() {
      this.projectFilter = '';
      this.clientFilter = '';
      this.statusFilter = 'ejecucion';
      this.periodFilter = '';
      this.updateFilters();
    },
    updateUrl() {
      const query = new URLSearchParams();
      if (this.tab === 'bi') query.set('tab', 'bi');
      if (this.tab === 'reports' && this.reportId !== 'projects')
        query.set('report', this.reportId);
      for (const [key, value] of [
        ['project', this.projectFilter],
        ['client', this.clientFilter],
        ['status', this.statusFilter === 'ejecucion' ? '' : this.statusFilter],
        ['period', this.periodFilter],
      ])
        if (value) query.set(key, value);
      history.replaceState(null, '', `./reports.html${query.size ? `?${query}` : ''}`);
    },
    async renderCharts() {
      if (!hasBI || this.tab !== 'bi') return;
      const budgetElement = document.getElementById('reports-budget-chart');
      const sourceElement = document.getElementById('reports-source-chart');
      if (!budgetElement || !sourceElement) return;
      const [{ render: renderBars }, { render: renderDonut }] = await Promise.all([
        import('../charts/bars.js'),
        import('../charts/donut.js'),
      ]);
      const budgetData = {
        categories: this.scopedProjects.map((item) => item.id),
        series: [
          {
            label: 'Presupuesto',
            color: '--s1',
            values: this.scopedProjects.map((item) => item.budgetAmount),
          },
          {
            label: 'Ejecutado',
            color: '--s2',
            values: this.scopedProjects.map(
              (item) => getProjectFinancials(data, item.id).executedCost
            ),
          },
        ],
      };
      const sourceData = this.sourceRows
        .filter((item) => item.amount > 0)
        .map((item) => ({
          label: item.label,
          value: item.amount,
          color: COST_SOURCE_TOKENS[item.id] || '--s-other',
        }));
      if (this.budgetChart?.update) this.budgetChart.update(budgetData);
      else {
        budgetElement.replaceChildren();
        this.budgetChart = renderBars(budgetElement, budgetData, {
          height: 260,
          label: 'Presupuesto y costo ejecutado por proyecto, en soles',
          table: false,
        });
      }
      if (this.sourceChart?.update) this.sourceChart.update(sourceData);
      else {
        sourceElement.replaceChildren();
        this.sourceChart = renderDonut(sourceElement, sourceData, {
          size: 220,
          legend: false,
          table: false,
          centerLabel: 'Ejecutado',
          label: 'Distribución del costo ejecutado por fuente',
        });
      }
    },
    destroy() {
      this.budgetChart?.destroy?.();
      this.sourceChart?.destroy?.();
    },
  };
}
