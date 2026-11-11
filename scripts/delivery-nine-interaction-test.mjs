import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import {
  getDataForVariant,
  getDocuments,
  getPortfolioFinancials,
  getProjectFinancials,
} from '../src-modern/scripts/data/mock-data.js';

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
async function noOverflow() {
  await page.waitForTimeout(200);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  assert.ok(overflow <= 1, `${page.url()}: overflow ${overflow}px`);
}
async function screenshot(name) {
  if (process.env.VISUAL !== '1') return;
  const out = path.join(root, 'tmp', 'delivery-nine-review');
  await mkdir(out, { recursive: true });
  await page.screenshot({ path: path.join(out, `${name}.png`), fullPage: true });
}

async function testDocuments() {
  for (const variant of ['surtec-peti', 'jy-pmi', 'jy-demo']) {
    const data = getDataForVariant(variant);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(url(variant, 'documents.html'));
    await ready();
    assert.equal(await page.locator('.sidebar-nav [data-module="documents"].active').count(), 1);
    assert.equal(
      await page
        .locator('#documents-title')
        .locator('xpath=ancestor::section')
        .locator('table tbody tr')
        .count(),
      getDocuments(data).length
    );
    await page.locator('#documents-project').selectOption(data.projects[0].id);
    assert.equal(
      await page
        .locator('#documents-title')
        .locator('xpath=ancestor::section')
        .locator('table tbody tr')
        .count(),
      getDocuments(data).filter((item) => item.projectId === data.projects[0].id).length
    );
    await page.locator('#documents-search').fill('código inexistente');
    await page.locator('.d9-empty:visible').waitFor();
    await page.getByRole('button', { name: 'Ver todos' }).click();
    await page.locator('#documents-search').fill(data.budgets[0].id);
    await page
      .locator('#documents-title')
      .locator('xpath=ancestor::section')
      .locator('table tbody tr')
      .first()
      .getByRole('link', { name: `DOC-${data.budgets[0].id}` })
      .click();
    await page.waitForURL(/document\.html\?.*id=/);
    assert.match(
      await page.locator('#document-facts-title').locator('xpath=ancestor::section').innerText(),
      new RegExp(data.budgets[0].id)
    );
    await page.getByRole('button', { name: 'Vista previa' }).click();
    await page.locator('#document-preview-modal').waitFor({ state: 'visible' });
    assert.match(
      await page.locator('#document-preview-modal').innerText(),
      /No hay contenido de archivo/
    );
    await page
      .locator('#document-preview-modal')
      .getByRole('button', { name: 'Cerrar' })
      .last()
      .click();
    await page.locator('#document-preview-modal').waitFor({ state: 'hidden' });
    await page.getByRole('button', { name: 'Nueva versión', exact: true }).click();
    await page.locator('#document-version-modal').waitFor({ state: 'visible' });
    await page.getByRole('button', { name: 'Guardar versión visual' }).click();
    await page.locator('#document-version-modal .alert-danger').waitFor({ state: 'visible' });
    await page.locator('#document-version-comment').fill('Revisión de ejemplo');
    await page.getByRole('button', { name: 'Guardar versión visual' }).click();
    await page.locator('#document-version-modal').waitFor({ state: 'hidden' });
    assert.match(
      await page.locator('#document-history-title').locator('xpath=ancestor::section').innerText(),
      /Revisión de ejemplo/
    );
    const detailUrl = page.url();
    await page.reload();
    await ready();
    assert.equal(page.url(), detailUrl);
    assert.match(
      await page.locator('#document-history-title').locator('xpath=ancestor::section').innerText(),
      /Revisión de ejemplo/
    );
    await page.getByRole('link', { name: 'Volver a Documentos' }).click();
    await page.waitForURL(/documents\.html/);
    await page.setViewportSize({ width: 390, height: 844 });
    await noOverflow();
    await screenshot(`${variant}-documents-mobile`);
    await page.goto(url(variant, `document.html?id=DOC-${data.budgets[0].id}`));
    await ready();
    await noOverflow();
  }
  console.log(
    'Documentos: filtros, proyecto, operación, versión, modales, persistencia y móvil correctos.'
  );
}

