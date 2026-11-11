// Clientes y Proveedores (MAESTROS, R1): lists with filters, create and edit
// in a modal, and a record page with its related projects, budgets, purchases
// and documents. One factory serves both kinds; the HTML of each page decides
// which fields and columns it shows.
import { Modal } from 'bootstrap';
import { activeVariant, isModuleEnabled } from '../config/variants.js';
import { moduleHref } from '../config/modules.js';
import { getDataForVariant } from '../data/mock-data.js';
import {
  MASTER_STATUSES,
  clientRelations,
  emptyMasterForm,
  masterForm,
  masterRecord,
  masterRecords,
  saveMasterForm,
  supplierRelations,
  validateMasterForm,
} from '../data/master-data.js';
import { formatMoney } from './shell.js';
import { formatAmount } from '../data/commercial-data.js';
import { formatDate } from './project-views.js';

const data = getDataForVariant(activeVariant);
const normalize = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

const DETAIL_TABS = {
  clients: [
    ['general', 'General'],
    ['contactos', 'Contactos'],
    ['proyectos', 'Proyectos'],
    ['presupuestos', 'Presupuestos'],
    ['documentos', 'Documentos'],
    ['historial', 'Historial'],
  ],
  suppliers: [
    ['general', 'General'],
    ['contactos', 'Contactos'],
    ['productos', 'Productos y servicios'],
    // R4: known prices and quotes exist where the data set has a catalogue.
    ...(data.quotes
      ? [
          ['precios', 'Precios conocidos'],
          ['cotizaciones', 'Cotizaciones'],
        ]
      : []),
    ['compras', 'Órdenes de compra'],
    ['proyectos', 'Proyectos'],
    ['documentos', 'Documentos'],
    ['historial', 'Historial'],
  ],
};

const relationsOf = (kind, id) =>
  kind === 'clients' ? clientRelations(data, id) : supplierRelations(data, id);

// Shared helpers and the create/edit modal. Plain fields and methods only, so
// the object can be spread into both components.
function masterShared(kind) {
  return {
    kind,
    allowed: isModuleEnabled(kind),
    statuses: MASTER_STATUSES,
    form: emptyMasterForm(kind),
    formError: '',
    formatMoney,
    formatMoneyCents: formatAmount,
    formatDate,
    primaryContact(record) {
      return record?.contacts.find((item) => item.primary) || record?.contacts[0] || null;
    },
    detailHref(id) {
      return moduleHref(kind, id);
    },
    projectHref(id) {
      return moduleHref('projects', id);
    },
    budgetHref(id) {
      return isModuleEnabled('budgets') ? moduleHref('budgets', id) : null;
    },
    purchaseHref(id) {
      return isModuleEnabled('purchases') ? moduleHref('purchases', id) : null;
    },
    documentHref(id) {
      return moduleHref('documents', id);
    },
    quoteHref(id) {
      return `./products.html?tab=cotizaciones&quote=${encodeURIComponent(id)}`;
    },
    priceHref(productId) {
      return `./products.html?tab=precios&product=${encodeURIComponent(productId)}`;
    },
    projectName(id) {
      return data.projects.find((item) => item.id === id)?.name || id;
    },
    openCreate() {
      this.form = emptyMasterForm(kind);
      this.formError = '';
      Modal.getOrCreateInstance(document.getElementById('master-form-modal')).show();
    },
    openEdit(record) {
      this.form = masterForm(record, kind);
      this.formError = '';
      Modal.getOrCreateInstance(document.getElementById('master-form-modal')).show();
    },
    saveForm() {
      this.formError = validateMasterForm(this.form, masterRecords(data, kind));
      if (this.formError) return;
      const isNew = !this.form.id;
      const id = saveMasterForm(data, kind, this.form);
      Modal.getOrCreateInstance(document.getElementById('master-form-modal')).hide();
      this.afterSave(id, isNew);
      const noun = kind === 'clients' ? 'Cliente' : 'Proveedor';
      window.AdminApp?.notificationManager?.success(
        isNew ? `${noun} ${id} registrado en esta demostración.` : `${noun} actualizado.`
      );
    },
  };
}

