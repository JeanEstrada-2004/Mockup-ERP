// ==========================================================================
// Kit de gráficos D3 (Entrega 2) — see DESIGN.md › Gráficos
// ==========================================================================
// Every pattern: `render(element, data, options)` → `{ update, destroy }`.
// Colours come from CSS tokens (theme.js); charts redraw on theme or size
// change, share one tooltip and expose an accessible name and data table.
export * as flow from './flow.js';
export * as executionBars from './execution-bars.js';
export * as area from './area.js';
export * as sparkline from './sparkline.js';
export * as splitBar from './split-bar.js';
export * as donut from './donut.js';
export * as bars from './bars.js';
export { format } from './base.js';
export { readTokens, seriesToken, SERIES, SERIES_OTHER } from './theme.js';
