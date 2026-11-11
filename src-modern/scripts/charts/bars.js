// ==========================================================================
// Barras finas — grouped bars with rounded ends, one value axis
// ==========================================================================
// data = {
//   categories: ['PR-2027-001', …],
//   series: [{ label: 'Presupuesto', color: '--s1', values: [185000, …] }],
//   colors?: ['--s1', '--s3', …]   // per-category colours (single series)
//   hrefs?: ['./project.html?id=…'] // optional link per category
// }
// options = { orientation = 'vertical' | 'horizontal', height, format = money,
//             axis = thousands, label, table }

import { scaleBand, scaleLinear } from 'd3-scale';
import { max } from 'd3-array';
import { ease, format, freshSvg, mountChart } from './base.js';
import { hideTip, showTip } from './tooltip.js';

function niceTop(value) {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = magnitude / 2;
  return Math.ceil(value / step) * step;
}

function legend(element, data, tokens) {
  element.querySelector(':scope > .legend')?.remove();
  if (data.series.length < 2) return;
  const list = document.createElement('ul');
  list.className = 'legend';
  data.series.forEach((serie) => {
    const li = document.createElement('li');
    const swatch = document.createElement('i');
    swatch.style.background = tokens.color(serie.color);
    li.append(swatch, document.createTextNode(serie.label));
    list.appendChild(li);
  });
  element.prepend(list);
}

function drawVertical({ host, element, data, options, tokens, width, animate }) {
  const height = options.height || 240;
  const margin = { top: 10, right: 8, bottom: 30, left: 56 };
  const valueFormat = options.format || format.money;
  const axisFormat = options.axis || format.thousands;
  legend(element, data, tokens);
  const svg = freshSvg(host, width, height);
  const top = niceTop(max(data.series.flatMap((serie) => serie.values)) || 0);
  const x = scaleBand()
    .domain(data.categories)
    .range([margin.left, width - margin.right])
    .paddingInner(0.32)
    .paddingOuter(0.16);
  const inner = scaleBand()
    .domain(data.series.map((_, index) => index))
    .range([0, x.bandwidth()])
    .padding(0.18);
  const y = scaleLinear()
    .domain([0, top])
    .range([height - margin.bottom, margin.top]);
  const barWidth = Math.min(inner.bandwidth(), 22);

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
  const crowded = x.bandwidth() < 64;
  data.categories.forEach((category) => {
    svg
      .append('text')
      .attr('x', x(category) + x.bandwidth() / 2)
      .attr('y', height - 8)
      .attr('text-anchor', 'middle')
      .attr('font-size', crowded ? 11 : 12)
      .attr('fill', tokens['--ink-3'])
      .text(crowded ? category.replace(/^PR-\d{4}-/, '') : category);
  });

  data.series.forEach((serie, seriesIndex) => {
    const offset = inner(seriesIndex) + (inner.bandwidth() - barWidth) / 2;
    const bars = svg
      .append('g')
      .selectAll('rect')
      .data(
        serie.values.map((value, index) => ({ value, category: data.categories[index], index }))
      )
      .join('rect')
      .attr('x', (d) => x(d.category) + offset)
      .attr('width', barWidth)
      .attr('rx', Math.min(barWidth / 2, 6))
      .attr('fill', (d) => tokens.color(data.colors?.[d.index] || serie.color))
      .attr('y', (d) => y(d.value))
      .attr('height', (d) => Math.max(0, y(0) - y(d.value)))
      .on('mousemove', (event, d) =>
        showTip(event, {
          title: d.category,
          lines: data.series.map((s) => `${s.label}: ${valueFormat(s.values[d.index])}`),
        })
      )
      .on('mouseleave', hideTip);
    if (animate) {
      bars
        .attr('y', y(0))
        .attr('height', 0)
        .transition()
        .delay((d) => 80 + d.index * 50 + seriesIndex * 40)
        .duration(650)
        .ease(ease)
        .attr('y', (d) => y(d.value))
        .attr('height', (d) => Math.max(0, y(0) - y(d.value)));
    }
  });
}

