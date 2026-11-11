// R2 (docs/realineamiento-jy-demo.md): rendiciones of J&Y Demo — numbering per
// worker and year, spender / preparer / reviewer, evidence viewer, OCR proposal
// corrected by a person, expense without document, administrative review
// (observe → correct → accept → hand to Contabilidad) and history. SurTec and
// PMI keep the approval flow.
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { getDataForVariant, getPortfolioFinancials } from '../src-modern/scripts/data/mock-data.js';
import { reportNumber, reportTotals } from '../src-modern/scripts/data/expense-reports.js';

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
// Accept SweetAlert confirmations.
const confirm = async () => {
  await page.locator('.swal2-confirm').click();
  await page.locator('.swal2-container').waitFor({ state: 'detached' });
};
const ready = () => page.waitForFunction(() => window.AdminApp?.isInitialized);
const tick = () => page.waitForTimeout(150);
async function noOverflow() {
  await page.waitForTimeout(200);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  assert.ok(overflow <= 1, `${page.url()}: overflow ${overflow}px`);
}
async function screenshot(name) {
  if (process.env.VISUAL !== '1') return;
  const out = path.join(root, 'tmp', 'expense-review-r2');
  await mkdir(out, { recursive: true });
  await page.screenshot({ path: path.join(out, `${name}.png`), fullPage: true });
}
const status = () => page.locator('.workspace-detail-heading .badge').first().innerText();
const history = () => page.locator('.review-history').innerText();
const approvalsCount = () => page.locator('.shell-nav-count[data-approvals-count]').innerText();

const data = getDataForVariant('jy-demo');
const baseExecuted = getPortfolioFinancials(data).executedCost;

async function testList() {
  await page.goto(url('jy-demo', 'expenses.html'));
  await ready();
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await ready();
  const rows = page.locator('.expense-table tbody tr');
  assert.equal(await rows.count(), data.expenseReports.length);
  // Numbering per worker and year; spender and preparer shown apart.
  const text = await page.locator('.expense-table').innerText();
  for (const report of data.expenseReports)
    assert.match(text, new RegExp(reportNumber(report).replace('.', '\\.')));
  assert.match(text, /Preparó: Rosa Huamán/);
  assert.doesNotMatch(text, /R-26-00\d/);
  // Pending first; KPI "Por revisar" filters.
  assert.match(await rows.first().innerText(), /Presentada|Corregida/);
  await page.locator('.kpi--button').filter({ hasText: 'Por revisar' }).click();
  assert.equal(
    await rows.count(),
    data.expenseReports.filter((item) => item.status === 'Presentada').length
  );
  await page.getByRole('button', { name: 'Limpiar' }).click();
  await page.locator('#expenses-worker').selectOption('PER-JY-002');
  assert.equal(await rows.count(), 2);
  assert.match(page.url(), /worker=PER-JY-002/);
  await page.getByRole('button', { name: 'Limpiar' }).click();
  await screenshot('list');
}

