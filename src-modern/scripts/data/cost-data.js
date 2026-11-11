import {
  getCostBySource,
  getCostEntries,
  getProjectFinancials,
  getProjectOperations,
} from './mock-data.js';

export const COST_SOURCES = [
  { id: 'purchases', label: 'Compras', allocation: 40 },
  { id: 'personnel', label: 'Personal', allocation: 25 },
  { id: 'expenses', label: 'Rendiciones', allocation: 15 },
  { id: 'materials', label: 'Materiales', allocation: 15 },
  { id: 'other', label: 'Otros', allocation: 5 },
];

const operationKinds = {
  purchase: 'Orden de compra atendida',
  timesheet: 'Tareo aprobado',
  expense: 'Rendición aprobada',
  material_issue: 'Salida de material',
  other: 'Ajuste de costo',
};

export function projectCostModel(data, projectId) {
  const financials = getProjectFinancials(data, projectId);
  if (!financials) return null;
  const totals = getCostBySource(data, projectId);
  const operations = getProjectOperations(data, projectId);
  const costEntries = getCostEntries(data, projectId);
  const sources = COST_SOURCES.map((source) => {
    const amount = totals[source.id] || 0;
    return {
      ...source,
      amount,
      percent: financials.executedCost
        ? Math.round((amount / financials.executedCost) * 1000) / 10
        : 0,
      count: costEntries.filter((item) => item.source === source.id).length,
    };
  });
  const entries = costEntries.map((entry) => {
    const operation = operations.find((item) => item.id === entry.operationId);
    return {
      ...entry,
      date: operation.date,
      status: operation.status,
      kind:
        operation.type === 'expense'
          ? `Rendición ${operation.status.toLowerCase()}`
          : operationKinds[operation.type] || operation.type,
      label: operation.label || operation.id,
      sourceLabel: COST_SOURCES.find((item) => item.id === entry.source)?.label || entry.source,
      supplierId: operation.supplierId || null,
      workerId: operation.workerId || null,
      materialId: operation.materialId || null,
      operationType: operation.type,
    };
  });
  const commitments = operations
    .filter((item) => item.type === 'purchase' && item.commitmentOpen > 0 && !item.costSource)
    .map((item) => ({
      id: item.id,
      date: item.date,
      supplierId: item.supplierId,
      amount: item.commitmentOpen,
      status: item.status,
    }));
  // The original mock budget has a single total, not approved source-level
  // budget lines. This allocation is a clearly labeled control illustration.
  const parts = sources.map((source) => {
    const budget = Math.round((financials.budgetAmount * source.allocation) / 100);
    return {
      ...source,
      budget,
      variation: budget - source.amount,
      executionPercent: budget ? Math.round((source.amount / budget) * 1000) / 10 : 0,
    };
  });
  return { financials, sources, entries, commitments, parts };
}
