# DESIGN.md — Sistema visual "Red de Integración"

**Referencia aprobada por el usuario (10/11/2026):** `docs/referencia/red-de-integracion.html`.
Ábrela en el navegador: es la fuente de verdad. Este documento resume sus reglas.

Modo **Operate** (herramienta de trabajo): claridad y consistencia primero, con una
identidad propia y reconocible. Ver `PRODUCT.md`.

## Concepto
El logo de SurTec es una **S hecha de nodos conectados**. La interfaz usa esa red como
metáfora del sistema: cada sol de costo llega al proyecto desde un origen rastreable.
Se expresa en tres lugares, nunca como decoración suelta:
1. el **riel de navegación** azul profundo que ancla la marca;
2. un **bloque protagonista** por pantalla, con degradado de marca y textura de red;
3. **gráficos propios con D3** que muestran flujo y trazabilidad.

Todo lo demás es sobrio: fondo claro, paneles blancos, líneas finas.

## Color

### Superficies y texto
| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `--canvas` | `#f2f5f9` | `#08111f` | Fondo de la aplicación |
| `--panel` / `--panel-2` | `#ffffff` / `#f7f9fc` | `#0e1a2b` / `#122236` | Paneles / hover y campos |
| `--line` | `#e1e7ef` | `#1f3048` | Bordes y divisiones finas |
| `--ink` / `--ink-2` / `--ink-3` | `#0f1e33` / `#4a5568` / `#6b778a` | `#e8eef7` / `#aab7c9` / `#8090a6` | Texto principal / secundario / metadatos |

### Marca (por variante, derivada en `scripts/app-shell-template.mjs`)
| Token | SurTec claro | Uso |
|---|---|---|
| `--rail` | `#10264a` | Riel de navegación (en oscuro `#050c18`) |
| `--brand` | `#1A365D` Azul Corporativo | Títulos de identidad |
| `--solid` | `#1A365D` | Botón principal, avatar, contadores (en oscuro `#0b63c2`) |
| `--accent` | `#0066CC` Azul Integración | Enlaces, activo, foco, serie 1 |
| `--hero-a` → `--hero-b` | `#1A365D` → `#0066CC` | Degradado del bloque protagonista |

J&Y conserva la misma estructura con su paleta neutral (riel pizarra `#1C2533`, oscuro
`#0A0E15`, acento `#2563EB`) hasta recibir una oficial. Cada variante declara en
`variants.js` › `theme` sus colores base (`primary`, `accent`, `rail`, `railDark`,
opcional `series1Dark`); `brandTokens()` deriva el resto (`--rail-active`, `--rail-ink`,
`--rail-muted`, `--rail-indicator`, `--accent-soft`, `--hero-*`, `--s1` y los
`--brand-*` heredados) y los inyecta con `html:root` para ganar a los valores por
defecto de SurTec declarados en `_variables.scss`.

### Datos (validada con `dataviz/scripts/validate_palette.js`, ambos modos PASS)
Orden fijo, nunca rotado. Un 5.º grupo se pliega en "Otros" (`--s-other`, gris).
Revalidada el 10/11/2026 para las dos marcas sobre `--panel` (`#ffffff` / `#0e1a2b`):
el azul derivado de SurTec en oscuro (`#3b8ad8`) quedaba a ΔE 14,6 del verde azulado
(mínimo 15) y se fijó en `#3d85e6` (`theme.series1Dark` en `variants.js`, ΔE 17,3).
Cada fuente de costo conserva su color en todo gráfico (`COST_SOURCE_TOKENS` en
`project-views.js`): Compras `--s1`, Personal `--s2`, Rendiciones `--s3`,
Materiales `--s4`, Otros `--s-other`. Presupuesto `--s1`, ejecutado `--s2`,
comprometido `--s3`.

| Serie | Claro | Oscuro |
|---|---|---|
| `--s1` azul (acento de la variante) | SurTec `#0066cc` · J&Y `#2563eb` | SurTec `#3d85e6` · J&Y `#5787f0` |
| `--s2` verde azulado | `#0e9c8c` | `#1fa08f` |
| `--s3` ámbar | `#bf7a04` | `#c2861c` |
| `--s4` violeta | `#7b5cf5` | `#8670ea` |

### Estados (`src-modern/scripts/utils/status.js`, `$statusClass()` en Alpine)
Píldoras suaves con texto, nunca solo color. Tonos: `info` (acento), `neutral` (gris),
`success` (`--good`), `warning` (`--warn`), `danger` (`--bad`), cada uno con su `-soft`.
Los colores de estado están reservados: nunca son "serie 5" de un gráfico.

## Tipografía
- **Plus Jakarta Sans** (`@fontsource-variable/plus-jakarta-sans`, familia
  `'Plus Jakarta Sans Variable'`, token `--font-display`): títulos y cifras,
  pesos 700–800, interletrado negativo (−0,02 a −0,04 em).