async function testReview() {
  const report = data.expenseReports.find((item) => item.id === 'R-26-003');
  await page.goto(url('jy-demo', `expense.html?id=${report.id}`));
  await ready();
  assert.equal(await page.locator('h1').innerText(), `Rendición ${reportNumber(report)}`);
  assert.equal(await status(), 'Presentada');
  assert.equal(await approvalsCount(), '7'); // every pending task (R3), budgets included (R4)
  const facts = await page.locator('.review-facts').first().innerText();
  assert.match(facts, /Responsable del gasto\s+Luis Condori/);
  assert.match(facts, /Preparada por\s+Rosa Huamán/);
  const totals = reportTotals(report);
  const totalCard = await page
    .locator('#review-totals-title')
    .locator('xpath=ancestor::section')
    .innerText();
  assert.match(totalCard, /S\/ 340\.00/);
  assert.match(totalCard, new RegExp(`No documentado\\s+S/ ${totals.undocumented.toFixed(2)}`));
  assert.equal(await page.locator('.review-table tbody tr').count(), report.items.length);
  assert.ok(await page.getByRole('button', { name: 'Aceptar rendición' }).isDisabled());

  // Expense 2: OCR misread the total; the registered value was corrected by a person.
  await page.getByRole('button', { name: 'Ver gasto 2' }).click();
  await tick();
  assert.match(await page.locator('.ev-doc').innerText(), /FACTURA ELECTRÓNICA[\s\S]*S\/ 129\.80/);
  const ocr = page.locator('.review-ocr-table');
  assert.match(
    await ocr.locator('tr', { hasText: 'Total' }).innerText(),
    /S\/ 129\.00\s*confianza baja\s*S\/ 129\.80\s*Corregido por una persona/
  );
  assert.doesNotMatch(await ocr.locator('tr', { hasText: 'RUC' }).innerText(), /Corregido/);
  // Zoom and full view of the evidence.
  await page.getByRole('button', { name: 'Acercar' }).click();
  assert.equal(await page.locator('.evidence-zoom-value').innerText(), '125 %');
  await page.getByRole('button', { name: 'Vista ampliada' }).click();
  assert.ok(await page.locator('.evidence-stage.is-full').isVisible());
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('.evidence-stage.is-full').count(), 0);
  await screenshot('review-item');

  // Item 5: expense without document is flagged, never turned into a receipt.
  await page.getByRole('button', { name: 'Ver gasto 5' }).click();
  await tick();
  assert.match(await page.locator('.ev-doc--none').innerText(), /NO DOCUMENTADO/);
  assert.match(
    await page.locator('.review-data').first().innerText(),
    /Motivo\s+Comedor rural sin comprobante/
  );

  // Review: four items conforme, item 4 observed, report observed.
  for (const index of [1, 2, 3, 5]) {
    await page.getByRole('button', { name: `Ver gasto ${index}` }).click();
    await tick();
    await page.getByRole('button', { name: 'Conforme', exact: true }).click();
    await tick();
  }
  await page.getByRole('button', { name: 'Ver gasto 4' }).click();
  await tick();
  await page.getByRole('button', { name: 'Observar gasto' }).click();
  await page
    .locator('#review-item-note')
    .fill('El RUC del hostal no se lee; confirmar con la factura.');
  await page.getByRole('button', { name: 'Registrar observación del gasto' }).click();
  await tick();
  assert.match(await page.locator('.review-table tbody tr').nth(3).innerText(), /Observado/);
  await page.getByRole('button', { name: 'Observar', exact: true }).click();
  await page.locator('#review-observe-note').fill('Revisar el ítem 4.');
  await page.getByRole('button', { name: 'Registrar observación', exact: true }).click();
  await tick();
  assert.equal(await status(), 'Observada');
  assert.match(await history(), /Observada[\s\S]*Gastos observados: Ítem 4/);
  assert.equal(await approvalsCount(), '7'); // moved from 'por revisar' to 'observadas'

  // Correction: only the observed expense is edited, then presented again.
  assert.ok(await page.getByRole('button', { name: 'Presentar corrección' }).isDisabled());
  await page.getByRole('button', { name: 'Editar gasto' }).click();
  await page.locator('#draft-ruc').fill('20610000311');
  await page.getByRole('button', { name: 'Guardar gasto' }).click();
  await tick();
  assert.match(await page.locator('.review-table tbody tr').nth(3).innerText(), /Corregido/);
  await page.getByRole('button', { name: 'Presentar corrección' }).click();
  await tick();
  assert.equal(await status(), 'Corregida');
  assert.equal(await approvalsCount(), '7');

  // Administrative fix of a small error, then accept and hand to Contabilidad.
  await page.getByRole('button', { name: 'Ver gasto 4' }).click();
  await tick();
  await page.getByRole('button', { name: 'Corregir dato' }).click();
  await page.locator('#draft-description').fill('Hospedaje 2 noches (cuadrilla)');
  await page.getByRole('button', { name: 'Guardar gasto' }).click();
  await tick();
  assert.match(await history(), /Corrección administrativa del ítem 4[\s\S]*Descripción/);
  assert.ok(!(await page.getByRole('button', { name: 'Aceptar rendición' }).isDisabled()));
  await page.getByRole('button', { name: 'Aceptar rendición' }).click();
  await confirm();
  assert.equal(await status(), 'Aceptada');
  await page.getByRole('button', { name: 'Entregar a Contabilidad' }).click();
  await tick();
  assert.equal(await status(), 'Entregada a Contabilidad');
  assert.equal(await approvalsCount(), '6'); // delivered: no task left for it
  const log = await history();
  for (const step of [
    'Entregada a Contabilidad',
    'Aceptada',
    'Corregida',
    'Corrigió el ítem 4',
    'Observada',
    'Presentada',
    'Creada',
  ])
    assert.ok(log.includes(step), `Historial sin ${step}`);
  assert.match(log, /Jean Estrada · en esta demostración/);
  await screenshot('review-delivered');

  // Local review never changes base costs.
  await page.goto(url('jy-demo', 'index.html'));
  await ready();
  assert.equal(getPortfolioFinancials(data).executedCost, baseExecuted);
  // Pendientes (R3) only links to the review page: no "Aprobar".
  await page.goto(url('jy-demo', 'approvals.html?tab=review'));
  await ready();
  const inbox = page.locator('.worklist-table tbody tr');
  assert.equal(await inbox.count(), 1);
  assert.match(await inbox.innerText(), /N\.º 1-2026/);
  assert.equal(await page.getByRole('button', { name: 'Aprobar' }).count(), 0);
}

