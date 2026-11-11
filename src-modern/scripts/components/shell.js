import { activeVariant, isModuleEnabled, variantStorageKey } from '../config/variants.js';
import { MODULES, moduleHref, moduleLabel } from '../config/modules.js';
import {
  getCostBySource,
  getDataForVariant,
  getDocuments,
  getPortfolioFinancials,
  getProject,
  getProjectFinancials,
} from '../data/mock-data.js';
import { approvedExpenseCosts, loadExpenseDemos } from '../data/expense-demo.js';
import { laborCostRows } from '../data/personnel-data.js';
import { warehouseMovements } from '../data/warehouse-data.js';
import { projectCostModel } from '../data/cost-data.js';

const data = getDataForVariant(activeVariant);
const projectKey = variantStorageKey('current-project');

export function formatMoney(amount) {
  const fixed = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `S/ ${fixed}`;
}

function readProjectId() {
  let saved;
  try {
    saved = localStorage.getItem(projectKey);
  } catch {
    /* storage is optional */
  }
  return data.projects.some((project) => project.id === saved) ? saved : data.projects[0]?.id;
}

export function writeProjectId(projectId) {
  if (!getProject(data, projectId)) return;
  try {
    localStorage.setItem(projectKey, projectId);
  } catch {
    /* storage is optional */
  }
  if (window.AdminApp) window.AdminApp.currentProjectId = projectId;
  window.dispatchEvent(new CustomEvent('project-change', { detail: { projectId } }));
}

