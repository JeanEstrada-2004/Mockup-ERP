// Presupuestos de J&Y (R4, rules.budgetFlow = 'technical'): list and budget
// page with partidas and metrados, APU, consolidated insumos, supplier prices
// and quotes, products with supplier options (Tipo B), internal vs. client
// view, versions and duplicates. Base budgets never change; a new version or
// a duplicate is stored locally and recalculated live.
import { Modal } from 'bootstrap';
import { activeVariant } from '../config/variants.js';
import { moduleHref } from '../config/modules.js';
import { getDataForVariant, getProject } from '../data/mock-data.js';
import { formatAmount } from '../data/commercial-data.js';
import {
  RESOURCE_GROUPS,
  apuLines,
  budgetCode,
  budgetTotals,
  insumos,
  partidaRows,
  productLines,
  round2,
} from '../data/budget-calc.js';
import {
  BUDGET_STATUSES,
  budgetContext,
  currentVersion,
  displayCode,
  duplicateBudget,
  loadBudgets,
  localVersions,
  saveCopy,
  saveLocalVersion,
  versionsOf,
} from '../data/budget-model.js';
import { formatDate } from './project-views.js';
import { writeProjectId } from './shell.js';

const data = getDataForVariant(activeVariant);
const TYPE_LABELS = { A: 'Partidas y APU', B: 'Productos' };
const normalize = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
const clone = (value) => JSON.parse(JSON.stringify(value ?? {}));
const notify = () => window.AdminApp?.notificationManager;

const helpers = {
  clients: data.clients,
  workers: data.workers,
  formatAmount,
  formatDate,
  typeLabel: (type) => TYPE_LABELS[type] || type,
  clientName: (id) => data.clients.find((item) => item.id === id)?.name || '—',
  workerName: (id) => data.workers.find((item) => item.id === id)?.name || '—',
  supplierName: (id) => data.suppliers.find((item) => item.id === id)?.name || '—',
  projectName: (id) => getProject(data, id)?.name || '',
  projectHref: (id) => (id ? moduleHref('projects', id) : null),
  supplierHref: (id) => moduleHref('suppliers', id),
  productHref: (id) => `./products.html?tab=precios&product=${encodeURIComponent(id)}`,
  quoteHref: (id) => `./products.html?tab=cotizaciones&quote=${encodeURIComponent(id)}`,
};

export function budgetTechList() {
  const params = new URLSearchParams(location.search);
  return {
    ...helpers,
    records: [],
    statuses: BUDGET_STATUSES,
    search: (params.get('search') || '').slice(0, 120),
    typeFilter: ['A', 'B'].includes(params.get('type')) ? params.get('type') : '',
    statusFilter: BUDGET_STATUSES.includes(params.get('status')) ? params.get('status') : '',
    form: { sourceId: '', title: '', clientId: '', responsibleId: '', comment: '' },
    formError: '',
    init() {
      this.reload();
      document.title = `Presupuestos · ${activeVariant.company.shortName}`;
      if (params.get('new') === '1') this.$nextTick(() => this.openNew());
    },
    reload() {
      this.records = loadBudgets(data).map((budget) => {
        const current = currentVersion(data, budget);
        return {
          ...budget,
          code: displayCode(data, budget),
          currentStatus: current?.status || budget.status,
          currentAmount: current?.amount ?? budget.amount,
          currentVersionNumber: current?.version || budget.version,
          versionCount: versionsOf(data, budget).length,
        };
      });
    },
    get filtered() {
      const term = normalize(this.search.trim());
      return this.records
        .filter((item) => {
          const text = `${item.code} ${item.title} ${this.clientName(item.clientId)} ${item.projectId || ''}`;
          return (
            (!term || normalize(text).includes(term)) &&
            (!this.typeFilter || item.type === this.typeFilter) &&
            (!this.statusFilter || item.currentStatus === this.statusFilter)
          );
        })
        .sort((a, b) => b.date.localeCompare(a.date));
    },
    get inReview() {
      return this.records.filter((item) => item.currentStatus === 'En revisión').length;
    },
    get acceptedAmount() {
      return this.records
        .filter((item) => item.currentStatus === 'Aceptado')
        .reduce((sum, item) => sum + item.currentAmount, 0);
    },
    countType(type) {
      return this.records.filter((item) => item.type === type).length;
    },
    detailHref(item) {
      return `./budget.html?id=${encodeURIComponent(item.id)}`;
    },
    updateUrl() {
      const next = new URLSearchParams();
      if (this.search.trim()) next.set('search', this.search.trim());
      if (this.typeFilter) next.set('type', this.typeFilter);
      if (this.statusFilter) next.set('status', this.statusFilter);
      history.replaceState(null, '', `./budgets.html${next.size ? `?${next}` : ''}`);
    },
    clearFilters() {
      this.search = '';
      this.typeFilter = '';
      this.statusFilter = '';
      this.updateUrl();
    },
    openNew() {
      this.form = { sourceId: '', title: '', clientId: '', responsibleId: '', comment: '' };
      this.formError = '';
      Modal.getOrCreateInstance(document.getElementById('budget-new-modal')).show();
    },
    createFromSource() {
      const source = this.records.find((item) => item.id === this.form.sourceId);
      if (!source || !this.form.title.trim() || !this.form.clientId) {
        this.formError = 'Elige el presupuesto base, el cliente y escribe el título.';
        return;
      }
      const current = currentVersion(data, source);
      const copy = duplicateBudget(data, source, current?.overrides, {
        ...this.form,
        title: this.form.title.trim().slice(0, 120),
      });
      Modal.getOrCreateInstance(document.getElementById('budget-new-modal')).hide();
      window.location.href = `./budget.html?id=${encodeURIComponent(copy.id)}`;
    },
  };
}

