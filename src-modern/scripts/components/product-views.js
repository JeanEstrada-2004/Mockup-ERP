// Productos y precios (R4, J&Y Demo): catalogue, price search with history,
// supplier quotes with their attachment, and a supplier comparator. Quotes
// registered here are local to the demonstration.
import { Modal } from 'bootstrap';
import { activeVariant, isModuleEnabled } from '../config/variants.js';
import { moduleHref } from '../config/modules.js';
import { getDataForVariant } from '../data/mock-data.js';
import { formatAmount } from '../data/commercial-data.js';
import {
  loadQuotes,
  nextQuoteId,
  priceHistory,
  quoteValidity,
  saveQuote,
} from '../data/budget-model.js';
import { formatDate } from './project-views.js';

const data = getDataForVariant(activeVariant);
const TABS = [
  ['catalogo', 'Catálogo'],
  ['precios', 'Búsqueda de precios'],
  ['cotizaciones', 'Cotizaciones'],
  ['comparador', 'Comparador'],
];
const KINDS = ['Mano de obra', 'Material', 'Equipo', 'Producto', 'Servicio'];
const normalize = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

function emptyQuote(productId = '') {
  return {
    supplierId: '',
    productId,
    price: '',
    currency: 'PEN',
    brand: '',
    leadDays: 5,
    date: data.today,
    validUntil: '',
    attachmentType: 'PDF',
    attachmentName: '',
    notes: '',
  };
}

export function productsWorkspace() {
  const params = new URLSearchParams(location.search);
  const products = (data.products || []).filter((item) => item.unit !== '%MO');
  const requestedProduct = products.find((item) => item.id === params.get('product'))?.id || '';
  return {
    allowed: isModuleEnabled('products'),
    tabs: TABS,
    kinds: KINDS,
    tab: TABS.some(([id]) => id === params.get('tab'))
      ? params.get('tab')
      : requestedProduct
        ? 'precios'
        : 'catalogo',
    products,
    quotes: [],
    suppliers: data.suppliers,
    search: '',
    kindFilter: '',
    priceSearch: '',
    productId: requestedProduct || products.find((item) => item.kind === 'Material')?.id || '',
    compareId: requestedProduct || 'PRD-01',
    supplierFilter: '',
    highlightQuote: params.get('quote') || '',
    form: emptyQuote(),
    formError: '',
    formatAmount,
    formatDate,
    init() {
      this.quotes = loadQuotes(data);
      document.title = `Productos y precios · ${activeVariant.company.shortName}`;
      if (!this.comparable.some((item) => item.id === this.compareId))
        this.compareId = this.comparable[0]?.id || '';
    },
    setTab(id) {
      this.tab = id;
      const next = new URL(location.href);
      next.searchParams.set('tab', id);
      history.replaceState(null, '', next);
    },
    supplierName(id) {
      return data.suppliers.find((item) => item.id === id)?.name || '—';
    },
    supplierHref(id) {
      return moduleHref('suppliers', id);
    },
    product(id) {
      return this.products.find((item) => item.id === id) || null;
    },
    offersOf(productId) {
      return this.quotes
        .flatMap((quote) =>
          quote.items
            .filter((item) => item.productId === productId)
            .map((item) => ({ ...item, quote }))
        )
        .sort((a, b) => a.price - b.price);
    },
    lastQuote(productId) {
      return (
        this.offersOf(productId).sort((a, b) => b.quote.date.localeCompare(a.quote.date))[0] || null
      );
    },
    get filteredProducts() {
      const term = normalize(this.search.trim());
      return this.products.filter(
        (item) =>
          (!term ||
            normalize(`${item.code} ${item.name} ${item.category} ${item.brand || ''}`).includes(
              term
            )) &&
          (!this.kindFilter || item.kind === this.kindFilter)
      );
    },
    // ---- Price search ---------------------------------------------------
    get priceMatches() {
      const term = normalize(this.priceSearch.trim());
      if (!term) return [];
      return this.products
        .filter((item) =>
          normalize(`${item.code} ${item.name} ${item.spec || ''} ${item.brand || ''}`).includes(
            term
          )
        )
        .slice(0, 8);
    },
    choose(id) {
      this.productId = id;
      this.priceSearch = '';
      const next = new URL(location.href);
      next.searchParams.set('product', id);
      history.replaceState(null, '', next);
    },
    get selected() {
      return this.product(this.productId);
    },
    get history() {
      // Recomputed when quotes change (local quotes included).
      return this.quotes.length >= 0 ? priceHistory(data, this.productId) : [];
    },
    get knownSuppliers() {
      const name = normalize(this.selected?.name || '');
      const byQuote = new Set(this.offersOf(this.productId).map((item) => item.quote.supplierId));
      return data.suppliers.filter(
        (supplier) =>
          byQuote.has(supplier.id) ||
          supplier.offerings.some(
            (offering) =>
              normalize(offering.name).includes(name) || name.includes(normalize(offering.name))
          )
      );
    },
    // ---- Quotes ---------------------------------------------------------
    get filteredQuotes() {
      return this.quotes
        .filter((quote) => !this.supplierFilter || quote.supplierId === this.supplierFilter)
        .sort((a, b) => b.date.localeCompare(a.date));
    },
    validity(quote) {
      return quoteValidity(quote, data.today);
    },
    openQuote(productId = '') {
      this.form = emptyQuote(productId || this.productId);
      this.formError = '';
      Modal.getOrCreateInstance(document.getElementById('quote-new-modal')).show();
    },
    saveQuoteForm() {
      const form = this.form;
      const price = Math.round(Number(form.price) * 100) / 100;
      if (!form.supplierId || !this.product(form.productId) || !(price > 0) || !form.validUntil) {
        this.formError = 'Completa proveedor, producto, precio mayor que cero y vigencia.';
        return;
      }
      if (form.validUntil < form.date) {
        this.formError = 'La vigencia no puede ser anterior a la fecha de la cotización.';
        return;
      }
      const quote = {
        id: nextQuoteId(this.quotes),
        supplierId: form.supplierId,
        date: form.date,
        validUntil: form.validUntil,
        currency: form.currency,
        items: [
          {
            productId: form.productId,
            price,
            brand: form.brand.trim().slice(0, 40),
            leadDays: Math.max(0, Math.round(Number(form.leadDays) || 0)),
            availability: 'Según cotización',
          },
        ],
        conditions: '',
        attachment: {
          fileName:
            form.attachmentName.trim().slice(0, 80) ||
            `${form.attachmentType === 'PDF' ? 'cotizacion.pdf' : 'cotizacion.jpg'}`,
          type: form.attachmentType,
        },
        notes: form.notes.trim().slice(0, 200),
        budgetId: null,
      };
      saveQuote(data, quote);
      this.quotes = loadQuotes(data);
      this.highlightQuote = quote.id;
      Modal.getOrCreateInstance(document.getElementById('quote-new-modal')).hide();
      window.AdminApp?.notificationManager?.success(
        `Cotización ${quote.id} registrada en esta demostración.`
      );
    },
    // ---- Comparator -----------------------------------------------------
    get comparable() {
      return this.products.filter((item) => this.offersOf(item.id).length >= 2);
    },
    get comparison() {
      return this.offersOf(this.compareId);
    },
  };
}
