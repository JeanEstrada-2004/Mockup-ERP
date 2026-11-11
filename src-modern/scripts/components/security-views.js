import { activeVariant, isModuleEnabled } from '../config/variants.js';
import { moduleHref } from '../config/modules.js';
import { getDataForVariant, getProject } from '../data/mock-data.js';
import { formatDate } from './project-views.js';
import {
  AUDIT_ACTIONS,
  BACKUP,
  MFA,
  PERMISSIONS,
  PERMISSION_ROLES,
  ROLES,
  SESSION_DEVICES,
  WORKER_ROLES,
} from '../data/security-data.js';

const moduleLabels = {
  purchases: 'Compras',
  expenses: 'Rendiciones',
  personnel: 'Personal',
  warehouse: 'Almacén',
  costs: 'Costos',
};
// "Carlos Mendoza" → "cmendoza"
const alias = (name) => {
  const parts = String(name)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .split(/\s+/);
  return `${parts[0]?.[0] || ''}${parts[1] || parts[0] || ''}`;
};

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
function operationModule(item) {
  return {
    purchase: 'purchases',
    expense: 'expenses',
    timesheet: 'personnel',
    payroll: 'personnel',
    rxh: 'personnel',
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
        alias: alias(item.name),
        role: WORKER_ROLES[index % WORKER_ROLES.length],
        area: item.area,
        lastAccess: SESSION_DEVICES[index % SESSION_DEVICES.length].activity,
        status: 'Activo',
        workerId: item.id,
      }))
    : [];
  const audit = allowed
    ? data.operations
        .filter((item) => isModuleEnabled(operationModule(item)))
        .sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id))
        .slice(0, 8)
        .map((item, index) => ({
          id: `AUD-${item.id}`,
          date: item.date,
          actor:
            data.workers.find(
              (worker) =>
                worker.id === (item.workerId || getProject(data, item.projectId)?.managerId)
            )?.name || 'Sistema',
          time: `${String(8 + (index % 9)).padStart(2, '0')}:${String((index * 17) % 60).padStart(2, '0')}`,
          action: AUDIT_ACTIONS[item.type] || 'Registró',
          module: moduleLabels[operationModule(item)] || operationModule(item),
          result: 'Correcto',
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
    roles: ROLES,
    permissionRows: PERMISSIONS,
    permissionRoles: PERMISSION_ROLES,
    roleNames: [...new Set(WORKER_ROLES)],
    mfa: MFA,
    backup: BACKUP,
    sessions: users.map((user, index) => ({
      ...SESSION_DEVICES[index % SESSION_DEVICES.length],
      user: user.name,
      id: `SES-${index + 1}`,
    })),
    formatDateTime: (value) => `${formatDate(value.slice(0, 10))} ${value.slice(11, 16)}`,
    search: (params.get('search') || '').slice(0, 120),
    roleFilter: WORKER_ROLES.includes(params.get('role'))
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
