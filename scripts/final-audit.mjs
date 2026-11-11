import assert from 'node:assert/strict';
import http from 'node:http';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { NAV_GROUPS } from '../src-modern/scripts/config/modules.js';
import { getVariantConfig, VARIANT_IDS } from '../src-modern/scripts/config/variants.js';
import { getDataForVariant, getProjectFinancials } from '../src-modern/scripts/data/mock-data.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist-pages');
const pagesBase = process.env.PAGES_BASE || '/Mockup-ERP/';
assert.match(pagesBase, /^\/[^?#]*\/$/);
const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/manifest+json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

async function outputFile(pathname) {
  if (!pathname.startsWith(pagesBase)) return null;
  const relative = decodeURIComponent(pathname.slice(pagesBase.length));
  const file = path.resolve(dist, relative || '.');
  if (file !== dist && !file.startsWith(`${dist}${path.sep}`)) return null;
  try {
    const info = await stat(file);
    return info.isDirectory() ? path.join(file, 'index.html') : file;
  } catch {
    return null;
  }
}

const server = http.createServer(async (request, response) => {
  try {
    const file = await outputFile(new URL(request.url, 'http://localhost').pathname);
    if (!file) return response.writeHead(404).end('Not found');
    response.writeHead(200, {
      'Content-Type': contentTypes[path.extname(file)] || 'application/octet-stream',
    });
    response.end(await readFile(file));
  } catch {
    response.writeHead(404).end('Not found');
  }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const variantUrl = (variant, page = 'index.html') => `${origin}${pagesBase}${variant}/${page}`;
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const browserErrors = [];
page.on('pageerror', (error) => browserErrors.push(error.message));
page.on('console', (message) => {
  if (message.type() === 'error') browserErrors.push(message.text());
});
page.on('requestfailed', (request) => {
  const reason = request.failure()?.errorText || 'desconocida';
  if (reason.includes('ERR_ABORTED')) return; // A navigation can cancel an unfinished chart chunk.
  browserErrors.push(`Solicitud fallida: ${request.url()} (${reason})`);
});
page.on('request', (request) => {
  const url = request.url();
  if (!url.startsWith(origin) && !url.startsWith('data:') && !url.startsWith('blob:'))
    browserErrors.push(`Solicitud externa: ${url}`);
});
page.on('response', (response) => {
  if (response.status() >= 400) browserErrors.push(`HTTP ${response.status()}: ${response.url()}`);
});
const ready = () => page.waitForFunction(() => window.AdminApp?.isInitialized);

async function checkVisibleLinks(variant) {
  const links = await page
    .locator('a:visible')
    .evaluateAll((nodes) =>
      nodes.map((node) => ({ href: node.href, label: node.textContent.trim() }))
    );
  for (const link of links) {
    if (!link.href || link.href.startsWith('mailto:') || link.href.startsWith('tel:')) continue;
    const target = new URL(link.href);
    assert.equal(target.origin, origin, `Enlace externo: ${page.url()} → ${link.href}`);
    assert.ok(
      target.pathname.startsWith(`${pagesBase}${variant}/`),
      `Enlace fuera de la variante: ${page.url()} → ${link.href}`
    );
    assert.ok(await outputFile(target.pathname), `Enlace roto: ${page.url()} → ${link.href}`);
  }
}

async function checkBasicAccessibility() {
  assert.equal(await page.locator('html').getAttribute('lang'), 'es');
  assert.equal(await page.locator('#main-content').count(), 1);
  assert.equal(await page.locator('.skip-link').count(), 1);
  assert.ok((await page.locator('h1:visible').count()) >= 1, `Sin título: ${page.url()}`);
  const issues = await page.evaluate(() => {
    const visible = (node) => node.getClientRects().length > 0;
    const problem = [];
    for (const image of document.querySelectorAll('img')) {
      if (visible(image) && !image.hasAttribute('alt')) problem.push('imagen sin alt');
    }
    for (const control of document.querySelectorAll('input, select, textarea')) {
      if (!visible(control) || control.type === 'hidden') continue;
      const labelled =
        control.getAttribute('aria-label') ||
        control.getAttribute('aria-labelledby') ||
        control.closest('label') ||
        (control.id && document.querySelector(`label[for="${CSS.escape(control.id)}"]`));
      if (!labelled) problem.push(`control sin etiqueta: ${control.id || control.tagName}`);
    }
    for (const button of document.querySelectorAll('button')) {
      if (!visible(button)) continue;
      if (
        !button.textContent.trim() &&
        !button.getAttribute('aria-label') &&
        !button.getAttribute('title')
      )
        problem.push('botón sin nombre');
    }
    return problem;
  });
  assert.deepEqual(issues, [], `${page.url()}: ${issues.join(', ')}`);
}

async function checkVariant(variant) {
  const config = getVariantConfig(variant);
  const data = getDataForVariant(variant);
  const variantDir = path.join(dist, variant);
  const htmlPages = (await readdir(variantDir)).filter((file) => file.endsWith('.html'));
  // 22 views + design-system.html (Entrega 2) + approvals.html (Entrega 4).
  assert.equal(htmlPages.length, 24);
  const manifest = JSON.parse(await readFile(path.join(variantDir, 'manifest.json'), 'utf8'));
  assert.match(manifest.name, new RegExp(config.company.shortName.replace('&', '&')));
  assert.equal(manifest.start_url, './index.html');
  assert.equal(manifest.scope, './');
  for (const icon of manifest.icons)
    assert.ok(await outputFile(new URL(icon.src, variantUrl(variant, 'manifest.json')).pathname));
  const ownBrand = variant === 'surtec-peti' ? 'surtec' : 'jy';
  const otherBrand = ownBrand === 'surtec' ? 'jy' : 'surtec';
  assert.ok((await stat(path.join(variantDir, 'assets', 'brands', ownBrand))).isDirectory());
  await assert.rejects(stat(path.join(variantDir, 'assets', 'brands', otherBrand)));
  const jsFiles = (await readdir(path.join(variantDir, 'assets'))).filter((file) =>
    file.endsWith('.js')
  );
  assert.equal(
    (await readdir(path.join(variantDir, 'assets'))).filter((file) => file.startsWith('manifest-'))
      .length,
    0
  );
  const jsContent = (
    await Promise.all(
      jsFiles.map((file) => readFile(path.join(variantDir, 'assets', file), 'utf8'))
    )
  ).join('\n');
  if (ownBrand === 'surtec') {
    assert.ok(!jsContent.includes('OC-JY-001'));
    assert.ok(!jsContent.includes('PR-JY-001'));
  } else {
    assert.ok(!jsContent.includes('OC-025'));
    assert.ok(!jsContent.includes('PR-2027-001'));
  }

  await page.setViewportSize({ width: 1440, height: 900 });
  for (const html of htmlPages) {
    await page.goto(variantUrl(variant, html), { waitUntil: 'domcontentloaded' });
    await ready();
    const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href');
    assert.equal(
      new URL(manifestHref, page.url()).pathname,
      `${pagesBase}${variant}/manifest.json`
    );
    const body = await page.locator('body').innerText();
    // Entrega 2: the rail names the presentation (PETI / PMI / Demo) on purpose;
    // course names stay out of the page content and template text stays out entirely.
    assert.ok(!/\bMetis\b/i.test(body), `Texto de plantilla: ${html}`);
    const content = await page.locator('#main-content').innerText();
    assert.ok(!/\bPETI\b|\bPMI\b/.test(content), `Texto de curso en el contenido: ${html}`);
    assert.ok(!body.includes(ownBrand === 'surtec' ? 'J&Y' : 'SurTec'), `Marca ajena: ${html}`);
    await checkVisibleLinks(variant);
    await checkBasicAccessibility();
  }

  await page.goto(variantUrl(variant));
  await ready();
  const logo = page.locator('.shell-logo--light');
  assert.match(await logo.getAttribute('src'), new RegExp(`/brands/${ownBrand}/`));
  assert.ok(await logo.evaluate((image) => image.complete && image.naturalWidth > 0));
  assert.deepEqual(
    await page
      .locator('.sidebar-nav a')
      .evaluateAll((nodes) => nodes.map((node) => node.dataset.module)),
    NAV_GROUPS.flatMap((group) => group.modules).filter((id) => config.enabledModules.includes(id))
  );
  assert.equal(await page.locator('#global-project-select option').count(), data.projects.length);
  await page.locator('#global-search').fill(data.projects[0].id);
  await page.locator('.shell-search-result').first().waitFor();
  assert.match(
    await page.locator('.shell-search-results').innerText(),
    new RegExp(data.projects[0].id)
  );
  await page.locator('#global-search').fill('sin resultados xyz');
  assert.match(
    await page.locator('.shell-search-results').innerText(),
    /No se encontraron resultados/
  );
  await page.locator('#global-search').fill('');
  await page.locator('[title="Cambiar tema"]').click();
  assert.equal(await page.locator('html').getAttribute('data-bs-theme'), 'dark');
  assert.ok(
    await page
      .locator('.shell-logo--dark')
      .evaluate((image) => image.complete && image.naturalWidth > 0)
  );
  await page.locator('[title="Cambiar tema"]').click();
  assert.equal(await page.locator('html').getAttribute('data-bs-theme'), 'light');

  await page.setViewportSize({ width: 390, height: 844 });
  for (const html of htmlPages) {
    await page.goto(variantUrl(variant, html), { waitUntil: 'domcontentloaded' });
    await ready();
    await page.waitForTimeout(100);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    assert.ok(overflow <= 1, `Desbordamiento móvil ${overflow}px: ${variant}/${html}`);
  }
  console.log(
    `${variant}: 24 vistas, marca, alcance, enlaces, recursos, búsqueda, tema, accesibilidad y móvil correctos.`
  );
}

async function scenarioOne() {
  const config = getVariantConfig('surtec-peti');
  const financials = getProjectFinancials(getDataForVariant(config), 'PR-2027-001');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(variantUrl('surtec-peti'));
  await ready();
  await page.locator('#global-project-select').selectOption('PR-2027-001');
  await page.goto(variantUrl('surtec-peti', 'project.html?id=PR-2027-001'));
  await ready();
  const projectText = await page.locator('#main-content').innerText();
  assert.match(projectText, /185 000/);
  assert.match(projectText, /112 450/);
  await page.getByRole('link', { name: /Ver costos/ }).click();
  await ready();
  assert.match(
    await page.locator('.costs-source-row').filter({ hasText: 'Compras' }).innerText(),
    /47 230/
  );
  assert.equal(financials.executedCost, 112450);
  await page.locator('.costs-source-row').filter({ hasText: 'Compras' }).click();
  await page.getByRole('button', { name: 'OC-025', exact: true }).click();
  await page
    .locator('#cost-operation-detail')
    .getByRole('link', { name: 'Abrir operación de origen' })
    .click();
  await page.waitForURL(/purchase\.html\?id=OC-025/);
  await page.getByRole('link', { name: 'Documento mock' }).click();
  await page.waitForURL(/document\.html\?.*id=DOC-OC-025/);
  const documentFacts = await page
    .locator('#document-facts-title')
    .locator('xpath=ancestor::section')
    .innerText();
  assert.match(documentFacts, /OC-025/);
  assert.match(documentFacts, /Implementación de Infraestructura Tecnológica/);
  await page.getByRole('link', { name: 'Abrir proyecto' }).click();
  await page.waitForURL(/project\.html\?id=PR-2027-001/);
  console.log('Escenario 1: Panel → PR-2027-001 → Costos → Compras → OC-025 → documento correcto.');
}

try {
  await page.goto(`${origin}${pagesBase}`, { waitUntil: 'domcontentloaded' });
  await page.waitForURL(/\/jy-demo\/(?:index\.html)?$/);
  for (const variant of VARIANT_IDS) await checkVariant(variant);
  await scenarioOne();
  assert.deepEqual(browserErrors, []);
} finally {
  await context.close();
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
