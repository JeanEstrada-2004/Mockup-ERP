// R6: closing journey for J&Y Demo, with unchanged PETI/PMI boundaries.
import assert from 'node:assert/strict';
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import {
  getCostBySource,
  getDataForVariant,
  getPortfolioFinancials,
} from '../src-modern/scripts/data/mock-data.js';
import { warehouseMovements, warehouseStock } from '../src-modern/scripts/data/warehouse-data.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const serveDir = path.join(root, 'dist-pages');
const pagesBase = process.env.PAGES_BASE || '/Mockup-ERP/';
assert.ok(pagesBase.startsWith('/') && pagesBase.endsWith('/'));
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
page.on('response', (response) => {
  if (response.status() >= 400) errors.push(`HTTP ${response.status()}: ${response.url()}`);
});
const ready = () => page.waitForFunction(() => window.AdminApp?.isInitialized);
const money = (value) => `S/ ${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}`;
async function open(variant, name) {
  await page.goto(url(variant, name));
  try {
    await ready();
  } catch (error) {
    throw new Error(`${variant}/${name}: ${errors.join('; ')}`, { cause: error });
  }
}
async function noOverflow() {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  assert.ok(overflow <= 1, `${page.url()}: desborde ${overflow}px`);
}
try {
  const data = getDataForVariant('jy-demo');
  assert.equal(data.warehouses.length, 1);
  assert.equal(warehouseStock(data, 'MAT-01'), 85);
  assert.deepEqual(
    warehouseMovements(data).map((item) => item.balance),
    [150, 80, 90, 85]
  );
  assert.equal(getCostBySource(data, 'PY-26-002').materials, 135);
  assert.equal(getPortfolioFinancials(data).executedCost, 133643);
  assert.equal(data.operations.find((item) => item.id === 'OC-26-005').costSource, null);

  await open('jy-demo', 'warehouse.html');
  assert.equal(await page.locator('.warehouse-workspace .d9-tabs [role="tab"]').count(), 3);
  assert.equal(
    await page.locator('.warehouse-workspace .d9-tabs').getByText('Almacenes').count(),
    0
  );
  assert.match(
    await page.locator('.warehouse-workspace').innerText(),
    /Un almacén|Almacén principal/
  );
  await page.locator('.warehouse-workspace .d9-tabs').getByRole('tab', { name: 'Kardex' }).click();
  assert.match(
    await page.locator('[aria-label="Kardex"]').innerText(),
    /ENT-26-005[\s\S]*SAL-26-001[\s\S]*DEV-26-001[\s\S]*AJM-26-001/
  );
  await page
    .locator('[aria-label="Kardex"]')
    .getByRole('link', { name: 'SAL-26-001', exact: true })
    .click();
  await ready();
  assert.match(
    await page.locator('[aria-label="Detalle del movimiento"]').innerText(),
    /S\/ 135\.00/
  );
  await page
    .locator('[aria-label="Detalle del movimiento"] a')
    .filter({ hasText: 'OC-26-005' })
    .click();
  await ready();
  assert.match(await page.locator('#main-content').innerText(), /OC-26-005/);

  await open('jy-demo', 'payments.html');
  assert.match(await page.locator('#main-content').innerText(), /Proceso en levantamiento/);
  assert.match(
    await page.locator('#main-content').innerText(),
    /BCP[\s\S]*pagos parciales[\s\S]*Propuesta TO-BE/i
  );
  assert.doesNotMatch(
    await page.locator('#main-content').innerText(),
    /Pago realizado|Transacción aprobada|MFA Activado/
  );

  await open('jy-demo', 'reports.html');
  assert.equal(await page.locator('.reports-catalog-card').count(), 13);
  assert.equal(await page.locator('.analytics-link:visible').count(), 0);
  for (let index = 0; index < 13; index += 1) {
    const card = page.locator('.reports-catalog-card').nth(index);
    const label = await card.locator('strong').innerText();
    await card.click();
    const rows = await page
      .locator('#reports-result-title')
      .locator('xpath=ancestor::section[1]')
      .locator('table tbody tr')
      .count();
    assert.ok(rows > 0, `${label}: sin registros de ejemplo`);
  }
  await page.locator('.reports-catalog-card').filter({ hasText: 'Costos por fuente' }).click();
  await page.locator('#reports-project').selectOption('PY-26-002');
  assert.match(
    await page.locator('#reports-result-title').locator('xpath=ancestor::section[1]').innerText(),
    /Materiales[\s\S]*S\/ 135\.00/
  );
  await page.getByRole('button', { name: /Exportar/ }).click();
  assert.match(await page.locator('.toast').first().innerText(), /simulado/i);
  await open('jy-demo', 'analytics.html');
  assert.match(await page.locator('#main-content').innerText(), /no disponible/i);

  await open('jy-demo', 'security.html');
  await page.locator('[aria-label="Matriz de permisos conceptual"] tbody tr').first().waitFor();
  assert.equal(
    await page.locator('[aria-label="Matriz de permisos conceptual"] tbody tr').count(),
    7
  );
  assert.match(await page.locator('#main-content').innerText(), /Borrador · por validar/);
  await page
    .locator('.security-workspace .d9-tabs')
    .getByRole('tab', { name: 'Auditoría' })
    .click();
  const audit = await page.locator('[aria-label="Auditoría transversal"]').innerText();
  for (const label of [
    'Rendición',
    'Presupuesto',
    'Cliente',
    'Proveedor',
    'Planilla',
    'Tareo',
    'Incidencia',
  ])
    assert.ok(
      audit.includes(label) ||
        (await page
          .locator('#security-jy-source option')
          .allTextContents()
          .then((items) => items.includes(label))),
      label
    );
  await page
    .locator('.security-workspace .d9-tabs')
    .getByRole('tab', { name: 'Controles propuestos' })
    .click();
  assert.match(
    await page.locator('[aria-label="Controles por validar"]').innerText(),
    /No está activada[\s\S]*No hay backup\s+ejecutado/
  );

  await open('jy-demo', 'settings.html');
  assert.match(
    await page.locator('[aria-label="Empresa y datos maestros"]').innerText(),
    /Por completar con la empresa/
  );
  for (const target of ['clients.html', 'suppliers.html', 'products.html'])
    assert.ok(
      await page.locator(`[aria-label="Empresa y datos maestros"] a[href="./${target}"]`).count()
    );
  await page
    .locator('.administration-workspace .d9-tabs')
    .getByRole('tab', { name: 'Catálogos' })
    .click();
  assert.match(
    await page.locator('[aria-label="Catálogos configurables"]').innerText(),
    /Alimentación[\s\S]*Factura electrónica[\s\S]*PEN/
  );
  await page
    .locator('.administration-workspace .d9-tabs')
    .getByRole('tab', { name: 'Parámetros' })
    .click();
  const parameters = await page.locator('[aria-label="Parámetros por validar"]').innerText();
  assert.match(
    parameters,
    /Gastos generales por defecto[\s\S]*Por validar[\s\S]*Utilidad por defecto/
  );
  assert.doesNotMatch(parameters, /80 %|reparto referencial/i);

  await open('jy-demo', 'index.html');
  await page.locator('.shell-user-button').click();
  await page.getByRole('button', { name: 'Recorridos de demostración' }).click();
  await page.locator('#demo-tours-modal').waitFor({ state: 'visible' });
  assert.equal(await page.locator('.demo-tour').count(), 6);
  const hrefs = await page
    .locator('.demo-tour-steps a')
    .evaluateAll((links) => links.map((item) => item.href));
  for (const href of new Set(hrefs))
    assert.equal((await page.request.get(href)).status(), 200, href);
  await page.keyboard.press('Escape');

  for (const name of [
    'warehouse.html',
    'payments.html',
    'reports.html',
    'security.html',
    'settings.html',
  ]) {
    await page.setViewportSize({ width: 390, height: 844 });
    await open('jy-demo', name);
    await noOverflow();
    await page.setViewportSize({ width: 1440, height: 900 });
    await noOverflow();
  }
  await page.getByRole('button', { name: 'Activar modo oscuro' }).click();
  assert.equal(await page.locator('html').getAttribute('data-bs-theme'), 'dark');

  for (const variant of ['surtec-peti', 'jy-pmi']) {
    await open(variant, 'payments.html');
    assert.match(await page.locator('#main-content').innerText(), /Pagos no disponible/);
    assert.equal(await page.locator('.sidebar-nav [data-module="payments"]').count(), 0);
  }
  await open('jy-pmi', 'warehouse.html');
  assert.match(await page.locator('#main-content').innerText(), /Almacén no disponible/);
  await open('surtec-peti', 'warehouse.html');
  assert.equal(await page.locator('.warehouse-tabs button').count(), 7);
  await open('jy-pmi', 'reports.html');
  assert.equal(await page.locator('.reports-catalog-card').count(), 7);
  await open('surtec-peti', 'security.html');
  assert.equal(await page.locator('.d9-tabs button').count(), 7);
  assert.deepEqual(errors, []);
  console.log(
    `R6: almacén, pagos, 13 reportes, seguridad, administración y seis recorridos; costo ${money(135)}; PETI/PMI conservados.`
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
