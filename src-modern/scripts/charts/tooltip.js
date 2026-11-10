// ==========================================================================
// Shared chart tooltip — one element for every chart on the page
// ==========================================================================
// Built with createElement + textContent (no innerHTML interpolation).
// Styled by `.chart-tip` in _design-system.scss.

let tip = null;

function element() {
  if (tip?.isConnected) return tip;
  tip = document.createElement('div');
  tip.className = 'chart-tip';
  tip.setAttribute('role', 'tooltip');
  tip.setAttribute('aria-hidden', 'true');
  document.body.appendChild(tip);
  return tip;
}

/**
 * @param {MouseEvent|PointerEvent} event
 * @param {{ title: string, lines?: string[] }} content
 */
export function showTip(event, { title, lines = [] }) {
  const node = element();
  const heading = document.createElement('b');
  heading.textContent = title;
  const children = [heading];
  lines.filter(Boolean).forEach((line) => {
    children.push(document.createElement('br'), document.createTextNode(line));
  });
  node.replaceChildren(...children);
  node.classList.add('is-on');
  const x = Math.min(event.clientX + 14, window.innerWidth - node.offsetWidth - 10);
  const below = event.clientY + 14 + node.offsetHeight < window.innerHeight;
  node.style.left = `${Math.max(10, x)}px`;
  node.style.top = `${below ? event.clientY + 14 : event.clientY - node.offsetHeight - 14}px`;
}

export function hideTip() {
  tip?.classList.remove('is-on');
}
