// Rendiciones with administrative review (R2, J&Y Demo: variant.rules.expenseFlow
// = 'review'). Shared by every build, so no company record lives here: base
// reports come from the data set (`data.expenseReports`); what the demonstration
// changes is kept per variant in localStorage and never alters project costs.
import { activeVariant, variantStorageKey } from '../config/variants.js';

// Flow levanted with J&Y: the spender (or Administración with the photos sent
// from the field) prepares the report, Administración reviews it, may observe
// it, and once accepted it is handed to Contabilidad. No multi-level approval.
export const REVIEW_STATUSES = [
  'Borrador',
  'Presentada',
  'Observada',
  'Corregida',
  'Aceptada',
  'Entregada a Contabilidad',
];
export const REVIEW_PENDING = ['Presentada', 'Corregida'];
// Accepted reports are the ones that count as project cost.
export const REVIEW_COST = ['Aceptada', 'Entregada a Contabilidad'];

// Categories observed in J&Y's spreadsheets; configurable in Administración.
// Category (how the expense is classified) is not the description (what it was).
export const EXPENSE_CATEGORIES = [
  'Alimentación',
  'Hospedaje',
  'Movilidad',
  'Transporte',
  'EMO/SCTR',
  'Planilla',
  'Servicio',
  'Útiles/impresiones',
  'Suministro',
  'Envíos/traslado de materiales',
];

// "Comprobante" at J&Y covers several kinds of evidence; only some of them are
// tax documents. `formal` documents carry V.V./IGV/No gravado; the others are
// recorded as No documentado (still a real cost: J&Y Real).
export const EVIDENCE_TYPES = {
  factura: { label: 'Factura electrónica', short: 'Factura', formal: true, layout: 'invoice' },
  boleta: {
    label: 'Boleta de venta electrónica',
    short: 'Boleta',
    formal: true,
    layout: 'invoice',
  },
  'boleta-foto': {
    label: 'Fotografía de boleta',
    short: 'Boleta (foto)',
    formal: true,
    layout: 'photo',
  },
  yape: { label: 'Captura de Yape', short: 'Yape', formal: false, layout: 'wallet' },
  plin: { label: 'Captura de Plin', short: 'Plin', formal: false, layout: 'wallet' },
  transferencia: {
    label: 'Constancia de transferencia',
    short: 'Transferencia',
    formal: false,
    layout: 'transfer',
  },
  deposito: {
    label: 'Constancia de depósito',
    short: 'Depósito',
    formal: false,
    layout: 'transfer',
  },
  'sin-documento': {
    label: 'Sin documento',
    short: 'Sin documento',
    formal: false,
    layout: 'none',
  },
};

export const ITEM_REVIEW = ['Pendiente', 'Conforme', 'Observado', 'Corregido'];
const OCR_FIELDS = ['ruc', 'vendor', 'date', 'series', 'number', 'vv', 'igv', 'nonTaxed', 'total'];
export const FIELD_LABELS = {
  ruc: 'RUC',
  vendor: 'Razón social',
  date: 'Fecha',
  series: 'Serie',
  number: 'Número',
  vv: 'V.V.',
  igv: 'IGV',
  nonTaxed: 'No gravado',
  total: 'Total',
  description: 'Descripción',
  category: 'Clasificación',
  justification: 'Motivo',
  docType: 'Tipo de evidencia',
};

const round = (value) => Math.round((Number(value) || 0) * 100) / 100;
const storageKey = variantStorageKey('expense-reports');

export const isFormal = (item) => Boolean(EVIDENCE_TYPES[item.docType]?.formal);
export const evidenceLayout = (item) => EVIDENCE_TYPES[item.docType]?.layout || 'none';

// Formal documents keep their tax breakdown; any other evidence is No documentado.
export function itemAmounts(item) {
  if (!isFormal(item)) {
    return {
      vv: 0,
      igv: 0,
      nonTaxed: 0,
      undocumented: round(item.total),
      total: round(item.total),
    };
  }
  return {
    vv: round(item.vv),
    igv: round(item.igv),
    nonTaxed: round(item.nonTaxed),
    undocumented: 0,
    total: round(item.total),
  };
}

