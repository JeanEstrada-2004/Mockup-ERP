# Plan de mejoras del Mockup Maestro

Fecha: 10/11/2026. Fuente: brief maestro + segundo prompt (160 puntos) comparados con las
Entregas 1–10 originales (`mockup-master.md`). Replanificado el mismo día tras aprobar el
estilo **"Red de Integración"** (`docs/referencia/red-de-integracion.html`).

**Objetivo:** que el mockup cumpla la especificación completa y se vea como una aplicación
empresarial real, atractiva y con identidad propia: legible en proyector, con gráficos
propios en D3, coherente en las 3 variantes y sin saturación.

## Estado de las entregas

Cada entrega actualiza esta tabla al terminar (estado, commit y notas para la siguiente).
Los prompts están en `docs/prompts/` (protocolo común en `docs/prompts/README.md`).

| Entrega | Estado | Commit | Notas para la siguiente |
|---|---|---|---|
| 1. Base técnica: datos, estados, tabla, header | **Terminada** (10/11/2026) | `Entrega 1: base del sistema de diseño` | Ver "Notas de la Entrega 1" |
| 2. Sistema visual "Red de Integración" + kit D3 | **Terminada** (10/11/2026) | `Entrega 2: sistema visual Red de Integración y kit D3` | Ver "Notas de la Entrega 2" |
| 3. Panel General, Proyectos y Ficha Integral | **Terminada** (10/11/2026) | `Entrega 3: panel, proyectos y ficha integral` | Ver "Notas de la Entrega 3" |
| 4. Aprobaciones, Rendiciones, Presupuestos, Compras | **Terminada** (10/11/2026) | `Entrega 4: aprobaciones, rendiciones, presupuestos y compras` | Ver "Notas de la Entrega 4" |
| 5. Personal, Almacén y Costos | Pendiente | — | — |
| 6. Documentos, Reportes, BI, CRM, Integraciones, Seguridad, Administración | Pendiente | — | — |
| 7. Cierre: quitar ApexCharts y Metis, recorridos, verificación final | Pendiente | — | — |

| Entrega | Qué se ve al terminar |
|---|---|
| 2 | Toda la aplicación con el nuevo estilo: riel azul profundo, Plus Jakarta Sans + Inter, cuerpo 15 px, pantalla completa, franja de KPI, bloque protagonista, paneles, tablas y modo oscuro. Kit D3 (flujo, ejecución, área, mini gráficos) y movimiento. |
| 3 | El Panel de la referencia con datos reales; Proyectos con alta; Ficha con 9 pestañas y sus gráficos. |
| 4 | Bandeja de Aprobaciones, revisión de rendiciones en dos columnas, "Mis Rendiciones" móvil, crear presupuesto y OC. |
| 5 | Personal con biometría e incidencias, Almacén con Kardex, Costos con el flujo de trazabilidad en grande. |
| 6 | Documentos en árbol, BI propio con D3, CRM kanban, Integraciones, Seguridad y Administración con estados creíbles. |
| 7 | Sin ApexCharts ni restos de Metis, recorridos guiados para la exposición, auditoría final en 3 variantes. |

### Notas de la Entrega 1 (para las siguientes)

- **Lo visual se rehace en la Entrega 2.** La Entrega 1 dejó cimientos que se conservan:
  datos, `utils/status.js`, `utils/data-table.js`, estructura del header, paleta por variante
  derivada en el build. Su capa de estilo (`_design-system.scss`, escala `--fs-*`) se
  reemplaza por la de `DESIGN.md`.
- **Portafolio:** 15 proyectos SurTec. Los 12 "en ejecución" (Activo + En riesgo) suman
  S/ 1 245 000 / S/ 768 400 (punto 6); además uno Planificado (PR-2027-013), uno Suspendido
  (PR-2027-014) y uno Cerrado (PR-2026-021). Los proyectos 004–014 y 2026-021 tienen una
  operación por fuente (OC, TAR, R, AJ). PR-2027-001/002/003 no cambiaron. Nuevos:
  CLI-004/005, PER-004 María Salazar, PER-005 José Vargas.
