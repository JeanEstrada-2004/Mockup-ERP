import { activeVariant, isModuleEnabled } from '../config/variants.js';
import { moduleHref } from '../config/modules.js';
import { getDataForVariant, getProject } from '../data/mock-data.js';
import { formatDate } from './project-views.js';

const data = getDataForVariant(activeVariant);
const allowed = isModuleEnabled('security');
const tabs = [
  ['usuarios', 'Usuarios'],
  ['roles', 'Roles'],
  ['permisos', 'Permisos'],
  ['mfa', 'MFA'],
  ['sesiones', 'Sesiones'],
  ['auditoria', 'Auditoría'],
  ['backups', 'Respaldos'],
];
const roleFixtures = [
  { id: 'administrador', name: 'Administrador de ejemplo', scope: 'Parámetros y consulta general' },
  { id: 'proyectos', name: 'Responsable de proyecto', scope: 'Proyectos, personal y costos' },
  { id: 'logistica', name: 'Logística de ejemplo', scope: 'Compras y almacén según alcance' },
  { id: 'colaborador', name: 'Colaborador de ejemplo', scope: 'Registro de gastos y tareo' },
];
const permissionRows = [
  { action: 'Ver costos', values: ['Sí', 'Sí', 'Parcial', 'No'] },
  { action: 'Crear orden de compra', values: ['Sí', 'No', 'Sí', 'No'] },
  { action: 'Registrar rendición', values: ['Sí', 'Sí', 'Sí', 'Sí'] },
  { action: 'Aprobar rendición', values: ['Sí', 'Sí', 'No', 'No'] },
  { action: 'Consultar documentos', values: ['Sí', 'Sí', 'Sí', 'Parcial'] },
];
function operationModule(item) {
  return {
    purchase: 'purchases',
    expense: 'expenses',
    timesheet: 'personnel',
    material_issue: 'warehouse',
    material_return: 'warehouse',
    other: 'costs',
  }[item.type];
}
function operationHref(item) {
  const module = operationModule(item);
  return module === 'costs' ? moduleHref('costs', `COST-${item.id}`) : moduleHref(module, item.id);
}
function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function securityWorkspace() {
  const params = new URLSearchParams(location.search);
  const users = allowed
    ? data.workers.map((item, index) => ({
        id: `USR-${item.id}`,
        name: item.name,
        alias: `demo.usuario.${String(index + 1).padStart(2, '0')}`,
        role: index === 0 ? 'Administrador de ejemplo' : 'Responsable de proyecto',
        area: item.area,
        status: 'Perfil ficticio',
        workerId: item.id,
      }))
    : [];
  const audit = allowed
    ? data.operations
        .filter((item) => isModuleEnabled(operationModule(item)))
        .sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id))
        .slice(0, 8)
        .map((item) => ({
          id: `AUD-${item.id}`,
          date: item.date,
          actor:
            data.workers.find(
              (worker) =>
                worker.id === (item.workerId || getProject(data, item.projectId)?.managerId)
            )?.name || 'Usuario ficticio',
          action: 'Referencia de operación',
          module: operationModule(item),
          operationId: item.id,
          projectId: item.projectId,
          href: operationHref(item),
        }))
    : [];
  return {
    allowed,
    tabs,
    tab: tabs.some(([id]) => id === params.get('tab')) ? params.get('tab') : 'usuarios',
    users,
    audit,
    roles: roleFixtures,
    permissionRows,
    search: (params.get('search') || '').slice(0, 120),
    roleFilter: ['Administrador de ejemplo', 'Responsable de proyecto'].includes(params.get('role'))
      ? params.get('role')
      : '',
    formatDate,
    workerHref: (id) => moduleHref('personnel', id),
    get filteredUsers() {
      const term = normalize(this.search.trim());
      return this.users.filter(
        (item) =>
          (!term || normalize(`${item.name} ${item.id} ${item.alias}`).includes(term)) &&
          (!this.roleFilter || item.role === this.roleFilter)
      );
    },
    setTab(id) {
      this.tab = id;
      this.updateUrl();
    },
    updateUrl() {
      const query = new URLSearchParams();
      if (this.tab !== 'usuarios') query.set('tab', this.tab);
      if (this.search.trim()) query.set('search', this.search.trim());
      if (this.roleFilter) query.set('role', this.roleFilter);
      history.replaceState(null, '', `./security.html${query.size ? `?${query}` : ''}`);
    },
    clearFilters() {
      this.search = '';
      this.roleFilter = '';
      this.updateUrl();
    },
    init() {
      if (allowed) document.title = `Seguridad · ${activeVariant.company.shortName}`;
    },
  };
}
