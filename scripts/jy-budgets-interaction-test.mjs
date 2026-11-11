// R4 (docs/realineamiento-jy-demo.md): technical budgets of J&Y Demo —
// partidas and metrados, APU, insumos with supplier prices, product budgets
// with supplier options, internal vs. client view, new version vs. duplicate,
// Productos y precios (price search, quotes, comparator) and OC from a quote.
// SurTec and PMI keep their simple budgets.
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { getDataForVariant } from '../src-modern/scripts/data/mock-data.js';
import {
  apuUnitCost,
  budgetTotals,
  insumos,
  partidaRows,
  productLines,
} from '../src-modern/scripts/data/budget-calc.js';

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
const tick = () => page.waitForTimeout(200);
const money = (value) => `S/ ${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}`;
async function noOverflow() {
  await page.waitForTimeout(200);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  assert.ok(overflow <= 1, `${page.url()}: overflow ${overflow}px`);
}
async function screenshot(name) {
  if (process.env.VISUAL !== '1') return;
  const out = path.join(root, 'tmp', 'jy-budgets-r4');
  await mkdir(out, { recursive: true });
  await page.screenshot({ path: path.join(out, `${name}.png`), fullPage: true });
}
const data = getDataForVariant('jy-demo');
const ctx = { products: data.products, quotes: data.quotes };
const tab = (name) =>
  page.locator('.tech-budget .workspace-tabs').getByRole('tab', { name, exact: true });

async function testList() {
  await page.goto(url('jy-demo', 'budgets.html'));
  await ready();
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await ready();
  const table = page.locator('.tech-table tbody tr');
  assert.equal(await table.count(), data.budgets.length);
  const text = await page.locator('.tech-table').innerText();
  // J&Y's observed code: PR + AAMM + correlative + version + initials.
  assert.match(text, /PR2606-0022-V2-GM[\s\S]*En revisión/);
  assert.match(text, /Partidas y APU/);
  assert.match(text, /Productos/);
  await page.locator('#tech-type').selectOption('B');
  assert.equal(await table.count(), 1);
  await page.getByRole('button', { name: 'Limpiar' }).click();
  await screenshot('list');
}

