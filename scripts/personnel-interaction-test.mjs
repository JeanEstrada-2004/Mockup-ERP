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
  const out = path.join(root, 'tmp', 'personnel-review');
  await mkdir(out, { recursive: true });
  await page.screenshot({ path: path.join(out, `${name}.png`), fullPage: true });
}

async function variantFlow(variant, workerId, projectId) {
  const data = getDataForVariant(variant);
  const worker = data.workers.find((item) => item.id === workerId);
  const baseline = getProjectFinancials(data, projectId);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(url(variant, 'personnel.html'));
  await ready();
  assert.equal(await page.locator('.sidebar-nav [data-module="personnel"].active').count(), 1);
  assert.equal(
    await page.locator('.personnel-tabs button').count(),
    variant === 'surtec-peti' ? 6 : 4
  );
  assert.equal(
    await page
      .locator('#personnel-people-title')
      .locator('..')
      .locator('..')
      .locator('table tbody tr')
      .count(),
    data.workers.length
  );
  await screenshot(`${variant}-personal`);
  await page.locator('#personnel-search').fill(worker.name);
  assert.equal(
    await page
      .locator('#personnel-people-title')
      .locator('..')
      .locator('..')
      .locator('table tbody tr')
      .count(),
    1
  );
  await page.getByRole('link', { name: worker.name }).first().click();
  await page.waitForURL(/worker\.html\?id=/);
  assert.equal(await page.locator('.shell-page-heading h1').innerText(), worker.name);
  assert.ok((await page.locator('.personnel-worker-content').innerText()).includes(worker.dni));
  assert.ok(
    (await page.locator('#worker-cost-title').locator('..').innerText()).includes(
      'Costo laboral vinculado'
    )
  );
  await screenshot(`${variant}-worker`);
  await page.locator('.personnel-flow').getByRole('link', { name: 'Asistencia' }).click();
  await page.waitForURL(/personnel\.html\?tab=asistencia&worker=/);
  assert.equal(await page.locator('#personnel-worker').inputValue(), workerId);
  assert.ok(
    (
      await page.locator('#personnel-attendance-title').locator('..').locator('..').innerText()
    ).includes(worker.name)
  );
  await page.locator('.personnel-tabs').getByRole('button', { name: 'Tareo' }).click();
  assert.ok(
    (
      await page.locator('#personnel-timesheet-title').locator('..').locator('..').innerText()
    ).includes(worker.name)
  );
  await page.goto(url(variant, `worker.html?id=${workerId}`));
  await ready();
  await page
    .locator('.personnel-cost-row')
    .first()
    .getByRole('link', { name: 'Ver en Costos' })
    .click();
  await page.waitForURL(/costs\.html\?record=COST-TAR-/);
  assert.equal(await page.locator('#cost-operation-detail:visible').count(), 1);
  await page.goBack();
  await ready();
  await page.locator('#worker-assignments-title').locator('..').getByRole('link').first().click();
  await page.waitForURL(/project\.html\?id=/);
  await page.goto(url(variant, 'personnel.html?tab=tareo'));
  await ready();
  if (variant === 'jy-demo') {
    await page.setViewportSize({ width: 390, height: 844 });
    await noOverflow();
    await screenshot('jy-demo-tareo-mobile');
  }
  await page.getByRole('button', { name: 'Registro manual' }).click();
  await page.locator('#personnel-manual-modal').waitFor({ state: 'visible' });
  await page.getByRole('button', { name: 'Guardar tareo visual' }).click();
  await page.locator('#personnel-manual-modal .alert-danger').waitFor({ state: 'visible' });
  await page.locator('#manual-worker').selectOption(workerId);
  await page.locator('#manual-project').selectOption(projectId);
  await page.locator('#manual-date').fill('2027-04-03');
  await page.locator('#manual-start').fill('08:00');
  await page.locator('#manual-end').fill('16:00');
  await page.locator('#manual-reason').fill('Jornada de campo demostrativa');
  await page.locator('#personnel-manual-modal .alert-danger').waitFor({ state: 'hidden' });
  assert.ok((await page.locator('.personnel-hours-preview').innerText()).includes('8 h'));
  if (variant === 'jy-demo') await screenshot('jy-demo-modal-mobile');
  await page.getByRole('button', { name: 'Guardar tareo visual' }).click();
  await page.locator('#personnel-manual-modal').waitFor({ state: 'hidden' });
  assert.ok(
    (
      await page.locator('#personnel-timesheet-title').locator('..').locator('..').innerText()
    ).includes('TR-DEMO-001')
  );
  assert.ok(
    (
      await page.locator('#personnel-timesheet-title').locator('..').locator('..').innerText()
    ).match(/Sin impacto|sin costo agregado/)
  );
  await page.reload();
  await ready();
  assert.ok(
    (
      await page.locator('#personnel-timesheet-title').locator('..').locator('..').innerText()
    ).includes('TR-DEMO-001')
  );
  await page.locator('.personnel-tabs').getByRole('button', { name: 'Asistencia' }).click();
  assert.ok(
    (
      await page.locator('#personnel-attendance-title').locator('..').locator('..').innerText()
    ).includes('ASI-DEMO-001')
  );
  assert.deepEqual(getProjectFinancials(data, projectId), baseline);
  await page.setViewportSize({ width: 768, height: 900 });
  await noOverflow();
  await page.setViewportSize({ width: 390, height: 844 });
  await noOverflow();
  await screenshot(`${variant}-asistencia-mobile`);
}

