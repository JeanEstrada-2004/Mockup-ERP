// ==========================================================================
// Chart theme — every colour comes from a CSS token (DESIGN.md › Datos)
// ==========================================================================
// Charts never inline a hex. A series is named by its token ('--s1'…'--s4',
// '--s-other', '--bad'…); this module resolves it against the current theme
// and tells charts when the theme changes so they can redraw.

const TOKENS = [
  '--ink',
  '--ink-2',
  '--ink-3',
  '--panel',
  '--panel-2',
  '--line',
  '--track',
  '--brand',
  '--accent',
  '--s1',
  '--s2',
  '--s3',
  '--s4',
  '--s-other',
  '--good',
  '--warn',
  '--bad',
];

/** Snapshot of the chart tokens for the active theme and variant. */
export function readTokens(root = document.documentElement) {
  const styles = getComputedStyle(root);
  const tokens = {};
  TOKENS.forEach((name) => {
    tokens[name] = styles.getPropertyValue(name).trim();
  });
  /** Resolve '--s1' (or any token) to its colour; unknown names pass through. */
  tokens.color = (name) => {
    if (!name) return tokens['--s1'];
    if (!name.startsWith('--')) return name;
    return tokens[name] || styles.getPropertyValue(name).trim();
  };
  return tokens;
}

/** Fixed categorical order, never rotated. A 5th group folds into "Otros". */
export const SERIES = ['--s1', '--s2', '--s3', '--s4'];
export const SERIES_OTHER = '--s-other';

/** Token for the series at `index` (index ≥ 4 → '--s-other'). */
export function seriesToken(index) {
  return SERIES[index] || SERIES_OTHER;
}

/**
 * Calls `callback` when the theme (data-bs-theme on <html>) changes.
 * Returns an unsubscribe function.
 */
export function onThemeChange(callback, root = document.documentElement) {
  const observer = new MutationObserver(() => callback());
  observer.observe(root, { attributes: true, attributeFilter: ['data-bs-theme'] });
  return () => observer.disconnect();
}
