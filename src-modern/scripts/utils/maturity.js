// Maturity badges (J&Y Demo, docs/realineamiento-jy-demo.md › D3). Any element
// with data-maturity="as-is | to-be | validate" receives a badge that tells a
// process confirmed with the company from a proposal and from what is still to
// be validated. Badges exist only where the variant enables the rule and are
// shown when the presenter turns them on (user menu or Alt + Shift + V).
import { variantRule, variantStorageKey } from '../config/variants.js';

export const MATURITY_LABELS = {
  'as-is': 'AS-IS confirmado',
  'to-be': 'Propuesta TO-BE',
  validate: 'Por validar',
};

const storageKey = variantStorageKey('maturity-tags');

function readPreference() {
  try {
    return localStorage.getItem(storageKey) === 'on';
  } catch {
    return false;
  }
}

function setVisible(visible) {
  document.documentElement.dataset.maturityTags = visible ? 'on' : 'off';
  document.querySelectorAll('[data-maturity-toggle]').forEach((button) => {
    button.setAttribute('aria-pressed', String(visible));
  });
  try {
    localStorage.setItem(storageKey, visible ? 'on' : 'off');
  } catch {
    /* storage is optional */
  }
}

function decorate(root) {
  const nodes = [
    ...(root.matches?.('[data-maturity]') ? [root] : []),
    ...(root.querySelectorAll?.('[data-maturity]') || []),
  ];
  for (const node of nodes) {
    const level = node.dataset.maturity;
    if (!MATURITY_LABELS[level] || node.querySelector(':scope > .maturity')) continue;
    const badge = document.createElement('span');
    badge.className = `maturity maturity--${level}`;
    badge.textContent = MATURITY_LABELS[level];
    if (node.dataset.maturityNote) badge.title = node.dataset.maturityNote;
    node.append(badge);
  }
}

export function initMaturityTags() {
  if (!variantRule('maturityTags')) return () => {};
  setVisible(readPreference());
  decorate(document.body);
  // Alpine renders x-if / x-for blocks after start-up: decorate them as they appear.
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) decorate(node);
      }
    }
  });
  const main = document.getElementById('main-content');
  if (main) observer.observe(main, { childList: true, subtree: true });

  const toggle = () => setVisible(document.documentElement.dataset.maturityTags !== 'on');
  const onClick = (event) => {
    if (event.target.closest('[data-maturity-toggle]')) toggle();
  };
  const onKey = (event) => {
    if (event.altKey && event.shiftKey && !event.ctrlKey && event.code === 'KeyV') {
      event.preventDefault();
      toggle();
    }
  };
  document.addEventListener('click', onClick);
  document.addEventListener('keydown', onKey);
  return () => {
    observer.disconnect();
    document.removeEventListener('click', onClick);
    document.removeEventListener('keydown', onKey);
  };
}
