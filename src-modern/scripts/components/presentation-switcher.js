// ==========================================================================
// Cambio oculto de presentación (SurTec PETI · J&Y PMI · J&Y Demo)
// ==========================================================================
// There is deliberately no visible selector (decision of Entrega 1, punto 119).
// The owner opens this dialog with:
//   - three clicks (or taps) on the presentation label under the logo, or
//   - Alt + Shift + P anywhere.
// Each option opens the same screen in the other build when that build has
// the module; otherwise its Panel General. The dialog is created on demand,
// so it never appears in the page text, and the last presentation used is
// remembered so the site root (/Mockup-ERP/) reopens it.

import { Modal } from 'bootstrap';
import { DEV_PORTS, VARIANT_IDS, activeVariant, getVariantConfig } from '../config/variants.js';

export const LAST_VARIANT_KEY = 'mockup-erp:last-variant';

// Page file → module that owns it. Detail pages fall back to their list,
// because record ids differ between the SurTec and J&Y data sets.
const PAGE_MODULE = {
  'index.html': ['dashboard', 'index.html'],
  'projects.html': ['projects', 'projects.html'],
  'project.html': ['projects', 'projects.html'],
  'budgets.html': ['budgets', 'budgets.html'],
  'budget.html': ['budgets', 'budgets.html'],
  'purchases.html': ['purchases', 'purchases.html'],
  'purchase.html': ['purchases', 'purchases.html'],
  'expenses.html': ['expenses', 'expenses.html'],
  'expense.html': ['expenses', 'expenses.html'],
  'approvals.html': ['approvals', 'approvals.html'],
  'personnel.html': ['personnel', 'personnel.html'],
  'worker.html': ['personnel', 'personnel.html'],
  'warehouse.html': ['warehouse', 'warehouse.html'],
  'material.html': ['warehouse', 'warehouse.html'],
  'costs.html': ['costs', 'costs.html'],
  'documents.html': ['documents', 'documents.html'],
  'document.html': ['documents', 'documents.html'],
  'reports.html': ['reports', 'reports.html'],
  'analytics.html': ['bi', 'analytics.html'],
  'crm.html': ['crm', 'crm.html'],
  'integrations.html': ['integrations', 'integrations.html'],
  'security.html': ['security', 'security.html'],
  'settings.html': ['administration', 'settings.html'],
  'design-system.html': [null, 'design-system.html'],
};

function currentFile() {
  const file = window.location.pathname.split('/').pop();
  return file && file.endsWith('.html') ? file : 'index.html';
}

/** Where the same screen lives in another presentation. */
export function targetPage(variantId, file = currentFile()) {
  const [moduleId, page] = PAGE_MODULE[file] || [null, 'index.html'];
  const variant = getVariantConfig(variantId);
  // Approvals is enabled wherever one of its three source modules is.
  const enabled =
    moduleId === null ||
    variant.enabledModules.includes(moduleId) ||
    (moduleId === 'approvals' &&
      ['budgets', 'purchases', 'expenses'].some((id) => variant.enabledModules.includes(id)));
  return enabled ? page : 'index.html';
}

/**
 * Built variants are sibling folders (…/surtec-peti/, …/jy-pmi/, …/jy-demo/).
 * In development each one runs on its own port (`npm run dev:all`).
 */
function targetHref(variantId) {
  const page = targetPage(variantId);
  if (import.meta.env?.DEV) {
    return `${location.protocol}//${location.hostname}:${DEV_PORTS[variantId]}/${page}`;
  }
  return new URL(`../${variantId}/${page}`, window.location.href).href;
}

function rememberVariant() {
  try {
    localStorage.setItem(LAST_VARIANT_KEY, activeVariant.id);
  } catch {
    /* private mode: the root falls back to J&Y Demo */
  }
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function buildDialog() {
  const modal = el('div', 'modal fade presentation-switcher');
  modal.id = 'presentation-switcher';
  modal.tabIndex = -1;
  modal.setAttribute('aria-labelledby', 'presentation-switcher-title');
  modal.setAttribute('aria-hidden', 'true');

  const dialog = el('div', 'modal-dialog modal-dialog-centered');
  const content = el('div', 'modal-content');
  const header = el('div', 'modal-header');
  const title = el('h2', 'modal-title', 'Cambiar presentación');
  title.id = 'presentation-switcher-title';
  const close = el('button', 'btn-close');
  close.type = 'button';
  close.setAttribute('data-bs-dismiss', 'modal');
  close.setAttribute('aria-label', 'Cerrar');
  header.append(title, close);

  const body = el('div', 'modal-body');
  body.append(
    el(
      'p',
      'presentation-switcher-hint',
      'Abre esta misma pantalla en otra presentación. Si allí no existe el módulo, se abre el Panel General.'
    )
  );
  const list = el('div', 'presentation-switcher-list');
  const isDev = Boolean(import.meta.env?.DEV);

  VARIANT_IDS.forEach((id) => {
    const variant = getVariantConfig(id);
    const current = id === activeVariant.id;
    const option = el(current ? 'div' : 'a', 'presentation-option');
    if (current) option.classList.add('is-current');
    if (!current) option.href = targetHref(id);
    option.dataset.variant = id;

    const code = el('span', 'presentation-option-code', variant.presentation.code);
    const text = el('span', 'presentation-option-text');
    text.append(
      el('strong', '', `${variant.company.shortName} · ${variant.presentation.label}`),
      el(
        'small',
        '',
        current
          ? 'Presentación actual'
          : isDev
            ? `Puerto ${DEV_PORTS[id]} · requiere npm run dev:all`
            : variant.company.name
      )
    );
    option.append(code, text);
    if (current) option.append(el('span', 'pill pill-info', 'Actual'));
    list.append(option);
  });
  body.append(list);

  content.append(header, body);
  dialog.append(content);
  modal.append(dialog);
  modal.addEventListener('hidden.bs.modal', () => modal.remove());
  return modal;
}

export function openPresentationSwitcher() {
  if (document.getElementById('presentation-switcher')) return;
  const modal = buildDialog();
  document.body.append(modal);
  Modal.getOrCreateInstance(modal).show();
}

/** Wires the two hidden triggers. Returns a cleanup function. */
export function initPresentationSwitcher() {
  rememberVariant();

  const onKey = (event) => {
    if (event.altKey && event.shiftKey && event.code === 'KeyP') {
      event.preventDefault();
      openPresentationSwitcher();
    }
  };
  // `detail` counts consecutive clicks/taps on the same spot.
  const onClick = (event) => {
    if (event.detail === 3 && event.target.closest('.shell-presentation')) {
      openPresentationSwitcher();
    }
  };
  document.addEventListener('keydown', onKey);
  document.addEventListener('click', onClick);
  return () => {
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('click', onClick);
  };
}
