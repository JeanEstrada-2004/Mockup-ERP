import { activeVariant, isModuleEnabled } from '../config/variants.js';
import { moduleHref } from '../config/modules.js';
import { getDataForVariant, getProject } from '../data/mock-data.js';
import { formatDate } from './project-views.js';
import { formatMoney, writeProjectId } from './shell.js';

const data = getDataForVariant(activeVariant);
const allowed = isModuleEnabled('crm');
function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}
function clientName(id) {
  return data.clients.find((item) => item.id === id)?.name || '—';
}
function workerName(id) {
  return data.workers.find((item) => item.id === id)?.name || '—';
}

export function crmWorkspace() {
  const params = new URLSearchParams(location.search);
  return {
    allowed,
    opportunities: allowed ? data.opportunities : [],
    clients: allowed ? data.clients : [],
    search: (params.get('search') || '').slice(0, 120),
    clientFilter: data.clients.some((item) => item.id === params.get('client'))
      ? params.get('client')
      : '',
    statusFilter: ['Prospección', 'Propuesta', 'Negociación', 'Ganado', 'Perdido'].includes(
      params.get('status')
    )
      ? params.get('status')
      : '',
    selectedId: data.opportunities.some((item) => item.id === params.get('id'))
      ? params.get('id')
      : data.opportunities[0]?.id || '',
    formatDate,
    formatMoney,
    clientName,
    workerName,
    get filtered() {
      const term = normalize(this.search.trim());
      return this.opportunities.filter(
        (item) =>
          (!term ||
            normalize(`${item.id} ${item.name} ${clientName(item.clientId)}`).includes(term)) &&
          (!this.clientFilter || item.clientId === this.clientFilter) &&
          (!this.statusFilter || item.status === this.statusFilter)
      );
    },
    get selected() {
      return this.filtered.find((item) => item.id === this.selectedId) || this.filtered[0] || null;
    },
    get wonCount() {
      return this.opportunities.filter((item) => item.status === 'Ganado').length;
    },
    get linkedCount() {
      return this.opportunities.filter((item) => item.budgetId && item.projectId).length;
    },
    get selectedProject() {
      return getProject(data, this.selected?.projectId);
    },
    select(id) {
      this.selectedId = id;
      if (this.selected?.projectId) writeProjectId(this.selected.projectId);
      this.updateUrl();
    },
    updateUrl() {
      const query = new URLSearchParams();
      if (this.search.trim()) query.set('search', this.search.trim());
      if (this.clientFilter) query.set('client', this.clientFilter);
      if (this.statusFilter) query.set('status', this.statusFilter);
      if (this.selectedId && this.selectedId !== this.opportunities[0]?.id)
        query.set('id', this.selectedId);
      history.replaceState(null, '', `./crm.html${query.size ? `?${query}` : ''}`);
    },
    clearFilters() {
      this.search = '';
      this.clientFilter = '';
      this.statusFilter = '';
      this.updateUrl();
    },
    budgetHref: (id) => moduleHref('budgets', id),
    projectHref: (id) => moduleHref('projects', id),
    clientProjectHref(id) {
      const project = data.projects.find((item) => item.clientId === id);
      return project ? moduleHref('projects', project.id) : null;
    },
    init() {
      if (!allowed) return;
      document.title = `CRM · ${activeVariant.company.shortName}`;
      if (this.selected?.projectId) writeProjectId(this.selected.projectId);
    },
  };
}
