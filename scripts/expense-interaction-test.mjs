import assert from 'node:assert/strict';
import http from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { getDataForVariant, getProjectFinancials } from '../src-modern/scripts/data/mock-data.js';

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
  '.json': 'application/json',
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
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});
async function ready() {
  await page.waitForFunction(() => window.AdminApp?.isInitialized);
}
async function noOverflow() {
  await page.waitForTimeout(400);
  const difference = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  assert.ok(difference <= 1, `${page.url()}: desbordamiento ${difference}px`);
  const mainLeft = await page
    .locator('.admin-main')
    .evaluate((node) => node.getBoundingClientRect().left);
  assert.ok(mainLeft <= 1, `${page.url()}: margen móvil ${mainLeft}px`);
}
async function screenshot(name) {
  if (process.env.VISUAL !== '1') return;
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(350);
  const out = path.join(root, 'tmp', 'expense-review');
  await mkdir(out, { recursive: true });
  await page.screenshot({ path: path.join(out, `${name}.png`), fullPage: true });
}

async function flow(variant, projectId) {
  const data = getDataForVariant(variant);
  const originalFinancials = getProjectFinancials(data, projectId);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(url(variant, 'expenses.html'));
  await ready();
  assert.equal(await page.locator('.sidebar-nav [data-module="expenses"]').count(), 1);
  assert.equal(
    await page.locator('.expense-table tbody tr').count(),
    data.operations.filter((item) => item.type === 'expense').length
  );
  await screenshot(`${variant}-list`);
  await page.locator('#expenses-search').fill('R-');
  assert.ok((await page.locator('.expense-table tbody tr').count()) >= 1);
  await page.getByRole('link', { name: 'Nueva rendición' }).click();
  await page.waitForURL(/expense\.html\?new=1/);
  await page.locator('#expense-project').selectOption(projectId);
  await page.getByRole('button', { name: 'Continuar a comprobantes' }).click();
  const id = await page.locator('.shell-page-heading h1').innerText();
  assert.equal(id, 'R-DEMO-001');
  assert.equal(await page.locator('#global-project-select').inputValue(), projectId);
  if (variant === 'jy-pmi') {
    await page.setViewportSize({ width: 390, height: 844 });
    await noOverflow();
    await screenshot('jy-pmi-mobile-comprobantes');
  }
  await page.getByRole('button', { name: /Factura de suministros/ }).click();
  await page.getByRole('button', { name: /Boleta de movilidad/ }).click();
  await screenshot(`${variant}-added`);
  assert.equal(await page.locator('.expense-added-list > div').count(), 2, errors.join('\n'));
  await page.getByRole('button', { name: 'Revisar datos propuestos' }).click();
  await page.locator('input[id^="value-"]').first().fill('110');
  await page.locator('#expense-undocumented-amount').fill('25');
  await page.locator('#expense-undocumented-note').fill('Movilidad de ejemplo');
  assert.ok((await page.locator('.expense-paper').first().innerText()).includes('S/ 100.00'));
  assert.ok((await page.locator('.expense-total-card').innerText()).includes('S/ 233.00'));
  if (variant === 'jy-pmi') await noOverflow();
  await screenshot(`${variant}-review`);
  await page.getByRole('link', { name: 'Abrir proyecto' }).click();
  await page.waitForURL(/project\.html\?id=/);
  assert.ok((await page.locator('.workspace-detail-heading').innerText()).includes(projectId));
  await page.goBack();
  await ready();
  await page.getByRole('button', { name: 'Enviar a revisión' }).click();
  assert.ok(
    (await page.locator('#expense-status-title').locator('..').innerText()).includes('En revisión')
  );
  await page.getByRole('button', { name: 'Simular observación' }).click();
  await page.locator('#expense-observation-note').fill('Corregir el número del comprobante');
  await page.getByRole('button', { name: 'Registrar observación' }).click();
  assert.ok((await page.locator('.expense-history').innerText()).includes('Observada'));
  await page.getByRole('button', { name: 'Corregir datos' }).click();
  await page.locator('input[id^="number-"]').first().fill('F001-000129');
  await page.locator('input[id^="igv-"]').first().fill('19');
  await page.getByRole('button', { name: 'Guardar corrección y reenviar' }).click();
  assert.ok((await page.locator('.expense-total-card').innerText()).includes('S/ 234.00'));
  await page.getByRole('button', { name: 'Simular aprobación' }).click();
  assert.ok(
    (await page.locator('#expense-status-title').locator('..').innerText()).includes('Aprobada')
  );
  const stored = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)),
    `mockup-erp:${variant}:expense-demos`
  );
  assert.equal(
    stored[0].history.map((item) => item.label).join('|'),
    'Borrador creado|Comprobante de ejemplo agregado|Comprobante de ejemplo agregado|Enviada a revisión|Observada|Corrección enviada|Aprobada'
  );
  await page.getByRole('link', { name: 'Ver relación en Costos' }).click();
  await page.waitForURL(/module-preview\.html\?module=costs/);
  assert.equal(await page.locator('.shell-preview-record--selected').count(), 1);
  assert.ok((await page.locator('.shell-preview-record--selected').innerText()).includes(id));
  assert.ok(
    (await page.locator('.alert-info:visible').innerText()).includes(
      'No se suma al costo ejecutado'
    )
  );
  await page.goBack();
  await ready();
  await page.reload();
  await ready();
  assert.ok((await page.locator('.expense-history').innerText()).includes('Corrección enviada'));
  assert.ok((await page.locator('.expense-total-card').innerText()).includes('S/ 234.00'));
  assert.deepEqual(getProjectFinancials(data, projectId), originalFinancials);
  await page.locator('.shell-header-actions [title="Cambiar tema"]').click();
  assert.equal(await page.locator('html').getAttribute('data-bs-theme'), 'dark');
  if (variant === 'surtec-peti') await screenshot('surtec-peti-dark-approved');
  await page.locator('.shell-header-actions [title="Cambiar tema"]').click();
  await page.setViewportSize({ width: 768, height: 900 });
  await noOverflow();
  await page.setViewportSize({ width: 390, height: 844 });
  await noOverflow();
  await screenshot(`${variant}-mobile-approved`);
  await page.goto(url(variant, 'expenses.html'));
  await ready();
  await noOverflow();
  await screenshot(`${variant}-mobile-list`);
  assert.ok((await page.locator('.workspace-project-cards').innerText()).includes(id));
}

