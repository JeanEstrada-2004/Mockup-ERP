import { activeVariant, isModuleEnabled, variantStorageKey } from '../config/variants.js';
import { Modal } from 'bootstrap';
import { moduleHref } from '../config/modules.js';
import {
  getCostBySource,
  getDocuments,
  getPortfolioFinancials,
  getMonthlyExecutedCost,
  getPendingApprovals,
  getProject,
  getProjectFinancials,
  getProjectOperations,
  getShellNotifications,
  getDataForVariant,
  projectShortName,
  EXPENSE_PENDING_STATUSES,
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
// Fixed series slot per cost source (DESIGN.md › Datos): the same source keeps
// its colour in every chart and variant, even when another source is absent.
export const COST_SOURCE_TOKENS = {
  purchases: '--s1',
  personnel: '--s2',
  expenses: '--s3',
  materials: '--s4',
  other: '--s-other',
};
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

/**
 * Data for charts/flow.js (Trazabilidad del costo) of one project: sources →
 * executed → budget (executed / committed / available). Shared by the Panel,
 * Costos and the visual reference so the three always show the same figures.
 */
export function projectFlowData(projectId) {
  const financials = getProjectFinancials(data, projectId);
  if (!financials) return null;
  const operations = getProjectOperations(data, projectId);
  return {
    sources: sourceRows(projectId).map((item) => ({
      label: item.label,
      value: item.amount,
      color: COST_SOURCE_TOKENS[item.id],
      detail: operations
        .filter((operation) => operation.costSource === item.id)
        .map((operation) => operation.id)
        .slice(0, 4)
        .join(', '),
    })),
    executed: financials.executedCost,
    budget: financials.budgetAmount,
    segments: [
      {
        label: 'Ejecutado',
        value: financials.executedCost,
        color: '--brand',
        note: `${financials.executionPercent.toString().replace('.', ',')} % del presupuesto`,
      },
      {
        label: 'Comprometido',
        value: financials.outstandingCommitments,
        color: '--s3',
        note: 'Órdenes aprobadas aún sin recepción',
      },
      {
        label: 'Disponible',
        value: Math.max(0, financials.availableToCommit),
        color: '--track',
        note: 'Para nuevos compromisos',
      },
    ],
  };
}

export function dashboardView() {
  const projects = data.projects.filter((project) =>
    ['Activo', 'En riesgo'].includes(project.status)
  );
  const approvals = getPendingApprovals(data, activeVariant)
    .map((item) => ({
      ...item,
      date:
        data.operations.find((operation) => operation.id === item.id)?.date ||
        getProject(data, item.projectId)?.startDate ||
        '',
      href: moduleHref(item.moduleId, item.id),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
  const months = getMonthlyExecutedCost(data);
  return {
    projects,
    portfolio: getPortfolioFinancials(data),
    alerts: dashboardAlerts().filter((item) => ['warning', 'error'].includes(item.level)),
    approvals,
    months,
    activity: recentActivity(),
    selectedProjectId: data.projects[0]?.id,
    charts: [],
    formatMoney,
    formatDate,
    projectClient,
    projectShortName,
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
    get greeting() {
      const hour = new Date().getHours();
      return hour < 12
        ? 'Buenos días, Jean'
        : hour < 19
          ? 'Buenas tardes, Jean'
          : 'Buenas noches, Jean';
    },
    get cutoffDate() {
      return formatDate(
        [...data.operations]
          .map((item) => item.date)
          .filter(Boolean)
          .sort()
          .at(-1)
      );
    },
    get expensePendingCount() {
      return this.approvals.filter((item) => item.moduleId === 'expenses').length;
    },
    get purchasePendingCount() {
      return this.approvals.filter((item) => item.moduleId === 'purchases').length;
    },
    get riskCount() {
      return data.projects.filter((project) => project.status === 'En riesgo').length;
    },
    get clientCount() {
      const inExecution = data.projects.filter(
        (project) => project.status === 'Activo' || project.status === 'En riesgo'
      );
      return new Set(inExecution.map((project) => project.clientId)).size;
    },
    get executedPercentLabel() {
      const { budgetAmount, executedCost } = this.portfolio;
      const percent = budgetAmount ? (executedCost / budgetAmount) * 100 : 0;
      return `${percent.toFixed(1).replace('.', ',')} %`;
    },
    get sources() {
      return sourceRows(this.selectedProjectId);
    },
    get oldestApprovals() {
      return this.approvals.slice(0, 3);
    },
    get flowData() {
      return projectFlowData(this.selectedProjectId);
    },
    init() {
      const saved = document.querySelector('#global-project-select')?.value;
      if (getProject(data, saved)) this.selectedProjectId = saved;
      this.$nextTick(() => this.renderCharts());
    },
    selectProject(id) {
      if (!getProject(data, id)) return;
      this.selectedProjectId = id;
      this.charts[0]?.update(this.flowData);
    },
    openNotifications() {
      const toggle = document.querySelector('.shell-notification-menu')?.previousElementSibling;
      toggle?.click();
      toggle?.focus();
    },
    async renderCharts() {
      const [flow, execution, area, sparkline] = await Promise.all([
        import('../charts/flow.js'),
        import('../charts/execution-bars.js'),
        import('../charts/area.js'),
        import('../charts/sparkline.js'),
      ]);
      this.charts.forEach((chart) => chart?.destroy?.());
      const el = (id) => document.getElementById(id);
      const cumulative = [];
      this.months.reduce((sum, month) => {
        const next = sum + month.value;
        cumulative.push(next);
        return next;
      }, 0);
      this.charts = [
        flow.render(el('dashboard-flow'), this.flowData, {
          label: `Trazabilidad del costo de ${this.selectedProjectId}`,
        }),
        execution.render(
          el('dashboard-execution'),
          this.projects.map((project) => ({
            id: project.id,
            name: projectShortName(project.name),
            budget: project.budgetAmount,
            cost: getProjectFinancials(data, project.id).executedCost,
            progress: project.progressPercent,
            href: this.projectHref(project.id),
          })),
          { label: 'Ejecución del presupuesto frente al avance físico por proyecto' }
        ),
        area.render(el('dashboard-monthly'), this.months, {
          label: 'Costo ejecutado por mes del portafolio en ejecución',
          valueLabel: 'ejecutados',
        }),
        sparkline.render(el('dashboard-spark'), cumulative, { width: 72, height: 26 }),
      ];
    },
    destroy() {
      this.charts.forEach((chart) => chart?.destroy?.());
    },
  };
}

export const PROJECT_STATUSES = ['Planificado', 'Activo', 'En riesgo', 'Suspendido', 'Cerrado'];
const demoProjectKey = variantStorageKey('demo-projects');

function loadDemoProjects() {
  try {
    const saved = JSON.parse(localStorage.getItem(demoProjectKey) || '[]');
    return Array.isArray(saved) ? saved.filter((item) => item?.id && item?.name) : [];
  } catch {
    return [];
  }
}

function emptyProjectForm(id) {
  return {
    id,
    name: '',
    clientId: '',
    managerId: '',
    description: '',
    location: '',
    startDate: '',
    endDate: '',
    status: 'Planificado',
    budgetAmount: '',
    currency: 'PEN',
    costCenter: '',
    contractNumber: '',
    clientRepresentative: '',
    notes: '',
  };
}

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
        cost: (project) => getProjectFinancials(data, project.id)?.executedCost || 0,
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
        { key: 'period', label: 'Periodo' },
      ],
    }),
    projects: [...data.projects, ...loadDemoProjects()],
    demoIds: loadDemoProjects().map((item) => item.id),
    statuses: PROJECT_STATUSES,
    clients,
    managers,
    dataClients: data.clients,
    dataWorkers: data.workers,
    search: '',
    status: '',
    client: '',
    manager: '',
    period: '',
    moreFilters: false,
    form: emptyProjectForm('PR-DEMO-001'),
    editingId: '',
    formatMoney,
    projectClient,
    projectManager,
    financials(id) {
      return getProjectFinancials(data, id) || { executedCost: 0 };
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
        const matchesPeriod = !this.period || project.startDate?.startsWith(this.period);
        const haystack = `${project.id} ${project.name} ${projectClient(project)}`
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase();
        return (
          matchesStatus &&
          matchesClient &&
          matchesManager &&
          matchesPeriod &&
          (!term || haystack.includes(term))
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
      this.period = /^20\d{2}$/.test(params.get('period') || '') ? params.get('period') : '';
      this.moreFilters = Boolean(this.client || this.manager || this.period);
      if (params.has('new')) this.$nextTick(() => this.openProjectModal());
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
      if (this.period) params.set('period', this.period);
      history.replaceState(null, '', `./projects.html${params.size ? `?${params}` : ''}`);
    },
    detailHref(id) {
      const url = new URL(
        projectDetailUrl(id, 'projects', this.search.trim(), this.status),
        location.href
      );
      if (this.client) url.searchParams.set('client', this.client);
      if (this.manager) url.searchParams.set('manager', this.manager);
      if (this.period) url.searchParams.set('period', this.period);
      return `${url.pathname.split('/').at(-1)}${url.search}`;
    },
    nextDemoId() {
      const numbers = this.demoIds
        .map((id) => Number(id.replace('PR-DEMO-', '')))
        .filter(Number.isFinite);
      return `PR-DEMO-${String(Math.max(0, ...numbers) + 1).padStart(3, '0')}`;
    },
    openProjectModal(source = null) {
      this.editingId = source && this.demoIds.includes(source.id) ? source.id : '';
      this.form = source
        ? {
            ...emptyProjectForm(this.nextDemoId()),
            ...source,
            id: this.editingId || this.nextDemoId(),
            name: this.editingId ? source.name : `${source.name} (copia)`,
          }
        : emptyProjectForm(this.nextDemoId());
      Modal.getOrCreateInstance(document.getElementById('project-create-modal')).show();
    },
    editProject(project) {
      if (!this.demoIds.includes(project.id)) {
        window.AdminApp?.notificationManager.info(
          'La edición de este registro base es una demostración. Duplica el proyecto para crear una copia editable.'
        );
        return;
      }
      this.openProjectModal(project);
    },
    showHistory(project) {
      const count = getProjectOperations(data, project.id).length;
      window.AdminApp?.notificationManager.info(
        `${project.id} · ${count} operaciones vinculadas en los datos de demostración.`
      );
    },
    saveProject() {
      const element = document.getElementById('project-create-form');
      if (!element?.reportValidity()) return;
      const entry = {
        ...this.form,
        budgetAmount: Number(this.form.budgetAmount) || 0,
        progressPercent: this.editingId ? Number(this.form.progressPercent) || 0 : 0,
        demo: true,
      };
      const current = loadDemoProjects();
      const index = current.findIndex((project) => project.id === entry.id);
      if (index >= 0) current[index] = entry;
      else current.push(entry);
      localStorage.setItem(demoProjectKey, JSON.stringify(current));
      this.projects = [...data.projects, ...current];
      this.demoIds = current.map((project) => project.id);
      Modal.getOrCreateInstance(document.getElementById('project-create-modal')).hide();
      this.clearFilters();
      window.AdminApp?.notificationManager.success(
        this.editingId ? 'Proyecto actualizado' : 'Proyecto creado'
      );
    },
    clearFilters() {
      this.search = '';
      this.status = '';
      this.client = '';
      this.manager = '';
      this.period = '';
      this.updateUrl();
    },
  };
}

