import { activeVariant, isModuleEnabled, variantStorageKey } from '../config/variants.js';
import { moduleHref } from '../config/modules.js';
import { getDataForVariant, getProject } from '../data/mock-data.js';
import { formatDate } from './project-views.js';
import { formatMoney, writeProjectId } from './shell.js';

const data = getDataForVariant(activeVariant);
const allowed = isModuleEnabled('crm');
// Pipeline (punto 20), in order.
export const CRM_STAGES = ['Prospecto', 'Contactado', 'Propuesta', 'Negociación', 'Ganado', 'Perdido'];
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
    statusFilter: CRM_STAGES.includes(params.get('status')) ? params.get('status') : '',
    stages: CRM_STAGES,
    stageOverrides: {},
    stageOf(item) {
      return this.stageOverrides[item.id] || item.status;
    },
    columnItems(stage) {
      return this.filtered.filter((item) => this.stageOf(item) === stage);
    },
    columnTotal(stage) {
      return this.columnItems(stage).reduce((sum, item) => sum + item.estimatedAmount, 0);
    },
    get pipelineAmount() {
      return this.opportunities
        .filter((item) => !['Ganado', 'Perdido'].includes(this.stageOf(item)))
        .reduce((sum, item) => sum + item.estimatedAmount, 0);
    },
    get weightedAmount() {
      return this.opportunities
        .filter((item) => !['Ganado', 'Perdido'].includes(this.stageOf(item)))
        .reduce((sum, item) => sum + (item.estimatedAmount * (item.probability || 0)) / 100, 0);
    },
    // Local demo actions (punto 22); the base records do not change.
    markStage(item, stage) {
      this.stageOverrides = { ...this.stageOverrides, [item.id]: stage };
      try {
        localStorage.setItem(variantStorageKey('crm-stages'), JSON.stringify(this.stageOverrides));
      } catch {
        /* optional */
      }
      window.AdminApp?.notificationManager?.success(`${item.id} marcada como ${stage.toLowerCase()}.`);
    },
    logActivity(item) {
      window.AdminApp?.notificationManager?.info(`Actividad registrada en ${item.id}: ${item.nextAction}.`);
    },
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
          (!this.statusFilter || this.stageOf(item) === this.statusFilter)
      );
    },
    get selected() {
      return this.filtered.find((item) => item.id === this.selectedId) || this.filtered[0] || null;
    },
    get wonCount() {
      return this.opportunities.filter((item) => this.stageOf(item) === 'Ganado').length;
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
      try {
        const saved = JSON.parse(localStorage.getItem(variantStorageKey('crm-stages')) || '{}');
        if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
          this.stageOverrides = Object.fromEntries(
            Object.entries(saved).filter(([, stage]) => CRM_STAGES.includes(stage))
          );
        }
      } catch {
        /* optional */
      }
      document.title = `CRM · ${activeVariant.company.shortName}`;
      if (this.selected?.projectId) writeProjectId(this.selected.projectId);
    },
  };
}
