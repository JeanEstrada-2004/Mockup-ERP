import assert from 'node:assert/strict';
import http from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
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
    `Ir a Inicio de ${expectedName}`
  );
  assert.equal(await page.locator('#global-project-select option').count(), expectedProjects);
  assert.ok(
    await page.locator('.shell-logo--light').evaluate((img) => img.complete && img.naturalWidth > 0)
  );
  assert.equal(await page.locator('.shell-page-heading h1').innerText(), 'Panel General');
  assert.equal(await page.locator('.sidebar-nav a[href="#"]').count(), 0);
  assert.ok(
    await page
      .locator('.sidebar-nav a')
      .evaluateAll((links) =>
        links.every((link) =>
          /\/(index|projects|crm|budgets|purchases|expenses|personnel|warehouse|costs|documents|reports|integrations|security|settings|module-preview)\.html(?:\?|$)/.test(
            link.href
          )
        )
      )
  );
  assert.ok(!/\b(PETI|PMI|Metis)\b/i.test(await page.locator('body').innerText()));
  assert.equal(errors.length, 0, errors.join('\n'));
}

async function verifyProjectFlow(variant, projectId) {
  const data = getDataForVariant(variant);
  const portfolio = getPortfolioFinancials(data);
  const project = data.projects.find((item) => item.id === projectId);
  const financials = getProjectFinancials(data, projectId);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(pageUrl(variant));
  await page.waitForFunction(() => document.querySelectorAll('.apexcharts-canvas').length === 2);
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
  await page.locator('.workspace-heading-actions a').click();
  await page.waitForURL(/projects\.html$/);
  if (process.env.VISUAL === '1' && variant === 'surtec-peti') {
    await page.screenshot({
      path: path.join(root, 'tmp', 'shell-review', 'projects-desktop.png'),
      fullPage: true,
    });
  }
  if (variant === 'surtec-peti') {
    await page.selectOption('#projects-status', 'En riesgo');
    assert.equal(await page.locator('.workspace-project-table tbody tr').count(), 1);
  }
  await page.selectOption('#projects-status', 'Activo');
  await page.locator('#projects-search').fill(projectId);
  assert.equal(await page.locator('.workspace-project-table tbody tr').count(), 1);
  await page.locator('.workspace-table-project').click();
  await page.waitForURL(/project\.html\?id=/);
  assert.equal(await page.locator('.workspace-detail-heading h1').innerText(), project.name);
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
  await page.locator('#panel-operations').waitFor({ state: 'visible' });
  assert.ok((await page.locator('#panel-operations').innerText()).includes('Compras'));
  await page.locator('#panel-operations .workspace-record-list a').first().click();
  await page.waitForURL(/purchase\.html\?id=/);
  assert.equal(
    await page.locator('.shell-page-heading h1').innerText(),
    data.operations.find((item) => item.projectId === projectId && item.type === 'purchase').id
  );
  await page.goBack();
  await page.locator('#panel-operations').waitFor({ state: 'visible' });
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
  await page.locator('#tab-operations').click();
  assert.ok((await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1);
  if (process.env.VISUAL === '1' && variant === 'surtec-peti') {
    const out = path.join(root, 'tmp', 'shell-review');
    await mkdir(out, { recursive: true });
    await page.screenshot({ path: path.join(out, 'project-mobile.png'), fullPage: true });
  }
  await page.goto(pageUrl(variant));
  await page.locator('.workspace-quick-actions a').first().click();
  await page.waitForURL(/project\.html\?id=.*from=home/);
  await page.locator('.workspace-detail-heading a').click();
  await page.waitForURL(/index\.html$/);
}

try {
  await openVariant('surtec-peti', 'SurTec', 3);
  assert.equal(await page.locator('.sidebar-nav [data-module="crm"]').count(), 1);
  assert.equal(await page.locator('.sidebar-nav [data-module="warehouse"]').count(), 1);
  assert.equal(await page.locator('.shell-notification-menu .shell-notification').count(), 4);
  await page.locator('[aria-label="Notificaciones: 4 pendientes"]').click();
  assert.ok(await page.locator('.shell-notification-menu').isVisible());
  await page.locator('[aria-label="Notificaciones: 4 pendientes"]').click();
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
    document
      .querySelector('#sources-chart-title + .workspace-caption')
      ?.textContent?.includes('PR-2027-002')
  );
  await page.reload();
  await page.waitForFunction(() =>
    document
      .querySelector('#sources-chart-title + .workspace-caption')
      ?.textContent?.includes('PR-2027-002')
  );

  await page.locator('#global-search').fill('OC-025');
  await page.locator('.shell-search-result').first().click();
  await page.waitForURL(/purchase\.html\?id=OC-025/);
  assert.equal(await page.locator('.shell-page-heading h1').innerText(), 'OC-025');
  assert.equal(await page.locator('.sidebar-nav [data-module="purchases"].active').count(), 1);
  assert.equal(await page.locator('#global-project-select').inputValue(), 'PR-2027-001');
  await page.locator('#global-search').fill('TechSupply');
  await page.locator('.shell-search-result').first().click();
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
  await verifyProjectFlow('jy-demo', 'PR-JY-001');

  await page.setViewportSize({ width: 1440, height: 900 });
  await openVariant('jy-pmi', 'J&Y', 2);
  assert.equal(await page.locator('.sidebar-nav [data-module="crm"]').count(), 0);
  assert.equal(await page.locator('.sidebar-nav [data-module="warehouse"]').count(), 0);
  assert.equal(await page.locator('.sidebar-nav [data-module="reports"]').count(), 1);
  assert.equal(await page.locator('html').getAttribute('data-bs-theme'), 'light');

  await openVariant('jy-demo', 'J&Y', 2);
  assert.equal(await page.locator('.sidebar-nav [data-module="reports"]').count(), 0);
  assert.equal(await page.locator('.sidebar-nav [data-module="security"]').count(), 0);
  assert.equal(await page.locator('.sidebar-nav [data-module="expenses"]').count(), 1);
  await page.locator('[aria-label="Menú de usuario de demostración"]').click();
  assert.ok(await page.locator('[data-shell-action="profile"]').isVisible());
  await page.locator('[data-shell-action="profile"]').click();
  assert.ok(await page.locator('.toast').first().isVisible());
  const legacyResponse = await page.request.get(pageUrl('jy-demo', 'analytics.html'));
  assert.equal(legacyResponse.status(), 404);

  if (process.env.VISUAL === '1') {
    const out = path.join(root, 'tmp', 'shell-review');
    await mkdir(out, { recursive: true });
    await page.screenshot({ path: path.join(out, 'jy-demo-desktop.png'), fullPage: true });
    await page.goto(pageUrl('surtec-peti'));
    await page.screenshot({ path: path.join(out, 'surtec-desktop.png'), fullPage: true });
  }

  assert.equal(errors.length, 0, errors.join('\n'));
  console.log(
    'Shell y recorrido Panel → Proyectos → Ficha → regreso: correctos en tres variantes.'
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
