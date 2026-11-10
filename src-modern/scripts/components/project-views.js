import { activeVariant, isModuleEnabled } from '../config/variants.js';
import { moduleHref } from '../config/modules.js';
import {
  getCostBySource,
  getDocuments,
  getPortfolioFinancials,
  getProject,
  getProjectFinancials,
  getProjectOperations,
  getShellNotifications,
  getDataForVariant,
} from '../data/mock-data.js';
import { formatMoney, writeProjectId } from './shell.js';
import { tableControls } from '../utils/data-table.js';

const data = getDataForVariant(activeVariant);
const costNames = {
  purchases: 'Compras',
  personnel: 'Personal',
  expenses: 'Rendiciones',
  materials: 'Materiales',
  other: 'Otros',
};
const costOrder = Object.keys(costNames);
const operationNames = {
  purchase: 'Compra',
  expense: 'Rendición',
  timesheet: 'Tareo',
  material_issue: 'Salida de material',
  material_return: 'Devolución de material',
  other: 'Ajuste',
};

export function formatDate(iso) {
  if (!iso) return '—';
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
}

function projectClient(project) {
  return data.clients.find((item) => item.id === project.clientId)?.name || '—';
}

function operationModule(operation) {
  return {
    purchase: 'purchases',
    expense: 'expenses',
    timesheet: 'personnel',
    material_issue: 'warehouse',
    material_return: 'warehouse',
    other: 'costs',
  }[operation.type];
}

function sourceRows(projectId) {
  const totals = getCostBySource(data, projectId);
  return costOrder
    .filter((id) => totals[id])
    .map((id) => ({
      id,
      label: costNames[id],
      amount: totals[id],
    }));
}

function projectDetailUrl(projectId, from = 'projects', search = '', status = '') {
  const params = new URLSearchParams({ id: projectId });
  if (from === 'home') params.set('from', 'home');
  if (from === 'projects') {
    params.set('from', 'projects');
    if (search) params.set('search', search);
    if (status) params.set('status', status);
  }
  return `./project.html?${params}`;
}

function dashboardAlerts() {
  return getShellNotifications(data, activeVariant).map((item) => ({
    ...item,
    href: moduleHref(item.moduleId, item.recordId),
  }));
}

function recentActivity() {
  return [...data.operations]
    .filter((item) => item.date)
    .sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id))
    .slice(0, 5)
    .map((item) => ({
      ...item,
      kind: operationNames[item.type] || 'Operación',
      projectName: getProject(data, item.projectId)?.name || item.projectId,
      href: projectDetailUrl(item.projectId, 'home'),
    }));
}

function chartColors() {
  const root = document.documentElement;
  const styles = getComputedStyle(root);
  return {
    brand: styles.getPropertyValue('--brand-accent').trim() || '#2563eb',
    muted: styles.getPropertyValue('--bs-secondary-color').trim() || '#64748b',
    grid: styles.getPropertyValue('--bs-border-color').trim() || '#e2e8f0',
    dark: root.dataset.bsTheme === 'dark',
  };
}

// The dashboard compares a readable subset: the first six projects in execution.
// The full portfolio stays in Proyectos. (Entrega 2 redesigns this panel.)
const DASHBOARD_PROJECT_LIMIT = 6;

