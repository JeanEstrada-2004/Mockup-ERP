// R5 (docs/realineamiento-jy-demo.md): Personal of J&Y Demo — office, field
// and temporary staff; SF100 attendance apart from field tareo (with
// signatures); payroll imputed to projects by an estimated %; recibos por
// honorarios; incidents; personnel cost without hourly rates; and
// Integraciones with honest states. SurTec and PMI keep their personnel view.
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { getCostBySource, getDataForVariant } from '../src-modern/scripts/data/mock-data.js';

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
  const out = path.join(root, 'tmp', 'jy-personnel-r5');
  await mkdir(out, { recursive: true });
  await page.screenshot({ path: path.join(out, `${name}.png`), fullPage: true });
}
const data = getDataForVariant('jy-demo');
const tab = (name) =>
  page.locator('.jy-personnel .d9-tabs').getByRole('tab', { name, exact: true });

async function testPersonnel() {
  await page.goto(url('jy-demo', 'personnel.html'));
  await ready();
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await ready();
  assert.equal(
    await page.locator('.sidebar-nav [data-module="personnel"] span').first().innerText(),
    'Personal'
  );
  assert.equal(await page.locator('.jy-personnel .d9-tabs [role="tab"]').count(), 7);
  // Personal: office, field and temporary; payroll or RxH.
  const people = await page.locator('.jy-people-table').innerText();
  assert.match(people, /Pedro Mamani[\s\S]*Temporal[\s\S]*Recibo por honorarios/);
  assert.match(people, /Rosa Huamán[\s\S]*Oficina[\s\S]*Planilla/);
  assert.doesNotMatch(
    await page.locator('#main-content').innerText(),
    /Costo laboral|tarifa por hora|S\/ \d+ por hora/i
  );

  // Asistencia (SF100) is not tareo: it marks the office and has no cost.
  await tab('Asistencia').click();
  await tick();
  const attendance = page.locator('.jy-attendance tbody tr');
  assert.equal(await attendance.count(), data.attendance.length);
  assert.match(
    await page.locator('.jy-attendance').innerText(),
    /Sin salida[\s\S]*SF100 · exportado a Excel/
  );
  await page.getByRole('button', { name: 'Importar Excel del SF100' }).click();
  assert.match(
    await page.locator('.toast').first().innerText(),
    /hoy el SF100 se descarga a Excel/
  );

  // Tareo: by project and day, signed; registering and signing.
  await tab('Tareo').click();
  await tick();
  const tareo = page.locator('.jy-tareo tbody tr');
  assert.equal(await tareo.count(), data.tareo.length);
  assert.equal(
    await page
      .locator('.jy-tareo')
      .getByRole('button', { name: /^Firmar tareo/ })
      .count(),
    2
  );
  await page.locator('#jy-tareo-project').selectOption('PY-26-002');
  assert.equal(
    await tareo.count(),
    data.tareo.filter((item) => item.projectId === 'PY-26-002').length
  );
  await page.getByRole('button', { name: 'Registrar tareo' }).click();
  await page.locator('#jy-tareo-modal').waitFor({ state: 'visible' });
  await page.locator('#jy-tareo-form-worker').selectOption('PER-JY-004');
  await page.locator('#jy-tareo-form-date').fill('2026-07-14');
  await page.getByRole('button', { name: 'Registrar', exact: true }).click();
  assert.match(await page.locator('#jy-tareo-modal .alert-danger').innerText(), /ya tiene tareo/);
  await page.locator('#jy-tareo-form-date').fill('2026-07-15');
  await page.locator('#jy-tareo-form-shift').selectOption('Media');
  await page.getByRole('button', { name: 'Registrar', exact: true }).click();
  await page.locator('#jy-tareo-modal').waitFor({ state: 'hidden' });
  await tick();
  const added = tareo.filter({ hasText: '15/07/2026' });
  assert.match(await added.innerText(), /Luis Condori[\s\S]*Media[\s\S]*Jean Estrada/);
  await added.getByRole('button', { name: /^Firmar tareo/ }).click();
  await tick();
  assert.match(await added.innerText(), /Firmado/);

  // Planilla: estimated % per project; imputed vs office cost.
  await tab('Planilla').click();
  await tick();
  const june = data.payroll.filter((item) => item.month === '2026-06');
  assert.equal(await page.locator('.jy-payroll tbody tr').count(), june.length);
  const rosa = page.locator('.jy-payroll tbody tr', { hasText: 'Rosa Huamán' });
  assert.match(
    await rosa.innerText(),
    /S\/ 4 200\.00[\s\S]*PY-26-001\s+5 %[\s\S]*PY-26-003\s+10 %[\s\S]*15 %[\s\S]*S\/ 3 570\.00/
  );
  // A different month keeps its own imputation.
  await page.locator('#jy-payroll-month').selectOption('2026-04');
  await tick();
  assert.doesNotMatch(await page.locator('.jy-payroll').innerText(), /PY-26-003/);
  await page.locator('#jy-payroll-month').selectOption('2026-06');
  await tick();
  // Editing an imputation is a local proposal: it validates the 100 % limit.
  await rosa.getByRole('button', { name: /Editar imputación/ }).click();
  await page.locator('#jy-imputation-modal').waitFor({ state: 'visible' });
  await page.locator('#imp-PY-26-001').fill('80');
  await page.locator('#imp-PY-26-003').fill('30');
  await page.getByRole('button', { name: 'Guardar propuesta' }).click();
  assert.match(
    await page.locator('#jy-imputation-modal .alert-danger').innerText(),
    /no puede pasar de 100/
  );
  await page.locator('#imp-PY-26-001').fill('10');
  await page.getByRole('button', { name: 'Guardar propuesta' }).click();
  await page.locator('#jy-imputation-modal').waitFor({ state: 'hidden' });
  await tick();
  assert.match(
    await rosa.innerText(),
    /PY-26-001\s+10 %[\s\S]*PY-26-003\s+30 %[\s\S]*Propuesta local, no registrada[\s\S]*40 %/
  );
  // Payroll cost per project links to Costos (base figures unchanged).
  const expected = june
    .flatMap((entry) =>
      entry.imputations.map((item) => ({ ...item, amount: (entry.cost * item.percent) / 100 }))
    )
    .filter((item) => item.projectId === 'PY-26-002')
    .reduce((sum, item) => sum + item.amount, 0);
  const projectLink = page.locator('.jy-personnel .d9-link-list a', { hasText: 'PY-26-002' });
  assert.match(await projectLink.innerText(), new RegExp(money(expected).replace('/', '\\/')));
  await projectLink.click();
  await page.waitForURL(/costs\.html\?record=COST-PLA-2606-002/);
  await ready();
  assert.match(await page.locator('#cost-operation-detail').innerText(), /Planilla jun\. 2026/);
  await screenshot('payroll');

  // RxH: a confirmed personnel cost source.
  await page.goto(url('jy-demo', 'personnel.html?tab=rxh'));
  await ready();
  assert.equal(await page.locator('.jy-rxh tbody tr').count(), data.rxh.length);
  await page.getByRole('button', { name: 'Registrar RxH' }).click();
  await page.locator('#jy-rxh-modal').waitFor({ state: 'visible' });
  await page.locator('#jy-rxh-worker').selectOption('PER-JY-006');
  assert.equal(await page.locator('#jy-rxh-person').inputValue(), 'Pedro Mamani');
  await page.locator('#jy-rxh-doc').fill('20123');
  await page.locator('#jy-rxh-number').fill('E001-17');
  await page.locator('#jy-rxh-project').selectOption('PY-26-001');
  await page.locator('#jy-rxh-amount').fill('3600');
  await page.getByRole('button', { name: 'Registrar recibo' }).click();
  assert.match(
    await page.locator('#jy-rxh-modal .alert-danger').innerText(),
    /RUC de persona natural/
  );
  await page.locator('#jy-rxh-doc').fill('10000000261');
  await page.getByRole('button', { name: 'Registrar recibo' }).click();
  await page.locator('#jy-rxh-modal').waitFor({ state: 'hidden' });
  await tick();
  assert.equal(await page.locator('.jy-rxh tbody tr').count(), data.rxh.length + 1);
  assert.match(
    await page.locator('.jy-rxh').innerText(),
    /E001-17[\s\S]*Registrado en esta demostración/
  );

  // Incidencias: missing marks and unsigned tareo; justify one.
  await page.goto(url('jy-demo', 'personnel.html?tab=incidencias'));
  await ready();
  const incidents = page.locator('.jy-incidents tbody tr');
  // 2 missing marks + 2 unsigned base rows (the local row was signed).
  assert.equal(await incidents.count(), 4);
  const missing = incidents.filter({ hasText: 'Día sin marcaciones' });
  await missing.getByRole('button', { name: 'Atender' }).click();
  await page.locator('#jy-incident-modal').waitFor({ state: 'visible' });
  await page.locator('#jy-incident-reason').fill('Estuvo todo el día en obra.');
  await page.getByRole('button', { name: 'Justificar' }).click();
  await page.locator('#jy-incident-modal').waitFor({ state: 'hidden' });
  await tick();
  assert.match(await missing.innerText(), /Estuvo todo el día en obra[\s\S]*Justificada/);
  await page.locator('#jy-incidents-title').scrollIntoViewIfNeeded();
  await screenshot('incidents');

  // Biometría: SF100 not integrated today; proposal shown as such.
  await tab('Biometría').click();
  await tick();
  assert.match(
    await page.locator('.jy-sf100').innerText(),
    /ZKTeco SF100[\s\S]*No integrado[\s\S]*exportan a Excel/
  );

  // Worker page: imputation history, tareo, RxH.
  await page.goto(url('jy-demo', 'worker.html?id=PER-JY-006'));
  await ready();
  const worker = await page.locator('#main-content').innerText();
  assert.match(worker, /Pedro Mamani[\s\S]*Temporal[\s\S]*Recibo por honorarios/);
  assert.match(worker, /No está en planilla/);
  // Most recent first: the receipt registered above, then June and May.
  assert.match(worker, /E001-17[\s\S]*E001-16[\s\S]*E001-15/);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(url('jy-demo', 'personnel.html?tab=planilla'));
  await ready();
  await noOverflow();
  await page.setViewportSize({ width: 1440, height: 900 });
}