function normalize(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function searchItems() {
  const items = [];
  const push = (kind, title, subtitle, moduleId, recordId, customHref) => {
    if (!isModuleEnabled(moduleId)) return;
    items.push({
      key: `${kind}-${recordId}`,
      kind,
      title,
      subtitle,
      href: customHref || moduleHref(moduleId, recordId),
    });
  };

  for (const project of data.projects) {
    push('Proyecto', `${project.id} · ${project.name}`, 'Proyecto', 'projects', project.id);
  }
  for (const client of data.clients) {
    const project = data.projects.find((item) => item.clientId === client.id);
    if (project)
      push('Cliente', client.name, 'Cliente relacionado a proyectos', 'projects', project.id);
  }
  for (const supplier of data.suppliers) {
    push(
      'Proveedor',
      supplier.name,
      'Proveedor de compras',
      'purchases',
      supplier.id,
      `./purchases.html?supplier=${encodeURIComponent(supplier.id)}`
    );
  }
  for (const worker of data.workers) {
    push('Trabajador', worker.name, worker.role, 'personnel', worker.id);
  }
  for (const material of data.materials) {
    push(
      'Material',
      `${material.id} · ${material.name}`,
      `Stock: ${material.stock} ${material.unit}`,
      'warehouse',
      material.id
    );
  }
  for (const budget of data.budgets) {
    push(
      'Presupuesto',
      budget.id,
      `${budget.projectId} · ${formatMoney(budget.amount)}`,
      'budgets',
      budget.id
    );
  }
  for (const operation of data.operations) {
    const moduleId = {
      purchase: 'purchases',
      expense: 'expenses',
      timesheet: 'personnel',
      material_issue: 'warehouse',
      material_return: 'warehouse',
      other: 'costs',
    }[operation.type];
    if (moduleId)
      push(
        'Operación',
        operation.id,
        `${operation.projectId} · ${formatMoney(operation.amount)}`,
        moduleId,
        operation.id
      );
  }
  for (const document of getDocuments(data)) {
    push('Documento', document.fileName, document.projectId, 'documents', document.id);
  }
  return items;
}

const searchableItems = searchItems();

export function globalSearch() {
  return {
    query: '',
    results: [],
    isOpen: false,
    search() {
      const term = normalize(this.query.trim());
      this.results =
        term.length < 2
          ? []
          : searchableItems
              .filter((item) =>
                normalize(`${item.title} ${item.subtitle} ${item.kind}`).includes(term)
              )
              .slice(0, 8);
      this.isOpen = true;
    },
    close() {
      this.isOpen = false;
    },
    openFirst() {
      if (this.results[0]) window.location.href = this.results[0].href;
    },
  };
}

export function projectContext() {
  return {
    projectId: data.projects[0]?.id || '',
    init() {
      this.projectId = readProjectId();
    },
    setProject(projectId) {
      this.projectId = projectId;
      writeProjectId(projectId);
    },
  };
}

function commonPageState() {
  return {
    projects: data.projects,
    selectedProjectId: readProjectId(),
    formatMoney,
    financials(projectId) {
      return getProjectFinancials(data, projectId);
    },
    clientName(clientId) {
      return data.clients.find((client) => client.id === clientId)?.name || '—';
    },
    projectHref(projectId) {
      return moduleHref('projects', projectId);
    },
    selectProject(projectId) {
      if (getProject(data, projectId)) this.selectedProjectId = projectId;
    },
  };
}

export function homeOverview() {
  return {
    ...commonPageState(),
    portfolio: getPortfolioFinancials(data),
    get currentProject() {
      return getProject(data, this.selectedProjectId);
    },
  };
}

function projectForRecord(recordId) {
  if (getProject(data, recordId)) return recordId;
  const stockMovement = warehouseMovements(data).find((item) => item.id === recordId);
  if (stockMovement) return stockMovement.projectId;
  if (recordId.startsWith('COST-')) {
    const costOperation = data.operations.find((item) => item.id === recordId.slice(5));
    if (costOperation) return costOperation.projectId;
  }
  const demoExpense = loadExpenseDemos().find(
    (item) => item.id === recordId || `COST-DEMO-${item.id}` === recordId
  );
  if (demoExpense) return demoExpense.projectId;
  const operation = data.operations.find((item) => item.id === recordId);
  if (operation) return operation.projectId;
  const budget = data.budgets.find((item) => item.id === recordId);
  if (budget) return budget.projectId;
  const document = getDocuments(data).find((item) => item.id === recordId);
  if (document) return document.projectId;
  const supplierOrder = data.operations.find((item) => item.supplierId === recordId);
  if (supplierOrder) return supplierOrder.projectId;
  const workerOperation = data.operations.find((item) => item.workerId === recordId);
  if (workerOperation) return workerOperation.projectId;
  const managedProject = data.projects.find((item) => item.managerId === recordId);
  if (managedProject) return managedProject.id;
  const client = data.projects.find((item) => item.clientId === recordId);
  return client?.id || null;
}

function previewRecords(moduleId, projectId) {
  const operations = data.operations.filter((item) => item.projectId === projectId);
  const opRecords = (type) =>
    operations
      .filter((item) => item.type === type)
      .map((item) => ({
        id: item.id,
        title: item.id,
        subtitle: `${item.projectId} · ${item.status}`,
        detail: formatMoney(item.amount),
      }));

  switch (moduleId) {
    case 'projects':
      return data.projects.map((item) => ({
        id: item.id,
        title: `${item.id} · ${item.name}`,
        subtitle: data.clients.find((client) => client.id === item.clientId)?.name || '',
        detail: item.status,
      }));
    case 'crm':
      return data.opportunities.map((item) => ({
        id: item.id,
        title: item.name,
        subtitle: item.clientId,
        detail: item.status,
      }));
    case 'budgets':
      return data.budgets
        .filter((item) => item.projectId === projectId)
        .map((item) => ({
          id: item.id,
          title: item.id,
          subtitle: `Versión ${item.version} · ${item.status}`,
          detail: formatMoney(item.amount),
        }));
    case 'purchases':
      return [
        ...opRecords('purchase'),
        ...data.suppliers.map((item) => ({
          id: item.id,
          title: item.name,
          subtitle: 'Proveedor',
          detail: '',
        })),
      ];
    case 'expenses':
      return opRecords('expense');
    case 'personnel':
      return [
        ...opRecords('timesheet'),
        ...data.workers.map((item) => ({
          id: item.id,
          title: item.name,
          subtitle: item.role,
          detail: '',
        })),
      ];
    case 'warehouse':
      return [
        ...opRecords('material_issue'),
        ...data.materials.map((item) => ({
          id: item.id,
          title: item.name,
          subtitle: `Stock: ${item.stock} ${item.unit}`,
          detail: item.stock < item.minimum ? 'Stock bajo' : 'Disponible',
        })),
      ];
    case 'costs':
      return [
        ...Object.entries(getCostBySource(data, projectId)).map(([source, amount]) => ({
          id: source,
          title:
            {
              purchases: 'Compras',
              personnel: 'Personal',
              expenses: 'Rendiciones',
              materials: 'Materiales',
              other: 'Otros',
            }[source] || source,
          subtitle: projectId,
          detail: formatMoney(amount),
        })),
        ...operations
          .filter((item) => item.type === 'expense' && item.costSource)
          .map((item) => ({
            id: `COST-${item.id}`,
            title: `${item.id} · Rendición incluida`,
            subtitle: 'Detalle incluido en el total de Rendiciones',
            detail: formatMoney(item.amount),
          })),
        ...laborCostRows(data)
          .filter((item) => item.projectId === projectId)
          .map((item) => ({
            id: item.id,
            title: `${item.operationId} · Tareo incluido`,
            subtitle: 'Detalle incluido en el total de Personal',
            detail: formatMoney(item.amount),
          })),
        ...operations
          .filter((item) => item.type === 'material_issue' && item.costSource === 'materials')
          .map((item) => ({
            id: `COST-${item.id}`,
            title: `${item.id} · Salida incluida`,
            subtitle:
              'Detalle incluido en el total de Materiales; la OC de inventario no se suma aquí',
            detail: formatMoney(item.amount),
          })),
        ...approvedExpenseCosts(projectId).map((item) => ({
          id: item.id,
          title: `${item.expenseId} · Rendición simulada`,
          subtitle: 'Demostración local · fuera del costo compartido',
          detail: formatMoney(item.amount),
        })),
      ];
    case 'documents':
      return getDocuments(data)
        .filter((item) => item.projectId === projectId)
        .map((item) => ({
          id: item.id,
          title: item.fileName,
          subtitle: `Origen: ${item.operationId}`,
          detail: `V${item.version}`,
        }));
    case 'reports':
      return [
        {
          id: 'projects-report',
          title: 'Reporte de proyectos',
          subtitle: 'Portafolio',
          detail: 'Vista preliminar',
        },
        {
          id: 'costs-report',
          title: 'Presupuesto vs. ejecución',
          subtitle: projectId,
          detail: 'Vista preliminar',
        },
      ];
    case 'integrations':
      return [
        {
          id: 'biometrics-integration',
          title: 'Biometría',
          subtitle: 'Integración prevista',
          detail: 'Simulada',
        },
        {
          id: 'accounting-integration',
          title: 'Contabilidad',
          subtitle: 'Integración prevista',
          detail: 'Simulada',
        },
      ];
    case 'security':
      return [
        {
          id: 'roles',
          title: 'Roles y accesos',
          subtitle: 'Configuración visual',
          detail: 'Simulada',
        },
        { id: 'audit', title: 'Auditoría', subtitle: 'Trazabilidad visual', detail: 'Simulada' },
      ];
    case 'administration':
      return [
        {
          id: 'company',
          title: 'Datos de empresa',
          subtitle: activeVariant.company.name,
          detail: '',
        },
        { id: 'catalogs', title: 'Catálogos', subtitle: 'Parámetros del sistema', detail: '' },
      ];
    default:
      return [];
  }
}

export function modulePreview() {
  const params = new URLSearchParams(window.location.search);
  const requestedModule = params.get('module') || 'projects';
  const allowed = Boolean(MODULES[requestedModule]) && isModuleEnabled(requestedModule);
  const moduleId = allowed ? requestedModule : null;
  const highlightedRecord = params.get('record') || '';
  const linkedProject = projectForRecord(highlightedRecord);
  const selectedProjectId = linkedProject || readProjectId();
  const costReturn =
    params.get('from') === 'costs' && getProject(data, params.get('project'))
      ? `./costs.html?${new URLSearchParams({ project: params.get('project'), ...(params.get('source') ? { source: params.get('source') } : {}), ...(params.get('operation') ? { operation: params.get('operation') } : {}) })}`
      : null;
  if (linkedProject) writeProjectId(linkedProject);

  return {
    ...commonPageState(),
    selectedProjectId,
    highlightedRecord,
    isDemoCost: highlightedRecord.startsWith('COST-DEMO-'),
    costReturn,
    get reportCosts() {
      return moduleId === 'reports' ? projectCostModel(data, this.selectedProjectId) : null;
    },
    title: moduleId ? moduleLabel(moduleId, activeVariant) : 'Sección no disponible',
    description: moduleId
      ? MODULES[moduleId].description
      : 'Esta presentación no incluye el módulo solicitado.',
    recordHeading: moduleId === 'projects' ? 'Proyectos registrados' : 'Registros relacionados',
    get records() {
      return moduleId ? previewRecords(moduleId, this.selectedProjectId) : [];
    },
    get currentProject() {
      return getProject(data, this.selectedProjectId);
    },
    init() {
      document.title = `${this.title} · ${activeVariant.company.shortName}`;
    },
  };
}

export function initShellActions(app) {
  const requestedModule = new URLSearchParams(window.location.search).get('module');
  const moduleId =
    document.body.dataset.page === 'home'
      ? 'dashboard'
      : document.body.dataset.page === 'approvals'
        ? 'approvals'
      : ['projects-list', 'project-detail'].includes(document.body.dataset.page)
        ? 'projects'
        : ['budgets-list', 'budget-detail'].includes(document.body.dataset.page)
          ? 'budgets'
          : ['purchases-list', 'purchase-detail'].includes(document.body.dataset.page)
            ? 'purchases'
            : ['expenses-list', 'expense-detail'].includes(document.body.dataset.page)
              ? 'expenses'
              : ['personnel-list', 'worker-detail'].includes(document.body.dataset.page)
                ? 'personnel'
                : ['warehouse-list', 'material-detail'].includes(document.body.dataset.page)
                  ? 'warehouse'
                  : document.body.dataset.page === 'costs-list'
                    ? 'costs'
                    : ['documents-list', 'document-detail'].includes(document.body.dataset.page)
                      ? 'documents'
                      : document.body.dataset.page === 'reports-workspace'
                        ? 'reports'
                        : document.body.dataset.page === 'crm-workspace'
                          ? 'crm'
                          : document.body.dataset.page === 'integrations-workspace'
                            ? 'integrations'
                            : document.body.dataset.page === 'security-workspace'
                              ? 'security'
                              : document.body.dataset.page === 'administration-workspace'
                                ? 'administration'
                                : MODULES[requestedModule] && isModuleEnabled(requestedModule)
                                  ? requestedModule
                                  : null;
  const activeLink = document.querySelector(`.sidebar-nav [data-module="${moduleId}"]`);
  if (activeLink) {
    activeLink.classList.add('active');
    activeLink.setAttribute('aria-current', 'page');
  }

  const originParams = new URLSearchParams(location.search);
  const origin = data.operations.find(
    (item) =>
      item.id === originParams.get('operation') &&
      item.projectId === originParams.get('project') &&
      item.costSource === originParams.get('source')
  );
  if (
    originParams.get('from') === 'costs' &&
    origin &&
    !['module-preview', 'document-detail'].includes(document.body.dataset.page)
  ) {
    const href = `./costs.html?${new URLSearchParams({ project: origin.projectId, source: origin.costSource, operation: origin.id })}`;
    const link = document.createElement('a');
    link.href = href;
    link.className = 'btn btn-outline-primary btn-sm mb-3';
    link.textContent = '← Volver a Costos';
    const main = document.querySelector('.admin-main .shell-page');
    const breadcrumb = main?.querySelector('.shell-breadcrumb');
    if (breadcrumb) breadcrumb.closest('nav')?.after(link);
  }

  document.querySelectorAll('[data-shell-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset.shellAction;
      const user = activeVariant.user;
      if (action === 'profile')
        app.notificationManager.info(`${user.name} · ${user.role} · ${activeVariant.company.name}`);
      if (action === 'settings') {
        if (isModuleEnabled('administration')) window.location.href = moduleHref('administration');
        else app.notificationManager.info('La configuración la gestiona el administrador del sistema.');
      }
      if (action === 'logout') {
        app.notificationManager.info('Cierre de sesión simulado: en la demostración la sesión continúa.');
      }
    });
  });
}
