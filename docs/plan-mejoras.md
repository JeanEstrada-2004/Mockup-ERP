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
| 5. Personal, Almacén y Costos | **Terminada** (10/11/2026) | `Entrega 5: personal, almacén y costos` | Ver "Notas de la Entrega 5" |
| 6. Documentos, Reportes, BI, CRM, Integraciones, Seguridad, Administración | **Terminada** (10/11/2026) | `Entrega 6: documentos, BI, CRM, seguridad, integraciones, reportes y administración` | Ver "Notas de la Entrega 6" |
| 7. Cierre: quitar ApexCharts y Metis, recorridos, verificación final | **Terminada** (10/11/2026) | `Entrega 7: limpieza, recorridos y auditoría final` | Ver "Notas de la Entrega 7" |

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
  Fallo intermitente encontrado y corregido: `shell-interaction-test.mjs` hacía clic en la
  tabla de Proyectos antes de que terminara de cerrarse el modal de alta (el fondo tapaba
  la tabla); ahora espera el cierre. Dos corridas completas seguidas pasan. Si reaparece el
  `deepEqual` intermitente de la auditoría, revisar esperas similares.

### Notas de la Entrega 5 (para las siguientes)

- **Costos:** franja de 5 KPI (Presupuesto, Comprometido con ayuda "?", Ejecutado,
  Disponible, Ejecución con avance físico), flujo de trazabilidad grande
  (`#cost-flow-chart`) y alertas derivadas: "PR-… ha consumido X % del presupuesto con
  Y % de avance" y "Partida … supera el presupuesto referencial en Z %". Porcentajes con
  coma decimal. Se retiraron las reglas de tarjetas de `_costs-workspace.scss`.
- **Flujo compartido:** `projectFlowData(projectId)` en `project-views.js` alimenta Panel,
  Costos y Sistema visual (antes había dos copias).
- **Personal y Tareo:** franja de 4 KPI, tira Biométrico → Asistencia → Tareo → Proyecto →
  Costo laboral (`.flow-steps`), columna Proyectos y menú ⋮, "Asignar trabajador"
  (`demo-assignments`). Biometría con estado creíble (decisión 3): ZKTeco · Oficina
  Principal, Conectado, 08/11/2026 18:05, 43 registros, errores = incidencias pendientes,
  "Sincronizar ahora" y tabla Trabajador · Fecha · Entrada · Salida · Horas · Estado.
  Nueva incidencia INC-002 "No identificado" (punto 92). Dispositivo en
  `personnel-data.js` › `BIOMETRIC_DEVICE`.
- **Almacén:** franja de KPI, pestaña Almacenes (`WAREHOUSES`) y modal "Registrar
  movimiento" (entrada desde OC, salida a proyecto con control de stock, devolución con
  estado del material, transferencia entre almacenes) guardado en `demo-movements`; no
  cambia stock, Kardex ni costos.
- **Para la Entrega 6:** Integraciones aún dice "Biometría · No configurada" mientras
  Personal muestra "ZKTeco Conectado"; alinear con `BIOMETRIC_DEVICE` y el error del
  punto 92 ("2 registros biométricos no pudieron asociarse…") con enlace a Incidencias.
- **Regla de builds:** los módulos de `data/` que no son `surtec.js`/`jy.js` se incluyen en
  todas las variantes; no escribir allí códigos ni nombres de una empresa (la auditoría
  lo detecta).
- **Pruebas cambiadas (intencional):** `personnel` (dispositivo, 2 incidencias,
  asignación), `warehouse` (7 pestañas, modal), `costs` (conteo animado, coma decimal,
  flujo), `validate-mock-data` (2 incidencias en PETI).

### Notas de la Entrega 6 (para la siguiente)

- **Documentos:** estructura por proyecto (Contratos, Presupuestos, Compras, Rendiciones,
  Personal, Planos, Informes, Entregables) con conteos y filtro por carpeta, filtro de
  responsable e indicador "Generados por el sistema". Ficha: Vista previa, Descargar
  (simulado), Nueva versión e Historial.
- **BI** en página propia `analytics.html` ("Inteligencia de Negocios", solo PETI; en PMI y
  Demo muestra "no disponible"). Usa el mismo `reportsWorkspace` (bandera `biPage`) y los
  mismos filtros que Reportes (+ Responsable); el enlace entre ambas conserva los filtros.
  6 KPI (rentabilidad estimada, presupuesto, costo, desviación promedio, en riesgo,
  rendiciones pendientes), margen estimado por proyecto (barras con negativos en rojo),
  presupuesto vs. costo, costos por fuente, evolución mensual (área) y tabla gerencial con
  desviación. Reportes conserva el catálogo de 8 reportes con "Exportar".
  Margen estimado = presupuesto − costo proyectado al cierre (ejecutado ÷ avance físico).
- **CRM** ("Gestión Comercial"): pipeline kanban de 6 etapas con OP-001…OP-006 (datos en
  `surtec.js`; solo la ganada tiene presupuesto y proyecto), KPI de pipeline ponderado,
  ficha con probabilidad y próxima acción, y acciones Generar presupuesto, Registrar
  actividad, Marcar como ganado/perdido (`crm-stages` local) y Convertir en proyecto.