- **Reportes y BI** abren filtrados en "En ejecución" (mismo conjunto que el Panel).
- **Panel:** muestra temporalmente 6 proyectos (`DASHBOARD_PROJECT_LIMIT` en
  `project-views.js`) y gráficos ApexCharts; `renderCharts()` importa `'apexcharts'` directo
  en vez de `utils/apex.js`. Todo esto se sustituye en la Entrega 3 con el kit D3.
- **Tabla compartida:** referencia en `projects.html`. Las demás listas se migran en su entrega.
- **Header:** el botón de Aprobaciones abre un desplegable (`getPendingApprovals()`); en la
  Entrega 4 debe enlazar a `approvals.html`.
- **Avisos:** quedan textos "ficticio/de ejemplo" en `security-views.js`,
  `integration-views.js`, `administration-views.js` y el catálogo "Clientes ficticios" → Entrega 6.
- **Pruebas cambiadas (intencional):** `shell-interaction-test.mjs`,
  `delivery-nine-interaction-test.mjs`, `personnel-interaction-test.mjs`,
  `validate-mock-data.mjs` (detalle en el commit de la Entrega 1).
- `npm run icons` también escanea `scripts/app-shell-template.mjs`.

### Notas de la Entrega 2 (para las siguientes)

- **Usar lo que ya existe.** Componentes y clases en `DESIGN.md` › Clases; ejemplo vivo
  con datos reales en `design-system.html` ("Sistema visual", fuera del menú). No crear
  otra franja de KPI, otro bloque protagonista ni otro estilo de pestañas.
- **Gráficos:** solo el kit (`src-modern/scripts/charts/`), API `render(el, data, options)`
  → `{ update, destroy }`. Colores por token y por fuente con `COST_SOURCE_TOKENS`
  (`project-views.js`). Llamar `update()` al cambiar de proyecto: el kit ya redibuja con el
  tema y el tamaño (no escuchar `theme-change` en las vistas).
- **Cifras animadas:** `x-count`, `x-count.money`, `x-count.pct`. Las pruebas que lean un
  KPI recién cargado deben esperar ~900 ms o usar el `aria-label` del elemento.
- **Panel (Entrega 3):** ya tiene la franja de 4 KPI con conteo y sus dos gráficos en D3
  (barras + dona); falta la composición completa de la referencia (6 KPI, bloque
  protagonista, flujo, ejecución frente al avance, área mensual). `DASHBOARD_PROJECT_LIMIT`
  sigue en `project-views.js`. El cálculo del costo mensual por fecha de operación está en
  `design-system-view.js` (`monthlyCost()`): moverlo a `mock-data.js` al usarlo en el Panel.
- **ApexCharts:** ninguna vista del ERP lo usa. Quedan `utils/apex.js`, `chart-palette.js`,
  el chunk `vendor-charts`, la dependencia y las páginas de muestra de Metis → Entrega 7.
- **Riel:** muestra PETI / PMI / Demo por pedido del usuario (antes estaba prohibido).
  El contenido de las vistas sigue sin nombrar cursos. "Aprobaciones" no está en el riel
  hasta que exista `approvals.html` (Entrega 4): añadirla a `modules.js` con contador
  (`.shell-nav-count`).
- **Pendiente visual por módulo:** los KPI de Costos, Reportes, Almacén y Personal siguen
  como tarjetas (`.workspace-kpi`, `.costs-kpis`, `.d9-kpis`) con el estilo nuevo; pasarlos
  a `.kpi-strip` en su entrega. Costos muestra decimales con punto ("49.1 %") → Entrega 5.
- **Pruebas cambiadas (intencional):** `shell-interaction-test.mjs` y `final-audit.mjs`
  (PETI/PMI permitido en el riel, prohibido en `#main-content`; 23 páginas; gráficos
  `.chart-svg`), `cost-interaction-test.mjs`, `delivery-nine-interaction-test.mjs` y
  `smoke-test.mjs` (esperan el SVG del kit en vez de ApexCharts).
