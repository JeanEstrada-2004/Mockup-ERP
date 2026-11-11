# Convenciones de Mockup-ERP

Prototipo frontend sin backend. Vite compila 29 páginas en `src-modern/` y tres variantes fijas definidas en `src-modern/scripts/config/variants.js`. `src-modern/analytics.html` es la vista de BI de SurTec. No existen páginas de autenticación ni ejemplos operativos de la plantilla original.

## Antes de editar

Lee [PRODUCT.md](PRODUCT.md), [DESIGN.md](DESIGN.md), [docs/plan-mejoras.md](docs/plan-mejoras.md) y [docs/mockup-master.md](docs/mockup-master.md). La referencia visual aprobada está en `docs/referencia/red-de-integracion.html`; la especificación en `docs/especificacion/`. Respeta el alcance de `surtec-peti`, `jy-pmi` y `jy-demo`, y mantén los datos de las empresas separados. J&Y Demo se está realineando a los procesos reales de J&Y por fases (R1–R6, [docs/realineamiento-jy-demo.md](docs/realineamiento-jy-demo.md)): tiene datos propios (`data/jy-demo.js`, proyectos `PY-26-NNN`), reglas en `variant.rules` y marcas AS-IS / TO-BE / por validar (`data-maturity`). En HTML, `<!-- IF regla=valor --> … <!-- ELSE --> … <!-- /IF -->` y `<!-- INCLUDE nombre -->` (`src-modern/partials/`) se resuelven al compilar cada variante: así una página compartida lleva vistas propias del Demo sin enviarlas a PETI ni PMI.

## Comandos

```powershell
npm ci
npm run dev:all                  # puertos 3000, 3001, 3002
npm run icons                    # tras agregar un icono bi-*
npm run lint
npm run check:mock-data
$env:PAGES_BASE='/Mockup-ERP/'
npm run build:variants           # dist-pages/
npm run test:delivery10
npm run build                    # dist-modern/
npm test                         # smoke test de 29 páginas
```

Pruebas de interacción: `test:shell`, `test:commercial`, `test:expenses`, `test:personnel`, `test:warehouse`, `test:costs`, `test:delivery9`, `test:masters`, `test:jy-expenses`, `test:jy-control`, `test:delivery10`. `node scripts/capture-views.mjs <etiqueta>` toma capturas de variantes, temas y anchos configurables. `npm run preview:pages` sirve la estructura de Pages localmente.

## Arquitectura

- `src-modern/scripts/main.js`: entrada de las páginas con shell y registro de componentes Alpine.
- `scripts/app-shell-template.mjs`: inserta header, navegación, marca, manifiesto y recorridos de demostración según la variante.
- `src-modern/scripts/config/modules.js`: orden fijo del menú y rutas por módulo.
- `src-modern/scripts/data/`: datos mock compartidos, decisiones y registros locales separados por variante.
- `src-modern/scripts/charts/`: único kit de gráficos, basado en D3; API en `DESIGN.md`.
- `src-modern/styles/scss/components/_design-system.scss`: última capa visual; usa tokens de `DESIGN.md`.

Cada página con shell declara `data-page`, `<!-- APP_HEADER -->`, `<!-- APP_SIDEBAR -->` y `<!-- APP_FOOTER -->`. Los componentes Alpine se registran en `main.js` bajo el mismo nombre que usa su `x-data`. Las páginas adaptadas son entradas de `vite.config.js`; no agregues una pantalla a `input` sin revisar su alcance y su prueba de humo.

## Reglas

- Datos y cifras desde `src-modern/scripts/data/`, nunca montos ilustrativos copiados en HTML. Las acciones locales no deben alterar costos base ni compromisos. Usa `variantStorageKey` para `localStorage`.
- Solo gráficos del kit D3, colores por tokens. No añadas CDN ni peticiones externas en runtime.
- Sin `<script>` inline ni `onclick`; usa listeners o Alpine. No interpolar datos en `innerHTML`.
- Movimiento breve, `prefers-reduced-motion`, estados con texto y color, foco visible y controles cómodos en móvil.
- Nombres en español, fechas DD/MM/AAAA, montos `S/ 1 250.00` cuando llevan céntimos.
- Los logos oficiales están en `public-assets/assets/brands/`; no alteres sus proporciones ni los archivos.
- El subconjunto de Bootstrap Icons se genera con `npm run icons`; no edites `_bootstrap-icons-subset.scss` a mano. Evita ids o clases que empiecen por `bi-`, pues el generador los interpretaría como iconos.
- Si cambias una estructura que prueban los scripts de interacción, actualiza la aserción sin rebajar la comprobación funcional.

El workflow de Pages publica solo `dist-pages/`. No hagas `git push` ni afirmes que una versión local está publicada sin comprobarlo.
