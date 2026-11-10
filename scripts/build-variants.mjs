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
// Pages requires a root entry file. It reopens the last presentation used in
// this browser (stored by the app as `mockup-erp:last-variant`) and otherwise
// leads to the public J&Y demo. There is still no visible variant picker.
await writeFile(
  join(pagesDir, 'index.html'),
  `<!doctype html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <noscript><meta http-equiv="refresh" content="0;url=./jy-demo/"></noscript>
  <title>Plataforma de gestión de proyectos</title>
</head>
<body>
  <p>Abriendo la demostración… <a href="./jy-demo/">Continuar</a></p>
  <script>
    var target = 'jy-demo';
    try {
      var last = localStorage.getItem('mockup-erp:last-variant');
      if (${JSON.stringify(variants)}.indexOf(last) !== -1) target = last;
    } catch (error) {}
    location.replace('./' + target + '/');
  </script>
</body>
</html>
`,
  'utf8'
);