async function testMobileCreate() {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(url('jy-demo', 'expenses.html'));
  await ready();
  assert.ok(await page.locator('#my-expenses-title').isVisible());
  await page.locator('.my-expenses-new').click();
  await page.waitForURL(/expense\.html\?new=1/);
  await ready();
  await page.getByRole('button', { name: 'Crear borrador' }).click();
  assert.match(
    await page.locator('.review-create .alert-danger').innerText(),
    /responsable del gasto/
  );
  await page.selectOption('#review-project', 'PY-26-001');
  await page.selectOption('#review-worker', 'PER-JY-002');
  // José Vargas already has N.º 7 and 8 of 2026.
  assert.match(await page.locator('.review-number').innerText(), /N\.º 9-2026 de José Vargas/);
  await page.selectOption('#review-prepared', 'PER-JY-003');
  await page.getByRole('button', { name: 'Crear borrador' }).click();
  await page.waitForURL(/expense\.html\?id=R-DEMO-001/);
  assert.equal(await page.locator('h1').innerText(), 'Rendición N.º 9-2026');
  await noOverflow();

  // Photo → suggested data → the person confirms.
  await page.getByRole('button', { name: /Tomar foto/ }).click();
  await page.locator('.ev-doc--invoice').waitFor();
  assert.equal(await page.locator('#draft-total').inputValue(), '84.96');
  await page.getByRole('button', { name: 'Confirmar gasto' }).click();
  await tick();
  // Second photo: OCR misread the total (low confidence); the image says S/ 38.00.
  await page.getByRole('button', { name: /Tomar foto/ }).click();
  assert.equal(await page.locator('#draft-total').inputValue(), '33');
  assert.match(await page.locator('label[for="draft-total"]').innerText(), /confianza baja/);
  assert.match(await page.locator('.ev-doc').innerText(), /S\/ 38\.00/);
  // The misread values add up, so only the person can catch it: fixing the
  // total alone breaks V.V. + IGV = total until the breakdown is fixed too.
  await page.locator('#draft-total').fill('38');
  await page.getByRole('button', { name: 'Confirmar gasto' }).click();
  assert.match(await page.locator('.review-form .alert-danger').innerText(), /igual al total/);
  await page.locator('#draft-vv').fill('32.20');
  await page.locator('#draft-igv').fill('5.80');
  await page.getByRole('button', { name: 'Confirmar gasto' }).click();
  await tick();
  assert.match(
    await history(),
    /Agregó el ítem 2[\s\S]*corrigió V\.V\., IGV, Total sugerido por OCR/
  );
  // Expense without document needs its reason.
  await page.getByRole('button', { name: /Gasto sin documento/ }).click();
  await page.locator('#draft-total').fill('10');
  await page.locator('#draft-category').selectOption('Movilidad');
  await page.locator('#draft-description').fill('Pasaje en combi');
  await page.getByRole('button', { name: 'Confirmar gasto' }).click();
  assert.match(await page.locator('.review-form .alert-danger').innerText(), /motivo/);
  await page.locator('#draft-justification').fill('Transporte informal sin comprobante.');
  await page.getByRole('button', { name: 'Confirmar gasto' }).click();
  await tick();
  assert.equal(await page.locator('.review-item-cards li').count(), 3);
  assert.match(await page.locator('.review-breakdown').innerText(), /No documentado\s+S\/ 10\.00/);
  await noOverflow();
  await screenshot('mobile-new');
  await page.getByRole('button', { name: 'Presentar rendición' }).click();
  await tick();
  assert.equal(await status(), 'Presentada');

  // The new report appears in the list and in the inbox.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(url('jy-demo', 'expenses.html'));
  await ready();
  assert.match(
    await page.locator('.expense-table').innerText(),
    /N\.º 9-2026[\s\S]*Creada en esta demostración/
  );
  assert.equal(await approvalsCount(), '7');
}

async function testOtherPresentations() {
  for (const variant of ['surtec-peti', 'jy-pmi']) {
    await page.goto(url(variant, 'expenses.html'));
    await ready();
    assert.equal(await page.locator('[x-data="expenseReviewList"]').count(), 0);
    assert.match(await page.locator('#expenses-status').innerText(), /Aprobada/);
  }
}

try {
  await testList();
  await testReview();
  await testMobileCreate();
  await testOtherPresentations();
  assert.deepEqual(errors, []);
  console.log(
    'Rendiciones J&Y: numeración por trabajador y año, tres personas, evidencia con zoom, OCR corregido, sin documento, observación, corrección, aceptación, entrega a Contabilidad, móvil y alcance correctos.'
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
