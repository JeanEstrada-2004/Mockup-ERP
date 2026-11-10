// ==========================================================================
// Mini gráfico (KPI) — a small area + line with the end point
// ==========================================================================
// data    = [number, …] in time order
// options = { width = 72, height = 26, color = '--s1', label }
// Decorative inside a KPI whose figure is already readable: no table, and
// the host is hidden from assistive tech unless a `label` is given.

import { scaleLinear } from 'd3-scale';
import { area, curveMonotoneX, line } from 'd3-shape';
import { max } from 'd3-array';
import { ease, freshSvg, mountChart } from './base.js';

function draw({ host, element, data, options, tokens, animate }) {
  const width = options.width || 72;
  const height = options.height || 26;
  const color = tokens.color(options.color || '--s1');
  const svg = freshSvg(host, width, height).attr('width', width).attr('height', height);
  if (!options.label) element.setAttribute('aria-hidden', 'true');
  if (data.length < 2) return;

  const x = scaleLinear()
    .domain([0, data.length - 1])
    .range([2, width - 2]);
  const y = scaleLinear()
    .domain([0, max(data) || 1])
    .range([height - 3, 3]);
  svg
    .append('path')
    .datum(data)
    .attr('fill', color)
    .attr('fill-opacity', 0.15)
    .attr(
      'd',
      area()
        .x((_, i) => x(i))
        .y0(height - 3)
        .y1((d) => y(d))
        .curve(curveMonotoneX)
    );
  const stroke = svg
    .append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', color)
    .attr('stroke-width', 1.8)
    .attr(
      'd',
      line()
        .x((_, i) => x(i))
        .y((d) => y(d))
        .curve(curveMonotoneX)
    );
  if (animate) {
    const length = stroke.node().getTotalLength();
    stroke
      .attr('stroke-dasharray', `${length} ${length}`)
      .attr('stroke-dashoffset', length)
      .transition()
      .duration(700)
      .ease(ease)
      .attr('stroke-dashoffset', 0);
  }
  svg
    .append('circle')
    .attr('cx', x(data.length - 1))
    .attr('cy', y(data[data.length - 1]))
    .attr('r', 2.8)
    .attr('fill', color);
}

export function render(element, data, options = {}) {
  element.classList.add('chart--inline');
  return mountChart(element, data, { table: false, minWidth: 0, ...options }, draw);
}
