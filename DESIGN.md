# DESIGN.md — Sistema visual del Mockup Maestro

Modo: **Operate** (herramienta de trabajo). La marca vive en los detalles precisos;
la claridad y la consistencia mandan sobre la expresión. Ver `PRODUCT.md`.

Implementación: `src-modern/styles/scss/abstracts/_variables.scss` (tokens) y
`src-modern/styles/scss/components/_design-system.scss` (capa común, se importa al final).

## Color

Cada variante declara dos colores en `src-modern/scripts/config/variants.js`
(`theme.primary`, `theme.accent`). `scripts/app-shell-template.mjs` deriva el resto para
claro y oscuro y lo inyecta como `--brand-*`. Bootstrap (`--bs-primary`, enlaces, foco,
paginación, progreso, checks) lee esos tokens; **no se usan hexes sueltos de marca**.

| Token | SurTec claro | Uso |
|---|---|---|
| `--brand-primary` | `#1A365D` Azul Corporativo | Títulos de identidad, etiqueta activa del menú |
| `--brand-solid` | `#1A365D` | Fondo del botón principal, avatar, contadores |
| `--brand-accent` | `#0066CC` Azul Integración | Enlaces, indicador activo, foco, serie 1 de gráficos |
| `--brand-accent-subtle` / `-border` | derivados | Fondos y bordes suaves (chips, menú activo, distintivo demo) |
| Texto secundario | `#4A5568` Gris Estructural (vía `--bs-secondary-color`) | Metadatos |
| Fondo | `#F7FAFC` Blanco Técnico (`--surface-app`) | Lienzo de la aplicación |

En oscuro, el botón principal pasa a `--brand-accent` y los textos de marca a tonos claros
derivados del acento (contraste AA). J&Y usa una paleta neutral (`#334155` / `#2563EB`)
hasta recibir una oficial.

### Estados (punto 145) — `src-modern/scripts/utils/status.js`
Un solo mapa estado → tono. En Alpine: `:class="$statusClass(item.status)"`; en JS:
`import { statusClass } from '../utils/status.js'`.

| Tono | Color | Estados |
|---|---|---|
| info | azul (acento) | Activo, Enviada, Emitida, Corregida, Conectado |
| neutral | gris | Borrador, Planificado, Cerrado/a, Vencido |
| success | verde | Aprobado/a, Atendida, Correcto, Completa, Registrado/a |
| warning | ámbar | Pendiente, En revisión, Observada, Suspendido, Incompleta, Stock bajo |
| danger | rojo | En riesgo, Rechazado/a, Perdido, Error |

Badges suaves (fondo tenue, texto oscuro del mismo tono), siempre con texto. Los
`.badge.text-bg-*` heredados se muestran con la misma paleta suave.

### Gráficos
Colores solo desde `utils/chart-palette.js`. La serie 1 toma `--brand-accent` de la variante.

## Tipografía
Inter (autoalojada). Escala única — **ningún texto bajo 12 px**:

| Token | px | Uso |
|---|---|---|
| `--fs-xs` | 12 | Contadores, encabezados de menú, captions |
| `--fs-sm` | 13 | Metadatos, badges, rango de paginación |
| `--fs-md` | 14 | Tablas, formularios, botones, texto de paneles |
| `--fs-base` | 16 | Lectura, menú lateral, subtítulo de página |
| `--fs-lg` | 18 | Títulos de panel/sección |
| `--fs-xl` | 20 | Encabezados secundarios |
| `--fs-2xl` | 28 | Título de página, cifras principales |

Cifras con `font-variant-numeric: tabular-nums` y alineadas a la derecha en tablas.
Sin etiquetas pequeñas en mayúsculas sobre los títulos ("eyebrows"): el título habla solo.
Excepción informativa: "PASO N DE 4" en flujos por pasos.

## Espacio y superficies
Tarjetas solo para agrupar contenido relacionado; nunca tarjetas anidadas. Paneles blancos
sobre lienzo `--surface-app`, sombra suave con desplazamiento. Máximo 4 gráficos por página.

## Componentes compartidos

### Header (generado por `scripts/app-shell-template.mjs`)
Logo oficial recortado a su área dibujada (archivo sin modificar; ver `LOGO_BOXES` en
`variants.js`) · búsqueda global · selector "Proyecto actual" con nombre corto ·
distintivo "Datos de demostración" · Aprobaciones con contador · tema · notificaciones por
categoría (Aprobación, Advertencia, Error) · usuario Jean Estrada / Administrador.

### Tabla — `utils/data-table.js` + `.data-*`
Referencia: `src-modern/projects.html`.
- Barra: búsqueda con ícono (`.data-toolbar-search`), filtros principales visibles,
  botón **Más filtros** (`.data-toolbar-more`) que abre `.data-toolbar-extra`.
- Chips de filtros aplicados (`.filter-chips`, `.filter-chip`) con × y "Limpiar filtros".
- Encabezados ordenables (`.data-sort` + `aria-sort`), código como enlace (`.data-code`),
  montos `.data-money` a la derecha.
- Acciones de fila en menú `⋮` (`.data-row-menu`, Popper `strategy: fixed`).
- Paginación (`.data-pagination`) bajo la tabla y bajo las tarjetas móviles.
- Columnas secundarias `.data-col-wide`: visibles desde 1600 px.
- Móvil: la tabla se sustituye por tarjetas.
- Estado vacío: ícono + mensaje + acción.

`tableControls()` solo expone métodos (sin getters), así que puede expandirse con `...`
en un componente Alpine. El componente define sus filtros y `onFiltersChange()`.

### Ayuda contextual
`<button type="button" class="help-tip" data-tip="Texto" aria-label="Ayuda: Texto">?</button>`
Tooltip solo CSS, accesible con teclado.

### Toasts y confirmaciones
Toasts: `window.AdminApp.notificationManager.success|info|warning(texto)`.
Confirmaciones: modal Bootstrap con pregunta concreta ("¿Deseas aprobar la rendición R-045?").

## Movimiento (emil-design-eng)
140–180 ms, `cubic-bezier(0.23, 1, 0.32, 1)`, solo `opacity`/`transform` (o `translate`/`scale`
cuando Popper ya usa `transform`). Menús entran desde su origen; botones responden con
`scale(0.97)`. Sin animaciones de scroll. Todo se desactiva con `prefers-reduced-motion`.

## Superficies del navegador
Selección, cursor, `accent-color`, anillos de foco y barras de desplazamiento toman la
paleta de la variante.
