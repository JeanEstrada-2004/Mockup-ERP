import { statusClass } from '../utils/status.js';
import { Modal } from 'bootstrap';
import { activeVariant, isModuleEnabled, variantStorageKey } from '../config/variants.js';
import { moduleHref } from '../config/modules.js';
import {
  commercialBreakdown,
  formatAmount,
  inventoryPurchaseBreakdown,
} from '../data/commercial-data.js';
import {
  getDataForVariant,
  getDocuments,
  getProject,
  getProjectFinancials,
} from '../data/mock-data.js';
import { formatMoney, writeProjectId } from './shell.js';
import { formatDate } from './project-views.js';
import { approvalDecision, approvalStatus } from '../data/approval-demo.js';
import {
  DEMO_BUDGETS_KEY,
  DEMO_PURCHASES_KEY,
  generateDocument,
  loadDemo,
} from './commercial-forms.js';

const data = getDataForVariant(activeVariant);
const versionKey = variantStorageKey('budget-versions');
const reviewStatuses = ['Borrador', 'En revisión', 'Observada', 'Aprobado'];

function normalize(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function clientName(id) {
  return data.clients.find((item) => item.id === id)?.name || '—';
}
function supplierName(id) {
  return data.suppliers.find((item) => item.id === id)?.name || '—';
}
function projectName(id) {
  return getProject(data, id)?.name || '—';
}
function purchaseRecords() {
  return data.operations
    .filter((item) => item.type === 'purchase')
    .map((item) => ({ ...item, status: approvalStatus(item.id, item.status) }));
}

function storedVersions() {
  try {
    const parsed = JSON.parse(localStorage.getItem(versionKey) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => {
        const base = data.budgets.find((budget) => budget.id === item.budgetId);
        return (
          base &&
          Number.isSafeInteger(item.version) &&
          item.version > base.version &&
          reviewStatuses.includes(item.status) &&
          typeof item.note === 'string'
        );
      })
      .map((item) => ({
        budgetId: item.budgetId,
        version: item.version,
        status: item.status,
        note: item.note.slice(0, 200),
        simulated: true,
      }));
  } catch {
    return [];
  }
}

function saveVersions(records) {
  try {
    localStorage.setItem(versionKey, JSON.stringify(records));
  } catch {
    /* optional */
  }
}

function versionHistory(base, extra) {
  return [
    {
      budgetId: base.id,
      version: base.version,
      status: approvalStatus(base.id, base.status, 'Aprobado'),
      note: 'Versión base del conjunto mock.',
      simulated: false,
    },
    ...extra.filter((item) => item.budgetId === base.id),
  ].sort((a, b) => b.version - a.version);
}

function modal(id) {
  return Modal.getOrCreateInstance(document.getElementById(id));
}
function toast(message) {
  window.AdminApp?.notificationManager?.info(message);
}

function listQuery(keys) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(keys)) if (value) params.set(key, value);
  return params.size ? `?${params}` : '';
}

function budgetDate(budget) {
  return budget.date || getProject(data, budget.projectId)?.startDate || '';
}

export function budgetsList() {
  return {
    allowed: isModuleEnabled('budgets'),
    budgets: isModuleEnabled('budgets') ? data.budgets : [],
    demoBudgets: [],
    budgetDate,
    formatDate,
    reloadDemo() {
      this.demoBudgets = loadDemo(DEMO_BUDGETS_KEY);
    },
    extras: [],
    search: '',
    projectFilter: '',
    statusFilter: '',
    projects: data.projects,
    formatMoney,
    clientName,
    projectName,
    statusClass,
    init() {
      this.extras = storedVersions();
      this.reloadDemo();
      const params = new URLSearchParams(location.search);
      this.search = params.get('search') || '';
      this.projectFilter = data.projects.some((item) => item.id === params.get('project'))
        ? params.get('project')
        : '';
      this.statusFilter = reviewStatuses.includes(params.get('status')) ? params.get('status') : '';
    },
    latest(base) {
      return versionHistory(base, this.extras)[0];
    },
    get filtered() {
      const term = normalize(this.search.trim());
      return this.budgets.filter((budget) => {
        const text = `${budget.id} ${budget.projectId} ${projectName(budget.projectId)} ${clientName(budget.clientId)}`;
        return (
          (!term || normalize(text).includes(term)) &&
          (!this.projectFilter || budget.projectId === this.projectFilter) &&
          (!this.statusFilter || this.latest(budget).status === this.statusFilter)
        );
      });
    },
    detailHref(budget) {
      return `${moduleHref('budgets', budget.id)}${listQuery({
        search: this.search.trim(),
        project: this.projectFilter,
        status: this.statusFilter,
      }).replace('?', '&')}`;
    },
    updateUrl() {
      history.replaceState(
        null,
        '',
        `./budgets.html${listQuery({
          search: this.search.trim(),
          project: this.projectFilter,
          status: this.statusFilter,
        })}`
      );
    },
    clearFilters() {
      this.search = '';
      this.projectFilter = '';
      this.statusFilter = '';
      this.updateUrl();
    },
  };
}