function masterList(kind) {
  const params = new URLSearchParams(window.location.search);
  return {
    ...masterShared(kind),
    records: [],
    search: (params.get('search') || '').slice(0, 120),
    statusFilter: MASTER_STATUSES.includes(params.get('status')) ? params.get('status') : '',
    groupFilter: (params.get('group') || '').slice(0, 80),
    init() {
      this.reload();
      document.title = `${kind === 'clients' ? 'Clientes' : 'Proveedores'} · ${activeVariant.company.shortName}`;
      if (params.get('new') === '1' && this.allowed) this.$nextTick(() => this.openCreate());
    },
    reload() {
      this.records = masterRecords(data, kind).map((record) => ({
        ...record,
        relations: relationsOf(kind, record.id),
      }));
    },
    afterSave() {
      this.reload();
    },
    // Sector for clients, categories for suppliers.
    groupsOf(record) {
      return kind === 'clients' ? [record.sector].filter(Boolean) : record.categories;
    },
    get groups() {
      return [...new Set(this.records.flatMap((record) => this.groupsOf(record)))].sort((a, b) =>
        a.localeCompare(b, 'es')
      );
    },
    get filtered() {
      const term = normalize(this.search.trim());
      return this.records.filter((record) => {
        const contact = this.primaryContact(record);
        const text = `${record.id} ${record.ruc} ${record.name} ${record.tradeName} ${record.specialty} ${record.brands.join(' ')} ${contact?.name || ''}`;
        return (
          (!term || normalize(text).includes(term)) &&
          (!this.statusFilter || record.status === this.statusFilter) &&
          (!this.groupFilter || this.groupsOf(record).includes(this.groupFilter))
        );
      });
    },
    get activeCount() {
      return this.records.filter((record) => record.status === 'Activo').length;
    },
    get withProjectsCount() {
      return this.records.filter((record) =>
        kind === 'clients'
          ? record.relations.inExecution > 0
          : record.relations.purchases.length > 0
      ).length;
    },
    get relatedTotal() {
      return this.records.reduce(
        (total, record) =>
          total +
          (kind === 'clients' ? record.relations.budgetAmount : record.relations.purchasedAmount),
        0
      );
    },
    get relatedCount() {
      return this.records.reduce(
        (total, record) =>
          total +
          (kind === 'clients'
            ? record.relations.projects.length
            : record.relations.purchases.length),
        0
      );
    },
    projectsListHref(record) {
      return `./projects.html?client=${encodeURIComponent(record.id)}`;
    },
    purchasesListHref(record) {
      return `./purchases.html?supplier=${encodeURIComponent(record.id)}`;
    },
    updateUrl() {
      const url = new URL(window.location.href);
      for (const [key, value] of [
        ['search', this.search.trim()],
        ['status', this.statusFilter],
        ['group', this.groupFilter],
      ]) {
        if (value) url.searchParams.set(key, value);
        else url.searchParams.delete(key);
      }
      url.searchParams.delete('new');
      window.history.replaceState({}, '', url);
    },
    clearFilters() {
      this.search = '';
      this.statusFilter = '';
      this.groupFilter = '';
      this.updateUrl();
    },
  };
}

function masterDetail(kind) {
  const params = new URLSearchParams(window.location.search);
  const tabs = DETAIL_TABS[kind];
  return {
    ...masterShared(kind),
    id: params.get('id') || '',
    record: null,
    relations: null,
    tabs,
    tab: tabs.some(([id]) => id === params.get('tab')) ? params.get('tab') : 'general',
    init() {
      this.load();
      if (this.record) document.title = `${this.record.name} · ${activeVariant.company.shortName}`;
    },
    load() {
      this.record = this.allowed ? masterRecord(data, kind, this.id) : null;
      this.relations = this.record ? relationsOf(kind, this.record.id) : null;
    },
    afterSave() {
      this.load();
    },
    setTab(id) {
      if (!tabs.some(([tabId]) => tabId === id)) return;
      this.tab = id;
      const url = new URL(window.location.href);
      url.searchParams.set('tab', id);
      window.history.replaceState({}, '', url);
    },
    tabCount(id) {
      const relations = this.relations;
      if (!relations) return null;
      return {
        contactos: this.record.contacts.length,
        proyectos: relations.projects.length,
        presupuestos: relations.budgets?.length,
        documentos: relations.documents.length,
        productos: this.record.offerings.length,
        precios: relations.prices?.length,
        cotizaciones: relations.quotes?.length,
        compras: relations.purchases?.length,
      }[id];
    },
    get history() {
      return [...this.record.history].sort((a, b) => b.date.localeCompare(a.date));
    },
  };
}

export const clientsList = () => masterList('clients');
export const suppliersList = () => masterList('suppliers');
export const clientDetail = () => masterDetail('clients');
export const supplierDetail = () => masterDetail('suppliers');
