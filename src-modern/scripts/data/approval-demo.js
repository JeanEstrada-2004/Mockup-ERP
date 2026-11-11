// ==========================================================================
// Bandeja de Aprobaciones — local decisions over the mock pending records
// ==========================================================================
// The pending set comes from the shared data (getPendingApprovals). Approving
// or observing here is a demonstration stored per variant in localStorage:
// it never changes executed costs, commitments or the base records.

import { activeVariant, variantStorageKey } from '../config/variants.js';
import { getDataForVariant, getPendingApprovals, getProject } from './mock-data.js';

const decisionKey = variantStorageKey('approval-decisions');
const DECISIONS = ['Aprobada', 'Observada'];

export const APPROVAL_TABS = [
  { id: 'budgets', label: 'Presupuestos', kind: 'Presupuesto', noun: 'el presupuesto' },
  { id: 'purchases', label: 'Compras', kind: 'Orden de compra', noun: 'la orden de compra' },
  { id: 'expenses', label: 'Rendiciones', kind: 'Rendición', noun: 'la rendición' },
];

export function loadDecisions() {
  try {
    const parsed = JSON.parse(localStorage.getItem(decisionKey) || '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(
        ([id, item]) => typeof id === 'string' && DECISIONS.includes(item?.status)
      )
    );
  } catch {
    return {};
  }
}

/** Local presentation state only; never mutates the source operation or its costs. */
export function approvalDecision(id) {
  return loadDecisions()[id] || null;
}

export function approvalStatus(id, original, approvedLabel = 'Aprobada') {
  const decision = approvalDecision(id);
  if (!decision) return original;
  return decision.status === 'Aprobada' ? approvedLabel : 'Observada';
}

export function saveDecision(id, decision) {
  const current = loadDecisions();
  current[id] = { ...decision, at: new Date().toISOString() };
  try {
    localStorage.setItem(decisionKey, JSON.stringify(current));
  } catch {
    /* private mode: the decision lives until reload */
  }
  return current;
}

export function removeDecision(id) {
  const current = loadDecisions();
  delete current[id];
  try {
    localStorage.setItem(decisionKey, JSON.stringify(current));
  } catch {
    /* optional */
  }
  return current;
}

/** Pending records enriched with responsible person and date. */
export function approvalRecords(data = getDataForVariant(activeVariant), variant = activeVariant) {
  const workerName = (id) => data.workers.find((item) => item.id === id)?.name || '—';
  return getPendingApprovals(data, variant).map((item) => {
    const project = getProject(data, item.projectId);
    const operation = data.operations.find((op) => op.id === item.id);
    const budget = data.budgets.find((entry) => entry.id === item.id);
    return {
      ...item,
      tab: item.moduleId,
      projectName: project?.name || item.projectId,
      responsible: workerName(operation?.workerId || project?.managerId),
      date: operation?.date || budget?.date || project?.startDate || '',
    };
  });
}

/** Records still waiting for a decision (header and rail counters use this). */
export function pendingApprovals(data, variant) {
  const decisions = loadDecisions();
  return approvalRecords(data, variant).filter((item) => !decisions[item.id]);
}