- **Capturas:** `npm run build:variants` y luego `node scripts/capture-views.mjs <etiqueta>`
  (PowerShell, `PAGES_BASE='/Mockup-ERP/'`); variables en la cabecera del script.

### Notas de la Entrega 3 (para las siguientes)

- **Panel:** seis KPI derivados del conjunto mock, bloque de aprobaciones, flujo D3 del
  proyecto seleccionado, ejecución de los 12 proyectos en curso, serie mensual y actividad.
  Los conteos pendientes son los de los registros existentes, no los ejemplos fijos de la
  especificación. `getMonthlyExecutedCost()` vive en `mock-data.js` y también alimenta
  `design-system.html`.
- **Proyectos:** filtros por búsqueda, estado, cliente, responsable y periodo. El modal de
  tres secciones crea copias locales con código `PR-DEMO-NNN`, persistidas con
  `variantStorageKey('demo-projects')`. No alteran los KPI ni las operaciones base.
  Los registros base se pueden duplicar; su acción Editar explica que la edición local
  se hace sobre una copia. La ficha de una copia no enlaza a costos inexistentes.
- **Ficha:** nueve pestañas con hash y teclado, seis KPI, cronograma resumido, operaciones,
  documentos y enlaces al módulo correspondiente. Materiales explica su ausencia en J&Y.
  El regreso conserva filtros de la lista.
- **Pruebas ajustadas por el cambio intencional de estructura:** `shell-interaction-test.mjs`
  y `cost-interaction-test.mjs`. `npm run lint`, `check:mock-data`, `build:variants`,
  `test:shell`, `test:costs` y `test:delivery10` pasan. Las capturas comparativas están en
  `screenshots/entregas/entrega-3-antes/` y `entrega-3-despues/` (ignoradas por Git).
- **Para la Entrega 4:** crear `approvals.html` y conectar el botón "Abrir bandeja" del
  Panel. Hoy abre el desplegable de aprobaciones del header. Mantener separados los
  cambios visuales de aprobación y los costos ejecutados del conjunto base.

### Notas de la Entrega 4 (para las siguientes)

- **Cambio oculto de presentación** (commit propio, antes de esta entrega): triple clic en
  la etiqueta PETI/PMI/Demo del riel o Alt + Shift + P. La raíz `/Mockup-ERP/` reabre la
  última presentación usada. Pedido del usuario; sigue sin haber selector visible.
- **Bandeja** `approvals.html` (módulo `approvals` en GENERAL, en las tres variantes):
  pestañas con contador, tabla compartida, Revisar / Observar (motivo + comentario) /
  Aprobar (confirmación "¿Deseas aprobar la rendición R-050?"). Decisiones locales en
  `approval-decisions` (`data/approval-demo.js`); `syncApprovalCounters()` mantiene iguales
  el contador del header, el del riel y la bandeja. El botón del header y "Abrir bandeja"
  del Panel llevan a esta vista (el desplegable del header se retiró).
- **Altas de demostración** (`components/commercial-forms.js`): "+ Nuevo presupuesto"
  (cabecera del punto 25, partidas jerárquicas 1/1.1/1.2/2/2.1/2.2 editables, subtotal,
  descuento, valor de venta, IGV, total, costo estimado y margen) y "+ Nueva orden de
  compra" (punto 32, detalle con IGV por línea, partida referencial, centro de costo,
  cotización y la alerta no bloqueante del punto 35). Se guardan en `demo-budgets` /
  `demo-purchases`, aparecen en una sección propia y no entran en totales ni costos.
- **Fichas:** presupuesto con Duplicar, Generar PDF ("Documento generado correctamente") y
  Ver historial; OC con Emitir, Generar documento e historial derivado del estado.
  "Ver proyecto" en ambas (punto 123).