export function dashboardView() {
  return {
    projects: data.projects
      .filter((project) => project.status === 'Activo' || project.status === 'En riesgo')
      .slice(0, DASHBOARD_PROJECT_LIMIT),
    portfolio: getPortfolioFinancials(data),
    alerts: dashboardAlerts(),
    activity: recentActivity(),
    selectedProjectId: data.projects[0]?.id,
    budgetChart: null,
    sourceChart: null,
    formatMoney,
    formatDate,
    projectClient,
    dataFinancials(id) {
      return getProjectFinancials(data, id);
    },
    projectHref(id) {
      return projectDetailUrl(id, 'home');
    },
    get currentProject() {
      return getProject(data, this.selectedProjectId);
    },
    get currentFinancials() {
      return getProjectFinancials(data, this.selectedProjectId);
    },
    get availableBudget() {
      return this.portfolio.budgetAmount - this.portfolio.executedCost;
    },
    get sources() {
      return sourceRows(this.selectedProjectId);
    },
    init() {
      const saved = document.querySelector('#global-project-select')?.value;
      if (getProject(data, saved)) this.selectedProjectId = saved;
      this.$nextTick(() => this.renderCharts());
    },
    selectProject(id) {
      if (!getProject(data, id)) return;
      this.selectedProjectId = id;
      this.$nextTick(() => this.renderCharts());
    },
    async renderCharts() {
      const budgetElement = document.querySelector('#dashboard-budget-chart');
      const sourceElement = document.querySelector('#dashboard-source-chart');
      if (!budgetElement || !sourceElement) return;
      const { default: ApexCharts } = await import('apexcharts');
      const colors = chartColors();
      this.budgetChart?.destroy();
      this.sourceChart?.destroy();
      budgetElement.replaceChildren();
      sourceElement.replaceChildren();
      this.budgetChart = new ApexCharts(budgetElement, {
        chart: {
          type: 'bar',
          height: 252,
          toolbar: { show: false },
          animations: { enabled: false },
          background: 'transparent',
          foreColor: colors.muted,
        },
        series: [
          { name: 'Presupuesto', data: this.projects.map((item) => item.budgetAmount) },
          {
            name: 'Costo ejecutado',
            data: this.projects.map((item) => getProjectFinancials(data, item.id).executedCost),
          },
        ],
        colors: [colors.brand, '#f59e0b'],
        plotOptions: { bar: { borderRadius: 3, columnWidth: '48%' } },
        dataLabels: { enabled: false },
        xaxis: { categories: this.projects.map((item) => item.id) },
        yaxis: { labels: { formatter: (value) => `S/ ${Math.round(value / 1000)} mil` } },
        grid: { borderColor: colors.grid },
        legend: { position: 'top', horizontalAlign: 'right' },
        tooltip: { theme: colors.dark ? 'dark' : 'light', y: { formatter: formatMoney } },
      });
      await this.budgetChart.render();
      const sources = this.sources;
      this.sourceChart = new ApexCharts(sourceElement, {
        chart: {
          type: 'donut',
          height: 252,
          animations: { enabled: false },
          background: 'transparent',
          foreColor: colors.muted,
        },
        series: sources.map((item) => item.amount),
        labels: sources.map((item) => item.label),
        colors: [colors.brand, '#0ea5e9', '#f59e0b', '#22c55e', '#8b5cf6'],
        dataLabels: { enabled: false },
        legend: { show: false },
        stroke: { colors: [colors.dark ? '#212529' : '#fff'] },
        tooltip: { theme: colors.dark ? 'dark' : 'light', y: { formatter: formatMoney } },
        plotOptions: {
          pie: {
            donut: {
              size: '68%',
              labels: {
                show: true,
                total: {
                  show: true,
                  label: 'Ejecutado',
                  formatter: () => formatMoney(this.currentFinancials.executedCost),
                },
              },
            },
          },
        },
      });
      await this.sourceChart.render();
    },
  };
}

export const PROJECT_STATUSES = ['Planificado', 'Activo', 'En riesgo', 'Suspendido', 'Cerrado'];

function projectManager(project) {
  return data.workers.find((item) => item.id === project.managerId)?.name || '\u2014';
}

export function projectsList() {
  const clients = data.clients.filter((client) =>
    data.projects.some((project) => project.clientId === client.id)
  );
  const managers = data.workers.filter((worker) =>
    data.projects.some((project) => project.managerId === worker.id)
  );
  return {
    ...tableControls({
      // No initial sort: rows keep the portfolio order (active work first).
      sortKey: '',
      accessors: {
        id: (project) => project.id,
        name: (project) => project.name,
        client: projectClient,
        manager: projectManager,
        progress: (project) => project.progressPercent,
        budget: (project) => project.budgetAmount,
        cost: (project) => getProjectFinancials(data, project.id).executedCost,
        status: (project) => PROJECT_STATUSES.indexOf(project.status),
      },
      chipDefs: [
        { key: 'search', label: 'B\u00fasqueda' },
        { key: 'status', label: 'Estado' },
        {
          key: 'client',
          label: 'Cliente',
          format: (id) => clients.find((item) => item.id === id)?.name || id,
        },
        {
          key: 'manager',
          label: 'Responsable',
          format: (id) => managers.find((item) => item.id === id)?.name || id,
        },
      ],
    }),
    projects: data.projects,
    statuses: PROJECT_STATUSES,
    clients,
    managers,
    search: '',
    status: '',
    client: '',
    manager: '',
    moreFilters: false,
    formatMoney,
    projectClient,
    projectManager,
    financials(id) {
      return getProjectFinancials(data, id);
    },
    costsHref(id) {
      return moduleHref('costs', id);
    },
    documentsHref(id) {
      return `./documents.html?project=${encodeURIComponent(id)}`;
    },
    get filteredProjects() {
      const term = this.search
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
      return this.projects.filter((project) => {
        const matchesStatus = !this.status || project.status === this.status;
        const matchesClient = !this.client || project.clientId === this.client;
        const matchesManager = !this.manager || project.managerId === this.manager;
        const haystack = `${project.id} ${project.name} ${projectClient(project)}`
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase();
        return (
          matchesStatus && matchesClient && matchesManager && (!term || haystack.includes(term))
        );
      });
    },
    get visibleProjects() {
      return this.paginate(this.applySort(this.filteredProjects));
    },
    init() {
      const params = new URLSearchParams(location.search);
      this.search = params.get('search') || '';
      const status = params.get('status');
      this.status = PROJECT_STATUSES.includes(status) ? status : '';
      const client = params.get('client');
      this.client = clients.some((item) => item.id === client) ? client : '';
      const manager = params.get('manager');
      this.manager = managers.some((item) => item.id === manager) ? manager : '';
      this.moreFilters = Boolean(this.client || this.manager);
    },
    onFiltersChange() {
      this.updateUrl();
    },
    updateUrl() {
      this.page = 1;
      const params = new URLSearchParams();
      if (this.search.trim()) params.set('search', this.search.trim());
      if (this.status) params.set('status', this.status);
      if (this.client) params.set('client', this.client);
      if (this.manager) params.set('manager', this.manager);
      history.replaceState(null, '', `./projects.html${params.size ? `?${params}` : ''}`);
    },
    detailHref(id) {
      return projectDetailUrl(id, 'projects', this.search.trim(), this.status);
    },
    clearFilters() {
      this.search = '';
      this.status = '';
      this.client = '';
      this.manager = '';
      this.updateUrl();
    },
  };
}

