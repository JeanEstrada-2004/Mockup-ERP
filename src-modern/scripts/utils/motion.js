// ==========================================================================
// Motion helpers (DESIGN.md › Movimiento, emil-design-eng)
// ==========================================================================
// - `x-count` Alpine directive: figures count up to their value (~650 ms).
// - `drawNetwork(canvas)`: the network texture of the hero panel.
// Everything respects `prefers-reduced-motion`.

const COUNT_MS = 650;

export function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

// Same easing as the CSS token --ease-out, approximated for JS frames.
const easeOutCubic = (t) => 1 - (1 - t) ** 3;

const groupThousands = (value) =>
  Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

export const formatCount = {
  int: (value) => groupThousands(value),
  money: (value) => `S/ ${groupThousands(value)}`,
  pct: (value) => `${(Math.round(value * 10) / 10).toFixed(1).replace('.', ',')} %`,
};

/**
 * `<span x-count.money="portfolio.budgetAmount"></span>`
 * Modifiers: `.money` (S/ 1 245 000), `.pct` (60,8 %), default integer.
 * The first render counts from zero; later changes count from the last value.
 */
export function registerCountDirective(Alpine) {
  Alpine.directive('count', (el, { expression, modifiers }, { evaluateLater, effect, cleanup }) => {
    const read = evaluateLater(expression);
    const format = modifiers.includes('money')
      ? formatCount.money
      : modifiers.includes('pct')
        ? formatCount.pct
        : formatCount.int;
    let current = 0;
    let frame = 0;

    effect(() => {
      read((target) => {
        const end = Number(target);
        cancelAnimationFrame(frame);
        if (!Number.isFinite(end)) {
          el.textContent = String(target ?? '');
          return;
        }
        if (prefersReducedMotion() || end === current) {
          current = end;
          el.textContent = format(end);
          return;
        }
        const start = current;
        const startedAt = performance.now();
        const step = (now) => {
          const t = Math.min(1, (now - startedAt) / COUNT_MS);
          current = start + (end - start) * easeOutCubic(t);
          el.textContent = format(t === 1 ? end : current);
          if (t < 1) frame = requestAnimationFrame(step);
          else current = end;
        };
        // Write the final value for assistive tech and tests, then animate.
        el.setAttribute('aria-label', format(end));
        frame = requestAnimationFrame(step);
      });
    });

    cleanup(() => cancelAnimationFrame(frame));
  });
}

/**
 * Network texture: nodes and short links, drawn once per size. Deterministic
 * (seeded) so the hero looks the same on every load and in screenshots.
 */
export function drawNetwork(canvas, { seed = 7, nodes = 26, reach = 90 } = {}) {
  if (!canvas?.getContext) return;
  const box = canvas.getBoundingClientRect();
  if (!box.width || !box.height) return;
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.round(box.width * ratio);
  canvas.height = Math.round(box.height * ratio);
  const context = canvas.getContext('2d');
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, box.width, box.height);

  // Linear congruential generator: same sequence as d3.randomLcg's idea.
  let state = seed;
  const random = () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
  const points = Array.from({ length: nodes }, () => [
    box.width * (0.45 + random() * 0.6),
    box.height * random(),
  ]);

  context.lineWidth = 1;
  context.strokeStyle = 'rgba(255, 255, 255, 0.22)';
  points.forEach((a, index) => {
    points.slice(index + 1).forEach((b) => {
      if (Math.hypot(a[0] - b[0], a[1] - b[1]) < reach) {
        context.beginPath();
        context.moveTo(a[0], a[1]);
        context.lineTo(b[0], b[1]);
        context.stroke();
      }
    });
  });
  context.fillStyle = 'rgba(255, 255, 255, 0.55)';
  points.forEach(([x, y]) => {
    context.beginPath();
    context.arc(x, y, 2.2, 0, Math.PI * 2);
    context.fill();
  });
}

/**
 * Draws the texture on every `canvas.hero-net` and keeps it sized.
 * Returns a cleanup function.
 */
export function mountHeroNetworks(root = document) {
  const canvases = [...root.querySelectorAll('canvas.hero-net')];
  if (!canvases.length || typeof ResizeObserver === 'undefined') return () => {};
  const observer = new ResizeObserver((entries) => {
    entries.forEach((entry) => drawNetwork(entry.target));
  });
  canvases.forEach((canvas) => observer.observe(canvas));
  return () => observer.disconnect();
}
