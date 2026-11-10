// ==========================================================================
// Trazabilidad del costo — fuentes → ejecutado → presupuesto
// ==========================================================================
// One vertical scale for the whole chart: a sol has the same height in the
// source column, the executed node and the budget column.
//
// data = {
//   sources:  [{ label, value, color: '--s1', detail: 'OC-025, OC-028' }],
//   executed: 112450,
//   budget:   185000,
//   segments: [{ label, value, color: '--brand' | '--s3' | '--track', note }],
// }
// options = { height = 268, label, table }

import { ease, format, freshSvg, mountChart } from './base.js';
import { hideTip, showTip } from './tooltip.js';

function ribbon(x0, a0, a1, x1, b0, b1) {
  const xm = (x0 + x1) / 2;
  return `M${x0},${a0} C${xm},${a0} ${xm},${b0} ${x1},${b0} L${x1},${b1} C${xm},${b1} ${xm},${a1} ${x0},${a1} Z`;
}

function draw({ host, data, options, tokens, width, animate }) {
  const height = options.height || 268;
  const compact = width < 520;
  const margin = { top: 6, right: compact ? 110 : 150, bottom: 22, left: compact ? 92 : 120 };
  const svg = freshSvg(host, width, height);
  const sources = data.sources.filter((source) => source.value > 0);
  const segments = data.segments.filter((segment) => segment.value > 0);
  const segmentTotal = segments.reduce((sum, segment) => sum + segment.value, 0);
  const sourceGap = 6;
  const usable = height - margin.top - margin.bottom - sourceGap * (sources.length - 1);
  const scale = usable / Math.max(data.budget, segmentTotal, data.executed, 1);

  const xSource = margin.left;
  const xMiddle = Math.round(width * 0.52);
  const xEnd = width - margin.right;
  const nodeWidth = 10;

  let y = margin.top;
  let yIn = margin.top;
  const nodes = sources.map((source) => {
    const h = source.value * scale;
    const node = { ...source, y0: y, y1: y + h, t0: yIn, t1: yIn + h };
    y += h + sourceGap;
    yIn += h;
    return node;
  });

  // Ribbons: each source flows into the executed node.
  const links = svg
    .append('g')
    .selectAll('path')
    .data(nodes)
    .join('path')
    .attr('d', (n) => ribbon(xSource + nodeWidth, n.y0, n.y1, xMiddle, n.t0, n.t1))
    .attr('fill', (n) => tokens.color(n.color))
    .attr('fill-opacity', 0.28)
    .style('cursor', 'default')
    .on('mousemove', (event, n) => {
      event.currentTarget.setAttribute('fill-opacity', '0.5');
      showTip(event, {
        title: n.label,
        lines: [
          `${format.money(n.value)} · ${format.pct((n.value / data.executed) * 100)} del ejecutado`,
          n.detail,
        ],
      });
    })
    .on('mouseleave', (event) => {
      event.currentTarget.setAttribute('fill-opacity', '0.28');
      hideTip();
    });
  if (animate) {
    links
      .attr('fill-opacity', 0)
      .transition()
      .delay((_, index) => 120 + index * 70)
      .duration(520)
      .ease(ease)
      .attr('fill-opacity', 0.28);
  }

  svg
    .append('g')
    .selectAll('rect')
    .data(nodes)
    .join('rect')
    .attr('x', xSource)
    .attr('y', (n) => n.y0)
    .attr('width', nodeWidth)
    .attr('height', (n) => Math.max(2, n.y1 - n.y0))
    .attr('rx', 3)
    .attr('fill', (n) => tokens.color(n.color));

  const labels = svg
    .append('g')
    .selectAll('text')
    .data(nodes)
    .join('text')
    .attr('x', xSource - 10)
    .attr('y', (n) => (n.y0 + n.y1) / 2)
    .attr('text-anchor', 'end')
    .attr('dominant-baseline', 'middle')
    .attr('fill', tokens['--ink'])
    .attr('font-size', 13);
  labels
    .append('tspan')
    .attr('font-weight', 600)
    .text((n) => n.label);
  labels
    .filter((n) => n.y1 - n.y0 >= 26)
    .append('tspan')
    .attr('x', xSource - 10)
    .attr('dy', 15)
    .attr('fill', tokens['--ink-3'])
    .attr('font-size', 12)
    .text((n) => format.money(n.value));

  // Executed node, feeding the budget column.
  const executedHeight = data.executed * scale;
  svg
    .append('rect')
    .attr('x', xMiddle)
    .attr('y', margin.top)
    .attr('width', nodeWidth)
    .attr('height', executedHeight)
    .attr('rx', 3)
    .attr('fill', tokens['--brand']);
  const outflow = svg
    .append('path')
    .attr(
      'd',
      ribbon(
        xMiddle + nodeWidth,
        margin.top,
        margin.top + executedHeight,
        xEnd,
        margin.top,
        margin.top + executedHeight
      )
    )
    .attr('fill', tokens['--brand'])
    .attr('fill-opacity', 0.14);
  if (animate) {
    outflow
      .attr('fill-opacity', 0)
      .transition()
      .delay(120 + nodes.length * 70)
      .duration(520)
      .ease(ease)
      .attr('fill-opacity', 0.14);
  }
  // The executed total is repeated in the budget column; skip it when narrow.
  if (!compact)
    svg
      .append('text')
      .attr('x', xMiddle + nodeWidth / 2)
      .attr('y', margin.top + executedHeight + 16)
      .attr('text-anchor', 'middle')
      .attr('font-size', 12)
      .attr('fill', tokens['--ink-3'])
      .text(`Ejecutado ${format.money(data.executed)}`);

  // Budget column: executed / committed / available.
  let ys = margin.top;
  const placed = segments.map((segment) => {
    const item = { ...segment, y0: ys, y1: ys + segment.value * scale };
    ys = item.y1 + 2;
    return item;
  });
  const column = svg.append('g');
  column
    .selectAll('rect')
    .data(placed)
    .join('rect')
    .attr('x', xEnd)
    .attr('y', (s) => s.y0)
    .attr('width', 22)
    .attr('height', (s) => Math.max(2, s.y1 - s.y0))
    .attr('rx', 4)
    .attr('fill', (s) => tokens.color(s.color))
    .attr('stroke', tokens['--line'])
    .on('mousemove', (event, s) =>
      showTip(event, { title: s.label, lines: [format.money(s.value), s.note] })
    )
    .on('mouseleave', hideTip);
  const segmentText = column
    .selectAll('text')
    .data(placed)
    .join('text')
    .attr('x', xEnd + 32)
    .attr('y', (s) => (s.y0 + s.y1) / 2)
    .attr('dominant-baseline', 'middle')
    .attr('font-size', 13)
    .attr('fill', tokens['--ink']);
  segmentText
    .append('tspan')
    .attr('font-weight', 600)
    .text((s) => s.label);
  segmentText
    .filter((s) => s.y1 - s.y0 >= 26)
    .append('tspan')
    .attr('x', xEnd + 32)
    .attr('dy', 15)
    .attr('fill', tokens['--ink-3'])
    .attr('font-size', 12)
    .text((s) => format.money(s.value));
  svg
    .append('text')
    .attr('x', xEnd + 11)
    .attr('y', height - 4)
    .attr('text-anchor', 'middle')
    .attr('font-size', 12)
    .attr('fill', tokens['--ink-3'])
    .text(`Presupuesto ${format.money(data.budget)}`);
}

export function render(element, data, options = {}) {
  const table = (current) => ({
    columns: ['Concepto', 'Importe'],
    rows: [
      ...current.sources.map((source) => [source.label, format.money(source.value)]),
      ['Ejecutado', format.money(current.executed)],
      ...current.segments.map((segment) => [segment.label, format.money(segment.value)]),
      ['Presupuesto', format.money(current.budget)],
    ],
  });
  return mountChart(element, data, { minWidth: 320, table, ...options }, draw);
}