async function testCostsAndIntegrations() {
  // Personnel cost = imputed payroll + RxH; no hour-based tareo cost.
  const personnel = getCostBySource(data, 'PY-26-001').personnel;
  await page.goto(url('jy-demo', 'costs.html?project=PY-26-001&source=personnel'));
  await ready();
  const rows = await page.locator('.costs-table').innerText();
  assert.match(rows, /Planilla abr\. 2026[\s\S]*Imputada/);
  assert.match(rows, /RxH E001-15[\s\S]*Registrado/);
  assert.doesNotMatch(rows, /TAR-26|Tareo aprobado/);
  assert.match(
    await page.locator('.costs-source-row', { hasText: 'Personal' }).innerText(),
    new RegExp(`S/ ${String(personnel).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}`.replace('/', '\\/'))
  );
  // Integraciones: honest states only.
  await page.goto(url('jy-demo', 'integrations.html'));
  await ready();
  assert.equal(await page.locator('.sidebar-nav [data-module="integrations"].active').count(), 1);
  const text = await page.locator('#main-content').innerText();
  assert.match(text, /ZKTeco SF100[\s\S]*No integrado/);
  assert.match(text, /Lectura de comprobantes \(OCR\)[\s\S]*Propuesta/);
  assert.match(text, /Contabilidad[\s\S]*Por definir/);
  assert.match(text, /Correo y notificaciones[\s\S]*Opcional/);
  assert.doesNotMatch(text, /Conectado|Correcto/);
  await screenshot('integrations');
  // Tours: the personnel tour follows payroll.
  await page.locator('.shell-user-button').click();
  await page.getByRole('button', { name: 'Recorridos de demostración' }).click();
  await page.locator('#demo-tours-modal').waitFor({ state: 'visible' });
  assert.match(
    await page.locator('#demo-tours-modal').innerText(),
    /Asistencia, planilla y costo[\s\S]*Planilla e imputación/
  );
}

async function testOtherPresentations() {
  for (const variant of ['surtec-peti', 'jy-pmi']) {
    await page.goto(url(variant, 'personnel.html'));
    await ready();
    assert.equal(await page.locator('[x-data="personnelJyWorkspace"]').count(), 0);
    assert.ok((await page.locator('.personnel-tabs button').count()) >= 4);
  }
}

try {
  await testPersonnel();
  await testCostsAndIntegrations();
  await testOtherPresentations();
  assert.deepEqual(errors, []);
  console.log(
    'Personal J&Y: tipos y régimen, asistencia SF100, tareo con firma, planilla e imputación, RxH, incidencias, costo sin horas e integraciones honestas correctos.'
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
