import { resolve } from 'node:path';
import { build } from 'vite';

const variants = ['surtec-peti', 'jy-pmi', 'jy-demo'];
const pagesBase = process.env.PAGES_BASE;

if (pagesBase && (!pagesBase.startsWith('/') || !pagesBase.endsWith('/'))) {
  throw new Error('PAGES_BASE debe tener la forma /nombre-del-repositorio/');
}

for (const variant of variants) {
  const base = pagesBase ? `${pagesBase}${variant}/` : './';
  const outDir = resolve('dist-pages', variant);

  await build({
    mode: variant,
    base,
    logLevel: 'warn',
    build: { outDir, emptyOutDir: true },
  });

  console.log(`${variant}: ${outDir} (base ${base})`);
}
