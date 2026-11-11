// Captures the built variants (dist-pages/) for before/after comparisons.
// Usage (PowerShell): $env:PAGES_BASE='/Mockup-ERP/'; node scripts/capture-views.mjs <label>
// Optional env: VIEWS=index,projects  VARIANTS=surtec-peti  THEMES=light,dark  WIDTHS=1440,390
//               COLLAPSED=1 (desktop rail collapsed)  FULL=1 (full-page desktop)
import { mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

const label = process.argv[2] || 'capturas';
const base = process.env.PAGES_BASE || '/Mockup-ERP/';
const port = Number(process.env.PORT || 4181);
const list = (name, fallback) => (process.env[name] || fallback).split(',').filter(Boolean);

const variants = list('VARIANTS', 'surtec-peti,jy-pmi,jy-demo');
const themes = list('THEMES', 'light');
const widths = list('WIDTHS', '1440,390').map(Number);
const views = list(
  'VIEWS',
  'index,projects,project,approvals,budgets,budget,purchases,purchase,expenses,expense,personnel,worker,warehouse,material,payments,costs,documents,document,reports,analytics,crm,integrations,security,settings,module-preview,design-system'
);
const heights = { 1440: 900, 390: 844 };
const sampleIds = {
  'surtec-peti': {
    project: 'PR-2027-001',
    budget: 'PRE-001',
    purchase: 'OC-025',
    expense: 'R-045',
    worker: 'PER-001',
    material: 'MAT-001',
    document: 'DOC-OC-025',
  },
  'jy-pmi': {
    project: 'PR-JY-001',
    budget: 'PRE-JY-001',
    purchase: 'OC-JY-001',
    expense: 'R-JY-001',
    worker: 'PER-JY-001',
    document: 'DOC-OC-JY-001',
  },
  'jy-demo': {
    project: 'PY-26-001',
    budget: 'PR2602-0008',
    purchase: 'OC-26-005',
    expense: 'R-26-001',
    worker: 'PER-JY-001',
    material: 'MAT-01',
    document: 'DOC-OC-26-005',
  },
};

const outDir = resolve('screenshots', 'entregas', label);
await mkdir(outDir, { recursive: true });

const server = spawn(process.execPath, ['scripts/preview-pages.mjs'], {
  env: { ...process.env, PAGES_BASE: base, PORT: String(port) },
  stdio: ['ignore', 'pipe', 'inherit'],
});
await new Promise((ok) => server.stdout.once('data', ok));

const browser = await chromium.launch();
let count = 0;
try {
  for (const variant of variants) {
    for (const theme of themes) {
      for (const width of widths) {
        const context = await browser.newContext({
          viewport: { width, height: heights[width] || 900 },
          deviceScaleFactor: 1,
        });
        await context.addInitScript(
          ([key, value, collapsedKey, collapsed]) => {
            localStorage.setItem(key, value);
            if (collapsed) localStorage.setItem(collapsedKey, 'true');
          },
          [
            `mockup-erp:${variant}:theme`,
            theme,
            `mockup-erp:${variant}:sidebar-collapsed`,
            process.env.COLLAPSED === '1',
          ]
        );
        const page = await context.newPage();
        for (const view of views) {
          const sampleId = sampleIds[variant]?.[view];
          const query = sampleId ? `?id=${encodeURIComponent(sampleId)}` : '';
          const response = await page.goto(
            `http://127.0.0.1:${port}${base}${variant}/${view}.html${query}`,
            { waitUntil: 'load', timeout: 60000 }
          );
          if (!response || response.status() !== 200) continue;
          await page.waitForFunction(() => window.AdminApp?.isInitialized, null, {
            timeout: 60000,
          });
          await page.waitForTimeout(1200); // let entrance motion settle
          await page.screenshot({
            path: resolve(outDir, `${variant}-${view}-${width}-${theme}.png`),
            fullPage: process.env.FULL === '1' || width !== 1440,
          });
          count += 1;
          if (view === 'index') {
            await page.locator('.shell-user-button').click();
            await page.locator('[data-bs-target="#demo-tours-modal"]').click();
            await page.locator('#demo-tours-modal').waitFor({ state: 'visible' });
            await page.waitForFunction(() =>
              document.querySelector('#demo-tours-modal')?.classList.contains('show')
            );
            await page.waitForTimeout(400); // finish Bootstrap's fade before capturing
            await page.screenshot({
              path: resolve(outDir, `${variant}-recorridos-${width}-${theme}.png`),
            });
            count += 1;
            await page.locator('#demo-tours-modal .btn-close').click();
            await page.locator('#demo-tours-modal').waitFor({ state: 'hidden' });
          }
        }
        console.log(`${variant} · ${theme} · ${width}px: ${count} capturas acumuladas`);
        await context.close();
      }
    }
  }
} finally {
  await browser.close();
  server.kill();
}
console.log(`${count} capturas en ${outDir}`);
