// ==========================================================================
// Serie temporal — monotone curve, gradient area, crosshair, end point
// ==========================================================================
// data    = [{ label: 'Ene', value: 62000, title?: 'Enero 2027' }]
// options = { height = 170, color = '--s1', format = money, axis = thousands,
//             valueLabel = 'ejecutados', label, table }

import { scaleLinear, scalePoint } from 'd3-scale';
import { area, curveMonotoneX, line } from 'd3-shape';
import { max } from 'd3-array';
import { pointer } from 'd3-selection';
import { ease, format, freshSvg, mountChart, nextId } from './base.js';
import { hideTip, showTip } from './tooltip.js';

function niceTop(value) {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = magnitude / 2;
  return Math.ceil(value / step) * step;
}

function draw({ host, data, options, tokens, width, animate }) {
  const height = options.height || 170;
  const margin = { top: 12, right: 14, bottom: 26, left: 52 };
  const color = tokens.color(options.color || '--s1');
  const valueFormat = options.format || format.money;
  const axisFormat = options.axis || format.thousands;
  const svg = freshSvg(host, width, height);
  if (!data.length) return;

  const top = niceTop(max(data, (d) => d.value) || 0);
  const x = scalePoint()
    .domain(data.map((d) => d.label))
    .range([margin.left, width - margin.right]);
  const y = scaleLinear()
    .domain([0, top])
    .range([height - margin.bottom, margin.top]);

  // Recessive grid and axis labels (ink tokens, never the series colour).
  y.ticks(4).forEach((tick) => {
    svg
      .append('line')
      .attr('x1', margin.left)
      .attr('x2', width - margin.right)
      .attr('y1', y(tick))
      .attr('y2', y(tick))
      .attr('stroke', tokens['--line']);
    svg
      .append('text')
      .attr('x', margin.left - 8)
      .attr('y', y(tick))
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', 11.5)
      .attr('fill', tokens['--ink-3'])
      .text(axisFormat(tick));
  });
  data.forEach((d) => {
    svg
      .append('text')
      .attr('x', x(d.label))
      .attr('y', height - 6)
      .attr('text-anchor', 'middle')
      .attr('font-size', 12)
      .attr('fill', tokens['--ink-3'])
      .text(d.label);
  });

  const gradientId = nextId('area-fade');
  const gradient = svg
    .append('defs')
    .append('linearGradient')
    .attr('id', gradientId)
    .attr('x1', 0)
    .attr('x2', 0)
    .attr('y1', 0)
    .attr('y2', 1);
  gradient.append('stop').attr('offset', 0).attr('stop-color', color).attr('stop-opacity', 0.28);
  gradient.append('stop').attr('offset', 1).attr('stop-color', color).attr('stop-opacity', 0);

  const curve = curveMonotoneX;
  const fill = svg
    .append('path')
    .datum(data)
    .attr('fill', `url(#${gradientId})`)
    .attr(
      'd',
      area()
        .x((d) => x(d.label))
        .y0(y(0))
        .y1((d) => y(d.value))
        .curve(curve)
    );
  const stroke = svg
    .append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', color)
    .attr('stroke-width', 2.2)
    .attr('stroke-linecap', 'round')
    .attr(
      'd',
      line()
        .x((d) => x(d.label))
        .y((d) => y(d.value))
        .curve(curve)
    );
  if (animate) {
    const length = stroke.node().getTotalLength();
    stroke
      .attr('stroke-dasharray', `${length} ${length}`)
      .attr('stroke-dashoffset', length)
      .transition()
      .duration(900)
      .ease(ease)
      .attr('stroke-dashoffset', 0)
      .on('end', () => stroke.attr('stroke-dasharray', null));
    fill.attr('opacity', 0).transition().delay(300).duration(600).ease(ease).attr('opacity', 1);
  }

  const last = data[data.length - 1];
  svg
    .append('circle')
    .attr('cx', x(last.label))
    .attr('cy', y(last.value))
    .attr('r', 4.5)
    .attr('fill', color)
    .attr('stroke', tokens['--panel'])
    .attr('stroke-width', 2);

  const cross = svg
    .append('line')
    .attr('y1', margin.top)
    .attr('y2', height - margin.bottom)
    .attr('stroke', tokens['--ink-3'])
    .attr('stroke-dasharray', '3 3')
    .attr('opacity', 0);
  const dot = svg
    .append('circle')
    .attr('r', 5)
    .attr('fill', color)
    .attr('stroke', tokens['--panel'])
    .attr('stroke-width', 2)
    .attr('opacity', 0);
  svg
    .append('rect')
    .attr('x', margin.left)
    .attr('y', margin.top)
    .attr('width', width - margin.left - margin.right)
    .attr('height', height - margin.top - margin.bottom)
    .attr('fill', 'transparent')
    .on('mousemove', (event) => {
      const [px] = pointer(event);
      const nearest = data.reduce((best, current) =>
        Math.abs(x(current.label) - px) < Math.abs(x(best.label) - px) ? current : best
      );
      cross.attr('x1', x(nearest.label)).attr('x2', x(nearest.label)).attr('opacity', 1);
      dot.attr('cx', x(nearest.label)).attr('cy', y(nearest.value)).attr('opacity', 1);
      showTip(event, {
        title: nearest.title || nearest.label,
        lines: [`${valueFormat(nearest.value)} ${options.valueLabel || ''}`.trim()],
      });
    })
    .on('mouseleave', () => {
      cross.attr('opacity', 0);
      dot.attr('opacity', 0);
      hideTip();
    });
}

export function render(element, data, options = {}) {
  const valueFormat = options.format || format.money;
  const table = (current) => ({
    columns: ['Periodo', 'Importe'],
    rows: current.map((d) => [d.title || d.label, valueFormat(d.value)]),
  });
  return mountChart(element, data, { table, ...options }, draw);
}
