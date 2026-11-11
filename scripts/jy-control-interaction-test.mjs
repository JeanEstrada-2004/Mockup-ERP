// R3 (docs/realineamiento-jy-demo.md): Costos y Control Contable (J&Y Real vs.
// formal treatment, categories, consolidation), Documentos with a visual
// preview, Pendientes as a worklist, and Inicio / Proyecto without the rules
// not confirmed with J&Y (physical progress, automatic 80 % alert). SurTec and
// PMI keep their views.
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { getDataForVariant, getProjectFinancials } from '../src-modern/scripts/data/mock-data.js';
import {
  costLines,
  groupLines,
  treatmentTotals,
} from '../src-modern/scripts/data/cost-treatment.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const serveDir = path.join(root, 'dist-pages');
const pagesBase = process.env.PAGES_BASE || '/';
if (!pagesBase.startsWith('/') || !pagesBase.endsWith('/')) throw new Error('PAGES_BASE inválido.');
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/manifest+json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};
const server = http.createServer(async (req, res) => {
  try {
    const requested = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (!requested.startsWith(pagesBase)) return res.writeHead(404).end('Not found');
    const relative = `/${requested.slice(pagesBase.length)}`;
    let file = path.resolve(serveDir, `.${relative}`);
    if (!file.startsWith(`${serveDir}${path.sep}`)) return res.writeHead(403).end();
    if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404).end('Not found');
  }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const url = (variant, pageName) => `${origin}${pagesBase}${variant}/${pageName}`;
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});
const ready = () => page.waitForFunction(() => window.AdminApp?.isInitialized);
const tick = () => page.waitForTimeout(150);
const money = (value) => `S/ ${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}`;
async function noOverflow() {
  await page.waitForTimeout(200);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  assert.ok(overflow <= 1, `${page.url()}: overflow ${overflow}px`);
}
async function screenshot(name) {
  if (process.env.VISUAL !== '1') return;
  const out = path.join(root, 'tmp', 'jy-control-r3');
  await mkdir(out, { recursive: true });
  await page.screenshot({ path: path.join(out, `${name}.png`), fullPage: true });
}
const data = getDataForVariant('jy-demo');

async function testCosts() {
  const projectId = 'PY-26-001';
  const lines = costLines(data, projectId);
  const totals = treatmentTotals(lines);
  assert.equal(totals.total, getProjectFinancials(data, projectId).executedCost);
  await page.goto(url('jy-demo', `costs.html?project=${projectId}`));
  await ready();
  await page.evaluate(() => localStorage.clear());
  assert.equal(await page.locator('h1').innerText(), 'Costos y Control Contable');
  assert.equal(
    await page.locator('.sidebar-nav [data-module="costs"] span').first().innerText(),
    'Costos y Control Contable'
  );
  // Only confirmed rules: no physical progress, no referential split by source.
  const main = await page.locator('#main-content').innerText();
  assert.doesNotMatch(main, /Avance físico|Partidas de control referencial/);
  // J&Y Real and its formal treatment add up to the executed cost.
  const real = await page
    .locator('#cost-real-title')
    .locator('xpath=ancestor::section')
    .innerText();
  assert.match(real, new RegExp(`Costo J&Y Real\\s+${money(totals.total)}`));
  assert.match(real, new RegExp(`No documentado\\s+${money(totals.undocumented)}`));
  assert.match(real, new RegExp(`Sin desglose tributario\\s+${money(totals.noBreakdown)}`));
  assert.equal(
    Math.round(
      (totals.vv + totals.igv + totals.nonTaxed + totals.undocumented + totals.noBreakdown) * 100
    ),
    Math.round(totals.total * 100)
  );
  await page.locator('#cost-treatment-bar .splitbar span').first().waitFor();
  await page.locator('#cost-category-chart .chart-svg').waitFor();
  // Consolidation by category, then by project across the portfolio.
  const categories = groupLines(data, lines, 'category');
  const rows = page.locator('.consolidation-table tbody tr');
  assert.equal(await rows.count(), categories.length);
  await rows.filter({ hasText: 'Alimentación' }).getByRole('button').click();
  await tick();
  const detail = page.locator('.consolidation-lines li');
  assert.equal(await detail.count(), categories.find((item) => item.key === 'Alimentación').count);
  assert.match(await detail.first().innerText(), /N\.º \d+-2026 · ítem \d/);
  await page.locator('#consolidation-scope').selectOption('all');
  await page.locator('#consolidation-grouping').selectOption('project');
  await tick();
  assert.equal(await rows.count(), groupLines(data, costLines(data), 'project').length);
  assert.match(
    await page.locator('.consolidation-table tfoot').innerText(),
    new RegExp(money(treatmentTotals(costLines(data)).total))
  );
  // A line opens the expense it comes from.
  await page.locator('#consolidation-grouping').selectOption('category');
  await tick();
  await rows.filter({ hasText: 'Hospedaje' }).getByRole('button').click();
  await tick();
  await detail.first().locator('a').click();
  await page.waitForURL(/expense\.html\?id=R-26-\d{3}&item=R-26-\d{3}-\d{2}/);
  await ready();
  await page.locator('.ev-doc').waitFor();
  // Operation rows show the rendición number, not the internal id.
  await page.goto(url('jy-demo', `costs.html?project=${projectId}&source=expenses`));
  await ready();
  assert.match(await page.locator('.costs-table').innerText(), /N\.º 7-2026/);
  await screenshot('costs');
  await page.setViewportSize({ width: 390, height: 844 });
  await noOverflow();
  await page.setViewportSize({ width: 1440, height: 900 });
  // SurTec keeps the referential split and has no treatment section.
  await page.goto(url('surtec-peti', 'costs.html?project=PR-2027-001'));
  await ready();
  assert.equal(await page.locator('#cost-parts-title').count(), 1);
  assert.equal(await page.locator('#cost-real-title').count(), 0);
}

