# Plan de mejoras del Mockup Maestro

Fecha: 10/11/2026. Fuente: brief maestro + segundo prompt (160 puntos) comparados
con las Entregas 1–10 descritas en `mockup-master.md`.

**Objetivo:** que el mockup cumpla la especificación completa y se vea como una
aplicación empresarial real: sobria, legible en proyector, con la identidad de
cada variante y sin saturación.

## Estado de las entregas

Cada entrega actualiza esta tabla al terminar (estado, commit y notas para la siguiente).
Los prompts de cada entrega están en `docs/prompts/`.

| Entrega | Estado | Commit | Notas para la siguiente |
|---|---|---|---|
| 1. Base de diseño | **Terminada** (10/11/2026) | `Entrega 1: base del sistema de diseño` | Ver "Notas de la Entrega 1" abajo |
| 2. Panel, Proyectos, Ficha | Pendiente | — | — |
| 3. Aprobaciones, Rendiciones, Presupuestos, Compras | Pendiente | — | — |
| 4. Personal, Almacén, Costos | Pendiente | — | — |
| 5. Documentos, Reportes, BI, CRM, Integraciones, Seguridad, Administración | Pendiente | — | — |
| 6. Limpieza y verificación final | Pendiente | — | — |

### Notas de la Entrega 1 (para la Entrega 2)

- **Portafolio:** 15 proyectos SurTec, no 12. Los 12 "en ejecución" (Activo + En riesgo)
  suman S/ 1 245 000 / S/ 768 400 (punto 6); además hay uno Planificado (PR-2027-013),
  uno Suspendido (PR-2027-014) y uno Cerrado (PR-2026-021) para mostrar todos los estados.
  Los proyectos 004–014 y 2026-021 tienen una operación por fuente (OC, TAR, R, AJ).
  PR-2027-001/002/003 no cambiaron. Nuevos: CLI-004/005, PER-004 María Salazar, PER-005 José Vargas.
- **Reportes y BI** abren filtrados en "En ejecución" (mismo conjunto que el Panel);
  el filtro permite "Todos los estados".
- **Panel:** el gráfico y "Proyectos relevantes" muestran temporalmente los 6 primeros
  proyectos en ejecución (`DASHBOARD_PROJECT_LIMIT` en `project-views.js`). Rediseñar en la
  Entrega 2 (6 KPI, acciones con modal). Los KPI siguen con el patrón antiguo de ícono.
- **Pendiente técnico:** `dashboardView.renderCharts()` importa `'apexcharts'` directamente;
  CLAUDE.md exige `utils/apex.js`. Corregir en la Entrega 2.
- **Tabla compartida:** referencia en `projects.html` (`utils/data-table.js`, clases `.data-*`).
  Las demás listas se migran en su entrega. Columnas `.data-col-wide` solo desde 1600 px.
- **Estados:** `utils/status.js` + `$statusClass()` en Alpine. Los `statusClass` locales de
  commercial/expense/personnel ya usan el compartido.
- **Header:** el botón de Aprobaciones abre un desplegable con `getPendingApprovals()`;
  en la Entrega 3 debe enlazar a `approvals.html`.
- **Avisos:** retiradas las alertas de cabecera y las etiquetas "ficticio/simulado" del HTML.
  Quedan textos así en `security-views.js`, `integration-views.js`, `administration-views.js`
  y en el catálogo "Clientes ficticios" de Administración → Entrega 5.
- **Pruebas cambiadas (intencional):** `shell-interaction-test.mjs` (etiqueta del logo,
  15 proyectos, 6 notificaciones, menú de usuario, riesgo derivado de datos, selector `.data-code`),
  `delivery-nine-interaction-test.mjs` (totales del portafolio, alcance "En ejecución",
  distintivo del header en lugar de la alerta de Integraciones),
  `personnel-interaction-test.mjs` (botón "Guardar decisión"), `validate-mock-data.mjs`
  (nuevos totales y los 5 estados).