export function budgetDetail() {
  const params = new URLSearchParams(location.search);
  const allowed = isModuleEnabled('budgets');
  const base = allowed ? data.budgets.find((item) => item.id === params.get('id')) : null;
  const project = base ? getProject(data, base.projectId) : null;
  const backParams = {
    search: (params.get('search') || '').slice(0, 120),
    project: data.projects.some((item) => item.id === params.get('project'))
      ? params.get('project')
      : '',
    status: reviewStatuses.includes(params.get('status')) ? params.get('status') : '',
  };
  const mockDocument = base ? getDocuments(data).find((item) => item.id === base.documentId) : null;
  return {
    allowed,
    base,
    project,
    mockDocument,
    extras: [],
    selectedVersion: base?.version || 1,
    versionNote: '',
    breakdown: base ? commercialBreakdown(base.amount, 'budget') : null,
    backHref: `./budgets.html${listQuery(backParams)}`,
    formatAmount,
    formatMoney,
    clientName,
    statusClass,
    get versions() {
      return this.base ? versionHistory(this.base, this.extras) : [];
    },
    get currentVersion() {
      return this.versions.find((item) => item.version === this.selectedVersion);
    },
    get approvedVersion() {
      return this.versions.find((item) => item.status === 'Aprobado');
    },
    get managerName() {
      return data.workers.find((item) => item.id === this.project?.managerId)?.name || '—';
    },
    get documentHref() {
      return this.mockDocument ? moduleHref('documents', this.mockDocument.id) : null;
    },
    get localDecision() {
      return base ? approvalDecision(base.id) : null;
    },
    get projectHref() {
      return this.project ? moduleHref('projects', this.project.id) : null;
    },
    init() {
      if (!base) return;
      this.extras = storedVersions();
      const requested = Number(params.get('version'));
      this.selectedVersion = this.versions.some((item) => item.version === requested)
        ? requested
        : this.versions[0].version;
      document.title = `${base.id} · Presupuesto · ${activeVariant.company.shortName}`;
      writeProjectId(base.projectId);
    },
    generatePdf() {
      generateDocument(
        `${base.id}-V${this.selectedVersion}.pdf`,
        `Cotización de ${base.id}, versión V${this.selectedVersion}`
      );
    },
    selectVersion(version) {
      this.selectedVersion = version;
      const next = new URL(location.href);
      next.searchParams.set('version', String(version));
      history.replaceState(null, '', next);
    },
    openVersionModal() {
      this.versionNote = '';
      modal('budget-version-modal').show();
    },
    createVersion() {
      const note = this.versionNote.trim().slice(0, 200);
      if (!note) return;
      const nextVersion = Math.max(...this.versions.map((item) => item.version)) + 1;
      this.extras = [
        ...this.extras,
        {
          budgetId: base.id,
          version: nextVersion,
          status: 'Borrador',
          note,
          simulated: true,
        },
      ];
      saveVersions(this.extras);
      this.selectVersion(nextVersion);
      modal('budget-version-modal').hide();
      toast(`Versión V${nextVersion} creada como borrador de demostración.`);
    },
    sendReview() {
      if (this.currentVersion?.status !== 'Borrador') return;
      this.setVersionStatus('En revisión');
      toast(`Versión V${this.selectedVersion} enviada a revisión (simulada).`);
    },
    openApprovalModal() {
      modal('budget-approval-modal').show();
    },
    approveVersion() {
      if (this.currentVersion?.status !== 'En revisión') return;
      this.setVersionStatus('Aprobado');
      modal('budget-approval-modal').hide();
      toast(`Versión V${this.selectedVersion} aprobada en esta demostración.`);
    },
    setVersionStatus(status) {
      this.extras = this.extras.map((item) =>
        item.budgetId === base.id && item.version === this.selectedVersion
          ? { ...item, status }
          : item
      );
      saveVersions(this.extras);
    },
  };
}

