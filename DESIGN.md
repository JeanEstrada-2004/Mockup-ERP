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

J&Y conserva la misma estructura con su paleta neutral (riel pizarra profundo, acento
`#2563EB`) hasta recibir una oficial.

### Datos (validada con `dataviz/scripts/validate_palette.js`, ambos modos PASS)
Orden fijo, nunca rotado. Un 5.º grupo se pliega en "Otros" (`--s-other`, gris).

| Serie | Claro | Oscuro |
|---|---|---|
| `--s1` azul | `#0066cc` | `#3b88dc` |
| `--s2` verde azulado | `#0e9c8c` | `#1fa08f` |
| `--s3` ámbar | `#bf7a04` | `#c2861c` |
| `--s4` violeta | `#7b5cf5` | `#8670ea` |

### Estados (`src-modern/scripts/utils/status.js`, `$statusClass()` en Alpine)
Píldoras suaves con texto, nunca solo color. Tonos: `info` (acento), `neutral` (gris),
`success` (`--good`), `warning` (`--warn`), `danger` (`--bad`), cada uno con su `-soft`.
Los colores de estado están reservados: nunca son "serie 5" de un gráfico.

## Tipografía
- **Plus Jakarta Sans** (`@fontsource-variable/plus-jakarta-sans`): títulos y cifras,
  pesos 700–800, interletrado negativo (−0,02 a −0,04 em).
- **Inter** (`@fontsource-variable/inter`): cuerpo, tablas, formularios.
- Cifras siempre `tabular-nums`.

| Rol | Tamaño |
|---|---|
| Cifra protagonista (bloque destacado) | 52 px |
| Título de página / saludo | 30 px |
| Cifra de KPI | 32 px |
| Título de panel | 18 px |
| Cuerpo, tablas, formularios | 15 px (tablas densas 14 px) |
| Metadatos, píldoras | 12,5–13 px (mínimo absoluto 12 px) |

Sin etiquetas pequeñas en mayúsculas sobre los títulos. Excepciones informativas: grupos
del riel ("GENERAL", "GESTIÓN"…) y "PASO N DE 4".

## Composición
- **Pantalla completa:** sin ancho máximo centrado; márgenes laterales de 28 px (16 px en móvil).
- **Riel** de 232 px a la izquierda; header claro con búsqueda, proyecto actual, distintivo
  "Datos de demostración", aprobaciones, notificaciones y usuario.
- **Saludo** ("Buenos días, Jean") + contexto + acción principal a la derecha.
- **Franja de KPI:** un panel con celdas divididas por líneas finas (no tarjetas sueltas).
  Cada celda: etiqueta con punto de color, cifra grande, pie de contexto (píldora, mini barra
  o mini gráfico) en la misma posición. Toda la celda es un enlace a su módulo.
- **Bloque protagonista:** máximo uno por pantalla; degradado de marca, textura de red en
  canvas, cifra de 52 px, lista corta y un botón blanco.
- **Paneles:** radio 14 px, borde `--line`, sin sombra salvo el marco general. Cabecera con
  título, subtítulo de una línea y enlace "Ver … →" a la derecha.

## Gráficos — kit D3 (`src-modern/scripts/charts/`, desde la Entrega 2)
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
- Cifras de KPI que cuentan hasta su valor (≈650 ms).
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