- `npm run icons` ahora también escanea `scripts/app-shell-template.mjs`.

## Decisiones (confirmadas por el usuario el 10/11/2026)

1. **Avisos de demostración.** Se reemplazan los avisos repetidos ("No existe MFA",
   "No hay dispositivo conectado"…) por un solo distintivo "Datos de demostración"
   en el header y una nota en `Acerca de`. Dentro de las vistas se muestran estados
   simulados creíbles: MFA Activado, ZKTeco Conectado, Backup Correcto.
2. **Portafolio.** Se agregan proyectos SurTec hasta tener 12 en ejecución con
   S/ 1 245 000 de presupuesto y S/ 768 400 de costo (aplicado: 15 proyectos en total,
   ver notas de la Entrega 1). PR-2027-001/002/003 no cambian.
   Cada proyecto nuevo tiene operaciones mínimas que sustentan su costo, para que
   `check:mock-data` siga validando la coherencia.
3. **J&Y Demo** oculta Almacén (no se muestra como "Propuesta futura").
4. **Selector de variante** solo en desarrollo (`npm run dev`), nunca en el build publicado.

## Reglas de diseño (aplican a todas las entregas)

| Tema | Regla |
|---|---|
| Tipografía | Escala única: 12 / 13 / 14 / 16 / 20 / 28 px. Mínimo 12 px; tablas y formularios 14 px. Montos con `tabular-nums`, alineados a la derecha. |
| Color SurTec | `#1A365D` botón principal y títulos · `#0066CC` enlaces, activo, foco, serie 1 de gráficos · `#4A5568` texto secundario · `#F7FAFC` fondo. |
| Color J&Y | Paleta neutral actual hasta recibir una paleta oficial. |
| Estados | Azul = activo/info · Gris = borrador · Verde = aprobado · Ámbar = pendiente · Rojo = riesgo/rechazo. Tonos suaves, siempre con texto. |
| Espacio | Tarjetas solo para agrupar. Filas de tabla de ~44 px. Máximo 4 gráficos por página. |
| Movimiento | 150–200 ms, `ease-out`, solo `transform`/`opacity`. Menús que se abren desde su origen, toasts suaves, botones con respuesta al presionar. Sin animaciones de scroll. Respeta `prefers-reduced-motion`. |
| Acción principal | Una por pantalla, arriba a la derecha, con el color corporativo. |
| Íconos | Solo Bootstrap Icons (`npm run icons` tras cada ícono nuevo). |

Herramientas: **impeccable** (`init`, `document`, `critique`, `typeset`, `layout`,
`distill`, `clarify`, `adapt`, `audit`, `polish`), **emil-design-eng** (micro-interacciones),
**Playwright** (capturas a 1440 y 390 px, modo claro y oscuro) y **archify**
(diagramas para los informes, opcional).

---

## Entrega 1 — Base del sistema de diseño

**Contexto de diseño**
- `PRODUCT.md`: propósito, usuarios, variantes, tono y reglas de los dos prompts.
- `DESIGN.md`: tokens, escala, componentes y estados.

**Estilos**
- `_variables.scss`: `$primary` y escala tipográfica conectadas a la variante
  (`--brand-*` → `--bs-primary`, foco, enlaces, pestaña activa, gráficos).
- Unificar los ~90 `font-size` sueltos en las variables de la escala.
- Revisar `_metis-restoration.scss`: conservar el ritmo de Metis y quitar duplicados.
- `chart-palette.js`: primera serie con el color de marca de cada variante.

**Shell (header, menú lateral, footer)**
- Logos: tamaño y recorte correctos (SurTec más visible; J&Y sin recuadro blanco).
- Selector de proyecto: chip compacto "PR-2027-001 · Infraestructura Tecnológica" con lista desplegable.
- Usuario: "Jean Estrada · Administrador" con Perfil, Configuración y Cerrar sesión.
- Campana con categorías (Aprobación, Advertencia, Error, Sistema) y botón de Aprobaciones con contador.
- Distintivo único "Datos de demostración".

