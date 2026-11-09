import assert from 'node:assert/strict';
import http from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import {
  getDataForVariant,
  getDocuments,
  getProjectFinancials,
} from '../src-modern/scripts/data/mock-data.js';
import { commercialBreakdown, formatAmount } from '../src-modern/scripts/data/commercial-data.js';
import { formatMoney } from '../src-modern/scripts/components/shell.js';

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
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
    res.end(body);
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
  await ready();
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
  const out = path.join(root, 'tmp', 'commercial-review');
  await mkdir(out, { recursive: true });
  await page.screenshot({ path: path.join(out, `${name}.png`), fullPage: true });
}

async function budgetFlow(variant, budgetId) {
  const data = getDataForVariant(variant);
  const budget = data.budgets.find((item) => item.id === budgetId);
  const project = data.projects.find((item) => item.id === budget.projectId);
  const amounts = commercialBreakdown(budget.amount, 'budget');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(url(variant, 'budgets.html'));
  await ready();
  assert.equal(await page.locator('.sidebar-nav [data-module="budgets"]').count(), 1);
  await page.locator('#budgets-search').fill(budgetId);
  assert.equal(await page.locator('.commercial-table tbody tr').count(), 1);
  await screenshot(`${variant}-budgets-list`);
  await page.locator('.commercial-table tbody tr a').first().click();
  await page.waitForURL(/budget\.html\?id=/);
  assert.equal(await page.locator('.shell-page-heading h1').innerText(), budgetId);
  assert.equal(await page.locator('#global-project-select').inputValue(), project.id);
  assert.ok(
    (await page.locator('#budget-total-title').locator('..').innerText()).includes(
      formatAmount(amounts.total)
    )
  );
  assert.equal(await page.locator('.commercial-lines-table tbody tr').count(), 2);
  await screenshot(`${variant}-budget-detail`);

  await page.getByRole('link', { name: 'Documento mock' }).click();
  await page.waitForURL(/document\.html\?id=/);
  assert.equal(await page.locator('#document-facts-title').count(), 1);
  await page.goBack();
  await page.getByRole('link', { name: 'Abrir proyecto' }).click();
  await page.waitForURL(/project\.html\?id=/);
  assert.equal(await page.locator('.workspace-detail-heading h1').innerText(), project.name);
  await page.goBack();

  await page.getByRole('button', { name: 'Nueva versión' }).click();
  await page.locator('#budget-version-modal').waitFor({ state: 'visible' });
  await page.locator('#budget-version-note').fill('Revisión de alcance demostrativa');
  await page.getByRole('button', { name: 'Crear versión' }).click();
  await page.locator('#budget-version-modal').waitFor({ state: 'hidden' });
  assert.ok(
    (await page.locator('.workspace-detail-heading').innerText()).includes(`V${budget.version + 1}`)
  );
  await page.reload();
  await ready();
  assert.ok((await page.locator('.commercial-history').innerText()).includes(`V${budget.version}`));
  assert.ok(
    (await page.locator('.commercial-history').innerText()).includes(`V${budget.version + 1}`)
  );
  await page.getByRole('button', { name: 'Enviar a revisión' }).click();
  await page.getByRole('button', { name: 'Aprobar versión' }).click();
  await page.locator('#budget-approval-modal').waitFor({ state: 'visible' });
  await page.locator('#budget-approval-modal').getByRole('button', { name: 'Cancelar' }).click();
  await page.locator('#budget-approval-modal').waitFor({ state: 'hidden' });
  assert.ok((await page.locator('.workspace-detail-heading').innerText()).includes('En revisión'));
  await page.getByRole('button', { name: 'Aprobar versión' }).click();
  await page
    .locator('#budget-approval-modal')
    .getByRole('button', { name: 'Aprobar versión' })
    .click();
  await page.locator('#budget-approval-modal').waitFor({ state: 'hidden' });
  assert.ok((await page.locator('.workspace-detail-heading').innerText()).includes('Aprobado'));
  const stored = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)),
    `mockup-erp:${variant}:budget-versions`
  );
  assert.equal(stored.at(-1).version, budget.version + 1);

  await page.setViewportSize({ width: 768, height: 900 });
  await noOverflow();
  await page.setViewportSize({ width: 390, height: 844 });
  await noOverflow();
  await screenshot(`${variant}-budget-mobile`);
}

