# Entrega 2 de 6 — Panel General, Proyectos y Ficha Integral

Trabajas en el Mockup Maestro de este repositorio. Sigue el **protocolo común** de
`docs/prompts/README.md`. Requisito: la Entrega 1 figura como **Terminada** en
`docs/plan-mejoras.md`. Lee sus "Notas para la siguiente", `PRODUCT.md` y `DESIGN.md`.

## Objetivo
Las tres pantallas más importantes de la demostración (Bloque 1 de la especificación):
un usuario entra al Panel, entiende qué pasa, abre un proyecto y lo recorre completo.
Usa los componentes compartidos de la Entrega 1; no crees variantes nuevas de tabla, KPI o modal.

Antes de cada vista: `/impeccable critique <vista>`. Después: `/impeccable layout` y
`/impeccable distill` si hay saturación.

## Tareas

### A. Panel General (`src-modern/index.html`, `components/dashboard.js`)
- Título "Panel General", subtítulo "Visión consolidada de proyectos y operación".
- 6 KPI clicables: Proyectos activos (12) · Presupuesto activo (S/ 1 245 000) ·
  Costos acumulados (S/ 768 400) · Rendiciones pendientes · Órdenes pendientes · Alertas.
  Todas las cifras derivadas de `mock-data.js`, con una línea breve de contexto.
- Acciones rápidas con modal: + Nuevo proyecto, + Nueva rendición, + Nueva orden de
  compra, + Nuevo presupuesto. El de proyecto reutiliza el modal de la sección B;
  los demás abren un modal corto que lleva a la vista de creación del módulo.
- "Presupuesto vs. costo por proyecto" (ApexCharts, S/ miles) — al menos PR-2027-001/002/003.
- Donut de costos por fuente (Compras, Rendiciones, Personal, Materiales, Otros).
- Tabla "Proyectos relevantes": máx. 5 filas, filtro por estado, búsqueda, "Ver proyecto".
- Timeline de actividad reciente ("Hace 10 min — Rendición R-045 enviada", etc.)
  derivada de operaciones. Bloque de alertas.
- Máximo 2 gráficos; resumen primero, detalle después.

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
Crear presupuestos, OC o rendiciones reales (Entrega 3); rediseñar los módulos enlazados.

## Terminado cuando
- Escenario 1 del punto 156 recorrible: Panel → PR-2027-001 → Costos → Compras → OC-025 → documento.
- Las cifras coinciden entre Panel, Ficha y Costos en las 3 variantes.
- Escritorio y móvil revisados con capturas; verificación y cierre del protocolo completos.
