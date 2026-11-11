// ==========================================================================
// Aprobaciones Pendientes (approvals.html) — punto 104–105, Entrega 4
// ==========================================================================

import { Modal } from 'bootstrap';
import { isModuleEnabled } from '../config/variants.js';
import { moduleHref } from '../config/modules.js';
import {
  APPROVAL_TABS,
  approvalRecords,
  loadDecisions,
  removeDecision,
  saveDecision,
} from '../data/approval-demo.js';
import { tableControls } from '../utils/data-table.js';
import { formatDate } from './project-views.js';
import { formatMoney } from './shell.js';

export const OBSERVATION_REASONS = [
  'Monto registrado no coincide con comprobante.',
  'Falta documento de sustento.',
  'Proyecto o partida incorrectos.',
  'Supera el saldo disponible de la partida.',
];

/** Keeps the header and rail counters equal to the inbox (local decisions). */
export function syncApprovalCounters() {
  const count = approvalRecords().filter((item) => !loadDecisions()[item.id]).length;
  document.querySelectorAll('[data-approvals-count]').forEach((badge) => {
    badge.textContent = String(count);
    badge.hidden = count === 0;
  });
  document.querySelectorAll('[data-approvals-link]').forEach((link) => {
    link.setAttribute('aria-label', `Aprobaciones: ${count} pendientes`);
  });
  return count;
}

export function approvalsView() {
  const tabs = APPROVAL_TABS.filter((tab) => isModuleEnabled(tab.id));
  return {
    ...tableControls({
      sortKey: 'date',
      sortDir: 'asc',
      accessors: {
        id: (row) => row.id,
        responsible: (row) => row.responsible,
        projectId: (row) => row.projectId,
        amount: (row) => row.amount,
        date: (row) => row.date,
      },
    }),
    tabs,
    tab: tabs[0]?.id || '',
    records: approvalRecords(),
    decisions: {},
    reasons: OBSERVATION_REASONS,
    target: null,
    observation: { reason: OBSERVATION_REASONS[0], comment: '' },
    formatMoney,
    formatDate,
    init() {
      this.decisions = loadDecisions();
      const requested = new URLSearchParams(location.search).get('tab');
      if (tabs.some((tab) => tab.id === requested)) this.tab = requested;
      else {
        // Open the first tab that has something pending.
        const firstPending = tabs.find((tab) => this.pendingIn(tab.id).length);
        if (firstPending) this.tab = firstPending.id;
      }
      syncApprovalCounters();
    },
    pendingIn(tabId) {
      return this.records.filter((item) => item.tab === tabId && !this.decisions[item.id]);
    },
    get resolved() {
      return this.records
        .filter((item) => this.decisions[item.id])
        .map((item) => ({ ...item, decision: this.decisions[item.id] }));
    },
    get pendingTotal() {
      return this.records.filter((item) => !this.decisions[item.id]).length;
    },
    get rows() {
      return this.applySort(this.pendingIn(this.tab));
    },
    get currentTab() {
      return tabs.find((tab) => tab.id === this.tab);
    },
    selectTab(id) {
      this.tab = id;
      this.page = 1;
      const next = new URL(location.href);
      next.searchParams.set('tab', id);
      history.replaceState(null, '', next);
    },
    reviewHref(item) {
      return moduleHref(item.moduleId, item.id);
    },
    projectHref(item) {
      return moduleHref('projects', item.projectId);
    },
    nounFor(item) {
      return APPROVAL_TABS.find((tab) => tab.id === item.tab)?.noun || 'el registro';
    },
    async approve(item) {
      const notifications = window.AdminApp?.notificationManager;
      const accepted = notifications
        ? await notifications.confirm({
            title: `¿Deseas aprobar ${this.nounFor(item)} ${item.id}?`,
            text: `${item.projectId} · ${formatMoney(item.amount)}. La aprobación es una demostración y no modifica los costos del proyecto.`,
            icon: 'question',
            confirmButtonText: 'Aprobar',
            cancelButtonText: 'Cancelar',
          })
        : true;
      if (!accepted) return;
      this.decisions = saveDecision(item.id, { status: 'Aprobada' });
      syncApprovalCounters();
      notifications?.success(`${item.id} aprobada.`);
    },
    openObservation(item) {
      this.target = item;
      this.observation = { reason: OBSERVATION_REASONS[0], comment: '' };
      Modal.getOrCreateInstance(document.getElementById('approval-observe-modal')).show();
    },
    saveObservation() {
      if (!this.target) return;
      this.decisions = saveDecision(this.target.id, {
        status: 'Observada',
        reason: this.observation.reason,
        comment: this.observation.comment.trim().slice(0, 240),
      });
      Modal.getOrCreateInstance(document.getElementById('approval-observe-modal')).hide();
      syncApprovalCounters();
      window.AdminApp?.notificationManager?.warning(
        `${this.target.id} observada: ${this.observation.reason}`
      );
      this.target = null;
    },
    undo(item) {
      this.decisions = removeDecision(item.id);
      syncApprovalCounters();
    },
  };
}
