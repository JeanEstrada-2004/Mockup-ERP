# Entrega 4 de 7 — Aprobaciones, Rendiciones, Presupuestos y Compras

Trabajas en el Mockup Maestro de este repositorio. Sigue el **protocolo común** de
`docs/prompts/README.md`. Requisito: la Entrega 3 figura como **Terminada** en
`docs/plan-mejoras.md`. Lee sus "Notas para la siguiente", `PRODUCT.md` y `DESIGN.md`.

## Objetivo
Los flujos operativos con aprobación (Bloques 2 y 3): crear, enviar, revisar, observar,
corregir y aprobar, más la experiencia móvil de Rendiciones. Reutiliza tabla, modales,
confirmaciones y toasts de las Entregas 1 y 2. `/impeccable critique` antes de cada vista,
`/impeccable adapt` para móvil, `/impeccable harden` para estados vacíos y errores.

## Tareas

### A. Bandeja de Aprobaciones (vista nueva)
- `src-modern/approvals.html` + componente + entrada en `vite.config.js` + caso en
  `main.js` (ver "Adding a New Page" en `CLAUDE.md`). Visible en las variantes que
  tengan al menos uno de presupuestos, compras o rendiciones.
- Título "Aprobaciones Pendientes"; pestañas Presupuestos, Compras, Rendiciones con contador.
- Tabla: Tipo · Código · Responsable · Proyecto · Monto · Fecha · Acción (Revisar, Aprobar
  con confirmación "¿Deseas aprobar la rendición R-045?", Observar con motivo).
- Conectar el botón de Aprobaciones del header a esta vista.

### B. Rendiciones (`expenses.html`, `expense.html`, `expense-views.js`)
- Lista: Código · Responsable · Proyecto · Fecha · Monto · Estado · Acciones; filtros
  proyecto, responsable, estado, periodo; "+ Nueva rendición".
- Detalle: tabla Fecha · Tipo · Documento · Concepto · V.V. · IGV · Total · Evidencia;
  totales rendido / documentado / no documentado; conceptos Valor de Venta, IGV,
  No Gravado y No Documentado visibles.
- "+ Agregar gasto" con Tomar foto / Subir imagen / Adjuntar PDF (simulados) →
  bloque "Datos propuestos por OCR" (RUC, proveedor, fecha, tipo, número, V.V., IGV,
  total) editable.
- Revisión administrativa en dos columnas: comprobante simulado | datos registrados;
  Aprobar gasto, Observar (modal motivo + comentario → estado Observada),
  Solicitar corrección.
- Trazabilidad: Creada → Enviada → Revisada → Observada → Corregida → Aprobada con
  fecha, usuario y comentario.
- **Mis Rendiciones (móvil):** pantalla con botón grande "+ Nueva rendición" →
  seleccionar proyecto → Tomar foto / Seleccionar archivo → OCR simulado →
  "Confirmar y enviar". Botones de al menos 48 px, una acción por pantalla.
  Conservar el recorrido actual de 4 pasos y su `localStorage`.

### C. Presupuestos (`budgets.html`, `budget.html`, `commercial-views.js`)
- Lista: Código · Cliente · Proyecto/Oportunidad · Versión · Fecha · Monto · Estado · `⋮`.
- "+ Nuevo presupuesto": cabecera del punto 25 + partidas jerárquicas (1 Infraestructura /
  1.1 Cableado / 1.2 Equipos; 2 Instalación / 2.1 Mano de obra / 2.2 Configuración) con
  Unidad, Cantidad, Costo unit., Precio unit., Total.
- Totales: subtotal, descuento, valor de venta, IGV, total, costo estimado, margen.
- Acciones: Guardar borrador, Enviar a revisión, Aprobar, Nueva versión, Duplicar,
  Generar PDF (modal "Documento generado correctamente"), Ver historial.
- Versiones V1–V3 con fecha, responsable, estado y vigente; nunca sobrescritura.
- Si PMI no tiene Presupuestos en alguna vista, respetar `enabledModules`.

### D. Compras (`purchases.html`, `purchase.html`)
- Lista: N.º OC · Proyecto · Proveedor · Fecha · Monto · Estado · `⋮`; filtros del punto 31.
- "+ Nueva orden de compra": datos del punto 32 y detalle Producto/Servicio · Cantidad ·
  Unidad · Precio · IGV · Total; partida presupuestaria, centro de costo, cotización adjunta.
- Acciones: Guardar borrador, Enviar a aprobación, Aprobar, Emitir, Registrar recepción,
  Generar documento, Ver historial.
- Alerta no bloqueante: "Advertencia: esta compra supera el saldo disponible de la
  partida seleccionada."
- "Ver proyecto" en cada OC.

Las acciones simuladas no alteran costos ejecutados del conjunto base (mantener la
regla actual documentada en `mockup-master.md`).

## Fuera de alcance
Almacén, Personal y Costos (Entrega 5).

## Terminado cuando
- Escenario 2 del punto 156 recorrible en móvil (390 px) y escritorio.
- La bandeja muestra lo pendiente de las 3 áreas y el contador del header coincide.
- Verificación y cierre del protocolo completos.
