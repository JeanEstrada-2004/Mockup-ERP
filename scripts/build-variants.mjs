import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';
import { build } from 'vite';

const variants = ['surtec-peti', 'jy-pmi', 'jy-demo'];
const pagesBase = process.env.PAGES_BASE;
const pagesDir = resolve('dist-pages');

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

  // Vite's publicDir copies every brand. Keep only the active company's
  // supplied assets in each published variant.
  const otherBrand = variant === 'surtec-peti' ? 'jy' : 'surtec';
  const otherBrandDir = resolve(outDir, 'assets', 'brands', otherBrand);
  if (!otherBrandDir.startsWith(`${outDir}${sep}`)) {
    throw new Error('Ruta de marca fuera del directorio de salida.');
  }
  await rm(otherBrandDir, { recursive: true, force: true });

  console.log(`${variant}: ${outDir} (base ${base})`);
}

await mkdir(pagesDir, { recursive: true });
await writeFile(join(pagesDir, '.nojekyll'), '');
// Pages requires a root entry file. The root leads to the public J&Y demo
// without exposing a variant picker or linking the presentations together.
await writeFile(
  join(pagesDir, 'index.html'),
  `<!doctype html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <meta http-equiv="refresh" content="0;url=./jy-demo/">
  <title>Plataforma de gestión de proyectos</title>
</head>
<body>
  <p>Abriendo la demostración de J&amp;Y… <a href="./jy-demo/">Continuar</a></p>
  <script>location.replace('./jy-demo/')</script>
</body>
</html>
`,
  'utf8'
);