async function testTechnicalBudget() {
  const budget = data.budgets.find((item) => item.id === 'PR2603-0014');
  const totals = budgetTotals(ctx, budget);
  await page.goto(url('jy-demo', `budget.html?id=${budget.id}`));
  await ready();
  assert.equal(await page.locator('.project-code').innerText(), 'PR2603-0014-V1-GM');
  // Direct cost + overhead + profit = client price; IGV apart.
  const kpis = await page.locator('.kpi-strip').first().innerText();
  for (const value of [
    totals.directCost,
    totals.overhead,
    totals.profit,
    totals.subtotal,
    totals.total,
  ])
    assert.ok(kpis.includes(money(value)), `KPI ${money(value)}`);
  assert.match(await page.locator('.tech-edit-note').innerText(), /solo lectura/);
  assert.ok(await page.locator('#tech-overhead').isDisabled());

  // Partidas: hierarchy with titles and leaf metrados.
  await tab('Partidas y metrados').click();
  await tick();
  const rows = partidaRows(ctx, budget);
  assert.equal(await page.locator('.tech-partidas tbody tr').count(), rows.length);
  assert.ok((await page.locator('.tech-partidas tr.tech-title').count()) >= 3);
  const leaf = rows.find((row) => row.code === '02.01.01');
  assert.match(
    await page.locator('.tech-partidas tbody tr', { hasText: '02.01.01' }).innerText(),
    new RegExp(
      `${leaf.quantity}[\\s\\S]*${money(leaf.unitCost).replace('/', '\\/')}[\\s\\S]*${money(leaf.partial).replace('/', '\\/')}`
    )
  );
  // APU of that partida: crew × 8 h ÷ yield, groups and unit cost.
  await page.getByRole('button', { name: 'Ver APU de 02.01.01' }).click();
  await tick();
  assert.match(page.url(), /tab=apu.*partida=02\.01\.01/);
  const apu = await page.locator('#tech-apu-title').locator('xpath=ancestor::section').innerText();
  assert.match(apu, /Rendimiento\s+8 pto\/día/);
  assert.match(
    apu,
    new RegExp(
      `Costo unitario\\s+${money(apuUnitCost(ctx, leaf.apu, budget.selections)).replace('/', '\\/')}`
    )
  );
  assert.match(apu, /Mano de obra[\s\S]*Materiales[\s\S]*Equipos y herramientas/);
  assert.match(apu, /Herramientas manuales\s+%MO\s+3/);
  // Insumos: consolidated, priced from the selected supplier quotes.
  await tab('Insumos').click();
  await tick();
  const list = insumos(ctx, budget);
  assert.equal(await page.locator('.tech-insumos tbody tr').count(), list.length);
  const tablero = page.locator('.tech-insumos tbody tr', {
    hasText: 'Tablero de distribución 12 polos',
  });
  assert.match(
    await tablero.locator('select option:checked').innerText(),
    /Tableros y Montajes[\s\S]*COT-26-003/
  );
  // Client view hides internal costs and shows sale prices.
  await page.getByRole('button', { name: 'Vista cliente' }).click();
  await tick();
  assert.equal(await tab('APU').isVisible(), false);
  assert.equal(await tab('Insumos').isVisible(), false);
  assert.doesNotMatch(
    await page.locator('.kpi-strip:visible').innerText(),
    /Costo directo|Utilidad/
  );
  await tab('Partidas y metrados').click();
  await tick();
  assert.match(await page.locator('.tech-partidas thead').innerText(), /Precio unitario/);
  assert.match(
    await page.locator('.tech-partidas tfoot').innerText(),
    new RegExp(money(totals.subtotal).replace('/', '\\/'))
  );
  await page.getByRole('button', { name: 'Vista interna' }).click();
  await screenshot('technical');

  // New version: same code, V2 in draft, editable; recalculates live.
  await page.getByRole('button', { name: 'Nueva versión' }).click();
  await page.locator('#budget-version-new-modal').waitFor({ state: 'visible' });
  await page.locator('#budget-version-comment').fill('Ajuste de metrados por planos actualizados');
  await page.getByRole('button', { name: 'Crear versión' }).click();
  await page.locator('#budget-version-new-modal').waitFor({ state: 'hidden' });
  assert.equal(await page.locator('.project-code').innerText(), 'PR2603-0014-V2-GM');
  assert.match(await page.locator('.tech-edit-note').innerText(), /borrador/);
  await tab('Partidas y metrados').click();
  await tick();
  const qtyInput = page.getByLabel('Metrado de 02.01.01');
  await qtyInput.fill('200');
  await qtyInput.dispatchEvent('change');
  await tick();
  const changed = budgetTotals(ctx, budget, { quantities: { '02.01.01': 200 } });
  assert.ok((await page.locator('.kpi-strip').first().innerText()).includes(money(changed.total)));
  await tab('Resumen').click();
  await page.locator('#tech-overhead').fill('12');
  await page.locator('#tech-overhead').dispatchEvent('change');
  await tick();
  const withOverhead = budgetTotals(ctx, budget, {
    quantities: { '02.01.01': 200 },
    overheadPct: 12,
  });
  assert.ok(
    (await page.locator('.kpi-strip').first().innerText()).includes(money(withOverhead.total))
  );
  // Change the supplier of an insumo: price and total follow.
  await tab('Insumos').click();
  await tick();
  await page
    .locator('.tech-insumos tbody tr', { hasText: 'Interruptor termomagnético' })
    .locator('select')
    .selectOption('COT-26-003');
  await tick();
  const withSupplier = budgetTotals(ctx, budget, {
    quantities: { '02.01.01': 200 },
    overheadPct: 12,
    selections: { 'MAT-07': 'COT-26-003' },
  });
  assert.ok(
    (await page.locator('.kpi-strip').first().innerText()).includes(money(withSupplier.total))
  );
  // "Generar OC" opens a purchase order prefilled from the quote of origin.
  const order = page
    .locator('.tech-insumos tbody tr', { hasText: 'Interruptor termomagnético' })
    .getByRole('link', { name: 'Generar OC' });
  await order.click();
  await page.waitForURL(
    /purchases\.html\?new=1&project=PY-26-002&supplier=PROV-JY-003&quote=COT-26-003/
  );
  await ready();
  await page.locator('#purchase-create-modal').waitFor({ state: 'visible' });
  assert.equal(await page.locator('#purchase-quote-origin').inputValue(), 'COT-26-003');
  assert.equal(await page.locator('#purchase-supplier').inputValue(), 'PROV-JY-003');
  assert.equal(await page.locator('#purchase-line').count(), 0);
  assert.match(await page.locator('#purchase-create-modal').innerText(), /Registrar orden/);
  await page.keyboard.press('Escape');

  // The version persists; the status moves forward; V1 is unchanged.
  await page.goto(url('jy-demo', `budget.html?id=${budget.id}&tab=versiones`));
  await ready();
  assert.match(
    await page.locator('.review-history').innerText(),
    /V2 · Borrador · en esta demostración[\s\S]*V1 · Aceptado/
  );
  await page.getByRole('button', { name: 'Marcar: En revisión' }).click();
  await tick();
  assert.match(
    await page.locator('.workspace-detail-heading .badge').first().innerText(),
    /En revisión/
  );
  await page.locator('#tech-version').selectOption('1');
  await tick();
  assert.ok((await page.locator('.kpi-strip').first().innerText()).includes(money(totals.total)));
  // Pendientes now lists this budget too.
  await page.goto(url('jy-demo', 'approvals.html?tab=budgets'));
  await ready();
  assert.match(
    await page.locator('.worklist-table').innerText(),
    /PR2603-0014-V2-GM[\s\S]*PR2606-0022-V2-GM|PR2606-0022-V2-GM[\s\S]*PR2603-0014-V2-GM/
  );
}