async function testReports() {
  const surtec = getDataForVariant('surtec-peti');
  const totals = getPortfolioFinancials(surtec);
  // Reports and BI open scoped to projects in execution, like the Panel General.
  const inExecution = new Set(
    surtec.projects
      .filter((item) => ['Activo', 'En riesgo'].includes(item.status))
      .map((item) => item.id)
  );
  const scopedPurchases = surtec.operations.filter(
    (item) => item.type === 'purchase' && inExecution.has(item.projectId)
  );
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(url('surtec-peti', 'reports.html'));
  await ready();
  assert.equal(await page.locator('.sidebar-nav [data-module="reports"].active').count(), 1);
  // Entrega 6: the catalogue page links to BI instead of a second tab.
  assert.equal(await page.locator('.analytics-link:visible').count(), 1);
  assert.equal(await page.locator('.reports-catalog-card').count(), 8);
  assert.equal(
    await page
      .locator('#reports-result-title')
      .locator('xpath=ancestor::section')
      .locator('table tbody tr')
      .count(),
    inExecution.size
  );
  await page.locator('.reports-catalog-card').filter({ hasText: 'Compras' }).click();
  assert.match(await page.locator('#reports-result-title').innerText(), /Compras/);
  assert.equal(
    await page
      .locator('#reports-result-title')
      .locator('xpath=ancestor::section')
      .locator('table tbody tr')
      .count(),
    scopedPurchases.length
  );
  await page.locator('#reports-period').selectOption('2027-03');
  assert.equal(
    await page
      .locator('#reports-result-title')
      .locator('xpath=ancestor::section')
      .locator('table tbody tr')
      .count(),
    scopedPurchases.filter((item) => item.date.startsWith('2027-03')).length
  );
  // Entrega 6: BI lives in analytics.html ("Inteligencia de Negocios"); the link keeps the filters.
  await page.locator('.analytics-link').click();
  await page.waitForURL(/analytics\.html\?.*period=2027-03/);
  await ready();
  assert.equal(await page.locator('.shell-page-heading h1').innerText(), 'Inteligencia de Negocios');
  await page.locator('#analytics-margin-chart .chart-svg').waitFor();
  await page.locator('#reports-budget-chart .chart-svg rect').first().waitFor();
  const kpis = await page.locator('.d9-kpis').innerText();
  assert.ok(kpis.includes(String(totals.activeProjectCount)));
  assert.ok(kpis.includes('S/ 1 245 000'));
  assert.ok(kpis.includes('S/ 768 400'));
  assert.match(
    await page.locator('#reports-monthly-title').locator('xpath=ancestor::section[1]').innerText(),
    /2027-03/
  );
  await page.locator('.reports-source-list button').filter({ hasText: 'Compras' }).click();
  assert.equal(await page.locator('.reports-source-detail a').count(), inExecution.size);
  await page.locator('.reports-source-detail a').first().click();
  await page.waitForURL(/costs\.html\?project=.*&source=purchases/);
  await page.goBack();
  await ready();
  await page.locator('#reports-project').selectOption('PR-2027-001');
  const projectFinancials = getProjectFinancials(surtec, 'PR-2027-001');
  assert.ok((await page.locator('.d9-kpis').innerText()).includes('S/ 112 450'));
  assert.equal(
    await page
      .locator('#reports-manager-title')
      .locator('xpath=ancestor::section[1]')
      .locator('table tbody tr')
      .count(),
    1
  );
  assert.equal(projectFinancials.executedCost, 112450);
  await page.setViewportSize({ width: 768, height: 900 });
  await noOverflow();
  await page.setViewportSize({ width: 390, height: 844 });
  await noOverflow();
  await screenshot('surtec-bi-mobile');
  await page.goto(url('surtec-peti', 'reports.html?report=expenses'));
  await ready();
  await noOverflow();
  await screenshot('surtec-reports-mobile');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(url('jy-pmi', 'reports.html'));
  await ready();
  // PMI has no BI: no link, and analytics.html by URL shows "no disponible".
  assert.equal(await page.locator('.analytics-link:visible').count(), 0);
  assert.equal(await page.locator('.reports-catalog-card').count(), 7);
  await page.locator('#reports-project').selectOption('PR-JY-001');
  assert.equal(
    await page
      .locator('#reports-result-title')
      .locator('xpath=ancestor::section')
      .locator('table tbody tr')
      .count(),
    1
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await noOverflow();
  await screenshot('jy-pmi-reports-mobile');
  await page.goto(url('jy-demo', 'reports.html'));
  await ready();
  assert.match(await page.locator('#main-content').innerText(), /Reportes no disponibles/);
  assert.equal(await page.locator('.reports-catalog-card').count(), 0);
  console.log(
    'Reportes y BI: catálogo, filtros, cifras, gráficos, proyecto → fuente y variantes correctos.'
  );
}

async function testCRM() {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(url('surtec-peti', 'crm.html'));
  await ready();
  assert.equal(await page.locator('.sidebar-nav [data-module="crm"].active').count(), 1);
  // Entrega 6: six-stage pipeline (punto 20) with one opportunity per stage.
  assert.equal(await page.locator('.crm-column').count(), 6);
  assert.equal(await page.locator('.crm-card').count(), 6);
  assert.equal(
    await page
      .locator('#crm-list-title')
      .locator('xpath=ancestor::section[1]')
      .locator('table tbody tr')
      .count(),
    6
  );
  await page.locator('.crm-card').filter({ hasText: 'Radioenlaces de campamento' }).click();
  assert.match(await page.locator('#crm-detail-title').locator('xpath=ancestor::section[1]').innerText(), /OP-005[\s\S]*Prospecto/);
  await page.getByRole('button', { name: 'Marcar como ganado' }).click();
  await page.locator('.crm-column').filter({ hasText: 'Ganado' }).filter({ hasText: 'Radioenlaces' }).waitFor();
  await page.evaluate(() => localStorage.removeItem('mockup-erp:surtec-peti:crm-stages'));
  await page.goto(url('surtec-peti', 'crm.html'));
  await ready();
  assert.match(
    await page.locator('#crm-detail-title').locator('xpath=ancestor::section[1]').innerText(),
    /OP-001.*PRE-001.*PR-2027-001/s
  );
  await page.locator('#crm-client').selectOption('CLI-002');
  await page.locator('.d9-empty:visible').waitFor();
  await page.getByRole('button', { name: 'Ver todas' }).click();
  await page.locator('#crm-search').fill('Infraestructura');
  assert.equal(
    await page
      .locator('#crm-list-title')
      .locator('xpath=ancestor::section[1]')
      .locator('table tbody tr')
      .count(),
    1
  );
  await page.getByRole('link', { name: 'Abrir presupuesto' }).click();
  await page.waitForURL(/budget\.html\?id=PRE-001/);
  // Entrega 4: "Ver proyecto" from every operation (punto 123).
  await page.getByRole('link', { name: 'Ver proyecto', exact: true }).first().click();
  await page.waitForURL(/project\.html\?id=PR-2027-001/);
  await page.goto(url('surtec-peti', 'crm.html'));
  await ready();
  await page.setViewportSize({ width: 390, height: 844 });
  await noOverflow();
  await screenshot('surtec-crm-mobile');
  for (const variant of ['jy-pmi', 'jy-demo']) {
    await page.goto(url(variant, 'crm.html'));
    await ready();
    assert.match(await page.locator('#main-content').innerText(), /CRM no disponible/);
    assert.equal(await page.locator('.crm-flow li').count(), 0);
    assert.equal(await page.locator('.sidebar-nav [data-module="crm"]').count(), 0);
  }
  console.log(
    'CRM: Oportunidad → Presupuesto → Proyecto, filtros, vacío, móvil y variantes correctos.'
  );
}

async function testIntegrations() {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(url('surtec-peti', 'integrations.html'));
  await ready();
  assert.equal(await page.locator('.sidebar-nav [data-module="integrations"].active').count(), 1);
  assert.equal(await page.locator('.integration-list button').count(), 5);
  // Entrega 1: the demo nature is stated once, in the header badge.
  assert.match(await page.locator('.shell-demo-badge').innerText(), /Datos de demostración/);
  assert.match(
    await page
      .locator('#integration-detail-title')
      .locator('xpath=ancestor::section[1]')
      .innerText(),
    /Biometría.*Conectado/s
  );
  // Entrega 6: credible states, sync history and the punto 92 error.
  assert.match(await page.locator('#main-content').innerText(), /2 registros biométricos no pudieron asociarse con trabajadores/);
  assert.equal(await page.locator('#integration-history-title').locator('xpath=ancestor::section[1]').locator('tbody tr').count(), 5);
  await page.locator('#integration-category').selectOption('Finanzas');
  assert.equal(await page.locator('.integration-list button').count(), 1);
  assert.match(
    await page
      .locator('#integration-detail-title')
      .locator('xpath=ancestor::section[1]')
      .innerText(),
    /Software contable/
  );
  await page.getByRole('button', { name: 'Limpiar' }).click();
  await page.locator('.integration-list button').filter({ hasText: 'Biometría' }).click();
  await page.getByRole('link', { name: 'Ver módulo relacionado' }).click();
  await page.waitForURL(/personnel\.html\?tab=incidencias/);
  await page.goto(url('surtec-peti', 'integrations.html'));
  await ready();
  await page.setViewportSize({ width: 390, height: 844 });
  await noOverflow();
  await screenshot('surtec-integrations-mobile');
  for (const variant of ['jy-pmi', 'jy-demo']) {
    await page.goto(url(variant, 'integrations.html'));
    await ready();
    assert.match(await page.locator('#main-content').innerText(), /Integraciones no disponibles/);
    assert.equal(await page.locator('.integration-list button').count(), 0);
  }
  console.log(
    'Integraciones: flujo previsto, filtros, ausencia de conexiones reales, móvil y variantes correctos.'
  );
}

async function testSecurity() {
  for (const variant of ['surtec-peti', 'jy-pmi']) {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(url(variant, 'security.html'));
    await ready();
    const data = getDataForVariant(variant);
    assert.equal(await page.locator('.sidebar-nav [data-module="security"].active').count(), 1);
    assert.equal(await page.locator('.d9-tabs button').count(), 7);
    assert.equal(
      await page
        .locator('#security-users-title')
        .locator('xpath=ancestor::section[1]')
        .locator('table tbody tr')
        .count(),
      data.workers.length
    );
    await page.locator('#security-search').fill('nombre inexistente');
    await page.locator('.d9-empty:visible').waitFor();
    await page.getByRole('button', { name: 'Ver todos' }).click();
    await page.locator('.d9-tabs').getByRole('button', { name: 'Roles' }).click();
    // Entrega 6: roles of punto 95 and credible simulated states (decision 3).
    assert.equal(await page.locator('.security-role-grid article').count(), 8);
    await page.locator('.d9-tabs').getByRole('button', { name: 'Permisos' }).click();
    assert.equal(await page.locator('.security-permissions-table tbody tr').count(), 5);
    await page.locator('.d9-tabs').getByRole('button', { name: 'MFA' }).click();
    assert.match(
      await page.locator('#security-mfa-title').locator('xpath=ancestor::section[1]').innerText(),
      /Activado/
    );
    await page.locator('.d9-tabs').getByRole('button', { name: 'Sesiones' }).click();
    assert.match(
      await page
        .locator('#security-sessions-title')
        .locator('xpath=ancestor::section[1]')
        .innerText(),
      /Activa/
    );
    await page.locator('.d9-tabs').getByRole('button', { name: 'Auditoría' }).click();
    assert.ok(
      (await page
        .locator('#security-audit-title')
        .locator('xpath=ancestor::section[1]')
        .locator('table tbody tr')
        .count()) > 0
    );
    await page.locator('.d9-tabs').getByRole('button', { name: 'Respaldos' }).click();
    assert.match(
      await page
        .locator('#security-backups-title')
        .locator('xpath=ancestor::section[1]')
        .innerText(),
      /08\/11\/2026 02:00[\s\S]*Correcto[\s\S]*Automático/
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await noOverflow();
    await screenshot(`${variant}-security-mobile`);
  }
  await page.goto(url('jy-demo', 'security.html'));
  await ready();
  assert.match(await page.locator('#main-content').innerText(), /Seguridad no disponible/);
  assert.equal(await page.locator('.security-role-grid article').count(), 0);
  console.log(
    'Seguridad: perfiles, roles, permisos, MFA, sesiones, auditoría, respaldos y variantes correctos.'
  );
}

async function testAdministration() {
  for (const variant of ['surtec-peti', 'jy-pmi']) {
    const data = getDataForVariant(variant);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(url(variant, 'settings.html'));
    await ready();
    assert.equal(
      await page.locator('.sidebar-nav [data-module="administration"].active').count(),
      1
    );
    assert.equal(await page.locator('.admin-company-brand img:visible').count(), 1);
    // Entrega 6: six sections of punto 101.
    assert.equal(await page.locator('.d9-tabs button').count(), 6);
    await page.locator('.d9-tabs').getByRole('tab', { name: 'Catálogos' }).click();
    assert.equal(
      await page.locator('.admin-catalog-menu button').count(),
      variant === 'surtec-peti' ? 8 : 6
    );
    assert.equal(
      await page.locator('.admin-catalog-layout table tbody tr').count(),
      data.projects.length
    );
    await page.locator('#admin-catalog-search').fill('sin coincidencias');
    await page.locator('.d9-empty:visible').waitFor();
    await page.getByRole('button', { name: 'Limpiar búsqueda' }).click();
    await page
      .locator('.admin-catalog-menu button')
      .filter({ hasText: 'Clientes' })
      .click();
    assert.equal(
      await page.locator('.admin-catalog-layout table tbody tr').count(),
      data.clients.length
    );
    await page.locator('.d9-tabs').getByRole('tab', { name: 'Parámetros' }).click();
    assert.equal(await page.locator('.admin-parameters > div').count(), 7);
    assert.match(await page.locator('.admin-parameters').innerText(), /18 %.*Escenario 2027/s);
    await page.setViewportSize({ width: 390, height: 844 });
    await noOverflow();
    await screenshot(`${variant}-administration-mobile`);
    await page.locator('.d9-tabs').getByRole('tab', { name: 'Empresa' }).click();
    await noOverflow();
    await page.locator('[title="Cambiar tema"]').click();
    assert.equal(await page.locator('.admin-logo-dark:visible').count(), 1);
    await page.locator('[title="Cambiar tema"]').click();
  }
  await page.goto(url('jy-demo', 'settings.html'));
  await ready();
  assert.match(await page.locator('#main-content').innerText(), /Administración no disponible/);
  assert.equal(await page.locator('.admin-company-brand img:visible').count(), 0);
  assert.equal(await page.locator('.sidebar-nav [data-module="administration"]').count(), 0);
  console.log(
    'Administración: empresa, catálogos, parámetros, filtros, móvil y variantes correctos.'
  );
}

try {
  if (!process.env.SECTION || process.env.SECTION === 'documents') await testDocuments();
  if (!process.env.SECTION || process.env.SECTION === 'reports') await testReports();
  if (!process.env.SECTION || process.env.SECTION === 'crm') await testCRM();
  if (!process.env.SECTION || process.env.SECTION === 'integrations') await testIntegrations();
  if (!process.env.SECTION || process.env.SECTION === 'security') await testSecurity();
  if (!process.env.SECTION || process.env.SECTION === 'administration') await testAdministration();
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
