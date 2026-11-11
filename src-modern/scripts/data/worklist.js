// Pendientes (R3, J&Y Demo: variant.rules.approvalsMode = 'worklist').
// J&Y works without formal multi-level approvals, so the inbox is a list of
// tasks: what is waiting for someone and what that person should do next.
// Built from the current state of the records (base data plus the local
// demonstration), so it also works in Node for the shell template.
import { activeVariant } from '../config/variants.js';
import { loadDecisions } from './approval-demo.js';
import { loadReports, reportNumber, reportTotals } from './expense-reports.js';
import { getProject } from './mock-data.js';
import { currentVersion, displayCode, loadBudgets } from './budget-model.js';

export const WORKLIST_TABS = [
  {
    id: 'review',
    label: 'Rendiciones por revisar',
    short: 'Por revisar',
    action: 'Revisar',
    foot: 'Presentadas o corregidas',
  },
  {
    id: 'observed',
    label: 'Rendiciones observadas',
    short: 'Observadas',
    action: 'Corregir',
    foot: 'Esperan corrección de quien prepara',
  },
  {
    id: 'deliver',
    label: 'Por entregar a Contabilidad',
    short: 'Por entregar',
    action: 'Entregar',
    foot: 'Rendiciones aceptadas',
  },
  {
    id: 'budgets',
    label: 'Presupuestos por revisar',
    short: 'Presupuestos',
    action: 'Revisar',
    foot: 'Versión actual en revisión',
  },
  {
    id: 'purchases',
    label: 'Órdenes de compra',
    short: 'Órdenes de compra',
    action: 'Revisar',
    foot: 'Pendientes de atención',
  },
  {
    id: 'documents',
    label: 'Documentos faltantes',
    short: 'Documentos',
    action: 'Adjuntar',
    foot: 'Registros sin documento adjunto',
  },
];

const lastNote = (report) =>
  [...report.history].reverse().find((entry) => entry.action === 'Observada')?.note || '';

export function worklistItems(data, variant = activeVariant) {
  const enabled = (id) => variant.enabledModules.includes(id);
  const items = [];
  if (enabled('expenses')) {
    for (const report of loadReports(data)) {
      const tab = {
        Presentada: 'review',
        Corregida: 'review',
        Observada: 'observed',
        Aceptada: 'deliver',
      }[report.status];
      if (!tab) continue;
      items.push({
        id: `${tab}-${report.id}`,
        tab,
        kind: 'Rendición',
        label: reportNumber(report),
        title: `${report.status} · ${report.items.length} gastos`,
        note: tab === 'observed' ? lastNote(report) : '',
        projectId: report.projectId,
        responsibleId: tab === 'observed' ? report.preparedBy : report.reviewerId,
        amount: reportTotals(report).total,
        date: report.date,
        href: `./expense.html?id=${encodeURIComponent(report.id)}`,
      });
    }
  }
  if (enabled('budgets') && data.products) {
    for (const budget of loadBudgets(data)) {
      const current = currentVersion(data, budget);
      if (current?.status !== 'En revisión') continue;
      items.push({
        id: `budgets-${budget.id}`,
        tab: 'budgets',
        kind: 'Presupuesto',
        label: displayCode(data, budget),
        title: current.comment || budget.title,
        note: '',
        projectId: budget.projectId,
        responsibleId: budget.responsibleId,
        amount: current.amount,
        date: current.date,
        href: `./budget.html?id=${encodeURIComponent(budget.id)}`,
      });
    }
  }
  if (enabled('purchases')) {
    const decisions = loadDecisions();
    for (const operation of data.operations.filter((item) => item.type === 'purchase')) {
      const project = getProject(data, operation.projectId);
      if (operation.status === 'Pendiente' && !decisions[operation.id]) {
        items.push({
          id: `purchases-${operation.id}`,
          tab: 'purchases',
          kind: 'Orden de compra',
          label: operation.id,
          title: operation.description || 'Orden de compra pendiente',
          note: '',
          projectId: operation.projectId,
          responsibleId: project?.managerId || null,
          amount: operation.amount,
          date: operation.date,
          href: `./purchase.html?id=${encodeURIComponent(operation.id)}`,
        });
      }
      if (!operation.documentId) {
        items.push({
          id: `documents-${operation.id}`,
          tab: 'documents',
          kind: 'Documento',
          label: operation.id,
          title: 'Adjuntar la cotización u orden de compra',
          note: '',
          projectId: operation.projectId,
          responsibleId: project?.managerId || null,
          amount: operation.amount,
          date: operation.date,
          href: `./purchase.html?id=${encodeURIComponent(operation.id)}`,
        });
      }
    }
  }
  return items;
}