function drawHorizontal({ host, element, data, options, tokens, width, animate }) {
  const rowHeight = 34;
  const margin = { top: 4, right: 92, bottom: 22, left: options.labelWidth || 132 };
  const height = options.height || margin.top + margin.bottom + data.categories.length * rowHeight;
  const valueFormat = options.format || format.money;
  const axisFormat = options.axis || format.thousands;
  legend(element, data, tokens);
  const svg = freshSvg(host, width, height);
  const values = data.series[0]?.values || [];
  const all = data.series.flatMap((serie) => serie.values);
  const top = niceTop(max(all) || 0);
  // Negative values (e.g. a projected loss) extend left of the zero line.
  const lowest = Math.min(0, ...all);
  const bottom = lowest < 0 ? -niceTop(-lowest) : 0;
  const x = scaleLinear()
    .domain([bottom, top])
    .range([margin.left, width - margin.right]);
  const y = scaleBand()
    .domain(data.categories)
    .range([margin.top, height - margin.bottom])
    .padding(0.42);

  x.ticks(4).forEach((tick) => {
    svg
      .append('line')
      .attr('x1', x(tick))
      .attr('x2', x(tick))
      .attr('y1', margin.top)
      .attr('y2', height - margin.bottom)
      .attr('stroke', tokens['--line']);
    svg
      .append('text')
      .attr('x', x(tick))
      .attr('y', height - 6)
      .attr('text-anchor', 'middle')
      .attr('font-size', 11.5)
      .attr('fill', tokens['--ink-3'])
      .text(axisFormat(tick));
  });

  const rows = values.map((value, index) => ({ value, category: data.categories[index], index }));
  if (bottom < 0) {
    svg
      .append('line')
      .attr('x1', x(0))
      .attr('x2', x(0))
      .attr('y1', margin.top)
      .attr('y2', height - margin.bottom)
      .attr('stroke', tokens['--ink-3']);
  }
  svg
    .append('g')
    .selectAll('text')
    .data(rows)
    .join('text')
    .attr('x', margin.left - 10)
    .attr('y', (d) => y(d.category) + y.bandwidth() / 2)
    .attr('text-anchor', 'end')
    .attr('dominant-baseline', 'middle')
    .attr('font-size', 13)
    .attr('fill', tokens['--ink-2'])
    .text((d) => d.category);
  const bars = svg
    .append('g')
    .selectAll('rect')
    .data(rows)
    .join('rect')
    .attr('x', (d) => x(Math.min(0, d.value)))
    .attr('y', (d) => y(d.category))
    .attr('height', y.bandwidth())
    .attr('rx', Math.min(y.bandwidth() / 2, 7))
    .attr('fill', (d) =>
      d.value < 0
        ? tokens['--bad']
        : tokens.color(data.colors?.[d.index] || data.series[0].color)
    )
    .attr('width', (d) => Math.abs(x(d.value) - x(0)))
    .on('mousemove', (event, d) =>
      showTip(event, { title: d.category, lines: [valueFormat(d.value)] })
    )
    .on('mouseleave', hideTip);
  if (animate) {
    bars
      .attr('x', x(0))
      .attr('width', 0)
      .transition()
      .delay((d) => 80 + d.index * 70)
      .duration(700)
      .ease(ease)
      .attr('x', (d) => x(Math.min(0, d.value)))
      .attr('width', (d) => Math.abs(x(d.value) - x(0)));
  }
  svg
    .append('g')
    .selectAll('text')
    .data(rows)
    .join('text')
    .attr('x', (d) => x(Math.max(0, d.value)) + 8)
    .attr('y', (d) => y(d.category) + y.bandwidth() / 2)
    .attr('dominant-baseline', 'middle')
    .attr('font-size', 12.5)
    .attr('font-weight', 600)
    .attr('fill', tokens['--ink'])
    .text((d) => valueFormat(d.value));
}

function draw(context) {
  if (context.options.orientation === 'horizontal') drawHorizontal(context);
  else drawVertical(context);
}

export function render(element, data, options = {}) {
  const valueFormat = options.format || format.money;
  const table = (current) => ({
    columns: ['', ...current.series.map((serie) => serie.label)],
    rows: current.categories.map((category, index) => [
      category,
      ...current.series.map((serie) => valueFormat(serie.values[index])),
    ]),
  });
  return mountChart(element, data, { table, ...options }, draw);
}