- **Inter** (`@fontsource-variable/inter`, familia `'Inter Variable'`, token
  `--font-body`): cuerpo, tablas, formularios. Hasta la Entrega 2 el CSS pedía `'Inter'`
  y caía a Segoe UI; usar siempre los tokens.
- Cifras siempre `tabular-nums`.

| Rol | Tamaño |
|---|---|
| Cifra protagonista (bloque destacado) | 52 px |
| Título de página / saludo | 30 px |
| Cifra de KPI | 32 px |
| Título de panel | 18 px |
| Cuerpo, tablas, formularios | 15 px (tablas densas 14 px) |
| Metadatos, píldoras | 12,5–13 px (mínimo absoluto 12 px) |

Tokens: `--fs-xs` 12,5 · `--fs-sm` 13,5 · `--fs-md`/`--fs-base` 15 · `--fs-dense` 14 ·
`--fs-lg` 18 · `--fs-xl` 20 · `--fs-2xl` 28 · `--fs-page` 30 · `--fs-kpi` 32 · `--fs-hero` 52.

Sin etiquetas pequeñas en mayúsculas sobre los títulos. Excepciones informativas: grupos
del riel ("GENERAL", "GESTIÓN"…) y "PASO N DE 4".

## Composición
- **Pantalla completa:** sin ancho máximo centrado; márgenes laterales `--gutter`
  28 px (16 px en móvil). `_metis-restoration.scss` se eliminó.
- **Riel** de 232 px a la izquierda, a toda la altura (76 px contraído). Arriba, el logo
  oficial sin alterar sobre una placa del color de fondo de su archivo (`--logo-plate`:
  blanco en claro, negro / azul noche en oscuro) y la etiqueta de presentación
  (`variants.js` › `presentation`: **PETI** · TO-BE 2027–2030, **PMI** · ERP contractual,
  **Demo** · Propuesta para J&Y). Contraído: isotipo + código. En móvil el riel es un
  panel deslizable y el header muestra isotipo + nombre corto + código
  (`.shell-header-mark`). El `<title>` termina en "· SurTec PETI", "· J&Y PMI"…
- **Cambio oculto de presentación** (`components/presentation-switcher.js`): triple clic
  (o triple toque) sobre la etiqueta PETI/PMI/Demo del riel, o **Alt + Shift + P**. Abre la
  misma pantalla en otra presentación (o su Panel si no tiene el módulo). No hay selector
  visible. La raíz `/Mockup-ERP/` reabre la última presentación usada
  (`mockup-erp:last-variant`); sin ella, J&Y Demo.
- **Header** claro (70 px): menú, búsqueda, proyecto actual, distintivo
  "Datos de demostración", aprobaciones, notificaciones y usuario.
- **Saludo** ("Buenos días, Jean") + contexto + acción principal a la derecha.
- **Franja de KPI:** un panel con celdas divididas por líneas finas (no tarjetas sueltas).
  Cada celda: etiqueta con punto de color, cifra grande, pie de contexto (píldora, mini barra
  o mini gráfico) en la misma posición. Toda la celda es un enlace a su módulo.
- **Bloque protagonista:** máximo uno por pantalla; degradado de marca, textura de red en
  canvas, cifra de 52 px, lista corta y un botón blanco.
- **Paneles:** radio 14 px, borde `--line`, sin sombra salvo el marco general. Cabecera con
  título, subtítulo de una línea y enlace "Ver … →" a la derecha.

### Clases (`src-modern/styles/scss/components/_design-system.scss`)
| Clase | Uso |
|---|---|
| `.kpi-strip` (`--4`, `--5`; 6 por defecto) › `.kpi` | Franja de KPI; `a.kpi` enlaza a su módulo |
| `.kpi-label` + `.kpi-dot` (`--s2`, `--s3`, `--s4`, `--bad`) | Etiqueta con punto de color |
| `.kpi-value` (`small` para la unidad) · `.kpi-foot` | Cifra 32 px y pie de contexto |
| `.pill` + `.pill-info` / `-good` / `-warn` / `-bad` | Píldora de contexto |
| `.hero-panel` › `canvas.hero-net`, `.hero-top`, `.hero-figure`, `.hero-list`, `.hero-tag` | Bloque protagonista (uno por pantalla) |
| `.panel` › `.panel-head` | Panel con cabecera; `.shell-page .card` recibe el mismo aspecto |
| `.panel-grid--hero` (5/8) · `--wide` (7/5) · `--halves` · `.panel-stack` | Composiciones de la referencia |
| `.badge` + `$statusClass()` / `.status-badge--*` | Estados (sin cambios de API) |
| `.workspace-tabs`, `.d9-tabs`, `.personnel-tabs`, `.warehouse-tabs` | Un solo estilo de pestañas (subrayado animado) |
| `.legend`, `.legend--rows`, `.chart`, `.chart-tip`, `.chart-table`, `.exec-row` | Gráficos |