async function purchaseFlow(variant, purchaseId) {
  const data = getDataForVariant(variant);
  const purchase = data.operations.find((item) => item.id === purchaseId);
  const project = data.projects.find((item) => item.id === purchase.projectId);
  const amounts = commercialBreakdown(purchase.amount, 'purchase');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(url(variant, 'purchases.html'));
  await ready();
  await page.locator('#purchases-search').fill(purchaseId);
  assert.equal(await page.locator('.commercial-table tbody tr').count(), 1);
  await screenshot(`${variant}-purchases-list`);
  await page.locator('.commercial-table tbody tr a').first().click();
  await page.waitForURL(/purchase\.html\?id=/);
  assert.equal(await page.locator('.shell-page-heading h1').innerText(), purchaseId);
  assert.ok(
    (await page.locator('#purchase-total-title').locator('..').innerText()).includes(
      formatAmount(amounts.total)
    )
  );
  assert.equal(await page.locator('.commercial-lines-table tbody tr').count(), 2);
  assert.equal(await page.locator('#global-project-select').inputValue(), project.id);
  await screenshot(`${variant}-purchase-detail`);

  await page.getByRole('link', { name: 'Documento mock' }).click();
  await page.waitForURL(/document\.html\?id=/);
  assert.equal(await page.locator('#document-facts-title').count(), 1);
  await page.goBack();
  await page.getByRole('link', { name: 'Abrir proyecto' }).click();
  await page.waitForURL(/project\.html\?id=/);
  assert.equal(await page.locator('.workspace-detail-heading h1').innerText(), project.name);
  await page.goBack();

  const baseline = getProjectFinancials(data, project.id).executedCost;
  await page.getByRole('button', { name: 'Aprobar OC' }).click();
  await page.locator('#purchase-approval-modal').waitFor({ state: 'visible' });
  await page.locator('#purchase-approval-modal').getByRole('button', { name: 'Cancelar' }).click();
  await page.locator('#purchase-approval-modal').waitFor({ state: 'hidden' });
  assert.ok((await page.locator('.workspace-detail-heading').innerText()).includes('Pendiente'));
  await page.getByRole('button', { name: 'Aprobar OC' }).click();
  await page
    .locator('#purchase-approval-modal')
    .getByRole('button', { name: 'Confirmar aprobación' })
    .click();
  await page.locator('#purchase-approval-modal').waitFor({ state: 'hidden' });
  assert.ok((await page.locator('.workspace-detail-heading').innerText()).includes('Aprobada'));
  await page.getByRole('button', { name: 'Registrar recepción' }).click();
  await page.locator('#purchase-receipt-modal').waitFor({ state: 'visible' });
  await page
    .locator('#purchase-receipt-modal')
    .getByRole('button', { name: 'Confirmar recepción' })
    .click();
  await page.locator('#purchase-receipt-modal').waitFor({ state: 'hidden' });
  assert.ok((await page.locator('.workspace-detail-heading').innerText()).includes('Atendida'));
  assert.ok(
    (await page.locator('#purchase-balance-title').locator('..').innerText()).includes(
      formatMoney(baseline)
    )
  );
  await page.reload();
  await ready();
  assert.ok((await page.locator('.workspace-detail-heading').innerText()).includes('Pendiente'));
  assert.ok(getDocuments(data).some((item) => item.operationId === purchaseId));

  await page.setViewportSize({ width: 768, height: 900 });
  await noOverflow();
  await page.setViewportSize({ width: 390, height: 844 });
  await noOverflow();
  await screenshot(`${variant}-purchase-mobile`);
}

try {
  await budgetFlow('surtec-peti', 'PRE-001');
  await budgetFlow('jy-pmi', 'PRE-JY-001');
  await page.goto(url('jy-demo', 'budgets.html'));
  await ready();
  assert.equal(await page.locator('.sidebar-nav [data-module="budgets"]').count(), 0);
  assert.ok((await page.locator('main').innerText()).includes('Módulo no incluido'));
  await purchaseFlow('surtec-peti', 'OC-033');
  await page.goto(url('surtec-peti', 'purchase.html?id=OC-201'));
  await ready();
  assert.equal(await page.locator('.commercial-budget-alert.alert-warning:visible').count(), 1);
  await purchaseFlow('jy-pmi', 'OC-JY-003');
  await purchaseFlow('jy-demo', 'OC-JY-003');
  assert.equal(errors.length, 0, errors.join('\n'));
  console.log('Presupuestos, versiones, OC, modales, enlaces y variantes: correctos.');
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
