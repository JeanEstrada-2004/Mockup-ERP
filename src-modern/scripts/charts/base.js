// ==========================================================================
// Chart kit base — the shared lifecycle of every chart
// ==========================================================================
// Every pattern exports `render(element, data, options)` and returns
// `{ update(data, options), destroy() }`. This module provides that contract:
// first draw animated, redraw (without animation) on resize or theme change,
// and an accessible alternative (aria-label + optional data table).

import { select } from 'd3-selection';
import 'd3-transition';
import { easeCubicOut } from 'd3-ease';
import { readTokens, onThemeChange } from './theme.js';
import { hideTip } from './tooltip.js';

export const ease = easeCubicOut;

export function reducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

const group = (value) =>
  Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

export const format = {
  // Negative amounts as −S/ 4 610 (minus sign before the currency).
  money: (value) => (value < 0 ? `−S/ ${group(-value)}` : `S/ ${group(value)}`),
  thousands: (value) => (value === 0 ? '0' : `${group(value / 1000)} mil`),
  pct: (value) => `${(Math.round(value * 10) / 10).toFixed(1).replace('.', ',')} %`,
  int: (value) => group(value),
};

let uid = 0;
/** Unique id for gradients and clip paths (several charts per page). */
export function nextId(prefix) {
  uid += 1;
  return `${prefix}-${uid}`;
}

/**
 * @param {HTMLElement} element  host (gets class `chart`)
 * @param {*} data
 * @param {object} options      chart options; `label` is the accessible name,
 *                              `table` ({ columns, rows } or data => that)
 *                              adds a collapsible data table; `false` omits it
 * @param {(ctx) => void} draw  draws into the host
 */
export function mountChart(element, data, options, draw) {
  if (!element) throw new Error('Gráfico: falta el elemento contenedor.');
  element.classList.add('chart');
  let state = { data, options: { ...options } };
  let lastWidth = 0;

  const redraw = (animate) => {
    lastWidth = element.clientWidth;
    const svgHost = select(element);
    draw({
      element,
      host: svgHost,
      data: state.data,
      options: state.options,
      tokens: readTokens(),
      width: Math.max(lastWidth, state.options.minWidth || 280),
      animate: animate && !reducedMotion(),
    });
    describe(element, state.options, state.data);
  };

  redraw(true);

  let timer = 0;
  const resize =
    typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(() => {
          // Ignore the observer's first callback and sub-pixel jitter.
          if (Math.abs(element.clientWidth - lastWidth) < 2) return;
          clearTimeout(timer);
          timer = setTimeout(() => redraw(false), 120);
        });
  resize?.observe(element);
  const stopTheme = onThemeChange(() => redraw(false));

  return {
    update(nextData = state.data, nextOptions = {}) {
      state = { data: nextData, options: { ...state.options, ...nextOptions } };
      redraw(true);
    },
    destroy() {
      clearTimeout(timer);
      resize?.disconnect();
      stopTheme();
      hideTip();
      element.replaceChildren();
    },
  };
}

/** Accessible name on the host and, optionally, a collapsible data table. */
function describe(element, { label, table: tableOption }, data) {
  const table = typeof tableOption === 'function' ? tableOption(data) : tableOption;
  if (label) {
    element.setAttribute('role', 'figure');
    element.setAttribute('aria-label', label);
  }
  element.querySelector(':scope > .chart-table')?.remove();
  if (!table?.rows?.length) return;
  const details = document.createElement('details');
  details.className = 'chart-table';
  const summary = document.createElement('summary');
  summary.textContent = table.summary || 'Ver datos del gráfico';
  const tableElement = document.createElement('table');
  tableElement.className = 'table table-sm';
  const head = tableElement.createTHead().insertRow();
  table.columns.forEach((column, index) => {
    const th = document.createElement('th');
    th.scope = 'col';
    th.textContent = column;
    if (index > 0) th.className = 'text-end';
    head.appendChild(th);
  });
  const body = tableElement.createTBody();
  table.rows.forEach((row) => {
    const tr = body.insertRow();
    row.forEach((cell, index) => {
      const td = tr.insertCell();
      td.textContent = cell;
      if (index > 0) td.className = 'text-end';
    });
  });
  details.append(summary, tableElement);
  element.appendChild(details);
}

/** Returns the host's <svg>, created once and cleared on each draw. */
export function freshSvg(host, width, height) {
  const svg = host
    .selectAll('svg.chart-svg')
    .data([0])
    .join((enter) => enter.insert('svg', ':first-child').attr('class', 'chart-svg'))
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .attr('aria-hidden', 'true');
  svg.selectAll('*').remove();
  return svg;
}