- **Rendiciones:** filtros de responsable y periodo con chips; "Mis Rendiciones" como
  entrada móvil (botón de 56 px, últimas rendiciones); "+ Agregar gasto" con Tomar foto /
  Subir imagen / Adjuntar PDF simulados que usan un comprobante de ejemplo y abren la
  propuesta OCR. Se conserva el recorrido de 4 pasos y su `localStorage`.
- **Tablas:** encabezados en texto normal en todas las vistas (se anuló el uppercase de
  Metis en `.table thead th`).
- **Pendiente:** los importes de Rendiciones usan el formato `S/ 1,250.00` del módulo
  original; unificar a `S/ 1 250.00` (punto 134) cuando se toque Rendiciones otra vez.
  Las decisiones de la bandeja no cambian el estado mostrado en la ficha de cada registro
  base (son demostración separada).
- **Pruebas cambiadas (intencional):** `shell` (bandeja, contadores, atajo oculto),
  `commercial` (altas, Generar PDF, "Ver proyecto"), `expenses` (Mis Rendiciones,
  captura, filtros), `delivery-nine` ("Ver proyecto"), `final-audit` (24 páginas).
  Una corrida de `test:delivery10` falló una vez en una comparación `deepEqual` que no se
  pudo reproducir en dos corridas completas posteriores; vigilar si reaparece.

## Decisiones confirmadas por el usuario (10/11/2026)

1. **Estilo "Red de Integración"** aprobado tal como se ve en la referencia. Gana sobre
   cualquier regla anterior de este plan.
2. **Gráficos con D3** (kit propio en `src-modern/scripts/charts/`). ApexCharts se retira en
   la Entrega 7; `CLAUDE.md` ya lo indica.
3. **Avisos de demostración:** un solo distintivo "Datos de demostración" en el header y
   estados simulados creíbles en las vistas (MFA Activado, ZKTeco Conectado, Backup Correcto).
4. **Portafolio** de 12 proyectos en ejecución (15 en total) con las cifras del punto 6.
5. **J&Y Demo** oculta Almacén. **Selector de variante** solo en desarrollo.
6. **Modo claro** es el principal para exponer; el oscuro debe verse igual de cuidado.

## Reglas de diseño

Las reglas completas (colores, tipografía, composición, gráficos, movimiento) están en
`DESIGN.md` y la referencia visual en `docs/referencia/red-de-integracion.html`. Resumen:

| Tema | Regla |
|---|---|
| Identidad | Riel azul profundo, un único bloque con degradado por pantalla, resto sobrio. |
| Tipografía | Plus Jakarta Sans (títulos, cifras) + Inter (cuerpo). Cuerpo 15 px, KPI 32 px, página 30 px, mínimo 12 px. |
| Datos | Paleta `--s1..--s4` validada; colores de estado reservados; un eje por gráfico. |
| KPI | Franja única dividida por líneas; cada cifra con contexto (píldora, mini barra o mini gráfico). |
| Movimiento | Gráficos que se dibujan, cifras que cuentan, respuesta al presionar; 140–900 ms, ease-out, `prefers-reduced-motion`. |
| Acción principal | Una por pantalla, arriba a la derecha, botón sólido de marca. |
| Íconos | Solo Bootstrap Icons (`npm run icons` tras cada ícono nuevo). |

Herramientas: **impeccable** (`critique`, `layout`, `typeset`, `distill`, `clarify`,
`adapt`, `audit`, `polish`), **emil-design-eng** (movimiento), **dataviz** (validar
paleta y gráficos), **Playwright** (capturas a 1440 y 390 px, claro y oscuro) y
**archify** (diagramas para los informes, opcional).

## Riesgos

- Las pruebas de interacción verifican textos y estructura; cada entrega las actualiza
  junto con las vistas, sin debilitarlas.
- La Entrega 2 toca todas las páginas: va sola y antes de rediseñar contenidos.
- Mientras convivan D3 y ApexCharts (Entregas 2–6), los colores de ApexCharts deben leer
  los mismos tokens para no verse distintos.
- Las cifras nuevas deben pasar `check:mock-data` antes de usarse en vistas.