async function testDuplicateAndProducts() {
  const budget = data.budgets.find((item) => item.id === 'PR2604-0019');
  const lines = productLines(ctx, budget);
  await page.goto(url('jy-demo', `budget.html?id=${budget.id}&tab=productos`));
  await ready();
  // Tipo B: one card per requested product with its supplier options.
  assert.equal(await page.locator('.tech-product').count(), lines.length);
  const pc = page.locator('.tech-product').first();
  assert.match(
    await pc.innerText(),
    /Cómputo y Redes Chachani[\s\S]*Menor precio[\s\S]*Tecnología Educativa del Sur/
  );
  assert.equal(await tab('APU').count(), 0);
  // Duplicate: another budget with a new code; this one does not change.
  await page.getByRole('button', { name: 'Duplicar' }).click();
  await page.locator('#budget-duplicate-modal').waitFor({ state: 'visible' });
  await page.locator('#budget-duplicate-title-input').fill('Equipamiento de laboratorio');
  await page.locator('#budget-duplicate-client').selectOption('CLI-JY-005');
  await page.getByRole('button', { name: 'Duplicar', exact: true }).last().click();
  await page.waitForURL(/budget\.html\?id=PR2607-0023/);
  await ready();
  assert.equal(await page.locator('.project-code').innerText(), 'PR2607-0023-V1-GM');
  assert.match(
    await page.locator('.project-meta').innerText(),
    /Agroexportadora Valle Verde[\s\S]*Borrador/
  );
  // A duplicated draft is editable: choosing the other supplier changes the total.
  await tab('Productos').click();
  await tick();
  await page
    .locator('.tech-product')
    .first()
    .getByLabel('Elegir Tecnología Educativa del Sur S.A.C.')
    .check();
  await tick();
  const moved = budgetTotals(ctx, budget, { selections: { 'PRD-01': 'COT-26-005' } });
  assert.ok((await page.locator('.kpi-strip').first().innerText()).includes(money(moved.total)));
  await tab('Versiones').click();
  assert.match(await page.locator('.review-history').innerText(), /Duplicado de PR2604-0019-V1-GM/);
  await page.goto(url('jy-demo', 'budgets.html'));
  await ready();
  assert.equal(await page.locator('.tech-table tbody tr').count(), data.budgets.length + 1);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(url('jy-demo', `budget.html?id=${budget.id}&tab=productos`));
  await ready();
  await noOverflow();
  await page.setViewportSize({ width: 1440, height: 900 });
}

