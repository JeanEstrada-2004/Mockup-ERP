import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import {
  getCostBySource,
  getDataForVariant,
  getProjectFinancials,
} from '../src-modern/scripts/data/mock-data.js';
import { warehouseMovements, warehouseStock } from '../src-modern/scripts/data/warehouse-data.js';

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
async function ready() {
  await page.waitForFunction(() => window.AdminApp?.isInitialized);
}
async function screenshot(name) {
  if (process.env.VISUAL !== '1') return;
  const out = path.join(root, 'tmp', 'warehouse-review');
  await mkdir(out, { recursive: true });
  await page.screenshot({ path: path.join(out, `${name}.png`), fullPage: true });
}
async function noOverflow() {
  await page.waitForTimeout(300);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  assert.ok(overflow <= 1, `${page.url()}: overflow ${overflow}px`);
}

try {
  const surtec = getDataForVariant('surtec-peti');
  const projectCost = getProjectFinancials(surtec, 'PR-2027-001');
  assert.equal(warehouseStock(surtec, 'MAT-001'), 1250);
  assert.equal(warehouseStock(surtec, 'MAT-002'), 80);
  assert.equal(warehouseMovements(surtec).length, 7);
  assert.equal(getCostBySource(surtec, 'PR-2027-001').materials, 13494);

  await page.goto(url('surtec-peti', 'warehouse.html'));
  await ready();
  assert.equal(await page.locator('.sidebar-nav [data-module="warehouse"].active').count(), 1);
  assert.equal(await page.locator('.warehouse-tabs button').count(), 6);
  const inventory = page.locator('#warehouse-inventory-title').locator('..').locator('..');
  assert.equal(await inventory.locator('table tbody tr').count(), 2);
  assert.match(
    await inventory.locator('table tbody tr').nth(0).innerText(),
    /1250.*300.*Disponible/s
  );
  assert.match(
    await inventory.locator('table tbody tr').nth(1).innerText(),
    /80.*100.*Stock bajo/s
  );
  const notices = await page.locator('.shell-notification-menu').innerText();
  assert.ok(notices.includes('Conector RJ45'));
  assert.ok(!notices.includes('Stock bajo: Cable UTP'));
  await screenshot('surtec-inventory-desktop');

  await page
    .locator('#warehouse-inventory-title')
    .locator('..')
    .locator('..')
    .getByRole('link', { name: 'Cable UTP Cat6' })
    .click();
  await page.waitForURL(/material\.html\?id=MAT-001/);
  assert.match(await page.locator('#material-stock-title').locator('..').innerText(), /1250 m/);
  assert.equal(
    await page
      .locator('#material-kardex-title')
      .locator('..')
      .locator('..')
      .locator('table tbody tr')
      .count(),
    5
  );
  assert.equal(await page.locator('.alert-warning:visible').count(), 0);
  await screenshot('surtec-material-desktop');
  await page.getByRole('link', { name: 'OC-035', exact: true }).first().click();
  await page.waitForURL(/purchase\.html\?id=OC-035/);
  assert.match(
    await page.locator('#purchase-lines-title').locator('..').locator('..').innerText(),
    /Cable UTP Cat6/
  );
  assert.match(await page.locator('body').innerText(), /Su compra no se suma al costo ejecutado/i);
  await page.getByRole('link', { name: 'Ver entrada en almacén' }).click();
  await page.waitForURL(/warehouse\.html\?tab=entradas&record=ENT-035/);
  assert.match(await page.locator('.warehouse-spotlight').innerText(), /ENT-035/);
  assert.match(await page.locator('.warehouse-spotlight').innerText(), /OC-035/);
  await page
    .locator('#warehouse-movements-title')
    .locator('..')
    .locator('..')
    .locator('table tbody tr')
    .filter({ hasText: 'ENT-035' })
    .getByRole('button', { name: 'Ver detalle' })
    .click();
  await page.locator('#warehouse-movement-modal').waitFor({ state: 'visible' });
  assert.match(await page.locator('#warehouse-movement-modal').innerText(), /REC-035/);
  await page
    .locator('#warehouse-movement-modal')
    .getByRole('button', { name: 'Cerrar' })
    .last()
    .click();
  await page.locator('#warehouse-movement-modal').waitFor({ state: 'hidden' });
  await page.locator('.warehouse-tabs').getByRole('button', { name: 'Kardex' }).click();
  assert.match(await page.locator('.warehouse-opening').innerText(), /1230 m/);
  assert.equal(
    await page
      .locator('#warehouse-movements-title')
      .locator('..')
      .locator('..')
      .locator('table tbody tr')
      .count(),
    5
  );
  await page.locator('.warehouse-tabs').getByRole('button', { name: 'Salidas' }).click();
  const issueRow = page
    .locator('#warehouse-movements-title')
    .locator('..')
    .locator('..')
    .locator('table tbody tr')
    .filter({ hasText: 'SAL-015' });
  assert.equal(await issueRow.count(), 1);
  await issueRow.getByRole('button', { name: 'Ver detalle' }).click();
  await page.locator('#warehouse-movement-modal').waitFor({ state: 'visible' });
  assert.match(await page.locator('#warehouse-movement-modal').innerText(), /13 494,00/);
  await page.locator('#warehouse-movement-modal a[href*="COST-SAL-015"]').click();
  await page.waitForURL(/costs\.html\?record=COST-SAL-015/);
  assert.match(await page.locator('#cost-operation-detail').innerText(), /SAL-015/);
  assert.equal(getProjectFinancials(surtec, 'PR-2027-001').executedCost, projectCost.executedCost);

  await page.goto(url('surtec-peti', 'material.html?id=MAT-002'));
  await ready();
  assert.equal(await page.locator('.alert-warning:visible').count(), 1);
  assert.match(await page.locator('#material-stock-title').locator('..').innerText(), /80 und/);
  await page.goto(url('surtec-peti', 'warehouse.html?tab=devoluciones'));
  await ready();
  assert.equal(
    await page
      .locator('#warehouse-movements-title')
      .locator('..')
      .locator('..')
      .locator('table tbody tr')
      .count(),
    1
  );
  assert.match(
    await page.locator('#warehouse-movements-title').locator('..').locator('..').innerText(),
    /DEV-015/
  );

  for (const width of [768, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await noOverflow();
    await page.goto(url('surtec-peti', 'warehouse.html?tab=kardex&material=MAT-001'));
    await ready();
    await noOverflow();
    if (width === 390) {
      await screenshot('surtec-kardex-mobile');
      await page
        .locator('#warehouse-movements-title')
        .locator('..')
        .locator('..')
        .locator('.warehouse-mobile-card')
        .first()
        .getByRole('button', { name: 'Ver detalle' })
        .click();
      await page.locator('#warehouse-movement-modal').waitFor({ state: 'visible' });
      await noOverflow();
      await screenshot('surtec-movement-mobile');
    }
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const variant of ['jy-pmi', 'jy-demo']) {
    await page.goto(url(variant, 'index.html'));
    await ready();
    assert.equal(await page.locator('.sidebar-nav [data-module="warehouse"]').count(), 0);
    await page.goto(url(variant, 'warehouse.html'));
    await ready();
    assert.match(await page.locator('#main-content').innerText(), /Almacén no disponible/);
    assert.equal(await page.locator('.warehouse-tabs button').count(), 0);
    await page.goto(url(variant, 'material.html?id=MAT-001'));
    await ready();
    assert.match(await page.locator('#main-content').innerText(), /Material no disponible/);
  }
  assert.deepEqual(errors, []);
  console.log(
    'Almacén: OC → recepción → entrada → Kardex → salida → proyecto/costo, alertas y variantes correctos.'
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
