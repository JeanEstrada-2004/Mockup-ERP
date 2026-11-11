// R1 (docs/realineamiento-jy-demo.md): Clientes y Proveedores in the three
// builds, J&Y Demo's own data set and the maturity badges of the Demo.
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { getDataForVariant } from '../src-modern/scripts/data/mock-data.js';
import { clientRelations, supplierRelations } from '../src-modern/scripts/data/master-data.js';

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
  '.jpg': 'image/jpeg',
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
async function noOverflow() {
  await page.waitForTimeout(200);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  assert.ok(overflow <= 1, `${page.url()}: overflow ${overflow}px`);
}
async function screenshot(name) {
  if (process.env.VISUAL !== '1') return;
  const out = path.join(root, 'tmp', 'masters-review');
  await mkdir(out, { recursive: true });
  await page.screenshot({ path: path.join(out, `${name}.png`), fullPage: true });
}
const rows = () => page.locator('.master-table tbody tr');

async function testClients(variant) {
  const data = getDataForVariant(variant);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(url(variant, 'clients.html'));
  await ready();
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await ready();
  assert.equal(await page.locator('.sidebar-nav [data-module="clients"].active').count(), 1);
  assert.equal(await rows().count(), data.clients.length);

  // Filters: search by RUC and status, kept in the URL.
  const first = data.clients[0];
  await page.locator('#master-search').fill(first.ruc);
  assert.equal(await rows().count(), 1);
  assert.match(page.url(), new RegExp(`search=${first.ruc}`));
  await page.locator('#master-search').fill('sin resultados xyz');
  await page.locator('.d9-empty:visible').waitFor();
  await page.getByRole('button', { name: 'Ver todos' }).click();
  assert.equal(await rows().count(), data.clients.length);

  // New client: RUC validation, then a local record that opens its own page.
  await page.getByRole('button', { name: '+ Nuevo cliente' }).click();
  await page.locator('#master-form-modal').waitFor({ state: 'visible' });
  await page.locator('#master-name').fill('Servicios Generales de Prueba S.A.C.');
  await page.locator('#master-ruc').fill('123');
  await page.getByRole('button', { name: 'Registrar cliente' }).click();
  assert.match(await page.locator('#master-form-modal .alert-danger').innerText(), /11 dígitos/);
  await page.locator('#master-ruc').fill(first.ruc);
  await page.getByRole('button', { name: 'Registrar cliente' }).click();
  assert.match(
    await page.locator('#master-form-modal .alert-danger').innerText(),
    /ya está registrado/
  );
  await page.locator('#master-ruc').fill('20699999901');
  await page.locator('#master-sector').fill('Servicios');
  await page.locator('#master-contact-name').fill('Ana Prueba');
  await page.getByRole('button', { name: 'Registrar cliente' }).click();
  await page.locator('#master-form-modal').waitFor({ state: 'hidden' });
  assert.equal(await rows().count(), data.clients.length + 1);
  const created = rows().filter({ hasText: 'Servicios Generales de Prueba' });
  assert.match(await created.innerText(), /Demostración/);
  await created.getByRole('link').click();
  await page.waitForURL(/client\.html\?id=CLI-DEMO-001/);
  await ready();
  assert.equal(await page.locator('h1').innerText(), 'Servicios Generales de Prueba S.A.C.');

  // Base record: projects, budgets and history; editing keeps RUC and name.
  const relations = clientRelations(data, first.id);
  await page.goto(url(variant, `client.html?id=${first.id}`));
  await ready();
  assert.equal(await page.locator('h1').innerText(), first.name);
  await page.locator('.kpi-value').first().waitFor();
  await page.waitForTimeout(900);
  assert.equal(
    await page.locator('.kpi-value').first().innerText(),
    String(relations.projects.length)
  );
  await page
    .locator('.d9-tabs')
    .getByRole('tab', { name: /Proyectos/ })
    .click();
  await page.locator('#master-projects-title').waitFor();
  assert.match(page.url(), /tab=proyectos/);
  const projectsPanel = page.locator('#master-projects-title').locator('xpath=ancestor::section');
  assert.equal(await projectsPanel.locator('tbody tr').count(), relations.projects.length);
  await page
    .locator('.d9-tabs')
    .getByRole('tab', { name: /Presupuestos/ })
    .click();
  await page.locator('#master-budgets-title').waitFor();
  assert.match(
    await page.locator('#main-content').innerText(),
    new RegExp(relations.budgets[0].id)
  );
  await page.getByRole('button', { name: 'Editar' }).first().click();
  await page.locator('#master-form-modal').waitFor({ state: 'visible' });
  assert.equal(await page.locator('#master-ruc').isEditable(), false);
  await page.locator('#master-phone').fill('(054) 999 000');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await page.locator('#master-form-modal').waitFor({ state: 'hidden' });
  await page
    .locator('.d9-tabs')
    .getByRole('tab', { name: /Historial/ })
    .click();
  await page.locator('#master-history-title').waitFor();
  assert.match(
    await page.locator('.d9-history').innerText(),
    /Modificó la ficha[\s\S]*en esta demostración[\s\S]*Teléfono/
  );
  await page
    .locator('.d9-tabs')
    .getByRole('tab', { name: /General/ })
    .click();
  await page.locator('#master-general-title').waitFor();
  assert.match(await page.locator('.d9-facts').innerText(), /\(054\) 999 000/);

  // Project → client page.
  const project = relations.projects[0];
  await page.goto(url(variant, `project.html?id=${project.id}`));
  await ready();
  await page.getByRole('link', { name: first.name }).first().click();
  await page.waitForURL(new RegExp(`client\\.html\\?id=${first.id}`));

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(url(variant, 'clients.html'));
  await ready();
  assert.ok((await page.locator('.d9-mobile-card').count()) >= data.clients.length);
  await noOverflow();
  await screenshot(`${variant}-clients-mobile`);
  await page.goto(url(variant, `client.html?id=${first.id}`));
  await ready();
  await noOverflow();
}

