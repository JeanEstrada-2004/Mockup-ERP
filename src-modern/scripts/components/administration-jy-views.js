import { activeVariant } from '../config/variants.js';
import { getDataForVariant } from '../data/mock-data.js';
import { EXPENSE_CATEGORIES, EVIDENCE_TYPES, REVIEW_STATUSES } from '../data/expense-reports.js';
import { BUDGET_STATUSES } from '../data/budget-model.js';

export function administrationJyWorkspace() {
  const data = getDataForVariant(activeVariant);
  return {
    tab: 'empresa',
    company: activeVariant.company,
    categories: EXPENSE_CATEGORIES,
    evidence: Object.values(EVIDENCE_TYPES).map((item) => item.label),
    units: [...new Set(data.products.map((item) => item.unit))].sort(),
    currencies: ['PEN · sol peruano', 'USD · dólar estadounidense (por validar)'],
    expenseStatuses: REVIEW_STATUSES,
    budgetStatuses: BUDGET_STATUSES,
    purchaseStatuses: ['Borrador', 'Pendiente', 'Aprobada', 'Atendida', 'Cancelada'],
  };
}