export function purchasesList() {
  return {
    purchases: purchaseRecords(),
    demoPurchases: [],
    reloadDemo() {
      this.demoPurchases = loadDemo(DEMO_PURCHASES_KEY);
    },
    projects: data.projects,
    suppliers: data.suppliers,
    search: '',
    projectFilter: '',
    supplierFilter: '',
    statusFilter: '',
    formatMoney,
    formatDate,
    supplierName,
    projectName,
    statusClass,
    init() {
      this.reloadDemo();
      const params = new URLSearchParams(location.search);
      this.search = params.get('search') || '';
      this.projectFilter = data.projects.some((item) => item.id === params.get('project'))
        ? params.get('project')
        : '';
      this.supplierFilter = data.suppliers.some((item) => item.id === params.get('supplier'))
        ? params.get('supplier')
        : '';
      this.statusFilter = ['Pendiente', 'Observada', 'Aprobada', 'Atendida'].includes(
        params.get('status')
      )
        ? params.get('status')
        : '';
    },
    get filtered() {
      const term = normalize(this.search.trim());
      return this.purchases
        .filter((item) => {
          const text = `${item.id} ${item.projectId} ${projectName(item.projectId)} ${supplierName(item.supplierId)}`;
          return (
            (!term || normalize(text).includes(term)) &&
            (!this.projectFilter || item.projectId === this.projectFilter) &&
            (!this.supplierFilter || item.supplierId === this.supplierFilter) &&
            (!this.statusFilter || item.status === this.statusFilter)
          );
        })
        .sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
    },
    detailHref(item) {
      return `${moduleHref('purchases', item.id)}${listQuery({
        search: this.search.trim(),
        project: this.projectFilter,
        supplier: this.supplierFilter,
        status: this.statusFilter,
      }).replace('?', '&')}`;
    },
    updateUrl() {
      history.replaceState(
        null,
        '',
        `./purchases.html${listQuery({
          search: this.search.trim(),
          project: this.projectFilter,
          supplier: this.supplierFilter,
          status: this.statusFilter,
        })}`
      );
    },
    clearFilters() {
      this.search = '';
      this.projectFilter = '';
      this.supplierFilter = '';
      this.statusFilter = '';
      this.updateUrl();
    },
  };
}