Ejemplo vivo de todo lo anterior con datos reales: **`design-system.html`** ("Sistema
visual", fuera del menú; se abre por URL). Es la referencia para las Entregas 3–7.

## Gráficos — kit D3 (`src-modern/scripts/charts/`, desde la Entrega 2)
API común: `render(element, data, options)` → `{ update(data, options), destroy() }`.
`options.label` da el nombre accesible; `options.table` (`{ columns, rows }`, función
de los datos o `false`) añade "Ver datos del gráfico". Colores siempre por token
(`'--s1'`…): `theme.js` los resuelve y observa `data-bs-theme`; `base.js` redibuja al
cambiar tema o ancho (sin repetir la animación) y respeta `prefers-reduced-motion`;
`tooltip.js` es un único tooltip compartido. Importar cada patrón por separado
(`import('../charts/flow.js')`); `charts/index.js` los reexporta.

| Módulo | `data` |
|---|---|
| `flow.js` | `{ sources: [{label, value, color, detail}], executed, budget, segments: [{label, value, color, note}] }` |
| `execution-bars.js` | `[{ id, name, budget, cost, progress, href }]`; `options.tolerance` = 5 |
| `area.js` | `[{ label, value, title }]`; `options.color`, `format`, `axis`, `valueLabel` |
| `sparkline.js` | `[number]`; `options.width`, `height`, `color` |
| `split-bar.js` | `[{ label, value, color }]` |
| `donut.js` | `[{ label, value, color, href }]`; `options.centerLabel`, `centerValue`, `legend`, `size` |
| `bars.js` | `{ categories, series: [{label, color, values}], colors? }`; `options.orientation: 'horizontal'` |

Migrados en la Entrega 2: Panel (barras + dona), Costos (barras horizontales) y
Reportes › BI (barras + dona). Ninguna vista del ERP usa ya ApexCharts; quedan solo las
páginas de muestra de Metis (fuera del build), `utils/apex.js` y `chart-palette.js`,
que se retiran en la Entrega 7.

Patrones aprobados en la referencia:
- **Trazabilidad del costo** (`flow.js`): fuentes → ejecutado → presupuesto
  (ejecutado / comprometido / disponible), una sola escala para todo el gráfico.
- **Ejecución frente al avance** (`execution-bars.js`): barra de ejecutado sobre el
  presupuesto + marca de avance físico; rojo (`--bad`) si gasta más de 5 puntos por encima
  de su avance.
- **Serie temporal** (`area.js`): curva monótona, área degradada, cruz de lectura, punto final.
- **Mini gráfico** (`sparkline.js`) y **barra dividida** (`split-bar.js`) dentro de KPI.
- Complementos: `donut.js`, `bars.js` (barras finas con extremos redondeados).

Reglas: un eje por gráfico; ejes y cuadrícula recesivos; texto en tokens de tinta, nunca en
el color de la serie; leyenda cuando hay 2 o más series; tooltip al pasar el mouse;
re-render al cambiar tema o tamaño; alternativa accesible (`aria-label` o tabla).
ApexCharts queda solo en lo aún no migrado y se elimina en la Entrega 7.

## Movimiento (emil-design-eng)
- Gráficos que se dibujan al cargar (barras crecen, líneas se trazan, flujos aparecen
  escalonados): 500–900 ms, `cubic-bezier(0.23, 1, 0.32, 1)`.
- Cifras de KPI que cuentan hasta su valor (≈650 ms) con la directiva de Alpine
  `x-count` (`x-count.money`, `x-count.pct`; `utils/motion.js`). El valor final queda en
  `aria-label` desde el primer cuadro.
- El contenido de la página entra una vez (opacidad + 6 px, 360 ms, escalonado).
- Textura de red del bloque protagonista: `canvas.hero-net`, dibujada por
  `mountHeroNetworks()` en `main.js` (determinista y redimensionable).
- Botones `scale(0.97)` al presionar; filas y celdas KPI con cambio de fondo al pasar.
- Menús que entran desde su origen (usar `translate`/`scale` cuando Popper ya usa `transform`).
- Sin animaciones de scroll. Todo se desactiva con `prefers-reduced-motion`.

## Componentes heredados de la Entrega 1 (se mantienen)
- **Tabla** (`utils/data-table.js` + `.data-*`, referencia `projects.html`): búsqueda,
  "Más filtros", chips de filtros aplicados, orden por columna, menú `⋮`, paginación,
  tarjetas en móvil, columnas `.data-col-wide` desde 1600 px.
- **Header:** logo oficial recortado a su área dibujada (`LOGO_BOXES` en `variants.js`;
  los archivos no se modifican), selector "Proyecto actual", distintivo de demostración,
  aprobaciones (`getPendingApprovals()`), notificaciones por categoría, usuario.
- **Ayuda contextual:** `<button class="help-tip" data-tip="…">?</button>`.
- **Toasts:** `window.AdminApp.notificationManager.success|info|warning(texto)`;
  confirmaciones con pregunta concreta ("¿Deseas aprobar la rendición R-045?").

## Superficies del navegador
Selección, cursor, `accent-color`, anillos de foco y barras de desplazamiento toman la
paleta de la variante.