export function budgetTechDetail() {
  const params = new URLSearchParams(location.search);
  const budget = loadBudgets(data).find((item) => item.id === params.get('id')) || null;
  const versions = budget ? versionsOf(data, budget) : [];
  const requestedVersion = Number(params.get('version'));
  const selected =
    versions.find((item) => item.version === requestedVersion) || versions[0] || null;
  const typeTabs =
    budget?.type === 'B'
      ? [
          ['resumen', 'Resumen'],
          ['productos', 'Productos'],
          ['precios', 'Precios y cotizaciones'],
          ['versiones', 'Versiones'],
        ]
      : [
          ['resumen', 'Resumen'],
          ['partidas', 'Partidas y metrados'],
          ['apu', 'APU'],
          ['insumos', 'Insumos'],
          ['precios', 'Precios y cotizaciones'],
          ['versiones', 'Versiones'],
        ];
  return {
    ...helpers,
    budget,
    versions,
    selectedVersion: selected?.version || 1,
    overrides: clone(selected?.overrides),
    view: params.get('view') === 'cliente' ? 'cliente' : 'interna',
    tabs: typeTabs,
    tab: typeTabs.some(([id]) => id === params.get('tab')) ? params.get('tab') : 'resumen',
    apuCode:
      budget?.partidas?.find((item) => item.code === params.get('partida') && item.apu)?.code ||
      budget?.partidas?.find((item) => item.apu)?.code ||
      '',
    resourceGroups: RESOURCE_GROUPS,
    statuses: BUDGET_STATUSES,
    versionComment: '',
    duplicateForm: {
      title: '',
      clientId: budget?.clientId || '',
      responsibleId: budget?.responsibleId || '',
      comment: '',
    },
    duplicateError: '',
    ctx: budgetContext(data),
    init() {
      if (!budget) return;
      if (budget.projectId) writeProjectId(budget.projectId);
      document.title = `${this.code} · Presupuesto · ${activeVariant.company.shortName}`;
    },
    // ---- Version and permissions --------------------------------------
    get version() {
      return this.versions.find((item) => item.version === this.selectedVersion) || null;
    },
    get isCurrent() {
      return this.selectedVersion === this.versions[0]?.version;
    },
    get editable() {
      return this.isCurrent && this.version?.status === 'Borrador';
    },
    get code() {
      return budget ? budgetCode(budget, this.selectedVersion) : '';
    },
    get internal() {
      return this.view === 'interna';
    },
    setView(view) {
      this.view = view;
      if (view === 'cliente' && ['apu', 'insumos', 'precios'].includes(this.tab))
        this.tab = 'resumen';
      this.syncUrl();
    },
    selectVersion(number) {
      const entry = this.versions.find((item) => item.version === number);
      if (!entry) return;
      this.selectedVersion = number;
      this.overrides = clone(entry.overrides);
      this.syncUrl();
    },
    setTab(id) {
      if (!this.tabs.some(([tabId]) => tabId === id)) return;
      if (!this.internal && ['apu', 'insumos', 'precios'].includes(id)) return;
      this.tab = id;
      this.syncUrl();
    },
    openApu(code) {
      this.apuCode = code;
      this.setTab('apu');
    },
    syncUrl() {
      const next = new URL(location.href);
      next.searchParams.set('tab', this.tab);
      next.searchParams.set('version', String(this.selectedVersion));
      if (this.view === 'cliente') next.searchParams.set('view', 'cliente');
      else next.searchParams.delete('view');
      if (this.tab === 'apu') next.searchParams.set('partida', this.apuCode);
      else next.searchParams.delete('partida');
      history.replaceState(null, '', next);
    },
    // ---- Figures --------------------------------------------------------
    get totals() {
      return budgetTotals(this.ctx, budget, this.overrides);
    },
    get rows() {
      return budget?.type === 'A' ? partidaRows(this.ctx, budget, this.overrides) : [];
    },
    // In the client view each partial carries overhead and profit.
    clientPrice(value) {
      return round2(value * this.totals.factor);
    },
    get apuRow() {
      return this.rows.find((item) => item.code === this.apuCode) || null;
    },
    get apuLines() {
      if (!this.apuRow) return [];
      return apuLines(this.ctx, this.apuRow.apu, {
        ...budget.selections,
        ...this.overrides.selections,
      });
    },
    linesOf(group) {
      return this.apuLines.filter((line) => line.group === group);
    },
    groupTotal(group) {
      return round2(this.linesOf(group).reduce((sum, line) => sum + line.partial, 0));
    },
    get insumos() {
      return budget?.type === 'A' ? insumos(this.ctx, budget, this.overrides) : [];
    },
    insumosOf(group) {
      return this.insumos.filter((item) => item.group === group);
    },
    get products() {
      return budget?.type === 'B' ? productLines(this.ctx, budget, this.overrides) : [];
    },
    offersFor(productId) {
      return this.ctx.quotes
        .filter((quote) => quote.items.some((item) => item.productId === productId))
        .map((quote) => {
          const offer = quote.items.find((item) => item.productId === productId);
          return { quoteId: quote.id, supplierId: quote.supplierId, date: quote.date, ...offer };
        })
        .sort((a, b) => a.price - b.price);
    },
    get relatedQuotes() {
      const ids = new Set(
        budget?.type === 'B'
          ? budget.products.map((item) => item.productId)
          : this.insumos.map((item) => item.productId)
      );
      return this.ctx.quotes
        .filter(
          (quote) =>
            quote.budgetId === budget?.id || quote.items.some((item) => ids.has(item.productId))
        )
        .sort((a, b) => b.date.localeCompare(a.date));
    },
    // Insumos with two or more supplier offers: the comparator.
    get comparable() {
      const items = budget?.type === 'B' ? this.products : this.insumos;
      return items
        .map((item) => ({ ...item, offers: this.offersFor(item.productId) }))
        .filter((item) => item.offers.length >= 2);
    },
    productName(id) {
      return this.ctx.products.find((item) => item.id === id)?.name || id;
    },
    quoteSupplier(quoteId) {
      const quote = this.ctx.quotes.find((item) => item.id === quoteId);
      return quote ? this.supplierName(quote.supplierId) : 'Precio interno de referencia';
    },
    orderHref(item) {
      const quote = this.ctx.quotes.find((entry) => entry.id === item.quoteId);
      if (!quote || !budget?.projectId) return null;
      return `./purchases.html?${new URLSearchParams({ new: '1', project: budget.projectId, supplier: quote.supplierId, quote: quote.id })}`;
    },
    get documentHref() {
      return budget?.documentId ? moduleHref('documents', budget.documentId) : null;
    },
    // ---- Editing a draft version ---------------------------------------
    persist() {
      if (!this.editable) return;
      const entry = this.version;
      if (entry.local) {
        const stored = clone(entry);
        delete stored.amount;
        delete stored.local;
        saveLocalVersion(budget.id, { ...stored, overrides: clone(this.overrides) });
      } else if (!budget.base) {
        budget.versions = budget.versions.map((item) =>
          item.version === entry.version ? { ...item, overrides: clone(this.overrides) } : item
        );
        budget.amount = this.totals.total;
        saveCopy(budget);
      }
      this.versions = versionsOf(data, budget);
    },
    setQuantity(key, value) {
      const number = round2(value);
      if (!this.editable || !(number >= 0)) return;
      this.overrides.quantities = { ...this.overrides.quantities, [key]: number };
      this.persist();
    },
    setPct(field, value) {
      const number = round2(value);
      if (!this.editable || !(number >= 0 && number <= 50)) return;
      this.overrides[field] = number;
      this.persist();
    },
    selectQuote(productId, quoteId) {
      if (!this.editable) return;
      this.overrides.selections = { ...this.overrides.selections, [productId]: quoteId || null };
      if (!quoteId) delete this.overrides.selections[productId];
      this.persist();
      notify()?.info(`Precio de ${this.productName(productId)}: ${this.quoteSupplier(quoteId)}.`);
    },
    // ---- New version / duplicate / status -------------------------------
    openVersion() {
      this.versionComment = '';
      Modal.getOrCreateInstance(document.getElementById('budget-version-new-modal')).show();
    },
    createVersion() {
      const comment = this.versionComment.trim().slice(0, 200);
      if (!comment) return;
      const number = Math.max(...this.versions.map((item) => item.version)) + 1;
      const base = this.versions[0];
      saveLocalVersion(budget.id, {
        version: number,
        date: data.today,
        responsibleId: budget.responsibleId,
        status: 'Borrador',
        comment,
        overrides: clone(base.overrides),
      });
      this.versions = versionsOf(data, budget);
      this.selectVersion(number);
      Modal.getOrCreateInstance(document.getElementById('budget-version-new-modal')).hide();
      notify()?.success(`Versión ${budgetCode(budget, number)} creada como borrador.`);
    },
    setStatus(status) {
      if (!this.isCurrent || !this.version?.local || !BUDGET_STATUSES.includes(status)) return;
      const entry = localVersions(budget.id).find((item) => item.version === this.selectedVersion);
      saveLocalVersion(budget.id, { ...entry, status, overrides: clone(this.overrides) });
      this.versions = versionsOf(data, budget);
      notify()?.success(`${this.code}: ${status}.`);
    },
    get nextStatuses() {
      const flow = {
        Borrador: ['En revisión'],
        'En revisión': ['Enviado al cliente', 'Borrador'],
        'Enviado al cliente': ['Aceptado', 'No aceptado'],
      };
      return this.version?.local && this.isCurrent ? flow[this.version.status] || [] : [];
    },
    openDuplicate() {
      this.duplicateForm = {
        title: `${budget.title} (copia)`,
        clientId: budget.clientId,
        responsibleId: budget.responsibleId,
        comment: '',
      };
      this.duplicateError = '';
      Modal.getOrCreateInstance(document.getElementById('budget-duplicate-modal')).show();
    },
    duplicate() {
      if (!this.duplicateForm.title.trim() || !this.duplicateForm.clientId) {
        this.duplicateError = 'Escribe el título y elige el cliente.';
        return;
      }
      const copy = duplicateBudget(data, budget, this.overrides, {
        ...this.duplicateForm,
        title: this.duplicateForm.title.trim().slice(0, 120),
      });
      Modal.getOrCreateInstance(document.getElementById('budget-duplicate-modal')).hide();
      window.location.href = `./budget.html?id=${encodeURIComponent(copy.id)}`;
    },
  };
}