export function purchaseDetail() {
  const params = new URLSearchParams(location.search);
  const purchase = purchaseRecords().find((item) => item.id === params.get('id')) || null;
  const project = purchase ? getProject(data, purchase.projectId) : null;
  const mockDocument = purchase
    ? getDocuments(data).find((item) => item.operationId === purchase.id)
    : null;
  const financials = project ? getProjectFinancials(data, project.id) : null;
  const backParams = {
    search: (params.get('search') || '').slice(0, 120),
    project: data.projects.some((item) => item.id === params.get('project'))
      ? params.get('project')
      : '',
    supplier: data.suppliers.some((item) => item.id === params.get('supplier'))
      ? params.get('supplier')
      : '',
    status: ['Pendiente', 'Observada', 'Aprobada', 'Atendida'].includes(params.get('status'))
      ? params.get('status')
      : '',
  };
  return {
    purchase,
    project,
    mockDocument,
    financials,
    breakdown: purchase
      ? purchase.inventoryLine
        ? inventoryPurchaseBreakdown(
            purchase,
            data.materials.find((item) => item.id === purchase.inventoryLine.materialId)
          )
        : commercialBreakdown(purchase.amount, 'purchase')
      : null,
    backHref: `./purchases.html${listQuery(backParams)}`,
    demoStatus: null,
    receiptRegistered: false,
    demoEvents: [],
    formatAmount,
    formatMoney,
    formatDate,
    supplierName,
    statusClass,
    get displayStatus() {
      return this.demoStatus || this.purchase?.status;
    },
    get localDecision() {
      return purchase ? approvalDecision(purchase.id) : null;
    },
    get canApprove() {
      return this.purchase?.status === 'Pendiente' && !this.demoStatus;
    },
    get canReceive() {
      return ['Aprobada', 'Emitida'].includes(this.displayStatus) && !this.receiptRegistered;
    },
    get canIssue() {
      return this.displayStatus === 'Aprobada';
    },
    // Status trail derived from the record (Borrador → … → Atendida) plus the
    // actions simulated in this view.
    get history() {
      if (!this.purchase) return [];
      const order = ['Pendiente', 'Aprobada', 'Emitida', 'Atendida'];
      const reached = order.indexOf(
        this.purchase.status === 'Atendida' ? 'Atendida' : this.purchase.status
      );
      const when = formatDate(this.purchase.date);
      const events = [
        { label: 'Creada', note: `Registrada para ${this.purchase.projectId}.`, when },
        { label: 'Enviada a aprobación', note: 'Pendiente de revisión de Logística.', when },
      ];
      if (reached >= 1)
        events.push({
          label: 'Aprobada',
          note: 'Aprobación registrada en los datos de demostración.',
          when,
        });
      if (reached >= 3)
        events.push({
          label: 'Atendida',
          note: 'Recepción registrada; el costo se imputa a su fuente.',
          when,
        });
      this.demoEvents.forEach((event) => events.push(event));
      return events;
    },
    get availableBeforeOrder() {
      return this.financials.availableToCommit + (this.purchase.commitmentOpen || 0);
    },
    get exceedsBalance() {
      return !this.purchase.costSource && this.purchase.amount > this.availableBeforeOrder;
    },
    get projectRisk() {
      return this.financials.executionPercent >= 80;
    },
    get projectHref() {
      return this.project ? moduleHref('projects', this.project.id) : null;
    },
    get supplierHref() {
      return this.purchase && isModuleEnabled('suppliers')
        ? moduleHref('suppliers', this.purchase.supplierId)
        : null;
    },
    get budgetHref() {
      return this.project && isModuleEnabled('budgets')
        ? moduleHref('budgets', this.project.budgetId)
        : null;
    },
    get documentHref() {
      return this.mockDocument ? moduleHref('documents', this.mockDocument.id) : null;
    },
    get warehouseHref() {
      return purchase?.inventoryLine && isModuleEnabled('warehouse')
        ? `./warehouse.html?tab=entradas&record=ENT-${purchase.id.slice(3)}`
        : null;
    },
    init() {
      if (!purchase) return;
      document.title = `${purchase.id} · Orden de Compra · ${activeVariant.company.shortName}`;
      writeProjectId(purchase.projectId);
    },
    openApprovalModal() {
      modal('purchase-approval-modal').show();
    },
    approve() {
      if (!this.canApprove) return;
      this.demoStatus = 'Aprobada';
      this.demoEvents.push({
        label: 'Aprobada',
        note: 'Aprobación simulada en esta vista.',
        when: 'Ahora',
      });
      modal('purchase-approval-modal').hide();
      toast(`${purchase.id}: aprobación simulada. Los importes del proyecto no cambian.`);
    },
    issue() {
      if (!this.canIssue) return;
      this.demoStatus = 'Emitida';
      this.demoEvents.push({
        label: 'Emitida',
        note: `Enviada a ${supplierName(purchase.supplierId)} (simulado).`,
        when: 'Ahora',
      });
      toast(`${purchase.id} emitida al proveedor (simulado).`);
    },
    generateDocument() {
      generateDocument(`${purchase.id}.pdf`, `Orden de Compra ${purchase.id}`);
    },
    openReceiptModal() {
      modal('purchase-receipt-modal').show();
    },
    receive() {
      if (!this.canReceive) return;
      this.demoStatus = 'Atendida';
      this.receiptRegistered = true;
      this.demoEvents.push({
        label: 'Recepción registrada',
        note: 'Recepción simulada; no genera costo real.',
        when: 'Ahora',
      });
      modal('purchase-receipt-modal').hide();
      toast(`${purchase.id}: recepción simulada. No se registró un costo real.`);
    },
  };
}