async function testWorklist() {
  await page.goto(url('jy-demo', 'approvals.html'));
  await ready();
  assert.equal(await page.locator('h1').first().innerText(), 'Pendientes');
  assert.equal(
    await page.locator('.sidebar-nav [data-module="approvals"] span').first().innerText(),
    'Pendientes'
  );
  assert.equal(
    await page.locator('[data-approvals-link]').getAttribute('aria-label'),
    'Pendientes: 6'
  );
  const tabs = page.locator('.worklist-workspace .workspace-tabs [role="tab"]');
  assert.equal(await tabs.count(), 5);
  for (const [name, count] of [
    ['Por revisar', 2],
    ['Observadas', 1],
    ['Por entregar', 1],
    ['Órdenes de compra', 1],
    ['Documentos', 1],
  ]) {
    await tabs.filter({ hasText: name }).click();
    await tick();
    assert.equal(await page.locator('.worklist-table tbody tr').count(), count, name);
  }
  // Each task leads to its record with the next step as its action.
  await tabs.filter({ hasText: 'Observadas' }).click();
  await tick();
  const observed = page.locator('.worklist-table tbody tr').first();
  assert.match(
    await observed.innerText(),
    /N\.º 8-2026[\s\S]*la factura no está a nombre de J&Y[\s\S]*Corregir/
  );
  await observed.getByRole('link', { name: 'Corregir' }).click();
  await page.waitForURL(/expense\.html\?id=R-26-005/);
  await ready();
  await page.goto(url('jy-demo', 'approvals.html?tab=documents'));
  await ready();
  assert.match(
    await page.locator('.worklist-table').innerText(),
    /OC-26-004[\s\S]*Adjuntar la cotización/
  );
  await screenshot('worklist');
  await page.setViewportSize({ width: 390, height: 844 });
  await noOverflow();
  assert.ok((await page.locator('.worklist-cards li').count()) >= 1);
  await page.setViewportSize({ width: 1440, height: 900 });
  // SurTec and PMI keep the approvals inbox.
  for (const variant of ['surtec-peti', 'jy-pmi']) {
    await page.goto(url(variant, 'approvals.html'));
    await ready();
    assert.equal(await page.locator('h1').first().innerText(), 'Aprobaciones Pendientes');
    assert.equal(await page.locator('.worklist-workspace').count(), 0);
  }
}