async function testProductsAndPrices() {
  await page.goto(url('jy-demo', 'products.html'));
  await ready();
  assert.equal(await page.locator('.sidebar-nav [data-module="products"].active').count(), 1);
  // Price search: history from quotes plus the internal reference.
  await page.getByRole('tab', { name: 'Búsqueda de precios' }).click();
  await page.locator('#price-search-input').fill('termomag');
  await page.locator('.price-search-results button').first().click();
  await tick();
  const history = page.locator('.price-history tbody tr');
  assert.equal(await history.count(), 4);
  assert.match(await history.first().innerText(), /10\/06\/2026[\s\S]*COT-26-006[\s\S]*S\/ 59\.50/);
  assert.match(
    await page.locator('.price-facts').innerText(),
    /Menor precio cotizado\s+S\/ 58\.00/
  );
  // Register a quote: it joins the history and the supplier page.
  await page.getByRole('button', { name: 'Registrar cotización' }).last().click();
  await page.locator('#quote-new-modal').waitFor({ state: 'visible' });
  await page.locator('#quote-supplier').selectOption('PROV-JY-003');
  await page.locator('#quote-price').fill('57.80');
  await page.locator('#quote-valid').fill('2026-07-30');
  await page.locator('#quote-attachment-name').fill('cotizacion-tableros-julio.pdf');
  await page.getByRole('button', { name: 'Registrar cotización' }).last().click();
  await page.locator('#quote-new-modal').waitFor({ state: 'hidden' });
  assert.equal(await history.count(), 5);
  assert.match(
    await history.first().innerText(),
    /COT-DEMO-001 · registrada en esta demostración[\s\S]*S\/ 57\.80/
  );
  // Comparator: price, lead time, brand, conditions side by side.
  await page.getByRole('tab', { name: 'Comparador' }).click();
  await page.locator('#compare-product').selectOption('PRD-01');
  await tick();
  const compare = await page.locator('.compare-table').innerText();
  assert.match(compare, /Cómputo y Redes Chachani[\s\S]*Tecnología Educativa del Sur/);
  assert.match(compare, /Precio\s+S\/ 2 890\.00\s*Menor precio\s+S\/ 3 050\.00/);
  assert.match(compare, /Plazo de entrega\s+5 días\s+3 días/);
  // Quotes list shows validity and attachment.
  await page.getByRole('tab', { name: 'Cotizaciones' }).click();
  assert.match(
    await page.locator('#quote-COT-26-002').innerText(),
    /Vencida[\s\S]*COT-26-002 Electricos Andinos\.pdf/
  );
  await screenshot('products');
  // Supplier page: known prices and quotes (with the one just registered).
  await page.goto(url('jy-demo', 'supplier.html?id=PROV-JY-003&tab=cotizaciones'));
  await ready();
  assert.match(
    await page.locator('#master-quotes-title').locator('xpath=ancestor::section').innerText(),
    /COT-DEMO-001[\s\S]*COT-26-003/
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(url('jy-demo', 'products.html?tab=comparador'));
  await ready();
  await noOverflow();
  await page.setViewportSize({ width: 1440, height: 900 });
  // OC detail shows its quote of origin and reception path.
  await page.goto(url('jy-demo', 'purchase.html?id=OC-26-002'));
  await ready();
  const facts = await page
    .locator('#purchase-information-title')
    .locator('xpath=ancestor::section')
    .innerText();
  assert.match(facts, /Cotización de origen\s+COT-26-003/);
  assert.match(facts, /Recepción\s+Material → entrada a almacén/);
}

async function testOtherPresentations() {
  for (const variant of ['surtec-peti', 'jy-pmi']) {
    await page.goto(url(variant, 'budgets.html'));
    await ready();
    assert.equal(await page.locator('[x-data="budgetTechList"]').count(), 0);
    await page.goto(url(variant, 'products.html'));
    await ready();
    assert.match(
      await page.locator('#main-content').innerText(),
      /Productos y precios no disponible/
    );
    assert.equal(await page.locator('.sidebar-nav [data-module="products"]').count(), 0);
  }
}

try {
  await testList();
  await testTechnicalBudget();
  await testDuplicateAndProducts();
  await testProductsAndPrices();
  await testOtherPresentations();
  assert.deepEqual(errors, []);
  console.log(
    'Presupuestos J&Y: partidas, APU, insumos, productos, vista cliente, versión y duplicado, precios, cotizaciones, comparador y OC con cotización de origen correctos.'
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
