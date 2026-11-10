// ==========================================================================
// Ejecución frente al avance — one row per project
// ==========================================================================
// Bar: executed cost over the budget (track = budget). Mark: what should be
// spent by now according to physical progress. The bar turns --bad when the
// project spends more than `tolerance` points ahead of its progress.
// One horizontal scale (the largest budget) for every row.
//
// data    = [{ id, name, budget, cost, progress, href }]
// options = { tolerance = 5, label, table }

import { scaleLinear } from 'd3-scale';
import { max } from 'd3-array';
import { select } from 'd3-selection';
import { ease, format, mountChart } from './base.js';
import { hideTip, showTip } from './tooltip.js';

const ROW_HEIGHT = 30;

export function isAhead(project, tolerance = 5) {
  if (!project.budget) return false;
  return (project.cost / project.budget) * 100 > project.progress + tolerance;
}

function draw({ element, data, options, tokens, animate }) {
  const tolerance = options.tolerance ?? 5;
  let list = element.querySelector(':scope > .exec-rows');
  if (!list) {
    list = document.createElement('div');
    list.className = 'exec-rows';
    element.prepend(list);
  }
  list.replaceChildren();

  // Build the row skeleton first so every chart cell has its final width.
  const rows = data.map((project) => {
    const row = document.createElement(project.href ? 'a' : 'div');
    row.className = 'exec-row';
    if (project.href) row.href = project.href;
    const ahead = isAhead(project, tolerance);
    const executedPct = project.budget ? (project.cost / project.budget) * 100 : 0;
    row.setAttribute(
      'aria-label',
      `${project.id} ${project.name}: ejecutado ${format.pct(executedPct)} del presupuesto, avance ${project.progress} %${ahead ? ', gasta más rápido que su avance' : ''}`
    );

    const title = document.createElement('div');
    title.className = 'exec-title';
    const code = document.createElement('strong');
    code.textContent = project.id;
    const name = document.createElement('span');
    name.textContent = project.name;
    title.append(code, name);

    const cell = document.createElement('div');
    cell.className = 'exec-chart';

    const values = document.createElement('div');
    values.className = 'exec-values';
    const pct = document.createElement('b');
    pct.textContent = format.pct(executedPct);
    if (ahead) pct.className = 'is-ahead';
    values.append(pct, document.createTextNode(`avance ${project.progress} %`));

    row.append(title, cell, values);
    list.appendChild(row);
    return { project, cell, ahead };
  });

  const widest = max(data, (project) => project.budget) || 1;
  rows.forEach(({ project, cell, ahead }) => {
    const width = Math.max(cell.clientWidth, 120);
    const x = scaleLinear().domain([0, widest]).range([0, width]);
    const svg = select(cell)
      .append('svg')
      .attr('viewBox', `0 0 ${width} ${ROW_HEIGHT}`)
      .attr('height', ROW_HEIGHT)
      .attr('aria-hidden', 'true');
    svg
      .append('rect')
      .attr('y', 9)
      .attr('width', x(project.budget))
      .attr('height', 12)
      .attr('rx', 6)
      .attr('fill', tokens['--track']);
    const bar = svg
      .append('rect')
      .attr('y', 9)
      .attr('height', 12)
      .attr('rx', 6)
      .attr('fill', ahead ? tokens['--bad'] : tokens['--s1'])
      .attr('width', x(Math.min(project.cost, widest)));
    if (animate) {
      bar
        .attr('width', 0)
        .transition()
        .delay(150)
        .duration(700)
        .ease(ease)
        .attr('width', x(Math.min(project.cost, widest)));
    }
    const markX = x((project.budget * project.progress) / 100);
    svg
      .append('rect')
      .attr('x', markX - 1.25)
      .attr('y', 3)
      .attr('width', 2.5)
      .attr('height', 24)
      .attr('rx', 1)
      .attr('fill', tokens['--ink']);
    svg
      .append('rect')
      .attr('width', width)
      .attr('height', ROW_HEIGHT)
      .attr('fill', 'transparent')
      .on('mousemove', (event) =>
        showTip(event, {
          title: `${project.id} · ${project.name}`,
          lines: [
            `Ejecutado ${format.money(project.cost)} de ${format.money(project.budget)}`,
            `Avance físico ${project.progress} %`,
            ahead ? 'Gasta más rápido que su avance' : '',
          ],
        })
      )
      .on('mouseleave', hideTip);
  });
}

export function render(element, data, options = {}) {
  const table = (current) => ({
    columns: ['Proyecto', 'Presupuesto', 'Ejecutado', 'Ejecución', 'Avance'],
    rows: current.map((project) => [
      `${project.id} · ${project.name}`,
      format.money(project.budget),
      format.money(project.cost),
      format.pct(project.budget ? (project.cost / project.budget) * 100 : 0),
      `${project.progress} %`,
    ]),
  });
  return mountChart(element, data, { table, ...options }, draw);
}
