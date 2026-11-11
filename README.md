# Mockup ERP · Gestión y Control de Proyectos

Prototipo frontend navegable de un ERP centrado en proyectos. Un mismo código produce tres presentaciones estáticas: **SurTec PETI**, **J&Y PMI** y **J&Y Demo**. Los datos y las acciones son de demostración; no hay backend, autenticación, OCR, biometría, pagos ni documentos reales.

La interfaz sigue el sistema visual [Red de Integración](DESIGN.md). Las decisiones funcionales y las cifras mock están documentadas en [PRODUCT.md](PRODUCT.md) y [docs/mockup-master.md](docs/mockup-master.md).

## Ejecutar localmente

Requiere Node.js 20.19+ o 22.13+ y npm 10+. En PowerShell:

```powershell
npm ci
npm run dev:all
```

Si npm falla por el certificado de este equipo, ejecuta `$env:NODE_OPTIONS='--use-system-ca'; npm ci`. La verificación TLS permanece activa.

Abre `http://localhost:3000/` para SurTec PETI, `http://localhost:3001/` para J&Y PMI y `http://localhost:3002/` para J&Y Demo. También puedes iniciar una sola presentación con `npm run dev:surtec`, `npm run dev:jy-pmi` o `npm run dev:jy-demo`.

En el menú de usuario, **Recorridos de demostración** ofrece enlaces a los escenarios disponibles en la presentación abierta. Los cambios de estado de la bandeja y los registros creados se guardan solo en este navegador, separados por variante.

## Compilar y comprobar

```powershell
npm run lint
npm run check:mock-data
$env:PAGES_BASE='/Mockup-ERP/'
npm run build:variants
npm run test:delivery10
npm run build
npm test
```

`build:variants` genera los tres sitios bajo `dist-pages/`. `build` genera una vista SurTec en `dist-modern/` para el smoke test. `npm run test:shell`, `test:commercial`, `test:expenses`, `test:personnel`, `test:warehouse`, `test:costs` y `test:delivery9` comprueban interacciones por módulo. `npm run icons` regenera los iconos usados tras cambiar clases `bi-*`.

Para previsualizar las mismas subrutas de GitHub Pages: `npm run preview:pages`. Abre `http://127.0.0.1:4174/Mockup-ERP/surtec-peti/`, `/jy-pmi/` o `/jy-demo/`. Sustituye `PAGES_BASE` por la ruta real del repositorio si cambia el nombre.

El workflow [.github/workflows/pages.yml](.github/workflows/pages.yml) publica `dist-pages/` cuando se ejecuta en GitHub Actions. **Los commits locales no se publican solos**: hay que hacer `git push` y comprobar el workflow. El repositorio se configura en *Settings → Pages → Source: GitHub Actions*.

## Estructura

- `src-modern/`: 25 vistas ERP, Alpine.js y SCSS.
- `src-modern/scripts/data/`: datos ficticios y operaciones compartidas por identificador.
- `src-modern/scripts/charts/`: gráficos D3 accesibles.
- `scripts/app-shell-template.mjs`: shell y marca por presentación.
- `docs/prompts/`: protocolo y entregas del rediseño.

El proyecto deriva de una plantilla Bootstrap bajo licencia MIT; consulta [LICENSE.md](LICENSE.md) para su atribución. La interfaz actual usa Vite, HTML, Bootstrap, Alpine.js, D3 y SCSS.
