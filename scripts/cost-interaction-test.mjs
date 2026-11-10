import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { getDataForVariant, getProjectFinancials } from '../src-modern/scripts/data/mock-data.js';
import { projectCostModel } from '../src-modern/scripts/data/cost-data.js';

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
  const out = path.join(root, 'tmp', 'cost-review');
  await mkdir(out, { recursive: true });
  await page.screenshot({ path: path.join(out, `${name}.png`), fullPage: true });
}
async function noOverflow() {
  await page.waitForTimeout(300);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  assert.ok(overflow <= 1, `${page.url()}: overflow ${overflow}px`);
}
async function checkVariant(variant, projectId) {
  const data = getDataForVariant(variant);
  const financials = getProjectFinancials(data, projectId);
  const model = projectCostModel(data, projectId);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(url(variant, `project.html?id=${projectId}`));
  await ready();
  assert.ok(
    (await page.locator('body').innerText()).includes(
      `S/ ${financials.executedCost.toLocaleString('en-US').replaceAll(',', ' ')}`
    )
  );
  await page.getByRole('link', { name: /Ver costos/ }).click();
  await page.waitForURL(/costs\.html\?project=/);
  await ready();
  assert.equal(await page.locator('.sidebar-nav [data-module="costs"].active').count(), 1);
  assert.equal(await page.locator('#costs-project').inputValue(), projectId);
  const kpis = await page.locator('.costs-kpis').innerText();
  for (const value of [
    financials.budgetAmount,
    financials.committedCost,
    financials.executedCost,
    financials.availableAgainstExecuted,
  ]) {
    assert.ok(
      kpis.includes(
        `S/ ${Math.round(value)
          .toString()
          .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}`
      )
    );
  }
  assert.ok(kpis.includes(`${financials.executionPercent} %`));
  await page.locator('#cost-budget-chart .chart-svg rect').first().waitFor();
  assert.equal(await page.locator('.costs-source-row').count(), 5);
  assert.equal(
    await page.locator('.costs-source-total').innerText(),
    `Total de fuentes\nS/ ${Math.round(financials.executedCost)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}`
  );
  assert.equal(
    model.sources.reduce((sum, item) => sum + item.amount, 0),
    financials.executedCost
  );
  assert.equal(
    model.entries.reduce((sum, item) => sum + item.amount, 0),
    financials.executedCost
  );
  await screenshot(`${variant}-costs-desktop`);
  await page.locator('.costs-source-row').filter({ hasText: 'Compras' }).click();
  assert.equal(await page.locator('#cost-operations-title').innerText(), 'Operaciones de Compras');
  assert.equal(
    await page
      .locator('#cost-operations-title')
      .locator('xpath=ancestor::section')
      .locator('table tbody tr')
      .count(),
    model.sources.find((item) => item.id === 'purchases').count
  );
  await page
    .locator('#cost-operations-title')
    .locator('xpath=ancestor::section')
    .locator('table tbody tr')
    .first()
    .getByRole('button', { name: /OC-/ })
    .click();
  await page.locator('#cost-operation-detail').waitFor({ state: 'visible' });
  const operationId = await page.locator('#cost-operation-title').innerText();
  await page
    .locator('#cost-operation-detail')
    .getByRole('link', { name: 'Abrir documento mock' })
    .click();
  await page.waitForURL(/document\.html\?.*id=/);
  assert.equal(await page.locator('#document-facts-title').count(), 1);
  assert.match(
    await page.locator('#document-facts-title').locator('xpath=ancestor::section').innerText(),
    new RegExp(operationId)
  );
  await page.getByRole('link', { name: 'Volver a Costos' }).click();
  await page.waitForURL(/costs\.html\?project=.*&source=purchases&operation=/);
  assert.equal(await page.locator('#cost-operation-title').innerText(), operationId);
  await page
    .locator('#cost-operation-detail')
    .getByRole('link', { name: 'Abrir operación de origen' })
    .click();
  await page.waitForURL(/purchase\.html\?id=.*&from=costs/);
  await page.getByRole('link', { name: 'Volver a Costos' }).click();
  await page.waitForURL(/costs\.html\?project=.*&source=purchases&operation=/);
  assert.equal(await page.locator('#cost-operation-title').innerText(), operationId);
  await page
    .locator('#cost-operation-detail')
    .getByRole('button', { name: 'Volver a la fuente' })
    .click();
  await page.locator('#cost-operation-detail').waitFor({ state: 'hidden' });
  await page.getByRole('button', { name: 'Ver todas' }).click();
  assert.equal(
    await page
      .locator('#cost-operations-title')
      .locator('xpath=ancestor::section')
      .locator('table tbody tr')
      .count(),
    model.entries.length
  );
  if (variant !== 'jy-demo') {
    await page.goto(
      url(
        variant,
        variant === 'surtec-peti'
          ? `reports.html?tab=bi&project=${projectId}`
          : `reports.html?report=costs&project=${projectId}`
      )
    );
    await ready();
    const report = await page.locator('#main-content').innerText();
    assert.ok(report.includes(projectId));
    if (variant === 'surtec-peti')
      assert.ok(
        report.includes(
          `S/ ${Math.round(financials.executedCost)
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}`
        )
      );
  }
  await page.goto(url(variant, 'index.html'));
  await ready();
  await page.locator('#dashboard-flow .chart-svg').waitFor();
  assert.ok((await page.locator('#dashboard-flow-title').innerText()).includes(projectId));
  const dashboard = await page.locator('#dashboard-flow').innerText();
  assert.ok(
    dashboard.includes(
      `S/ ${Math.round(financials.executedCost)
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}`
    )
  );
}