**Componentes compartidos** (un solo módulo JS + SCSS, reutilizado por todas las vistas)
- Tabla: búsqueda, filtros visibles + "Más filtros", chips de filtros aplicados, orden,
  paginación, menú `⋮`, estado vacío y paso a tarjetas en móvil.
- Toast, modal de confirmación, tooltip de ayuda `?`, tarjeta KPI clicable, badge de estado.

**Datos**
- 9 proyectos nuevos con clientes, responsables y operaciones mínimas.
- Usuario actual y notificaciones según el punto 3.

**Verificación:** lint, `check:mock-data`, build de 3 variantes, capturas antes/después,
pruebas actualizadas.

## Entrega 2 — Panel, Proyectos y Ficha Integral (Bloque 1)

**Panel General (`index.html`)**
- 6 KPI: Proyectos activos 12 · Presupuesto activo S/ 1 245 000 · Costos acumulados
  S/ 768 400 · Rendiciones pendientes · Órdenes pendientes · Alertas. Cada uno lleva a su módulo.
- Acciones rápidas con modal: Nuevo proyecto, Nueva rendición, Nueva OC, Nuevo presupuesto.
- Gráfico "Presupuesto vs. costo por proyecto" (S/ miles), donut de costos por fuente,
  tabla de 5 proyectos con filtro y búsqueda, timeline de actividad, alertas.

**Proyectos (`projects.html`)**
- Columnas del punto 13 (incluye Responsable y Acciones `⋮`).
- Filtros: buscar, cliente, responsable, estado, periodo.
- Modal "Nuevo proyecto" en 3 secciones (principal, económica, complementaria) → toast
  y el proyecto aparece en la lista (guardado en `localStorage`).

**Ficha Integral (`project.html`)**
- Encabezado con cliente, responsable, estado, avance y fecha final.
- 6 KPI: Presupuesto, Costo ejecutado, Disponible, Avance, Documentos, Alertas.
- 9 pestañas: Resumen, Presupuesto, Compras, Rendiciones, Personal, Materiales,
  Costos, Documentos, Indicadores. La pestaña queda en la URL (`#costos`) para
  breadcrumbs y regreso.
- Resumen: descripción, cronograma por hitos, responsables, alertas, últimas
  actividades y gráfico pequeño presupuesto vs. costo.

## Entrega 3 — Aprobaciones, Rendiciones, Presupuestos y Compras (Bloques 2 y 3)

**Bandeja de Aprobaciones (vista nueva `approvals.html`)**
- Pestañas Presupuestos, Compras y Rendiciones; tabla del punto 105;
  Revisar, Aprobar (con confirmación) y Observar (con motivo).

**Rendiciones**
- Lista con las columnas y filtros del punto 37.
- Revisión administrativa en dos columnas: comprobante simulado | datos registrados;
  Aprobar gasto, Observar, Solicitar corrección.
- Detalle con tabla del punto 42 y totales rendido / documentado / no documentado.
- Trazabilidad con fecha, usuario y comentario.
- **Mis Rendiciones (móvil):** botón grande "+ Nueva rendición" → proyecto → Tomar foto /
  Seleccionar archivo → "Datos propuestos por OCR" (editables) → Confirmar y enviar.

**Presupuestos**
- Crear presupuesto (cabecera del punto 25) con partidas jerárquicas (1 / 1.1 / 1.2…).
- Totales: subtotal, descuento, valor de venta, IGV, total, costo estimado y margen.
- Acciones: Guardar borrador, Enviar a revisión, Aprobar, Nueva versión, Duplicar,
  Generar PDF (modal "Documento generado"), Ver historial. Versiones V1–V3 sin sobrescritura.