try {
  await variantFlow('surtec-peti', 'PER-002', 'PR-2027-001');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(url('surtec-peti', 'personnel.html?tab=biometria'));
  await ready();
  // Entrega 5 (decision 3): credible simulated device state instead of a disclaimer.
  const biometrics = await page.locator('#personnel-biometrics-title').locator('..').innerText();
  assert.match(biometrics, /ZKTeco · Oficina Principal/);
  assert.match(biometrics, /Conectado/);
  assert.match(biometrics, /08\/11\/2026 18:05/);
  assert.match(biometrics, /Incompleto/);
  await page.getByRole('button', { name: 'Sincronizar ahora' }).click();
  await page.getByText('Sincronización completada.').first().waitFor();
  await page.locator('.personnel-tabs').getByRole('button', { name: 'Incidencias' }).click();
  assert.equal(await page.locator('.personnel-incident').count(), 2);
  assert.match(await page.locator('.personnel-incident').nth(1).innerText(), /No identificado/);
  await page.getByRole('button', { name: 'Justificar' }).first().click();
  await page.locator('#personnel-incident-modal').waitFor({ state: 'visible' });
  await page.getByRole('button', { name: 'Guardar decisión' }).click();
  await page.locator('#personnel-incident-modal .alert-danger').waitFor({ state: 'visible' });
  await page.locator('#incident-reason').fill('Salida omitida en el escenario de ejemplo');
  await page.getByRole('button', { name: 'Guardar decisión' }).click();
  await page.locator('#personnel-incident-modal').waitFor({ state: 'hidden' });
  assert.ok((await page.locator('.personnel-incident').first().innerText()).includes('Revisada'));
  assert.ok(
    (await page.locator('.personnel-incident').first().innerText()).includes('Usuario de demostración')
  );
  // Asignar trabajador (punto 50): local demo assignment appears in the table.
  await page.locator('.personnel-tabs').getByRole('button', { name: 'Asignaciones' }).click();
  await page.getByRole('button', { name: 'Asignar trabajador' }).click();
  await page.locator('#personnel-assign-modal').waitFor({ state: 'visible' });
  await page.selectOption('#assign-worker', 'PER-005');
  await page.selectOption('#assign-project', 'PR-2027-003');
  await page.fill('#assign-role', 'Supervisor de obra');
  await page.fill('#assign-from', '2027-05-01');
  await page.fill('#assign-to', '2027-06-30');
  await page.locator('#personnel-assign-form').getByRole('button', { name: 'Asignar' }).click();
  await page.locator('#personnel-assign-modal').waitFor({ state: 'hidden' });
  await page.getByText('Supervisor de obra').first().waitFor();
  await variantFlow('jy-pmi', 'PER-JY-002', 'PR-JY-001');
  await page.goto(url('jy-demo', 'personnel.html'));
  await ready();
  assert.equal(await page.locator('.personnel-tabs button').count(), 4);
  assert.equal(
    await page
      .locator('.personnel-panel[x-show="tab === \'biometria\' && hasBiometrics"]:visible')
      .count(),
    0
  );
  assert.equal(
    await page.locator('.personnel-cards').filter({ hasText: 'TR-DEMO-001' }).count(),
    0
  );
  await variantFlow('jy-demo', 'PER-JY-002', 'PR-JY-001');
  assert.equal(errors.length, 0, errors.join('\n'));
  console.log(
    'Personal, asistencia, tareo, proyecto, costo y alcance biométrico: correctos en tres variantes.'
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
