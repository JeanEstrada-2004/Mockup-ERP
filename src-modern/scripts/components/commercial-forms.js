// ==========================================================================
// Altas de demostración: Nuevo presupuesto (puntos 25–28) y Nueva orden de
// compra (puntos 32–35). Entrega 4.
// ==========================================================================
// Both are separate Alpine scopes around their modal. Records are saved per
// variant in localStorage, marked as demonstration, and never enter the
// portfolio totals, executed costs or commitments.

import { Modal } from 'bootstrap';
import Swal from 'sweetalert2';
import { activeVariant, variantStorageKey } from '../config/variants.js';
import { getCostBySource, getDataForVariant, getProject } from '../data/mock-data.js';
import { COST_SOURCES } from '../data/cost-data.js';
import { TAX_RATE, formatAmount } from '../data/commercial-data.js';

const data = getDataForVariant(activeVariant);
export const DEMO_BUDGETS_KEY = variantStorageKey('demo-budgets');
export const DEMO_PURCHASES_KEY = variantStorageKey('demo-purchases');

export function loadDemo(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(parsed) ? parsed.filter((item) => item?.id) : [];
  } catch {
    return [];
  }
}

function saveDemo(key, records) {
  try {
    localStorage.setItem(key, JSON.stringify(records));
  } catch {
    /* private mode: the record lives until reload */
  }
}

function nextId(prefix, records) {
  const numbers = records
    .map((item) => Number(String(item.id).replace(prefix, '')))
    .filter(Number.isFinite);
  return `${prefix}${String(Math.max(0, ...numbers) + 1).padStart(3, '0')}`;
}

/** "Generar PDF / documento" — punto 28: confirmation only, no file is created. */
export function generateDocument(fileName, description) {
  return Swal.fire({
    icon: 'success',
    title: 'Documento generado correctamente',
    text: `${description} (${fileName}) quedó vinculado al registro en Gestión Documental.`,
    confirmButtonText: 'Aceptar',
    customClass: { confirmButton: 'btn btn-primary' },
    buttonsStyling: false,
  });
}

const round2 = (value) => Math.round((Number(value) || 0) * 100) / 100;
const today = () => new Date().toISOString().slice(0, 10);

// --------------------------------------------------------------------------
// Nuevo presupuesto
// --------------------------------------------------------------------------
// Hierarchical items: chapters (1, 2) sum their leaves (1.1, 1.2 …).
function defaultBudgetLines() {
  return [
    { code: '1', name: 'Infraestructura', chapter: true },
    {
      code: '1.1',
      name: 'Cableado estructurado',
      unit: 'm',
      quantity: 400,
      unitCost: 9,
      unitPrice: 12.5,
    },
    {
      code: '1.2',
      name: 'Equipos de red',
      unit: 'und',
      quantity: 6,
      unitCost: 1450,
      unitPrice: 1890,
    },
    { code: '2', name: 'Instalación', chapter: true },
    { code: '2.1', name: 'Mano de obra', unit: 'h', quantity: 160, unitCost: 28, unitPrice: 42 },
    {
      code: '2.2',
      name: 'Configuración y pruebas',
      unit: 'servicio',
      quantity: 1,
      unitCost: 2400,
      unitPrice: 3600,
    },
  ];
}

function emptyBudget(id) {
  return {
    id,
    clientId: '',
    projectId: '',
    date: today(),
    validityDays: 30,
    currency: 'PEN',
    managerId: '',
    version: 1,
    description: '',
    discountPercent: 0,
    lines: defaultBudgetLines(),
  };
}

export function budgetTotals(form) {
  const leaves = form.lines.filter((line) => !line.chapter);
  const subtotal = round2(leaves.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0));
  const discount = round2(subtotal * ((Number(form.discountPercent) || 0) / 100));
  const saleValue = round2(subtotal - discount);
  const tax = round2(saleValue * TAX_RATE);
  const total = round2(saleValue + tax);
  const estimatedCost = round2(
    leaves.reduce((sum, line) => sum + line.quantity * line.unitCost, 0)
  );
  const margin = saleValue ? round2(((saleValue - estimatedCost) / saleValue) * 100) : 0;
  return { subtotal, discount, saleValue, tax, total, estimatedCost, margin };
}

export function budgetCreate() {
  return {
    form: emptyBudget('PRE-DEMO-001'),
    clients: data.clients,
    projects: data.projects,
    workers: data.workers,
    formatAmount,
    lineTotal(line) {
      if (!line.chapter) return round2(line.quantity * line.unitPrice);
      const prefix = `${line.code}.`;
      return round2(
        this.form.lines
          .filter((item) => !item.chapter && item.code.startsWith(prefix))
          .reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
      );
    },
    get totals() {
      return budgetTotals(this.form);
    },
    init() {
      const params = new URLSearchParams(location.search);
      if (params.has('new')) this.$nextTick(() => this.open());
      const source = params.get('duplicate');
      if (source) this.$nextTick(() => this.open(source));
    },
    open(duplicateOf = '') {
      const records = loadDemo(DEMO_BUDGETS_KEY);
      this.form = emptyBudget(nextId('PRE-DEMO-', records));
      const base = data.budgets.find((item) => item.id === duplicateOf);
      if (base) {
        this.form.clientId = base.clientId;
        this.form.projectId = base.projectId;
        this.form.description = `Copia de ${base.id}`;
        this.form.managerId = getProject(data, base.projectId)?.managerId || '';
      }
      Modal.getOrCreateInstance(document.getElementById('budget-create-modal')).show();
    },
    selectProject() {
      const project = getProject(data, this.form.projectId);
      if (project) {
        this.form.clientId = project.clientId;
        this.form.managerId = project.managerId;
      }
    },
    save(status) {
      const element = document.getElementById('budget-create-form');
      if (!element?.reportValidity()) return;
      const records = loadDemo(DEMO_BUDGETS_KEY);
      const entry = {
        ...JSON.parse(JSON.stringify(this.form)),
        status,
        amount: this.totals.total,
        demo: true,
        history: [
          {
            label: status === 'En revisión' ? 'Enviado a revisión' : 'Borrador guardado',
            at: new Date().toISOString(),
          },
        ],
      };
      saveDemo(DEMO_BUDGETS_KEY, [...records.filter((item) => item.id !== entry.id), entry]);
      Modal.getOrCreateInstance(document.getElementById('budget-create-modal')).hide();
      window.dispatchEvent(new CustomEvent('demo-budgets-changed'));
      window.AdminApp?.notificationManager?.success(
        status === 'En revisión'
          ? `Presupuesto ${entry.id} enviado a revisión.`
          : `Presupuesto ${entry.id} guardado como borrador.`
      );
    },
  };
}