export function projectDetail() {
  const params = new URLSearchParams(location.search);
  const id = params.get('id') || '';
  const project = getProject(data, id);
  const from = params.get('from') === 'home' ? 'home' : 'projects';
  const search = (params.get('search') || '').slice(0, 120);
  const status = PROJECT_STATUSES.includes(params.get('status')) ? params.get('status') : '';
  const listParams = new URLSearchParams();
  if (search) listParams.set('search', search);
  if (status) listParams.set('status', status);
  const backHref =
    from === 'home' ? './index.html' : `./projects.html${listParams.size ? `?${listParams}` : ''}`;
  const tabIds = ['summary', 'operations', 'documents'];
  return {
    project,
    financials: project ? getProjectFinancials(data, id) : null,
    operations: project ? getProjectOperations(data, id) : [],
    documents: project ? getDocuments(data).filter((item) => item.projectId === id) : [],
    sources: project ? sourceRows(id) : [],
    tab: tabIds.includes(params.get('tab')) ? params.get('tab') : 'summary',
    backHref,
    backLabel: from === 'home' ? 'Volver al Panel General' : 'Volver a Proyectos',
    hasWarehouse: isModuleEnabled('warehouse'),
    hasBudgets: isModuleEnabled('budgets'),
    formatMoney,
    formatDate,
    projectClient,
    get managerName() {
      return data.workers.find((item) => item.id === this.project?.managerId)?.name || '—';
    },
    get purchaseRows() {
      return this.operations.filter((item) => item.type === 'purchase');
    },
    get expenseRows() {
      return this.operations.filter((item) => item.type === 'expense');
    },
    get personnelRows() {
      return this.operations.filter((item) => item.type === 'timesheet');
    },
    get materialRows() {
      return this.operations.filter((item) =>
        ['material_issue', 'material_return'].includes(item.type)
      );
    },
    get pendingCount() {
      return this.operations.filter((item) => ['Pendiente', 'En revisión'].includes(item.status))
        .length;
    },
    get executionWidth() {
      return Math.min(this.financials?.executionPercent || 0, 100);
    },
    personName(id) {
      return data.workers.find((item) => item.id === id)?.name || '—';
    },
    supplierName(id) {
      return data.suppliers.find((item) => item.id === id)?.name || '—';
    },
    materialName(id) {
      return data.materials.find((item) => item.id === id)?.name || '—';
    },
    operationHref(item) {
      const moduleId = operationModule(item);
      return moduleId && isModuleEnabled(moduleId) ? moduleHref(moduleId, item.id) : null;
    },
    documentHref(item) {
      return moduleHref('documents', item.id);
    },
    moduleHref,
    init() {
      document.title = project
        ? `${project.id} · ${project.name} · ${activeVariant.company.shortName}`
        : 'Proyecto no encontrado';
      if (project) writeProjectId(project.id);
    },
    setTab(id) {
      if (!tabIds.includes(id)) return;
      this.tab = id;
      const next = new URL(location.href);
      if (id === 'summary') next.searchParams.delete('tab');
      else next.searchParams.set('tab', id);
      history.replaceState(null, '', next);
    },
    moveTab(event, offset) {
      const current = tabIds.indexOf(this.tab);
      const next = tabIds[(current + offset + tabIds.length) % tabIds.length];
      this.setTab(next);
      this.$nextTick(() => document.querySelector(`[data-project-tab="${next}"]`)?.focus());
      event.preventDefault();
    },
    switchProject(projectId) {
      if (projectId === this.project?.id || !getProject(data, projectId)) return;
      location.href = projectDetailUrl(projectId, from, search, status);
    },
  };
}