**Compras**
- Crear OC (punto 32) con detalle, partida presupuestaria, centro de costo y cotización adjunta.
- Acciones: Guardar borrador, Enviar a aprobación, Aprobar, Emitir, Registrar recepción,
  Generar documento, Ver historial.
- Alerta no bloqueante cuando la OC supera el saldo de la partida.

## Entrega 4 — Personal, Almacén y Costos (Bloques 4 a 6)

**Personal y Tareo**
- Pestañas: Personal, Asignaciones, Tareo, Biometría (solo PETI), Incidencias (solo PETI).
- Modal "Asignar trabajador" y modal de registro manual de tareo (punto 52).
- Biometría: tarjeta ZKTeco Oficina Principal (Conectado, 08/11/2026 18:05, 43 registros, 2 errores) y registros biométricos.
- Incidencias: Corregir / Justificar / Ignorar con responsable, fecha y motivo.
- Diagrama compacto Biométrico → Asistencia → Tareo → Proyecto → Costo laboral.

**Almacén y Materiales (solo PETI)**
- Pestañas: Inventario, Movimientos, Entradas, Salidas, Kardex, Almacenes.
- Modales de Entrada (desde OC), Salida (imputa costo), Devolución y Transferencia.
- Badge "Stock bajo" y su notificación.

**Costos por Proyecto**
- Selector de proyecto, 5 KPI con tooltip en "Costo comprometido".
- Gráfico presupuesto / comprometido / ejecutado.
- Tabla por fuente con drill-down fuente → operaciones → documento.
- Tabla "Costos por partida" con variación y desviaciones resaltadas.
- Alertas del punto 73.

## Entrega 5 — Documentos, Reportes, BI, CRM, Integraciones, Seguridad y Administración (Bloques 7 y 8)

- **Documentos:** árbol por proyecto (Contratos, Presupuestos, Compras, Rendiciones,
  Personal, Planos, Informes, Entregables), tabla del punto 77, ficha con
  Vista previa / Descargar / Nueva versión / Historial y origen de documentos generados.
- **Reportes:** catálogo de 8 reportes con Ver y Exportar (toast).
- **BI (`analytics.html`, solo PETI):** filtros, 6 KPI, 4 gráficos (margen por proyecto,
  presupuesto vs. costo, costos por fuente, evolución mensual), tabla gerencial y
  drill-down Empresa → Proyecto → Fuente → Transacción.
- **CRM (solo PETI):** kanban de 6 columnas, ficha de oportunidad, acciones del punto 22
  y "Convertir en proyecto".
- **Integraciones (solo PETI):** 5 tarjetas con estado, historial de sincronización y
  error con "Revisar incidencias".
- **Seguridad:** pestañas Usuarios, Roles, Permisos, Sesiones, Auditoría y Backups;
  MFA Activado; matriz de permisos.
- **Administración:** pestañas Empresa, Catálogos, Parámetros, Notificaciones,
  Apariencia y Configuración general.

## Entrega 6 — Limpieza, recorridos de demostración y verificación final

- Quitar páginas y componentes heredados de Metis que no se usan; actualizar
  `main.js`, `package.json`, `CLAUDE.md`, `README.md` y `mockup-master.md`.
- Panel opcional "Recorridos de demostración" con los 5 escenarios del punto 156.
- `impeccable audit` + `polish` sobre todas las vistas; prueba de los 5 escenarios
  en las 3 variantes, escritorio y móvil, claro y oscuro.
- Opcional: diagramas con archify para PETI/PMI (flujo general, entidades, arquitectura TO-BE).

## Riesgos

- Las pruebas de interacción verifican textos y estructura actuales; cada entrega
  las actualiza junto con las vistas.
- Cambios de paleta y tipografía afectan a todas las páginas: por eso van primero y solos.
- Las cifras nuevas del portafolio deben pasar `check:mock-data` antes de usarse en vistas.
