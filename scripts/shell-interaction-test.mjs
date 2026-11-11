import assert from 'node:assert/strict';
import http from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { getVariantConfig, variantRule } from '../src-modern/scripts/config/variants.js';
import {
  getDataForVariant,
  getDocuments,
  getPortfolioFinancials,
  getProjectFinancials,
} from '../src-modern/scripts/data/mock-data.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const serveDir = path.join(root, 'dist-pages');
const pagesBase = process.env.PAGES_BASE || '/';
if (!pagesBase.startsWith('/') || !pagesBase.endsWith('/')) {
  throw new Error('PAGES_BASE debe tener la forma /nombre-del-repositorio/');
}
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

if (!existsSync(serveDir)) throw new Error('Ejecuta npm run build:variants primero.');

const server = http.createServer(async (req, res) => {
  try {
    let pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (!pathname.startsWith(pagesBase)) {
      res.writeHead(404).end('Not found');
      return;
    }
    pathname = `/${pathname.slice(pagesBase.length)}`;
    let file = path.resolve(serveDir, `.${pathname}`);
    if (!file.startsWith(`${serveDir}${path.sep}`)) {
      res.writeHead(403).end();
      return;
    }
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
const pageUrl = (variant, pageName = 'index.html') => `${origin}${pagesBase}${variant}/${pageName}`;
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});

async function openVariant(variant, expectedName, expectedProjects) {
  await page.goto(pageUrl(variant));
  await page.waitForFunction(() => window.AdminApp?.isInitialized);
  assert.equal(
    await page.locator('.shell-brand').getAttribute('aria-label'),
    `${expectedName}: ir al Panel General`
  );
  assert.equal(await page.locator('#global-project-select option').count(), expectedProjects);
  assert.ok(
    await page.locator('.shell-logo--light').evaluate((img) => img.complete && img.naturalWidth > 0)
  );
  assert.match(
    await page.locator('.shell-page-heading h1').innerText(),
    /^(Buenos días|Buenas tardes|Buenas noches), Jean$/
  );
  assert.equal(await page.title().then((title) => title.includes('Panel General')), true);
  assert.equal(await page.locator('.sidebar-nav a[href="#"]').count(), 0);
  assert.ok(
    await page
      .locator('.sidebar-nav a')
      .evaluateAll((links) =>
        links.every((link) =>
          /\/(index|projects|approvals|clients|suppliers|products|crm|budgets|purchases|expenses|personnel|warehouse|payments|costs|documents|reports|integrations|security|settings|module-preview)\.html(?:\?|$)/.test(
            link.href
          )
        )
      )
  );
  // Entrega 2: the rail and the mobile header name the presentation on purpose
  // (user request: PETI / PMI / Demo must be told apart). Course names stay
  // out of the page content, and no template branding appears anywhere.
  assert.ok(!/\bMetis\b/i.test(await page.locator('body').innerText()));
  assert.ok(!/\b(PETI|PMI)\b/.test(await page.locator('#main-content').innerText()));
  assert.equal(
    await page.locator('.shell-presentation-code').innerText(),
    { 'surtec-peti': 'PETI', 'jy-pmi': 'PMI', 'jy-demo': 'Demo' }[variant]
  );
  assert.equal(errors.length, 0, errors.join('\n'));
}

async function verifyDemoTours(variant, expectedCount) {
  await page.locator('.shell-user-button').click();
  await page.getByRole('button', { name: 'Recorridos de demostración' }).click();
  await page.locator('#demo-tours-modal').waitFor({ state: 'visible' });
  assert.equal(await page.locator('.demo-tour').count(), expectedCount);
  const hrefs = await page
    .locator('.demo-tour-steps a')
    .evaluateAll((links) => links.map((link) => link.href));
  assert.ok(hrefs.every((href) => href.includes(`${pagesBase}${variant}/`)));
  for (const href of new Set(hrefs)) {
    assert.equal((await page.request.get(href)).status(), 200, `Paso sin página: ${href}`);
  }
  if (variant === 'jy-pmi') {
    assert.ok(!hrefs.some((href) => /warehouse|crm|budget\.html|biometria/.test(href)));
  }
  await page.locator('.demo-tour-steps a').first().click();
  await page.waitForURL(new RegExp(`${pagesBase}${variant}/${variant === 'jy-demo' ? 'client' : 'index'}\\.html`));
  assert.equal(errors.length, 0, errors.join('\n'));
}

async function verifyProjectFlow(variant, projectId) {
  const data = getDataForVariant(variant);
  const portfolio = getPortfolioFinancials(data);
  const project = data.projects.find((item) => item.id === projectId);
  const financials = getProjectFinancials(data, projectId);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(pageUrl(variant));
  // Entrega 3: flow and monthly charts are SVG; execution is accessible linked rows.
  // R3: J&Y Demo has no physical progress; "Proyecto en contexto" takes its place.
  const withProgress = variantRule('physicalProgress', getVariantConfig(variant));
  await page.waitForFunction(
    (progress) =>
      document.querySelectorAll('#dashboard-flow .chart-svg, #dashboard-monthly .chart-svg')
        .length === 2 &&
      (progress
        ? document.querySelectorAll('#dashboard-execution .exec-row').length > 0
        : document.querySelectorAll('.project-context-item').length > 0),
    withProgress
  );
  // KPI figures count up (~650 ms); read them once they settle.
  await page.waitForTimeout(900);
  assert.ok(
    (await page.locator('body').innerText()).includes(
      `S/ ${Math.round(portfolio.budgetAmount)
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}`
    )
  );
  if (variant === 'surtec-peti') {
    const lightProjectBackground = await page
      .locator('#global-project-select')
      .evaluate((element) => getComputedStyle(element).backgroundColor);
    await page.locator('[title="Cambiar tema"]').click();
    assert.equal(await page.locator('html').getAttribute('data-bs-theme'), 'dark');
    // Read contrast once the theme transition has settled.
    await page.waitForTimeout(500);
    const darkColors = await page.evaluate(() => ({
      nav: getComputedStyle(document.querySelectorAll('.sidebar-nav .nav-link')[1]).color,
      sidebarBackground: getComputedStyle(document.querySelector('.admin-sidebar')).backgroundColor,
      projectColor: getComputedStyle(document.querySelector('#global-project-select')).color,
      projectBackground: getComputedStyle(document.querySelector('#global-project-select'))
        .backgroundColor,
    }));
    const luminance = (color) => {
      const channels = color
        .match(/[\d.]+/g)
        .slice(0, 3)
        .map(Number);
      const linear = channels.map((channel) => {
        const value = channel / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      });
      return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
    };
    const contrast = (foreground, background) => {
      const a = luminance(foreground);
      const b = luminance(background);
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    };
    assert.notEqual(darkColors.projectBackground, lightProjectBackground);
    assert.ok(contrast(darkColors.nav, darkColors.sidebarBackground) >= 4.5);
    assert.ok(contrast(darkColors.projectColor, darkColors.projectBackground) >= 4.5);
    if (process.env.VISUAL === '1') {
      const out = path.join(root, 'tmp', 'shell-review');
      await mkdir(out, { recursive: true });
      await page.screenshot({ path: path.join(out, 'dashboard-dark.png'), fullPage: true });
    }
    await page.locator('[title="Cambiar tema"]').click();
  }
  await page.locator('.workspace-heading-actions a[href*="projects.html"]').click();
  await page.waitForURL(/projects\.html\?new=1$/);
  await page.locator('#project-create-modal').waitFor({ state: 'visible' });
  // Bootstrap ignores a close request while the opening fade is still running.
  await page.waitForFunction(() => {
    const modal = document.querySelector('#project-create-modal');
    return modal?.classList.contains('show') && document.body.classList.contains('modal-open');
  });
  await page.waitForTimeout(350);
  await page.locator('#project-create-modal [data-bs-dismiss="modal"]').last().click();
  // Wait for Bootstrap's fade-out: the backdrop must be gone before the table is clicked.
  await page.locator('#project-create-modal').waitFor({ state: 'hidden' });
  await page.locator('.modal-backdrop').waitFor({ state: 'detached' });
  if (process.env.VISUAL === '1' && variant === 'surtec-peti') {
    await page.screenshot({
      path: path.join(root, 'tmp', 'shell-review', 'projects-desktop.png'),
      fullPage: true,
    });
  }
  if (variant === 'surtec-peti') {
    await page.selectOption('#projects-status', 'En riesgo');
    assert.equal(
      await page.locator('.workspace-project-table tbody tr').count(),
      data.projects.filter((item) => item.status === 'En riesgo').length
    );
  }
  await page.selectOption('#projects-status', 'Activo');
  await page.locator('#projects-search').fill(projectId);
  assert.equal(await page.locator('.workspace-project-table tbody tr').count(), 1);
  await page.locator('.workspace-project-table .data-code').first().click();
  await page.waitForURL(/project\.html\?id=/);
  assert.equal(await page.locator('.workspace-detail-heading h1').innerText(), project.name);
  assert.equal(await page.locator('[role="tab"]').count(), 9);
  assert.equal(await page.locator('#global-project-select').inputValue(), projectId);
  assert.ok(
    (await page.locator('#panel-summary').innerText()).includes(
      `S/ ${financials.executedCost.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}`
    )
  );
  if (process.env.VISUAL === '1' && variant === 'surtec-peti') {
    await page.screenshot({
      path: path.join(root, 'tmp', 'shell-review', 'project-desktop.png'),
      fullPage: true,
    });
  }
  await page.locator('#tab-summary').focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await page.locator('#panel-purchases').waitFor({ state: 'visible' });
  assert.equal(new URL(page.url()).hash, '#purchases');
  assert.ok((await page.locator('#panel-purchases').innerText()).includes('Compras'));
  await page.locator('#panel-purchases .workspace-record-list a').first().click();
  await page.waitForURL(/purchase\.html\?id=/);
  assert.equal(
    await page.locator('.shell-page-heading h1').innerText(),
    data.operations.find((item) => item.projectId === projectId && item.type === 'purchase').id
  );
  await page.goBack();
  await page.locator('#panel-purchases').waitFor({ state: 'visible' });
  await page.locator('#tab-materials').click();
  await page.locator('#panel-materials').waitFor({ state: 'visible' });
  if (variant === 'surtec-peti') {
    assert.ok((await page.locator('#panel-materials .workspace-record-list a').count()) > 0);
  } else if (variant === 'jy-demo') {
    assert.match(await page.locator('#panel-materials').innerText(), /No hay registros de esta sección para el proyecto/);
    assert.equal(await page.locator('#panel-materials a[href*="warehouse.html"]').count(), 1);
  } else {
    assert.match(await page.locator('#panel-materials').innerText(), /no está habilitado/);
  }
  await page.locator('#tab-documents').click();
  await page.locator('#panel-documents').waitFor({ state: 'visible' });
  assert.equal(
    await page.locator('#panel-documents .workspace-record-list a').count(),
    getDocuments(data).filter((item) => item.projectId === projectId).length
  );
  await page.locator('#panel-documents .workspace-record-list a').first().click();
  await page.waitForURL(/document\.html\?id=/);
  assert.equal(await page.locator('#document-facts-title').count(), 1);
  await page.goBack();
  await page.locator('#panel-documents').waitFor({ state: 'visible' });
  await page.locator('.workspace-detail-heading a').click();
  await page.waitForURL(/projects\.html\?search=/);
  assert.equal(await page.locator('#projects-search').inputValue(), projectId);
  assert.equal(await page.locator('#projects-status').inputValue(), 'Activo');
  assert.equal(await page.locator('.workspace-project-table tbody tr').count(), 1);

  await page.setViewportSize({ width: 768, height: 900 });
  await page.reload();
  assert.ok(await page.locator('.workspace-project-card').isVisible());
  assert.ok((await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1);
  await page.locator('.workspace-project-card').click();
  await page.waitForFunction(() => window.AdminApp?.isInitialized);
  assert.ok((await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1);
  await page.locator('.workspace-detail-heading a').click();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  assert.ok(await page.locator('.workspace-project-card').isVisible());
  assert.ok((await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1);
  await page.locator('.workspace-project-card').click();
  await page.waitForFunction(() => window.AdminApp?.isInitialized);
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  );
  assert.ok((await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1);
  await page.locator('#tab-purchases').click();
  assert.ok((await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1);
  if (process.env.VISUAL === '1' && variant === 'surtec-peti') {
    const out = path.join(root, 'tmp', 'shell-review');
    await mkdir(out, { recursive: true });
    await page.screenshot({ path: path.join(out, 'project-mobile.png'), fullPage: true });
  }
  await page.goto(pageUrl(variant));
  await page
    .locator('#dashboard-flow-title')
    .locator('..')
    .locator('..')
    .getByRole('link', { name: 'Abrir ficha' })
    .click();
  await page.waitForURL(/project\.html\?id=.*from=home/);
  await page.locator('.workspace-detail-heading a').click();
  await page.waitForURL(/index\.html$/);
}

try {
  await openVariant('surtec-peti', 'SurTec Ingeniería y Tecnología S.A.C.', 15);
  await verifyDemoTours('surtec-peti', 5);
  assert.equal(await page.locator('.sidebar-nav [data-module="crm"]').count(), 1);
  assert.equal(await page.locator('.sidebar-nav [data-module="warehouse"]').count(), 1);
  assert.equal(await page.locator('.shell-notification-menu .shell-notification').count(), 6);
  await page.locator('[aria-label="Notificaciones: 6 pendientes"]').click();
  assert.ok(await page.locator('.shell-notification-menu').isVisible());
  await page.locator('[aria-label="Notificaciones: 6 pendientes"]').click();
  await page.locator('[data-sidebar-toggle]').click();
  assert.equal(
    await page.locator('[data-sidebar-toggle]').getAttribute('aria-label'),
    'Expandir menú lateral'
  );
  assert.ok(
    await page
      .locator('#admin-wrapper')
      .evaluate((el) => el.classList.contains('sidebar-collapsed'))
  );
  await page.locator('[data-sidebar-toggle]').click();

  await page.selectOption('#global-project-select', 'PR-2027-002');
  await page.waitForFunction(() =>
    document.querySelector('#dashboard-flow-title')?.textContent?.includes('PR-2027-002')
  );
  await page.reload();
  await page.waitForFunction(() =>
    document.querySelector('#dashboard-flow-title')?.textContent?.includes('PR-2027-002')
  );

  await page.locator('#global-search').fill('OC-025');
  await page.locator('.shell-search-result').first().click();
  await page.waitForURL(/purchase\.html\?id=OC-025/);
  assert.equal(await page.locator('.shell-page-heading h1').innerText(), 'OC-025');
  assert.equal(await page.locator('.sidebar-nav [data-module="purchases"].active').count(), 1);
  assert.equal(await page.locator('#global-project-select').inputValue(), 'PR-2027-001');
  // R1: a supplier result opens its record; its purchases keep the Compras filter.
  await page.locator('#global-search').fill('TechSupply');
  await page.locator('.shell-search-result').first().click();
  await page.waitForURL(/supplier\.html\?id=PROV-001/);
  await page.waitForFunction(() => window.AdminApp?.isInitialized);
  assert.equal(await page.locator('.sidebar-nav [data-module="suppliers"].active').count(), 1);
  await page
    .locator('.d9-tabs')
    .getByRole('tab', { name: /Órdenes de compra/ })
    .click();
  await page.getByRole('link', { name: 'Ver en Compras' }).click();
  await page.waitForURL(/purchases\.html\?supplier=PROV-001/);
  assert.equal(await page.locator('#purchases-supplier').inputValue(), 'PROV-001');

  await page.locator('.shell-header-actions [title="Cambiar tema"]').click();
  assert.equal(await page.locator('html').getAttribute('data-bs-theme'), 'dark');
  await page.reload();
  assert.equal(await page.locator('html').getAttribute('data-bs-theme'), 'dark');

  await page.evaluate(() => localStorage.removeItem('mockup-erp:surtec-peti:theme'));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(pageUrl('surtec-peti'));
  await page.waitForFunction(() => window.AdminApp?.isInitialized);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  assert.ok(overflow <= 1, `Desbordamiento horizontal móvil: ${overflow}px`);
  assert.ok(await page.locator('#admin-sidebar').evaluate((el) => el.inert));
  await page.locator('[data-sidebar-toggle]').click();
  assert.ok(await page.locator('#admin-sidebar').evaluate((el) => el.classList.contains('show')));
  assert.ok(!(await page.locator('#admin-sidebar').evaluate((el) => el.inert)));
  assert.equal(
    await page.locator('[data-sidebar-toggle]').getAttribute('aria-label'),
    'Cerrar menú lateral'
  );
  await page.keyboard.press('Escape');
  assert.ok(
    !(await page.locator('#admin-sidebar').evaluate((el) => el.classList.contains('show')))
  );
  assert.ok(await page.locator('#admin-sidebar').evaluate((el) => el.inert));

  await page.setViewportSize({ width: 768, height: 900 });
  await page.reload();
  const tabletOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - innerWidth
  );
  assert.ok(tabletOverflow <= 1, `Desbordamiento horizontal tablet: ${tabletOverflow}px`);

  if (process.env.VISUAL === '1') {
    const out = path.join(root, 'tmp', 'shell-review');
    await mkdir(out, { recursive: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    await page.screenshot({ path: path.join(out, 'surtec-mobile.png'), fullPage: true });
  }

  await verifyProjectFlow('surtec-peti', 'PR-2027-001');
  await verifyProjectFlow('jy-pmi', 'PR-JY-001');
  await verifyProjectFlow('jy-demo', 'PY-26-001');

  await page.setViewportSize({ width: 1440, height: 900 });
  await openVariant('jy-pmi', 'J&Y Ingenieros Consultores S.A.C.', 2);
  await verifyDemoTours('jy-pmi', 4);
  assert.equal(await page.locator('.sidebar-nav [data-module="crm"]').count(), 0);
  assert.equal(await page.locator('.sidebar-nav [data-module="warehouse"]').count(), 0);
  assert.equal(await page.locator('.sidebar-nav [data-module="reports"]').count(), 1);
  assert.equal(await page.locator('html').getAttribute('data-bs-theme'), 'light');

  // R1: own data set with four projects (PY-26-001…004).
  await openVariant('jy-demo', 'J&Y Ingenieros Consultores S.A.C.', 4);
  await verifyDemoTours('jy-demo', 6);
  assert.equal(await page.locator('.sidebar-nav [data-module="reports"]').count(), 1);
  assert.equal(await page.locator('.sidebar-nav [data-module="security"]').count(), 1);
  assert.equal(await page.locator('.sidebar-nav [data-module="warehouse"]').count(), 1);
  assert.equal(await page.locator('.sidebar-nav [data-module="payments"]').count(), 1);
  assert.equal(await page.locator('.sidebar-nav [data-module="administration"]').count(), 1);
  assert.equal(await page.locator('.sidebar-nav [data-module="expenses"]').count(), 1);
  await page.locator('[aria-label="Menú de usuario: Jean Estrada, Administrador"]').click();
  assert.ok(await page.locator('[data-shell-action="profile"]').isVisible());
  await page.locator('[data-shell-action="profile"]').click();
  assert.ok(await page.locator('.toast').first().isVisible());
  // Removed showcase pages return 404; BI remains restricted by variant.
  const legacyResponse = await page.request.get(pageUrl('jy-demo', 'users.html'));
  assert.equal(legacyResponse.status(), 404);
  await page.goto(pageUrl('jy-demo', 'analytics.html'));
  await page.waitForFunction(() => window.AdminApp?.isInitialized);
  assert.match(await page.locator('#main-content').innerText(), /no disponible/i);

  if (process.env.VISUAL === '1') {
    const out = path.join(root, 'tmp', 'shell-review');
    await mkdir(out, { recursive: true });
    await page.screenshot({ path: path.join(out, 'jy-demo-desktop.png'), fullPage: true });
    await page.goto(pageUrl('surtec-peti'));
    await page.screenshot({ path: path.join(out, 'surtec-desktop.png'), fullPage: true });
  }

  // Entrega 4: approvals inbox. Header and rail counters equal the inbox, and
  // a local approval lowers all of them without touching base records.
  await page.goto(pageUrl('surtec-peti', 'approvals.html'));
  await page.waitForFunction(() => window.AdminApp?.isInitialized);
  await page.evaluate(() => localStorage.removeItem('mockup-erp:surtec-peti:approval-decisions'));
  await page.reload();
  await page.waitForFunction(() => window.AdminApp?.isInitialized);
  assert.equal(await page.locator('.sidebar-nav [data-module="approvals"].active').count(), 1);
  const headerCount = Number(
    await page.locator('[data-approvals-link] [data-approvals-count]').innerText()
  );
  assert.ok(headerCount > 0);
  assert.equal(
    Number(await page.locator('.sidebar-nav [data-approvals-count]').innerText()),
    headerCount
  );
  const inboxTotal = await page.evaluate(() =>
    [...document.querySelectorAll('.workspace-tabs .tab-count')].reduce(
      (sum, el) => sum + Number(el.textContent),
      0
    )
  );
  assert.equal(inboxTotal, headerCount);
  await page.getByRole('tab', { name: /Rendiciones/ }).click();
  const expenseRow = page.locator('.approvals-workspace tbody tr').first();
  const expenseId = await expenseRow.locator('.data-code').first().innerText();
  await expenseRow.getByRole('button', { name: 'Aprobar' }).click();
  await page.getByRole('heading', { name: `¿Deseas aprobar la rendición ${expenseId}?` }).waitFor();
  await page.locator('.swal2-confirm').click();
  await page.waitForFunction(
    (expected) =>
      document.querySelector('[data-approvals-link] [data-approvals-count]')?.textContent ===
      String(expected),
    headerCount - 1
  );
  assert.ok((await page.locator('.approval-resolved').innerText()).includes(expenseId));
  await page.goto(pageUrl('surtec-peti', `expense.html?id=${expenseId}`));
  await page.waitForFunction(() => window.AdminApp?.isInitialized);
  assert.equal(await page.locator('.expense-detail-heading .badge').innerText(), 'Aprobada');
  assert.match(await page.locator('.expense-history').innerText(), /Decisión visual registrada/);
  await page.goto(pageUrl('surtec-peti', 'approvals.html?tab=expenses'));
  await page
    .locator('.approval-resolved')
    .getByRole('button', { name: 'Deshacer' })
    .first()
    .click();
  await page.waitForFunction(
    (expected) =>
      document.querySelector('[data-approvals-link] [data-approvals-count]')?.textContent ===
      String(expected),
    headerCount
  );
  for (const [tab, detailPage, expectedStatus] of [
    ['Presupuestos', 'budget', 'Aprobado'],
    ['Compras', 'purchase', 'Aprobada'],
  ]) {
    await page.getByRole('tab', { name: new RegExp(tab) }).click();
    const row = page.locator('.approvals-workspace tbody tr').first();
    const id = await row.locator('.data-code').first().innerText();
    await row.getByRole('button', { name: 'Aprobar' }).click();
    await page.locator('.swal2-confirm').click();
    await page.goto(pageUrl('surtec-peti', `${detailPage}.html?id=${id}`));
    await page.waitForFunction(() => window.AdminApp?.isInitialized);
    assert.equal(
      await page.locator('.workspace-detail-heading .badge').first().innerText(),
      expectedStatus
    );
    await page.goto(
      pageUrl(
        'surtec-peti',
        `approvals.html?tab=${detailPage === 'budget' ? 'budgets' : 'purchases'}`
      )
    );
    await page
      .locator('.approval-resolved li')
      .filter({ hasText: id })
      .getByRole('button', { name: 'Deshacer' })
      .click();
  }
  await page.goto(pageUrl('surtec-peti'));
  await page.locator('a', { hasText: 'Abrir bandeja' }).click();
  await page.waitForURL(/approvals\.html$/);

  // Hidden presentation switcher: not in the page until opened; Alt+Shift+P or
  // a triple click on the rail label; same screen in the other build when it
  // has the module, otherwise its Panel; the last presentation is remembered.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(pageUrl('surtec-peti', 'warehouse.html'));
  await page.waitForFunction(() => window.AdminApp?.isInitialized);
  assert.equal(await page.locator('#presentation-switcher').count(), 0);
  assert.equal(
    await page.evaluate(() => localStorage.getItem('mockup-erp:last-variant')),
    'surtec-peti'
  );
  await page.keyboard.press('Alt+Shift+KeyP');
  await page.locator('#presentation-switcher').waitFor({ state: 'visible' });
  assert.equal(await page.locator('.presentation-option').count(), 3);
  assert.equal(
    await page.locator('.presentation-option.is-current').getAttribute('data-variant'),
    'surtec-peti'
  );
  assert.match(
    await page.locator('a.presentation-option[data-variant="jy-pmi"]').getAttribute('href'),
    new RegExp(`${pagesBase}jy-pmi/index\\.html$`)
  );
  await page.locator('#presentation-switcher .btn-close').click();
  await page.locator('#presentation-switcher').waitFor({ state: 'detached' });
  await page.goto(pageUrl('surtec-peti', 'costs.html'));
  await page.waitForFunction(() => window.AdminApp?.isInitialized);
  await page.locator('.shell-presentation').click({ clickCount: 3 });
  await page.locator('#presentation-switcher').waitFor({ state: 'visible' });
  await page.locator('a.presentation-option[data-variant="jy-demo"]').click();
  await page.waitForURL(new RegExp(`${pagesBase}jy-demo/costs\\.html$`));
  await page.waitForFunction(() => window.AdminApp?.isInitialized);
  assert.equal(
    await page.evaluate(() => localStorage.getItem('mockup-erp:last-variant')),
    'jy-demo'
  );

  assert.equal(errors.length, 0, errors.join('\n'));
  console.log(
    'Shell, cambio oculto de presentación y recorrido Panel → Proyectos → Ficha → regreso: correctos en tres variantes.'
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
