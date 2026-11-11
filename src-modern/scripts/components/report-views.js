import { activeVariant, isModuleEnabled } from '../config/variants.js';
import { moduleHref } from '../config/modules.js';
import {
  getCostBySource,
  getDataForVariant,
  getDocuments,
  getProjectFinancials,
  EXPENSE_PENDING_STATUSES,
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
    // analytics.html (Inteligencia de Negocios) is the BI page; reports.html
    // keeps the operational catalogue (Entrega 6).
    biPage: document.body.dataset.page === 'analytics-workspace',
    tab: document.body.dataset.page === 'analytics-workspace' && hasBI ? 'bi' : 'reports',
    reportId: reportDefs.some((item) => item.id === params.get('report'))
      ? params.get('report')
      : 'projects',
    projectFilter: data.projects.some((item) => item.id === params.get('project'))
      ? params.get('project')
      : '',
    clientFilter: data.clients.some((item) => item.id === params.get('client'))
      ? params.get('client')
      : '',
    managerFilter: data.workers.some((item) => item.id === params.get('manager'))
      ? params.get('manager')
      : '',
    get managers() {
      const ids = [...new Set(data.projects.map((item) => item.managerId))];
      return data.workers.filter((item) => ids.includes(item.id));
    },
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
          (!this.managerFilter || item.managerId === this.managerFilter) &&
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
            EXPENSE_PENDING_STATUSES.includes(item.status)
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
      if (!this.biPage) this.tab = 'reports';
      this.updateUrl();
    },
    exportReport() {
      window.AdminApp?.notificationManager?.success(
        `Reporte de ${this.reportTitle} exportado a Excel (simulado).`
      );
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
      this.managerFilter = '';
      this.statusFilter = 'ejecucion';
      this.periodFilter = '';
      this.updateFilters();
    },
    updateUrl() {
      const query = this.filterQuery();
      if (!this.biPage && this.reportId !== 'projects') query.set('report', this.reportId);
      const page = this.biPage ? './analytics.html' : './reports.html';
      history.replaceState(null, '', `${page}${query.size ? `?${query}` : ''}`);
    },
    filterQuery() {
      const query = new URLSearchParams();
      for (const [key, value] of [
        ['project', this.projectFilter],
        ['client', this.clientFilter],
        ['manager', this.managerFilter],
        ['status', this.statusFilter === 'ejecucion' ? '' : this.statusFilter],
        ['period', this.periodFilter],
      ])
        if (value) query.set(key, value);
      return query;
    },
    // Link between the two pages keeps the same filters.
    get biHref() {
      const query = this.filterQuery();
      return `./analytics.html${query.size ? `?${query}` : ''}`;
    },
    get reportsHref() {
      const query = this.filterQuery();
      return `./reports.html${query.size ? `?${query}` : ''}`;
    },
    // ---- BI indicators (punto 85) -----------------------------------------
    // Estimated margin: budget minus the cost projected to completion
    // (executed ÷ physical progress). A projection, labelled as such.
    projectMargin(project) {
      const financials = getProjectFinancials(data, project.id);
      const progress = Math.max(project.progressPercent, 1) / 100;
      const projected = Math.min(financials.executedCost / progress, financials.budgetAmount * 2);
      return {
        projected,
        margin: financials.budgetAmount - projected,
        percent: financials.budgetAmount
          ? ((financials.budgetAmount - projected) / financials.budgetAmount) * 100
          : 0,
      };
    },
    // Deviation: executed % of budget minus physical progress %.
    projectDeviation(project) {
      const financials = getProjectFinancials(data, project.id);
      return Math.round((financials.executionPercent - project.progressPercent) * 10) / 10;
    },
    get biIndicators() {
      const rows = this.scopedProjects;
      const budget = rows.reduce((sum, item) => sum + item.budgetAmount, 0);
      const margin = rows.reduce((sum, item) => sum + this.projectMargin(item).margin, 0);
      const deviation = rows.length
        ? rows.reduce((sum, item) => sum + this.projectDeviation(item), 0) / rows.length
        : 0;
      return {
        marginPercent: budget ? (margin / budget) * 100 : 0,
        deviation: Math.round(deviation * 10) / 10,
      };
    },
    pct(value) {
      return `${(Math.round(value * 10) / 10).toFixed(1).replace('.', ',')} %`;
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
      const marginData = {
        categories: this.scopedProjects.map((item) => item.id),
        series: [
          {
            label: 'Margen estimado',
            color: '--s2',
            values: this.scopedProjects.map((item) => Math.round(this.projectMargin(item).margin)),
          },
        ],
      };
      const monthlyData = this.monthlyTrend;
      const marginElement = document.getElementById('analytics-margin-chart');
      const monthlyElement = document.getElementById('analytics-monthly-chart');
      const [{ render: renderArea }] = await Promise.all([import('../charts/area.js')]);
      if (marginElement) {
        if (this.marginChart?.update) this.marginChart.update(marginData);
        else {
          marginElement.replaceChildren();
          this.marginChart = renderBars(marginElement, marginData, {
            orientation: 'horizontal',
            labelWidth: 110,
            label: 'Margen estimado por proyecto en soles',
            table: false,
          });
        }
      }
      if (monthlyElement && monthlyData.length) {
        if (this.monthlyChart?.update) this.monthlyChart.update(monthlyData);
        else {
          monthlyElement.replaceChildren();
          this.monthlyChart = renderArea(monthlyElement, monthlyData, {
            label: 'Costo ejecutado por mes del alcance seleccionado',
            valueLabel: 'ejecutados',
            table: false,
          });
        }
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
    get monthlyTrend() {
      const names = [
        'Ene',
        'Feb',
        'Mar',
        'Abr',
        'May',
        'Jun',
        'Jul',
        'Ago',
        'Set',
        'Oct',
        'Nov',
        'Dic',
      ];
      const totals = new Map();
      data.operations
        .filter((item) => item.costSource && item.date && this.projectIds.has(item.projectId))
        .forEach((item) => {
          const key = item.date.slice(0, 7);
          totals.set(key, (totals.get(key) || 0) + item.amount);
        });
      return [...totals.keys()].sort().map((key) => ({
        label: names[Number(key.slice(5, 7)) - 1],
        title: key,
        value: totals.get(key),
      }));
    },
    destroy() {
      this.budgetChart?.destroy?.();
      this.sourceChart?.destroy?.();
      this.marginChart?.destroy?.();
      this.monthlyChart?.destroy?.();
    },
  };
}
