# Entrega 5 de 7 — Personal y Tareo, Almacén y Materiales, Costos por Proyecto

Trabajas en el Mockup Maestro de este repositorio. Sigue el **protocolo común** de
`docs/prompts/README.md`. Requisito: la Entrega 4 figura como **Terminada** en
`docs/plan-mejoras.md`. Lee sus "Notas para la siguiente", `PRODUCT.md` y `DESIGN.md`.

## Objetivo
Mostrar cómo personal y materiales se convierten en costo del proyecto, y hacer de
Costos la vista donde todo costo tiene un origen identificable (Bloques 4 a 6).
`/impeccable critique` antes de cada vista; `/impeccable distill` en Costos para que
sea importante sin saturarse.

## Tareas

### A. Personal y Tareo (`personnel.html`, `worker.html`, `personnel-views.js`)
- Título "Personal y Tareo"; pestañas Personal, Asignaciones, Tareo, Biometría,
  Incidencias. Biometría e Incidencias **solo en PETI**.
- Personal: DNI · Trabajador · Cargo · Área · Estado · Proyectos · `⋮`.
- Ficha del trabajador: datos, cargo, área, proyectos, historial de tareo, asistencia,
  incidencias, costo imputable. No convertirlo en RR. HH. completo.
- Asignaciones: Trabajador · Proyecto · Rol · Desde · Hasta · % · botón "Asignar trabajador" (modal).
- Tareo: Trabajador · Proyecto · Fecha · Entrada · Salida · Horas · Estado; filtros;
  modal de registro manual (punto 52, conservar validaciones existentes).
- Biometría: "Sincronización Biométrica", tarjeta ZKTeco Oficina Principal ·
  Conectado · 08/11/2026 18:05 · 43 registros · 2 errores; tabla de registros
  (Juan Pérez 08:01–17:03 8h 02m Correcto; Ana Díaz 08:10 — Incompleto).
- Incidencias: falta entrada, falta salida, duplicada, no identificado;
  Corregir / Justificar / Ignorar con responsable, fecha y motivo.
- Franja compacta Biométrico → Asistencia → Tareo → Proyecto → Costo laboral.
- Tareo en móvil como tarjetas.

### B. Almacén y Materiales (`warehouse.html`, `material.html`) — solo PETI
- Pestañas: Inventario, Movimientos, Entradas, Salidas, Kardex, Almacenes.
- Inventario: Código · Material · Categoría · Unidad · Stock · Mínimo · Almacén · Estado;
  badge "Stock bajo" y su notificación (Conector RJ45 80/100; Cable UTP 1 250/300 sin alerta).
- Ficha de material: punto 60.
- Modales: Entrada (desde OC: OC → Recepción → Entrada), Salida (imputa costo al
  proyecto), Devolución, Transferencia.
- Kardex: Fecha · Documento · Movimiento · Entrada · Salida · Saldo · Proyecto/Origen.
- Conservar la regla de no duplicar costo entre OC de inventario y salidas.

### C. Costos por Proyecto (`costs.html`, `cost-views.js`)
- Selector de proyecto arriba.
- 5 KPI: Presupuesto S/ 185 000 · Comprometido S/ 128 700 · Ejecutado S/ 112 450 ·
  Disponible S/ 72 550 · Ejecución 60,8 % (PR-2027-001). Tooltip en "Costo comprometido":
  "Órdenes y obligaciones ya aprobadas que todavía pueden no haberse ejecutado."
- Gráfico presupuesto / comprometido / ejecutado y, en grande, el flujo de trazabilidad
  (`charts/flow.js`) del proyecto seleccionado: fuentes → ejecutado → presupuesto.
- Tabla por fuente (Compras 47 230 · Personal 30 362 · Rendiciones 15 743 · Materiales
  13 494 · Otros 5 621, con %) y drill-down fuente → operaciones (OC-025, OC-028…;
  R-041, R-045…) → documento.
- Tabla "Costos por partida": Partida · Presupuesto · Ejecutado · Variación · %;
  desviaciones resaltadas.
- Alertas: "Proyecto ha consumido X % del presupuesto con Y % de avance",
  "Partida 2.1 supera el presupuesto en 8 %" (derivadas de datos, no texto fijo).

## Fuera de alcance
Documentos, Reportes, BI y módulos de sistema (Entrega 6).

## Terminado cuando
- Escenarios 3 y 4 del punto 156 recorribles en PETI; PMI y J&Y Demo sin Almacén
  ni Biometría (también por URL directa).
- Cifras de Costos iguales a Panel y Ficha en las 3 variantes.
- Verificación y cierre del protocolo completos.