try {
  await checkVariant('surtec-peti', 'PR-2027-001');
  const surtec = getDataForVariant('surtec-peti');
  const source = projectCostModel(surtec, 'PR-2027-001');
  assert.deepEqual(
    source.sources.map((item) => item.amount),
    [47230, 30362, 15743, 13494, 5621]
  );
  assert.deepEqual(source.financials, {
    projectId: 'PR-2027-001',
    budgetAmount: 185000,
    executedCost: 112450,
    outstandingCommitments: 16250,
    committedCost: 128700,
    availableAgainstExecuted: 72550,
    availableToCommit: 56300,
    executionPercent: 60.8,
  });
  await page.goto(url('surtec-peti', 'costs.html?project=PR-2027-002'));
  await ready();
  assert.match(await page.locator('.costs-alerts').innerText(), /85.9 %/);
  await page.locator('#costs-project').selectOption('PR-2027-001');
  assert.equal(await page.locator('#costs-project').inputValue(), 'PR-2027-001');
  assert.match(await page.locator('.costs-kpis').innerText(), /112 450/);
  assert.match(page.url(), /project=PR-2027-001/);
  await page.locator('#costs-project').selectOption('PR-2027-002');
  assert.match(await page.locator('.costs-kpis').innerText(), /82 500/);
  await page.setViewportSize({ width: 768, height: 900 });
  await noOverflow();
  await page.setViewportSize({ width: 390, height: 844 });
  await noOverflow();
  await screenshot('surtec-costs-mobile');
  await page
    .locator('.costs-mobile-card')
    .first()
    .getByRole('button', { name: 'Ver trazabilidad' })
    .click();
  await page.locator('#cost-operation-detail').waitFor({ state: 'visible' });
  await noOverflow();
  await screenshot('surtec-cost-detail-mobile');
  await page.getByRole('button', { name: 'Activar modo oscuro' }).click();
  await page.waitForTimeout(300);
  assert.equal(await page.locator('html').getAttribute('data-bs-theme'), 'dark');
  await page.locator('#cost-budget-chart .chart-svg rect').first().waitFor();
  await checkVariant('jy-pmi', 'PR-JY-001');
  await checkVariant('jy-demo', 'PR-JY-001');
  assert.deepEqual(errors, []);
  console.log(
    'Costos: cifras, fuentes, compromisos, Proyecto → operación → documento, BI y móvil correctos.'
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