export function projectDetail() {
  const params = new URLSearchParams(location.search);
  const id = params.get('id') || '';
  const project = getProject(data, id) || loadDemoProjects().find((item) => item.id === id) || null;
  const from = params.get('from') === 'home' ? 'home' : 'projects';
  const search = (params.get('search') || '').slice(0, 120);
  const status = PROJECT_STATUSES.includes(params.get('status')) ? params.get('status') : '';
  const listParams = new URLSearchParams();
  if (search) listParams.set('search', search);
  if (status) listParams.set('status', status);
  for (const key of ['client', 'manager', 'period']) {
    const value = params.get(key);
    if (value) listParams.set(key, value);
  }
  const backHref =
    from === 'home' ? './index.html' : `./projects.html${listParams.size ? `?${listParams}` : ''}`;
  const tabIds = [
    'summary',
    'budget',
    'purchases',
    'expenses',
    'personnel',
    'materials',
    'costs',
    'documents',
    'indicators',
  ];
  const requestedTab = location.hash.slice(1) || params.get('tab');
  const baseFinancials = project ? getProjectFinancials(data, id) : null;
  const financials =
    baseFinancials ||
    (project
      ? {
          budgetAmount: project.budgetAmount,
          executedCost: 0,
          outstandingCommitments: 0,
          committedCost: 0,
          availableAgainstExecuted: project.budgetAmount,
          availableToCommit: project.budgetAmount,
          executionPercent: 0,
        }
      : null);
  return {
    project,
    financials,
    operations: project ? getProjectOperations(data, id) : [],
    documents: project ? getDocuments(data).filter((item) => item.projectId === id) : [],
    sources: project ? sourceRows(id) : [],
    tabs: [
      { id: 'summary', label: 'Resumen' },
      { id: 'budget', label: 'Presupuesto' },
      { id: 'purchases', label: 'Compras' },
      { id: 'expenses', label: 'Rendiciones' },
      { id: 'personnel', label: 'Personal' },
      { id: 'materials', label: 'Materiales' },
      { id: 'costs', label: 'Costos' },
      { id: 'documents', label: 'Documentos' },
      { id: 'indicators', label: 'Indicadores' },
    ],
    tab: tabIds.includes(requestedTab) ? requestedTab : 'summary',
    budgetChart: null,
    backHref,
    backLabel: from === 'home' ? 'Volver al Panel General' : 'Volver a Proyectos',
    hasWarehouse: isModuleEnabled('warehouse'),
    hasBudgets: isModuleEnabled('budgets'),
    get clientHref() {
      return this.project && isModuleEnabled('clients')
        ? moduleHref('clients', this.project.clientId)
        : null;
    },
    budget: data.budgets.find((item) => item.projectId === id) || null,
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
    rowsForTab(id) {
      return (
        {
          purchases: this.purchaseRows,
          expenses: this.expenseRows,
          personnel: this.personnelRows,
          materials: this.hasWarehouse ? this.materialRows : [],
        }[id] || []
      );
    },
    moduleForTab(id) {
      return {
        purchases: 'purchases',
        expenses: 'expenses',
        personnel: 'personnel',
        materials: 'warehouse',
      }[id];
    },
    recordSubtitle(item) {
      return item.type === 'purchase'
        ? this.supplierName(item.supplierId)
        : item.type === 'expense' || item.type === 'timesheet'
          ? this.personName(item.workerId)
          : this.materialName(item.materialId);
    },
    get projectActivity() {
      return [...this.operations]
        .filter((item) => item.date)
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 5);
    },
    get pendingCount() {
      return this.operations.filter(
        (item) => item.status === 'Pendiente' || EXPENSE_PENDING_STATUSES.includes(item.status)
      ).length;
    },
    get alertCount() {
      return this.pendingCount + (this.project?.status === 'En riesgo' ? 1 : 0);
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
      if (baseFinancials) writeProjectId(project.id);
      if (project) this.$nextTick(() => this.renderBudgetChart());
    },
    async renderBudgetChart() {
      const element = document.getElementById('project-budget-chart');
      if (!element) return;
      const { render } = await import('../charts/bars.js');
      this.budgetChart = render(element, {
        categories: [project.id],
        series: [
          { label: 'Presupuesto', color: '--s1', values: [financials.budgetAmount] },
          { label: 'Ejecutado', color: '--s2', values: [financials.executedCost] },
        ],
      }, { height: 160, label: `Presupuesto y costo ejecutado de ${project.id}` });
    },
    destroy() {
      this.budgetChart?.destroy?.();
    },
    setTab(id) {
      if (!tabIds.includes(id)) return;
      this.tab = id;
      history.replaceState(
        null,
        '',
        `${location.pathname}${location.search}${id === 'summary' ? '' : `#${id}`}`
      );
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
