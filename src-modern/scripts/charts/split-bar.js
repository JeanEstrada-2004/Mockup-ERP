// ==========================================================================
// Barra dividida (KPI) — proportions as rounded segments in one line
// ==========================================================================
// data    = [{ label: 'Activos', value: 9, color: '--s1' }, …]
// options = { label }  (defaults to "9 activos, 3 en riesgo"-style text)
// Plain DOM segments (flex), so it scales with its cell and needs no SVG.

import { mountChart } from './base.js';
import { hideTip, showTip } from './tooltip.js';

function draw({ element, data, tokens, animate }) {
  let bar = element.querySelector(':scope > .splitbar');
  if (!bar) {
    bar = document.createElement('span');
    bar.className = 'splitbar';
    element.prepend(bar);
  }
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1;
  bar.replaceChildren(
    ...data
      .filter((item) => item.value > 0)
      .map((item, index) => {
        const segment = document.createElement('span');
        segment.style.flex = String(item.value);
        segment.style.background = tokens.color(item.color || '--s1');
        if (animate) {
          segment.animate(
            [
              { transform: 'scaleX(0)', transformOrigin: 'left' },
              { transform: 'scaleX(1)', transformOrigin: 'left' },
            ],
            {
              duration: 600,
              delay: 120 + index * 60,
              easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
              fill: 'backwards',
            }
          );
        }
        segment.addEventListener('mousemove', (event) =>
          showTip(event, {
            title: item.label,
            lines: [`${item.value} · ${Math.round((item.value / total) * 100)} %`],
          })
        );
        segment.addEventListener('mouseleave', hideTip);
        return segment;
      })
  );
}

export function render(element, data, options = {}) {
  const label =
    options.label || data.map((item) => `${item.value} ${item.label.toLowerCase()}`).join(', ');
  return mountChart(element, data, { table: false, minWidth: 0, ...options, label }, draw);
}