try {
  await flow('surtec-peti', 'PR-2027-001');
  await page.goto(url('surtec-peti', 'expense.html?id=R-050'));
  await ready();
  await page.getByRole('link', { name: 'Crear rendición de práctica para este proyecto' }).click();
  await page.waitForURL(/expense\.html\?new=1&project=PR-2027-001/);
  assert.equal(await page.locator('#expense-project').inputValue(), 'PR-2027-001');
  await page.goto(url('surtec-peti', 'expense.html?id=R-041'));
  await ready();
  await page.getByRole('link', { name: 'Ver relación en Costos' }).click();
  await page.waitForURL(/costs\.html\?record=COST-R-041/);
  assert.match(await page.locator('#cost-operation-detail').innerText(), /R-041/);
  await flow('jy-pmi', 'PR-JY-001');
  // J&Y Demo uses the review flow since R2: expense-review-interaction-test.mjs.

  // Entrega 4: "Mis Rendiciones" is the phone entry point; desktop keeps the table.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(url('surtec-peti', 'expenses.html'));
  await ready();
  assert.ok(await page.locator('#my-expenses-title').isVisible());
  const newButton = page.locator('.my-expenses-new');
  assert.ok((await newButton.boundingBox()).height >= 48);
  assert.ok((await page.locator('.my-expenses-list li').count()) > 0);
  await newButton.click();
  await page.waitForURL(/expense\.html\?new=1/);
  await ready();
  await page.selectOption('#expense-project', 'PR-2027-001');
  await page.getByRole('button', { name: 'Continuar a comprobantes →' }).click();
  await page.getByRole('button', { name: 'Tomar foto' }).click();
  assert.equal(await page.locator('.expense-added-list > div').count(), 1);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(url('surtec-peti', 'expenses.html?responsible=PER-003'));
  await ready();
  assert.equal(await page.locator('#my-expenses-title').isVisible(), false);
  assert.match(await page.locator('.filter-chips').innerText(), /Responsable: Luis Quispe/);

  assert.equal(errors.length, 0, errors.join('\n'));
  console.log(
    'Rendiciones: Mis Rendiciones (móvil), captura simulada, filtros, propuesta editable, observación, corrección, aprobación, Costos y móvil correctos.'
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