async function testHomeAndProject() {
  await page.goto(url('jy-demo', 'index.html'));
  await ready();
  assert.equal(await page.locator('#dashboard-execution').count(), 0);
  assert.match(
    await page.locator('#dashboard-approvals-title').innerText(),
    /pendientes esperan atención/
  );
  assert.match(await page.locator('.kpi-strip').innerText(), /Costo J&Y Real acumulado/);
  const context = page.locator('#dashboard-context-title').locator('xpath=ancestor::section');
  assert.match(
    await context.innerText(),
    /Proyecto en contexto · PY-26-001[\s\S]*Costo J&Y Real[\s\S]*Rendiciones[\s\S]*Documentos/
  );
  // Changing the current project updates the panel.
  await page.locator('#global-project-select').selectOption('PY-26-002');
  await tick();
  assert.match(await context.innerText(), /PY-26-002/);
  await context.getByRole('link', { name: /Rendiciones/ }).click();
  await page.waitForURL(/project\.html\?id=PY-26-002.*#expenses/);
  await ready();
  assert.equal(
    await page.locator('[data-project-tab="expenses"]').getAttribute('aria-selected'),
    'true'
  );
  // Project page: no physical progress anywhere.
  const project = await page.locator('#main-content').innerText();
  assert.doesNotMatch(project, /Avance físico|Avance informado/);
  assert.match(await page.locator('.kpi-strip').innerText(), /Rendiciones/);
  // Notifications: no automatic budget alert, OC pending "de revisión".
  const notifications = await page.locator('.shell-notification-menu').innerText();
  assert.doesNotMatch(notifications, /supera el/);
  assert.match(notifications, /OC-26-004 pendiente de revisión/);
  await page.goto(url('jy-demo', 'projects.html'));
  await ready();
  assert.doesNotMatch(await page.locator('.data-table thead').innerText(), /Avance/);
  await page.goto(url('surtec-peti', 'projects.html'));
  await ready();
  assert.match(await page.locator('.data-table thead').innerText(), /Avance/);
  await page.goto(url('surtec-peti', 'index.html'));
  await ready();
  assert.equal(await page.locator('#dashboard-execution').count(), 1);
  assert.equal(await page.locator('#dashboard-context-title').count(), 0);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(url('jy-demo', 'index.html'));
  await ready();
  await noOverflow();
  await page.setViewportSize({ width: 1440, height: 900 });
}

async function testDocuments() {
  const report = data.expenseReports.find((item) => item.id === 'R-26-001');
  // Every evidence with a document is a document of its own.
  await page.goto(url('jy-demo', 'documents.html?search=R-26-001'));
  await ready();
  const item = report.items[2];
  await page.goto(url('jy-demo', `document.html?id=DOC-${item.id}`));
  await ready();
  const viewer = page.locator('.document-viewer');
  assert.match(
    await viewer.innerText(),
    /FACTURA ELECTRÓNICA[\s\S]*F003-00102255[\s\S]*S\/ 240\.00/
  );
  await page.getByRole('button', { name: 'Vista previa' }).click();
  assert.ok(await page.locator('.evidence-stage.is-full').isVisible());
  await page.keyboard.press('Escape');
  await page.getByRole('link', { name: 'Abrir operación de origen' }).click();
  await page.waitForURL(new RegExp(`expense\\.html\\?id=R-26-001&item=${item.id}`));
  await ready();
  // The rendición itself and an OC show an illustrated sheet.
  await page.goto(url('jy-demo', 'document.html?id=DOC-R-26-001'));
  await ready();
  assert.match(
    await page.locator('.ev-doc').innerText(),
    /RENDICIÓN[\s\S]*N\.º 7-2026[\s\S]*Total rendido\s+S\/ 1 494\.00/
  );
  await page.goto(url('jy-demo', 'document.html?id=DOC-OC-26-001'));
  await ready();
  assert.match(
    await page.locator('.ev-doc').innerText(),
    /ORDEN DE COMPRA[\s\S]*Suministros Eléctricos Andinos/
  );
  await screenshot('document');
  await page.setViewportSize({ width: 390, height: 844 });
  await noOverflow();
  await page.setViewportSize({ width: 1440, height: 900 });
  // Other presentations keep the metadata preview.
  await page.goto(url('surtec-peti', 'document.html?id=DOC-OC-025'));
  await ready();
  assert.equal(await page.locator('.document-viewer').count(), 0);
}

try {
  await testCosts();
  await testWorklist();
  await testHomeAndProject();
  await testDocuments();
  assert.deepEqual(errors, []);
  console.log(
    'Control J&Y: J&Y Real y tratamiento formal, categorías, consolidación, Pendientes, Inicio y proyecto sin avance físico, documentos con vista previa y alcance correctos.'
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