async function testSuppliers(variant) {
  const data = getDataForVariant(variant);
  const supplier = data.suppliers[0];
  const relations = supplierRelations(data, supplier.id);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(url(variant, 'suppliers.html'));
  await ready();
  assert.equal(await rows().count(), data.suppliers.length);
  const category = supplier.categories[0];
  await page.locator('#master-group').selectOption(category);
  assert.equal(
    await rows().count(),
    data.suppliers.filter((item) => item.categories.includes(category)).length
  );
  await page.getByRole('button', { name: 'Limpiar' }).click();
  await rows().filter({ hasText: supplier.name }).getByRole('link').click();
  await page.waitForURL(new RegExp(`supplier\\.html\\?id=${supplier.id}`));
  await ready();
  await page
    .locator('.d9-tabs')
    .getByRole('tab', { name: /Órdenes de compra/ })
    .click();
  await page.locator('#master-purchases-title').waitFor();
  const purchasesPanel = page.locator('#master-purchases-title').locator('xpath=ancestor::section');
  assert.equal(await purchasesPanel.locator('tbody tr').count(), relations.purchases.length);
  const purchase = relations.purchases[0];
  await purchasesPanel.getByRole('link', { name: purchase.id }).click();
  await page.waitForURL(new RegExp(`purchase\\.html\\?id=${purchase.id}`));
  await ready();
  // OC → supplier page closes the loop.
  await page.getByRole('link', { name: supplier.name }).first().click();
  await page.waitForURL(new RegExp(`supplier\\.html\\?id=${supplier.id}`));
  await ready();
  await page
    .locator('.d9-tabs')
    .getByRole('tab', { name: /Productos y servicios/ })
    .click();
  await page.locator('#master-offerings-title').waitFor();
  const offeringsPanel = page.locator('#master-offerings-title').locator('xpath=ancestor::section');
  assert.equal(await offeringsPanel.locator('tbody tr').count(), supplier.offerings.length);

  // Global search opens the supplier page.
  await page.locator('#global-search').fill(supplier.name.slice(0, 12));
  await page.locator('.shell-search-result').first().waitFor();
  assert.match(
    await page.locator('.shell-search-results').innerText(),
    new RegExp(supplier.name.slice(0, 12))
  );

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(url(variant, 'suppliers.html'));
  await ready();
  await noOverflow();
  await screenshot(`${variant}-suppliers-mobile`);
}

async function testDemoMaturity() {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(url('jy-demo', 'suppliers.html'));
  await ready();
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await ready();
  // Hidden by default; the user menu (or Alt+Shift+V) shows them.
  assert.ok((await page.locator('.maturity').count()) >= 1);
  assert.equal(await page.locator('.maturity:visible').count(), 0);
  await page.locator('.shell-user-button').click();
  await page.locator('[data-maturity-toggle]').click();
  assert.equal(await page.locator('[data-maturity-toggle]').getAttribute('aria-pressed'), 'true');
  assert.match(await page.locator('.maturity:visible').first().innerText(), /Propuesta TO-BE/);
  await page.goto(url('jy-demo', 'purchases.html'));
  await ready();
  assert.match(await page.locator('.maturity:visible').first().innerText(), /Por validar/);
  await page.keyboard.press('Alt+Shift+V');
  assert.equal(await page.locator('.maturity:visible').count(), 0);
  await screenshot('jy-demo-maturity');
  // Other presentations never render the badges nor the menu item.
  for (const variant of ['surtec-peti', 'jy-pmi']) {
    await page.goto(url(variant, 'purchases.html'));
    await ready();
    assert.equal(await page.locator('.maturity').count(), 0);
    assert.equal(await page.locator('[data-maturity-toggle]').count(), 0);
  }
  // J&Y Demo no longer mirrors PMI: own projects, PY codes and 2026 dates.
  await page.goto(url('jy-demo', 'projects.html'));
  await ready();
  const demo = getDataForVariant('jy-demo');
  for (const project of demo.projects) {
    assert.match(await page.locator('#main-content').innerText(), new RegExp(project.id));
  }
  assert.doesNotMatch(await page.locator('#main-content').innerText(), /PR-JY-001/);
  assert.equal(
    await page.locator('.sidebar-nav [data-module="purchases"] span').first().innerText(),
    'Compras / OC'
  );
}

try {
  for (const variant of ['surtec-peti', 'jy-pmi', 'jy-demo']) {
    await testClients(variant);
    await testSuppliers(variant);
  }
  await testDemoMaturity();
  assert.deepEqual(errors, []);
  console.log(
    'Maestros: clientes y proveedores (lista, filtros, alta, edición, ficha, relaciones, móvil) y madurez del Demo correctos.'
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
