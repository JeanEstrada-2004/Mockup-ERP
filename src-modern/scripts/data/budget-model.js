// Presupuestos técnicos, Productos y precios (R4, J&Y Demo: rules.budgetFlow =
// 'technical'). Shared by every build, no company data here: base budgets,
// catalogue and quotes come from the data set. What the demonstration adds —
// new versions, duplicated budgets and registered quotes — lives per variant
// in localStorage and never changes the base budgets or project figures.
//
// Nueva versión ≠ duplicar: a new version keeps the budget's identity
// (PR2606-0022-V3-GM); duplicating creates another budget (new correlative)
// that only reuses its partidas or products.
import { activeVariant, variantStorageKey } from '../config/variants.js';
import { budgetCode, budgetTotals } from './budget-calc.js';

export const BUDGET_STATUSES = [
  'Borrador',
  'En revisión',
  'Enviado al cliente',
  'Aceptado',
  'No aceptado',
  'Reemplazado',
];
const draftsKey = variantStorageKey('budget-drafts');
const copiesKey = variantStorageKey('budget-copies');
const quotesKey = variantStorageKey('demo-quotes');
const clone = (value) => JSON.parse(JSON.stringify(value));

function read(key, fallback) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || 'null');
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}
function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

// ---- Quotes -------------------------------------------------------------
export function loadQuotes(data) {
  const local = read(quotesKey, []);
  return [
    ...(data.quotes || []).map((quote) => ({ ...quote, base: true })),
    ...(Array.isArray(local) ? local : [])
      .filter((quote) => quote && /^COT-DEMO-\d{3}$/.test(quote.id) && Array.isArray(quote.items))
      .map((quote) => ({ ...quote, base: false })),
  ];
}

export function saveQuote(data, quote) {
  const local = read(quotesKey, []).filter((item) => item.id !== quote.id);
  return write(quotesKey, [...local, clone(quote)]);
}

export function nextQuoteId(quotes) {
  const max = quotes.reduce((current, quote) => {
    const number = Number(String(quote.id).replace('COT-DEMO-', ''));
    return /^COT-DEMO-/.test(quote.id) && Number.isSafeInteger(number)
      ? Math.max(current, number)
      : current;
  }, 0);
  return `COT-DEMO-${String(max + 1).padStart(3, '0')}`;
}

export function budgetContext(data) {
  return { products: data.products || [], quotes: loadQuotes(data) };
}

export function quoteValidity(quote, today) {
  return quote.validUntil >= today ? 'Vigente' : 'Vencida';
}

// Everything known about the price of a product: internal reference and each
// quote, most recent first.
export function priceHistory(data, productId) {
  const product = (data.products || []).find((item) => item.id === productId);
  const rows = loadQuotes(data)
    .flatMap((quote) =>
      quote.items
        .filter((item) => item.productId === productId)
        .map((item) => ({
          date: quote.date,
          source: 'Cotización',
          quoteId: quote.id,
          supplierId: quote.supplierId,
          price: item.price,
          brand: item.brand || '',
          spec: item.spec || '',
          leadDays: item.leadDays,
          availability: item.availability,
          validUntil: quote.validUntil,
          local: !quote.base,
        }))
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  if (product)
    rows.push({
      date: '',
      source: 'Precio interno de referencia',
      quoteId: null,
      supplierId: null,
      price: product.refPrice,
      brand: product.brand || '',
      spec: product.spec || '',
    });
  return rows;
}

// ---- Budget versions and copies ----------------------------------------
function readDrafts() {
  const parsed = read(draftsKey, {});
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
}

export function localVersions(budgetId) {
  const list = readDrafts()[budgetId];
  return Array.isArray(list) ? list.filter((item) => Number.isSafeInteger(item.version)) : [];
}

export function saveLocalVersion(budgetId, entry) {
  const drafts = readDrafts();
  drafts[budgetId] = [
    ...localVersions(budgetId).filter((item) => item.version !== entry.version),
    clone(entry),
  ];
  return write(draftsKey, drafts);
}

export function loadCopies() {
  const list = read(copiesKey, []);
  return Array.isArray(list) ? list.filter((item) => /^PR\d{4}-\d{4}$/.test(item?.id)) : [];
}

// All budgets: base ones (with their local versions) and local duplicates.
export function loadBudgets(data) {
  return [
    ...(data.budgets || []).map((budget) => ({ ...budget, base: true })),
    ...loadCopies().map((budget) => ({ ...budget, base: false })),
  ];
}

// Versions of a budget: the recorded ones plus those created in the demo.
export function versionsOf(data, budget) {
  const ctx = budgetContext(data);
  const recorded = (budget.versions || []).map((entry) => ({ ...entry, local: false }));
  const local = localVersions(budget.id).map((entry) => ({
    ...entry,
    local: true,
    amount: budgetTotals(ctx, budget, entry.overrides).total,
  }));
  return [...recorded, ...local].sort((a, b) => b.version - a.version);
}

export function currentVersion(data, budget) {
  return versionsOf(data, budget)[0];
}

export function displayCode(data, budget) {
  return budgetCode(budget, currentVersion(data, budget)?.version || budget.version);
}

// Correlative of a new budget: PR + AAMM of today + next number of all budgets.
export function nextBudgetId(data) {
  const yymm = data.today.slice(2, 4) + data.today.slice(5, 7);
  const max = loadBudgets(data).reduce(
    (current, budget) => Math.max(current, Number(budget.id.slice(-4)) || 0),
    0
  );
  return `PR${yymm}-${String(max + 1).padStart(4, '0')}`;
}

export function duplicateBudget(data, source, overrides, form) {
  const id = nextBudgetId(data);
  const copy = {
    ...clone(source),
    id,
    title: form.title || source.title,
    clientId: form.clientId || source.clientId,
    projectId: null,
    responsibleId: form.responsibleId || source.responsibleId,
    date: data.today,
    version: 1,
    status: 'Borrador',
    documentId: null,
    copiedFrom: displayCode(data, source),
    overheadPct: overrides?.overheadPct ?? source.overheadPct,
    profitPct: overrides?.profitPct ?? source.profitPct,
    selections: { ...source.selections, ...overrides?.selections },
    versions: [
      {
        version: 1,
        date: data.today,
        responsibleId: form.responsibleId || source.responsibleId,
        status: 'Borrador',
        comment: `Duplicado de ${displayCode(data, source)}. ${form.comment || ''}`.trim(),
        amount: null,
      },
    ],
  };
  if (copy.partidas) {
    copy.partidas = copy.partidas.map((item) =>
      item.apu && overrides?.quantities?.[item.code] !== undefined
        ? { ...item, quantity: overrides.quantities[item.code] }
        : item
    );
  }
  if (copy.products) {
    copy.products = copy.products.map((item) =>
      overrides?.quantities?.[item.id] !== undefined
        ? { ...item, quantity: overrides.quantities[item.id] }
        : item
    );
  }
  copy.amount = budgetTotals(budgetContext(data), copy).total;
  copy.versions[0].amount = copy.amount;
  write(copiesKey, [...loadCopies().filter((item) => item.id !== id), copy]);
  return copy;
}

export function saveCopy(copy) {
  return write(copiesKey, [...loadCopies().filter((item) => item.id !== copy.id), clone(copy)]);
}

export function versionEvent(action) {
  return { by: activeVariant.user.name, action };
}
