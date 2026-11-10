// ==========================================================================
// Dona — share of a whole, with the total in the centre
// ==========================================================================
// data    = [{ label, value, color: '--s1', href? }]  (fixed series order)
// options = { size = 220, thickness = 0.24, centerLabel, centerValue,
//             format = money, legend = true, label, table }

import { arc, pie } from 'd3-shape';
import { interpolate } from 'd3-interpolate';
import { ease, format, freshSvg, mountChart } from './base.js';
import { hideTip, showTip } from './tooltip.js';

function draw({ host, element, data, options, tokens, animate }) {
  const size = options.size || 220;
  const radius = size / 2;
  const inner = radius * (1 - (options.thickness || 0.24));
  const valueFormat = options.format || format.money;
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const svg = freshSvg(host, size, size)
    .attr('class', 'chart-svg chart-svg--donut')
    .style('max-width', `${size}px`);
  const g = svg.append('g').attr('transform', `translate(${radius},${radius})`);

  const slices = pie()
    .sort(null)
    .value((d) => d.value)
    .padAngle(0.012)(data.filter((d) => d.value > 0));
  const shape = arc().innerRadius(inner).outerRadius(radius).cornerRadius(3);
  const grown = arc()
    .innerRadius(inner)
    .outerRadius(radius + 4)
    .cornerRadius(3);

  const paths = g
    .selectAll('path')
    .data(slices)
    .join('path')
    .attr('fill', (d) => tokens.color(d.data.color))
    .attr('d', shape)
    .on('mousemove', (event, d) => {
      event.currentTarget.setAttribute('d', grown(d));
      showTip(event, {
        title: d.data.label,
        lines: [
          `${valueFormat(d.data.value)} · ${format.pct((d.data.value / (total || 1)) * 100)}`,
        ],
      });
    })
    .on('mouseleave', (event, d) => {
      event.currentTarget.setAttribute('d', shape(d));
      hideTip();
    });
  if (animate) {
    paths
      .transition()
      .duration(800)
      .ease(ease)
      .attrTween('d', (d) => {
        const sweep = interpolate({ startAngle: 0, endAngle: 0 }, d);
        return (t) => shape(sweep(t));
      });
  }

  if (options.centerLabel || options.centerValue) {
    const label = g.append('text').attr('text-anchor', 'middle');
    label
      .append('tspan')
      .attr('x', 0)
      .attr('dy', '-0.35em')
      .attr('font-size', 13)
      .attr('fill', tokens['--ink-2'])
      .text(options.centerLabel || '');
    label
      .append('tspan')
      .attr('x', 0)
      .attr('dy', '1.45em')
      .attr('font-size', 20)
      .attr('font-weight', 800)
      .attr('font-family', 'var(--font-display)')
      .attr('fill', tokens['--ink'])
      .text(options.centerValue ?? valueFormat(total));
  }

  // Legend with values (2+ series → legend, DESIGN.md › Gráficos).
  element.querySelector(':scope > .legend')?.remove();
  if (options.legend !== false) {
    const legend = document.createElement('ul');
    legend.className = 'legend legend--rows';
    data.forEach((item) => {
      const li = document.createElement('li');
      const swatch = document.createElement('i');
      swatch.style.background = tokens.color(item.color);
      const name = document.createElement(item.href ? 'a' : 'span');
      name.textContent = item.label;
      if (item.href) name.href = item.href;
      const value = document.createElement('b');
      value.textContent = valueFormat(item.value);
      li.append(swatch, name, value);
      legend.appendChild(li);
    });
    element.insertBefore(legend, element.querySelector(':scope > .chart-table'));
  }
}

export function render(element, data, options = {}) {
  const valueFormat = options.format || format.money;
  const table = (current) => {
    const total = current.reduce((sum, item) => sum + item.value, 0) || 1;
    return {
      columns: ['Categoría', 'Importe', 'Participación'],
      rows: current.map((item) => [
        item.label,
        valueFormat(item.value),
        format.pct((item.value / total) * 100),
      ]),
    };
  };
  return mountChart(element, data, { table, minWidth: 0, ...options }, draw);
}
