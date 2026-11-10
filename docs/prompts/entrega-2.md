# Entrega 2 de 7 — Sistema visual "Red de Integración" y kit de gráficos D3

Trabajas en el Mockup Maestro de este repositorio. Sigue el **protocolo común** de
`docs/prompts/README.md`. Requisito: la Entrega 1 figura como **Terminada** en
`docs/plan-mejoras.md`. Lee sus "Notas de la Entrega 1", `PRODUCT.md` y `DESIGN.md`.

**Referencia visual aprobada por el usuario:** `docs/referencia/red-de-integracion.html`.
Ábrela en el navegador antes de empezar; es la fuente de verdad del estilo (colores,
tipografía, riel de navegación, franja de KPI, bloque protagonista, gráficos, movimiento).
`DESIGN.md` describe sus reglas. Si la referencia y el código actual chocan, gana la referencia.

## Objetivo
Que **toda la aplicación** cambie de aspecto, en las 3 variantes y en claro/oscuro, antes
de rediseñar pantallas concretas. Al terminar, cualquier vista existente ya debe verse con
el nuevo estilo aunque su contenido no cambie, y debe existir un kit de gráficos D3 listo
para las entregas siguientes. **No rediseñar todavía el contenido del Panel** (Entrega 3),
salvo lo mínimo para que no se rompa.

## Tareas

### A. Dependencias
- `npm install d3` (o solo los módulos necesarios: d3-selection, d3-scale, d3-shape,
  d3-transition, d3-array, d3-interpolate, d3-ease). Importar por módulos, nunca como global.
- Tipografía autoalojada: `@fontsource-variable/plus-jakarta-sans` (títulos y cifras) junto a
  `@fontsource-variable/inter` (cuerpo), ya instalada. Nada desde CDN (lo exige `npm test`).

### B. Tokens y tema (`_variables.scss`, `app-shell-template.mjs`, `variants.js`)
- Reemplazar la escala tipográfica por la de `DESIGN.md` (cuerpo 15 px, cifras 32 px,
  título de página 30 px, panel 18 px, mínimo 12,5 px). Actualizar los `--fs-*`.
- Paleta de superficies e ink de la referencia (claro y oscuro) y tokens nuevos:
  `--rail*` (riel), `--hero-a/--hero-b` (degradado), `--solid` (botón principal),
  serie de datos `--s1..--s4` + `--s-other`, estados `--good/--warn/--bad` y sus `-soft`.
  Los de marca se siguen derivando por variante en `app-shell-template.mjs`.
- J&Y: misma estructura con su paleta neutral (riel gris pizarra profundo, acento azul).

### C. Shell
- **Riel de navegación** azul profundo (en J&Y, pizarra) con el logo oficial recortado,
  grupos en mayúsculas pequeñas, ítem activo con fondo y filete interior, contador en
  "Aprobaciones" si aplica. Íconos de trazo uniforme (Bootstrap Icons).
- Header claro y limpio como la referencia; mantener todo lo de la Entrega 1 (búsqueda,
  proyecto actual, distintivo de demostración, aprobaciones, notificaciones, usuario).
- **Pantalla completa:** quitar el `max-width: 1700px` centrado de `.shell-page`; márgenes
  laterales consistentes. Revisar `_metis-restoration.scss` y eliminar lo que contradiga
  el nuevo estilo (o fusionarlo en `_design-system.scss`).

### D. Componentes visuales (`_design-system.scss`)
- **Franja de KPI** (`.kpi-strip` / `.kpi`): un panel con celdas divididas por líneas finas,
  etiqueta con punto de color, cifra grande en Plus Jakarta Sans, pie de contexto
  (píldora, mini barra o mini gráfico). Reutilizable en todos los módulos.
- **Bloque protagonista** (`.hero-panel`): degradado de marca + textura de red en canvas.
  Regla: máximo uno por pantalla.
- **Paneles**, botones, píldoras de estado (mantener `utils/status.js`), tablas, pestañas,
  modales, toasts y formularios con el nuevo estilo. Las tablas de la Entrega 1 conservan
  su comportamiento.
- **Movimiento** (`emil-design-eng`): conteo de cifras (`[data-count]`), gráficos que se
  dibujan al cargar, botones con escala al presionar, hover en filas y KPI, menús que
  entran desde su origen. Todo con `prefers-reduced-motion`.

### E. Kit de gráficos D3 (`src-modern/scripts/charts/`)
Un módulo por patrón, con la misma API (`render(element, data, options)` que devuelve
`{ update, destroy }`), colores desde tokens CSS, re-render al cambiar tema o tamaño,
tooltip compartido y `aria-label`/tabla alternativa:
- `flow.js` — trazabilidad (fuentes → ejecutado → presupuesto).
- `execution-bars.js` — ejecución frente al avance (barra + marca, rojo si adelantado).
- `area.js` — serie temporal con área degradada, cruz de lectura y punto final.
- `sparkline.js`, `split-bar.js`, `donut.js`, `bars.js` (barras finas redondeadas).
- `tooltip.js`, `theme.js` (lee tokens, observa `data-bs-theme`).
- Validar la paleta con la skill `dataviz` (`scripts/validate_palette.js`) en ambos modos.
Migrar a este kit los gráficos ApexCharts que ya existen **solo si es directo**; si no,
dejarlos funcionando y anotarlos en "Notas para la siguiente" (se migran en su entrega y
ApexCharts se elimina en la Entrega 7).

### F. Documentación
Actualizar `DESIGN.md` con lo que realmente quedó implementado (clases, tokens, API del kit).

## Fuera de alcance
Rediseñar el contenido de Panel, Proyectos o Ficha (Entrega 3) y de los demás módulos.

## Terminado cuando
- Todas las vistas de las 3 variantes muestran el nuevo estilo en claro y oscuro, sin
  regresiones de contraste ni desbordes (capturas antes/después a 1440 y 390 px).
- El kit D3 renderiza los patrones con datos reales en una página o en el Panel, con
  tooltips, animación de entrada y cambio de tema correcto.
- `npm test` sigue sin peticiones externas; verificación y cierre del protocolo completos.