// --------------------------------------------------------------------------
// Nueva orden de compra
// --------------------------------------------------------------------------
export const PAYMENT_TERMS = ['Contado', 'Crédito 30 días', 'Crédito 60 días', 'Adelanto 50 %'];

function emptyPurchase(id) {
  return {
    id,
    projectId: '',
    supplierId: '',
    date: today(),
    currency: 'PEN',
    managerId: '',
    paymentTerms: PAYMENT_TERMS[1],
    deliveryPlace: '',
    notes: '',
    budgetLine: 'purchases',
    costCenter: '',
    quotation: '',
    lines: [{ description: '', quantity: 1, unit: 'und', unitPrice: 0 }],
  };
}

/**
 * Referential balance of a cost line (partida) for one project: its share of
 * the budget (cost-data.js allocations) minus what that source already
 * executed and the open commitments when the line is Compras.
 */
export function budgetLineBalance(projectId, lineId) {
  const project = getProject(data, projectId);
  const source = COST_SOURCES.find((item) => item.id === lineId);
  if (!project || !source) return null;
  const allocated = round2((project.budgetAmount * source.allocation) / 100);
  const executed = getCostBySource(data, projectId)[lineId] || 0;
  const committed =
    lineId === 'purchases'
      ? data.operations
          .filter((item) => item.projectId === projectId)
          .reduce((sum, item) => sum + (item.commitmentOpen || 0), 0)
      : 0;
  return { allocated, executed, committed, available: round2(allocated - executed - committed) };
}

export function purchaseCreate() {
  return {
    form: emptyPurchase('OC-DEMO-001'),
    projects: data.projects,
    suppliers: data.suppliers,
    workers: data.workers,
    budgetLines: COST_SOURCES,
    paymentTerms: PAYMENT_TERMS,
    formatAmount,
    lineSubtotal(line) {
      return round2(line.quantity * line.unitPrice);
    },
    lineTax(line) {
      return round2(this.lineSubtotal(line) * TAX_RATE);
    },
    get subtotal() {
      return round2(this.form.lines.reduce((sum, line) => sum + this.lineSubtotal(line), 0));
    },
    get tax() {
      return round2(this.subtotal * TAX_RATE);
    },
    get total() {
      return round2(this.subtotal + this.tax);
    },
    get balance() {
      return budgetLineBalance(this.form.projectId, this.form.budgetLine);
    },
    get exceedsLine() {
      return Boolean(this.balance && this.total > this.balance.available);
    },
    get quotations() {
      return data.budgets.filter(
        (item) => !this.form.projectId || item.projectId === this.form.projectId
      );
    },
    init() {
      if (new URLSearchParams(location.search).has('new')) this.$nextTick(() => this.open());
    },
    open() {
      this.form = emptyPurchase(nextId('OC-DEMO-', loadDemo(DEMO_PURCHASES_KEY)));
      Modal.getOrCreateInstance(document.getElementById('purchase-create-modal')).show();
    },
    selectProject() {
      const project = getProject(data, this.form.projectId);
      if (!project) return;
      this.form.managerId = project.managerId;
      this.form.costCenter = `CC-${project.id.replace(/^(PR|PY)-/, '')}`;
      this.form.quotation = project.budgetId || '';
    },
    addLine() {
      this.form.lines.push({ description: '', quantity: 1, unit: 'und', unitPrice: 0 });
    },
    removeLine(index) {
      if (this.form.lines.length > 1) this.form.lines.splice(index, 1);
    },
    save(status) {
      const element = document.getElementById('purchase-create-form');
      if (!element?.reportValidity()) return;
      const records = loadDemo(DEMO_PURCHASES_KEY);
      const entry = {
        ...JSON.parse(JSON.stringify(this.form)),
        status,
        amount: this.total,
        demo: true,
      };
      saveDemo(DEMO_PURCHASES_KEY, [...records.filter((item) => item.id !== entry.id), entry]);
      Modal.getOrCreateInstance(document.getElementById('purchase-create-modal')).hide();
      window.dispatchEvent(new CustomEvent('demo-purchases-changed'));
      window.AdminApp?.notificationManager?.success(
        status === 'Pendiente'
          ? 'Orden de Compra enviada a aprobación.'
          : `Orden de Compra ${entry.id} guardada como borrador.`
      );
    },
  };
}