export function reportTotals(report) {
  const totals = { vv: 0, igv: 0, nonTaxed: 0, undocumented: 0, total: 0 };
  for (const item of report?.items || []) {
    const amounts = itemAmounts(item);
    for (const key of Object.keys(totals)) totals[key] = round(totals[key] + amounts[key]);
  }
  const items = report?.items || [];
  return {
    ...totals,
    documented: round(totals.vv + totals.igv + totals.nonTaxed),
    count: items.length,
    withoutDocument: items.filter((item) => item.docType === 'sin-documento').length,
    informal: items.filter((item) => !isFormal(item)).length,
    observed: items.filter((item) => item.review === 'Observado').length,
    conforming: items.filter((item) => item.review === 'Conforme').length,
  };
}

export function reportNumber(report) {
  return `N.º ${report.number}-${report.year}`;
}

// OCR/KIE proposal: what was detected on the evidence, with a confidence per
// field. Registered values are what a person confirmed or corrected.
export function suggestedValues(item) {
  if (!isFormal(item) && item.docType === 'sin-documento') return null;
  const base = Object.fromEntries(OCR_FIELDS.map((field) => [field, item[field]]));
  return { ...base, ...(item.suggested || {}) };
}

export function fieldConfidence(item, field) {
  if (item.docType === 'sin-documento') return null;
  const fallback = evidenceLayout(item) === 'photo' ? 'media' : 'alta';
  return item.confidence?.[field] || fallback;
}

export function correctedFields(item) {
  const suggested = suggestedValues(item);
  if (!suggested) return [];
  return OCR_FIELDS.filter((field) => String(suggested[field] ?? '') !== String(item[field] ?? ''));
}

function readStore() {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function validReport(report) {
  return (
    report &&
    typeof report.id === 'string' &&
    REVIEW_STATUSES.includes(report.status) &&
    Array.isArray(report.items) &&
    Array.isArray(report.history)
  );
}

// Base reports (with local review changes applied) plus reports created here.
export function loadReports(data) {
  const store = readStore();
  const base = (data.expenseReports || []).map((report) => {
    const local = store[report.id];
    return validReport(local) ? { ...local, base: true, edited: true } : { ...report, base: true };
  });
  const created = Object.values(store)
    .filter((report) => validReport(report) && /^R-DEMO-\d{3,}$/.test(report.id))
    .map((report) => ({ ...report, base: false }));
  return [...base, ...created];
}

export function saveReport(report) {
  try {
    const store = readStore();
    const clean = JSON.parse(JSON.stringify(report));
    delete clean.base;
    delete clean.edited;
    store[report.id] = clean;
    localStorage.setItem(storageKey, JSON.stringify(store));
    return true;
  } catch {
    return false;
  }
}

export function nextReportId(reports) {
  const max = reports.reduce((current, report) => {
    const number = Number(String(report.id).replace('R-DEMO-', ''));
    return /^R-DEMO-/.test(report.id) && Number.isSafeInteger(number)
      ? Math.max(current, number)
      : current;
  }, 0);
  return `R-DEMO-${String(max + 1).padStart(3, '0')}`;
}

// J&Y numbers rendiciones per worker and year: "N.º 15-2026".
export function nextReportNumber(reports, workerId, year) {
  return (
    reports
      .filter((report) => report.workerId === workerId && report.year === year)
      .reduce((max, report) => Math.max(max, report.number), 0) + 1
  );
}

export function reviewEvent(data, action, note = '') {
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return { at: `${data.today}T${time}`, user: activeVariant.user.name, action, note, local: true };
}

// Data checks before a report can be presented (or a correction sent).
export function itemProblems(item) {
  const problems = [];
  if (!item.date) problems.push('fecha');
  if (!(Number(item.total) > 0)) problems.push('total mayor que cero');
  if (!EXPENSE_CATEGORIES.includes(item.category)) problems.push('clasificación');
  if (!String(item.description || '').trim()) problems.push('descripción');
  if (item.docType === 'sin-documento' && !String(item.justification || '').trim())
    problems.push('motivo del gasto sin documento');
  if (isFormal(item)) {
    if (!/^(10|15|17|20)\d{9}$/.test(String(item.ruc || ''))) problems.push('RUC de 11 dígitos');
    if (
      Math.abs(round(item.vv) + round(item.igv) + round(item.nonTaxed) - round(item.total)) > 0.01
    )
      problems.push('V.V. + IGV + No gravado igual al total');
  }
  return problems;
}