- **Seguridad** ("Seguridad y Control de Acceso", `data/security-data.js`): 8 roles del
  punto 95, matriz Sí/Parcial/No, MFA Activado, sesiones con dispositivo/IP/ubicación,
  auditoría con acción y resultado, respaldos Correcto con historial.
- **Integraciones:** estados del punto 90 (ZKTeco Conectado y Backup Correcto salen de
  `BIOMETRIC_DEVICE` y `BACKUP`, igual que en Personal y Seguridad), historial de
  sincronización y el aviso del punto 92 con "Revisar incidencias".
- **Administración del Sistema:** 6 pestañas (Empresa con razón social, RUC, dirección,
  teléfono, correo, moneda y zona horaria; Catálogos; Parámetros; Notificaciones por
  categoría y canal; Apariencia con tema; Configuración general). SurTec tiene datos
  legales ficticios en `variants.js` › `company.legal`; J&Y (empresa real) muestra "Por
  completar con la empresa".
- **Kit D3:** `bars.js` horizontal admite valores negativos; `format.money` escribe
  "−S/ 4 610".
- **Trampa:** no usar ids ni clases que empiecen por `bi-` (el generador de íconos los toma
  como íconos de Bootstrap); por eso la página es `analytics-workspace`.
- **Para la Entrega 7:** la página vieja de Metis `analytics` ya no existe como plantilla
  (se reutilizó el nombre); el resto de páginas Metis siguen fuera del build. Pendientes
  anotados: formato `S/ 1,250.00` de Rendiciones y estado de registros tras aprobar en la
  bandeja; J&Y Demo con el alcance de PMI (decisión del usuario: después).
- **Pruebas cambiadas (intencional):** `delivery-nine` (documentos, BI en su página, CRM
  kanban, seguridad e integraciones con estados creíbles, 6 pestañas de administración),
  `shell` (analytics.html deja de ser página legada), `cost` (BI en `analytics.html`),
  `final-audit` (25 páginas), `validate-mock-data` (oportunidades sin proyecto).

### Notas de la Entrega 7 (cierre)

- Se retiraron las páginas, componentes, estilos, documentación de uso y assets de
  muestra que no intervenían en el ERP. La vista BI en `analytics.html` se conserva.
  ApexCharts y Prism salieron de `package.json`, del lockfile y de la configuración
  de Vite. Los favicon y manifiestos apuntan al isotipo de cada presentación.
- El menú de usuario abre los recorridos guiados. SurTec muestra los cinco escenarios;
  J&Y adapta compra y tareo a su alcance y omite el escenario comercial. Los enlaces
  permanecen dentro de la presentación actual.
- Rendiciones, compras y presupuestos muestran en la ficha y lista las decisiones
  locales de la bandeja. El estado original, los compromisos y los costos compartidos
  no se modifican. Rendiciones y otros importes con céntimos usan espacios en los miles.
- `shell-interaction-test.mjs` comprueba los recorridos por variante y el estado de
  la rendición tras aprobar. El capturador toma las 25 vistas con identificadores de
  ejemplo para las fichas. Capturas antes y después: `screenshots/entregas/entrega-7-*`
  (archivos locales ignorados por Git).
- La batería vigente pasa en las tres variantes y los cinco escenarios. El build
  final y las 25 páginas de humo se verifican tras la limpieza. La publicación
  pública sigue pendiente de `git push` y de comprobar GitHub Actions; ningún
  archivo se subió en esta entrega.

### Revisión de la Entrega 7 (Claude, tras el trabajo de Codex)

- Verificado: lint, `check:mock-data`, las tres variantes con `test:delivery10` y las 25
  páginas de humo pasan; ApexCharts, Prism y las páginas Metis están retirados; favicon y
  manifiesto por presentación; recorridos por variante (5 en SurTec, 4 en J&Y).
- Ajustes: los pasos de cada recorrido se numeran (1 → 2 → 3) para leer el orden; los
  logos de J&Y se sirven desde copias web reducidas (`assets/brands/jy/web/`, mismas
  proporciones, sin redibujo): cada página baja de ~3,5 MB a ~0,6 MB de imágenes. Los
  originales siguen en `assets/brands/jy/`.

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

## Siguiente etapa: realineamiento de J&Y Demo (11/11/2026)

El usuario decidió que J&Y Demo deje de ser una copia reducida de PMI y represente la
propuesta del futuro ERP interno de J&Y, con cada pieza marcada como AS-IS confirmado,
propuesta TO-BE o por validar. La auditoría, la matriz de alineamiento, la arquitectura de
vistas y el plan por fases (R1–R6) están en
[realineamiento-jy-demo.md](realineamiento-jy-demo.md). SurTec PETI y J&Y PMI conservan su comportamiento; solo suman Clientes y Proveedores. Antes
de R1 se resolvieron las decisiones D1–D5. **R1 terminada** (11/11/2026): datos propios del Demo, Clientes y Proveedores en las tres presentaciones y marcas de madurez; notas en la sección 10 de ese documento. **R2 terminada** (11/11/2026): rendiciones de J&Y con revisión administrativa (sección 11). **R3 terminada**: Costos y Control Contable, Documentos con vista previa, Pendientes e Inicio sin reglas no confirmadas (sección 12). **R4 terminada**: presupuestos técnicos (partidas, APU, insumos, productos, versiones), Productos y precios y OC con cotización de origen (sección 13). Siguiente: R5.
