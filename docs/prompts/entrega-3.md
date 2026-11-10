# Entrega 3 de 7 — Panel General, Proyectos y Ficha Integral

Trabajas en el Mockup Maestro de este repositorio. Sigue el **protocolo común** de
`docs/prompts/README.md`. Requisito: la Entrega 2 figura como **Terminada** en
`docs/plan-mejoras.md`. Lee sus "Notas para la siguiente", `PRODUCT.md` y `DESIGN.md`.

## Objetivo
Las tres pantallas más importantes de la demostración (Bloque 1 de la especificación):
un usuario entra al Panel, entiende qué pasa, abre un proyecto y lo recorre completo.
Usa los componentes del sistema visual y el kit D3 de la Entrega 2 (y la tabla, estados y header de la Entrega 1); no crees variantes nuevas de tabla, KPI, gráfico o modal. La referencia visual exacta del Panel es `docs/referencia/red-de-integracion.html`.

Antes de cada vista: `/impeccable critique <vista>`. Después: `/impeccable layout` y
`/impeccable distill` si hay saturación.

## Tareas

### A. Panel General (`src-modern/index.html`, `components/project-views.js` › `dashboardView`)
Reproducir la composición aprobada de `docs/referencia/red-de-integracion.html`,
con datos reales de `mock-data.js` (nada fijo en el HTML) y en las 3 variantes:
- **Saludo:** "Buenos días, Jean" (según la hora) + línea de contexto (fecha de corte,
  proyectos en ejecución, clientes). Acciones a la derecha: "+ Nueva rendición" (secundaria)
  y "+ Nuevo proyecto" (principal). El título de página sigue siendo "Panel General"
  para breadcrumbs y `<title>`.
- **Franja de 6 KPI** en un solo panel con divisiones finas (no 6 tarjetas sueltas):
  Proyectos activos (barra activos/en riesgo) · Presupuesto activo (S/ 1 245 000) ·
  Costo acumulado (S/ 768 400 + mini gráfico + % ejecutado) · Rendiciones pendientes ·
  Órdenes por aprobar · Alertas; cada una con una píldora de contexto y enlace a su módulo.
  Cifras con conteo animado.
- **Bloque protagonista** con degradado de marca y textura de red: "N aprobaciones esperan
  tu revisión" con las 3 más antiguas y "Abrir bandeja" (desplegable del header hasta que
  exista `approvals.html` en la Entrega 4). Es el único bloque con degradado.
- **Trazabilidad del costo** del proyecto del selector (flujo D3: fuentes → ejecutado →
  presupuesto con ejecutado / comprometido / disponible), enlazado a Costos.
- **Ejecución frente al avance** (barras D3 por proyecto en ejecución; rojo si gasta más
  rápido que su avance) con enlace a Proyectos. Sustituye "Presupuesto vs. costo".
- **Costo mensual del portafolio** (área D3) derivado de las fechas de las operaciones.
- **Actividad reciente** (línea de tiempo) derivada de operaciones.
- Quitar el límite temporal `DASHBOARD_PROJECT_LIMIT` y el gráfico de barras ApexCharts.
- En J&Y Demo y PMI la composición es la misma con sus datos; lo que no aplique
  (por ejemplo, materiales) no aparece.

### B. Proyectos (`projects.html`, `components/project-views.js`)
- Columnas: Código · Proyecto · Cliente · Responsable · Avance · Presupuesto · Costo ·
  Estado · Acciones (`⋮`: Ver, Editar, Duplicar, Historial).
- Filtros visibles: buscar, estado; en "Más filtros": cliente, responsable, periodo.
  Chips de filtros aplicados. Estado en la URL (ya existe; conservarlo).
- Acción principal "+ Nuevo proyecto" → modal en 3 secciones (principal, económica,
  complementaria; campos del punto 14) → "Guardar proyecto"/"Cancelar" → toast
  "Proyecto creado" y la fila aparece (persistencia en `localStorage` con
  `variantStorageKey`, marcada como demostración y fuera de los totales).
- En móvil, filas como tarjetas.

### C. Ficha Integral (`project.html`)
- Breadcrumb Proyectos / PR-2027-001 / <pestaña>. Encabezado: código, nombre,
  cliente, responsable, estado, avance, fecha final, "Volver a Proyectos".
- 6 KPI: Presupuesto, Costo ejecutado, Disponible (S/ 72 550 en PR-2027-001), Avance,
  Documentos, Alertas.
- 9 pestañas: Resumen, Presupuesto, Compras, Rendiciones, Personal, Materiales,
  Costos, Documentos, Indicadores. Pestaña activa en el hash (`#costos`), navegable
  con teclado, y en móvil desplazable horizontalmente.
- Resumen: descripción, cronograma por hitos, responsables, alertas, últimas actividades,
  gráfico pequeño presupuesto vs. costo.
- Cada pestaña muestra un resumen de su módulo con enlace "Abrir en <módulo>"; cada
  registro enlaza a su ficha y cada ficha de módulo tiene "Ver proyecto" (punto 123).
- Materiales solo con datos en PETI; en las otras variantes, estado vacío explicativo.
- Selector de proyecto del header sincronizado con la ficha (ya existe; conservarlo).

## Fuera de alcance
Crear presupuestos, OC o rendiciones reales (Entrega 4); rediseñar los módulos enlazados.

## Terminado cuando
- Escenario 1 del punto 156 recorrible: Panel → PR-2027-001 → Costos → Compras → OC-025 → documento.
- Las cifras coinciden entre Panel, Ficha y Costos en las 3 variantes.
- Escritorio y móvil revisados con capturas; verificación y cierre del protocolo completos.
