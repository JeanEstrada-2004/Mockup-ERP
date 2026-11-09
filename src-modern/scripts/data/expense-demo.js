import { activeVariant, variantStorageKey } from '../config/variants.js';

const storageKey = variantStorageKey('expense-demos');
const round = (value) => Math.round((Number(value) || 0) * 100) / 100;

export function expenseExamples(data) {
  return [
    {
      id: 'factura-ejemplo',
      label: 'Factura de suministros',
      number: 'F001-000128',
      vendor: data.suppliers[0]?.name || 'Proveedor de ejemplo',
      ruc: '20100000001',
      date: '2027-04-03',
      description: 'Suministros para el proyecto',
      value: 100,
      igv: 18,
      nonTaxed: 0,
    },
    {
      id: 'boleta-ejemplo',
      label: 'Boleta de movilidad',
      number: 'B001-000052',
      vendor: 'Movilidad de ejemplo',
      ruc: '20100000002',
      date: '2027-04-04',
      description: 'Traslado al proyecto',
      value: 0,
      igv: 0,
      nonTaxed: 80,
    },
    {
      id: 'factura-servicio',
      label: 'Factura de servicio',
      number: 'F002-000034',
      vendor: data.suppliers[1]?.name || 'Servicio de ejemplo',
      ruc: '20100000003',
      date: '2027-04-05',
      description: 'Servicio técnico',
      value: 200,
      igv: 36,
      nonTaxed: 0,
    },
  ];
}

export function expenseTotals(record) {
  const items = record?.items || [];
  const value = round(items.reduce((sum, item) => sum + round(item.value), 0));
  const igv = round(items.reduce((sum, item) => sum + round(item.igv), 0));
  const nonTaxed = round(items.reduce((sum, item) => sum + round(item.nonTaxed), 0));
  const undocumented = round(record?.undocumentedAmount);
  return {
    value,
    igv,
    nonTaxed,
    undocumented,
    total: round(value + igv + nonTaxed + undocumented),
  };
}

export function loadExpenseDemos() {
  try {
    const records = JSON.parse(localStorage.getItem(storageKey) || '[]');
    return Array.isArray(records)
      ? records.filter(
          (item) =>
            item &&
            typeof item.id === 'string' &&
            /^R-DEMO-\d{3,}$/.test(item.id) &&
            typeof item.projectId === 'string' &&
            ['Borrador', 'En revisión', 'Observada', 'Aprobada'].includes(item.status) &&
            Array.isArray(item.items) &&
            Array.isArray(item.history)
        )
      : [];
  } catch {
    return [];
  }
}

export function saveExpenseDemo(record) {
  try {
    const records = loadExpenseDemos().filter((item) => item.id !== record.id);
    localStorage.setItem(storageKey, JSON.stringify([...records, record]));
    return true;
  } catch {
    return false;
  }
}

export function nextExpenseId() {
  const current = loadExpenseDemos().reduce((max, item) => {
    const number = Number(item.id.replace('R-DEMO-', ''));
    return Number.isSafeInteger(number) ? Math.max(max, number) : max;
  }, 0);
  return `R-DEMO-${String(current + 1).padStart(3, '0')}`;
}

export function expenseEvent(label, note = '') {
  // Keep local demonstration actions in the same fictional 2027 scenario as
  // the projects and sample receipts; this is not a real audit timestamp.
  return { label, note, at: '2027-07-01T12:00:00', simulated: true };
}

export function demoCostId(expenseId) {
  return `COST-DEMO-${expenseId}`;
}

export function approvedExpenseCosts(projectId) {
  return loadExpenseDemos()
    .filter((item) => item.projectId === projectId && item.status === 'Aprobada')
    .map((item) => ({
      id: demoCostId(item.id),
      expenseId: item.id,
      projectId,
      amount: expenseTotals(item).total,
      variantId: activeVariant.id,
      simulated: true,
    }));
}
