# Especificación funcional detallada (segundo prompt)

> Transcripción compacta del segundo prompt del usuario (10/11/2026). Conserva la
> numeración de los 160 puntos y todos los datos, campos, botones y estados. Si el
> usuario aporta el texto original, reemplazar este archivo.

Mockup frontend navegable: sin backend, API, base de datos, autenticación ni
integraciones reales. Acciones simuladas con JS, Alpine.js, modales, tabs, memoria o
`localStorage`.

1. **El proyecto es la entidad central:** cliente, oportunidad, presupuesto, compras,
   OC, rendiciones, personal, tareo, materiales, almacén, documentos, costos,
   indicadores y alertas se consultan desde una vista integral.
2. **Sidebar:** GENERAL (Inicio, Proyectos) · GESTIÓN (CRM, Presupuestos, Compras,
   Rendiciones, Personal y Tareo, Almacén) · CONTROL (Costos, Documentos, Reportes y BI) ·
   SISTEMA (Integraciones, Seguridad, Administración). Tareo y Biometría dentro de
   Personal; Materiales y Kardex dentro de Almacén; Auditoría dentro de Seguridad o Administración.
3. **Header:** buscador "Buscar proyectos, clientes, documentos, órdenes..." (proyectos,
   clientes, proveedores, rendiciones, presupuestos, órdenes, documentos) · selector
   "Proyecto actual: PR-2027-001 · Infraestructura Tecnológica" · campana (ej. 6):
   R-045 pendiente de revisión, OC-028 requiere aprobación, stock de Cable UTP bajo,
   PR-2027-002 supera 80 % del presupuesto, error de sincronización biométrica ·
   usuario **Jean Estrada / Administrador** con perfil, configuración, cerrar sesión.
4. **Clientes:** Minera del Sur S.A. (RUC 20512345678, Minería) · Industrias Andinas
   S.A.C. (Industria) · Clínica Regional del Sur (Salud).
5. **Proyectos:** PR-2027-001 Implementación de Infraestructura Tecnológica · Minera del
   Sur · Carlos Mendoza · 10/01/2027–30/06/2027 · S/ 185 000 · S/ 112 450 · 67 % ·
   Activo. PR-2027-002 Sistema de Seguridad Electrónica · Industrias Andinas · S/ 96 000 ·
   S/ 82 500 · 82 % · En riesgo. PR-2027-003 Modernización de Red Corporativa · Clínica
   Regional del Sur · S/ 145 000 · S/ 48 200 · 38 % · Activo.
6. **Panel General** (`index.html`), subtítulo "Visión consolidada de proyectos y
   operación". 5–6 KPI clicables: Proyectos activos 12 · Presupuesto activo S/ 1 245 000 ·
   Costos acumulados S/ 768 400 · Rendiciones pendientes 8 · Órdenes pendientes 5 · Alertas 3.
7. **Gráfico "Presupuesto vs. costo por proyecto"** (ApexCharts, S/ miles):
   001 185/112.45 · 002 96/82.5 · 003 145/48.2.
8. **Donut de distribución de costos:** Compras 42 %, Personal 27 %, Rendiciones 14 %,
   Materiales 12 %, Otros 5 %.
9. **Proyectos relevantes:** Código · Proyecto · Cliente · Avance · Presupuesto · Costo ·
   Estado; máx. 5; Ver proyecto, filtro por estado, búsqueda.
10. **Actividad reciente** (timeline): "Hace 10 min — Rendición R-045 enviada",
    "Hace 35 min — OC-028 aprobada", "Hoy 09:15 — Proyecto PR-2027-001 actualizado",
    "Ayer — Nuevo documento cargado".
11. **Acciones rápidas** con modales: + Nuevo proyecto, + Nueva rendición, + Nueva orden
    de compra, + Nuevo presupuesto.
12. **Proyectos** (`projects.html`), subtítulo "Gestión integral de proyectos".
13. **Listado:** Código · Proyecto · Cliente · Responsable · Avance · Presupuesto · Costo ·
    Estado · Acciones. Estados Planificado, Activo, En riesgo, Suspendido, Cerrado.
    Filtros buscar, cliente, responsable, estado, periodo. Botón "+ Nuevo proyecto".
14. **Crear proyecto:** principal (código, nombre, cliente, responsable, descripción,
    ubicación, inicio, fin estimado, estado) · económica (presupuesto base, moneda,
    centro de costo) · complementaria (n.º contrato, responsable del cliente,
    observaciones). Botones "Guardar proyecto", "Cancelar".
15. **Ficha Integral** (`project-detail.html?id=PR-2027-001` conceptual): encabezado con
    código, nombre, cliente, responsable, estado, avance 67 %, fecha final 30/06/2027.
16. **KPI del proyecto:** Presupuesto S/ 185 000 · Costo ejecutado S/ 112 450 ·
    Disponible S/ 72 550 · Avance 67 % · Documentos 38 · Alertas 2.
17. **Tabs:** Resumen, Presupuesto, Compras, Rendiciones, Personal, Materiales, Costos,
    Documentos, Indicadores. Muy fácil pasar entre secciones.
18. **Resumen:** descripción, cronograma resumido, responsables, avance, presupuesto,
    costo, últimas actividades, alertas y gráfico pequeño presupuesto vs. costo.
19. **CRM** (`crm.html`, principalmente PETI), título "Gestión Comercial".
20. **Pipeline Kanban:** Prospecto, Contactado, Propuesta, Negociación, Ganado, Perdido;
    tarjeta: cliente, oportunidad, monto estimado, probabilidad, responsable, próxima acción.
21. **Ficha de oportunidad:** código, cliente, contacto, descripción, servicio, monto,
    probabilidad, cierre estimado, responsable, estado, notas, actividad reciente.
22. **Acciones CRM:** Generar presupuesto, Registrar actividad, Marcar como ganado,
    Marcar como perdido; si ganada, "Convertir en proyecto" (CRM → Presupuesto → Proyecto).
23. **Presupuestos** (`budgets.html`), título "Presupuestos y Cotizaciones".
24. **Lista:** Código · Cliente · Proyecto/Oportunidad · Versión · Fecha · Monto · Estado ·
    Acciones. Estados Borrador, En revisión, Aprobado, Rechazado, Vencido. Filtros
    cliente, proyecto, estado, fecha. "+ Nuevo presupuesto".
25. **Crear presupuesto:** código automático, cliente, proyecto u oportunidad, fecha,
    validez, moneda, responsable, versión, descripción.
26. **Partidas jerárquicas:** 1 Infraestructura (1.1 Cableado, 1.2 Equipos),
    2 Instalación (2.1 Mano de obra, 2.2 Configuración). Tabla Código · Partida · Unidad ·
    Cantidad · Costo Unit. · Precio Unit. · Total.
27. **Totales:** subtotal, descuento, valor de venta, IGV, total; opcional costo estimado y margen.
28. **Funciones:** Guardar borrador, Enviar a revisión, Aprobar, Nueva versión, Duplicar,
    Generar PDF (modal "Documento generado correctamente"), Ver historial.
29. **Versionado:** V1, V2, V3 con fecha, responsable, estado, versión vigente; nunca sobrescritura.
30. **Compras** (`purchases.html`), título "Compras y Órdenes de Compra".
31. **Lista OC:** N.º OC · Proyecto · Proveedor · Fecha · Monto · Estado · Acciones.
    Estados Borrador, Pendiente, Aprobada, Emitida, Atendida, Cerrada. Filtros proyecto,
    proveedor, estado, periodo.
32. **Crear OC:** proyecto, proveedor, fecha, moneda, responsable, condición de pago,
    lugar de entrega, observaciones.
33. **Detalle OC:** Producto/Servicio · Cantidad · Unidad · Precio · IGV · Total; partida
    presupuestaria, centro de costo, cotización adjunta.
34. **Acciones OC:** Guardar borrador, Enviar a aprobación, Aprobar, Emitir, Registrar
    recepción, Generar documento, Ver historial.
35. **Alerta presupuestaria** no bloqueante: "Advertencia: esta compra supera el saldo
    disponible de la partida seleccionada."
36. **Rendiciones** (`expenses.html`), título "Rendiciones de Gastos"; diseño muy cuidado.
37. **Lista:** Código · Responsable · Proyecto · Fecha · Monto · Estado · Acciones.
    Estados Borrador, Enviada, En revisión, Observada, Corregida, Aprobada. Filtros
    proyecto, responsable, estado, periodo.
38. **Nueva rendición:** código, trabajador, proyecto, fecha, descripción.
39. **"+ Agregar gasto"** con Tomar foto, Subir imagen, Adjuntar PDF (simulados).
40. **OCR simulado** "Información detectada": RUC, proveedor, fecha, tipo, número, valor
    de venta, IGV, total; etiqueta "Datos propuestos por OCR"; editable.
41. **Tipos económicos:** Valor de Venta, IGV, No Gravado, No Documentado, siempre visibles.
42. **Detalle:** Fecha · Tipo · Documento · Concepto · V.V. · IGV · Total · Evidencia;
    Total rendido, Total documentado, Total no documentado.
43. **Revisión** administrativa en dos columnas: comprobante | datos. Aprobar gasto,
    Observar, Solicitar corrección.
44. **Observaciones:** modal con motivo y comentario ("Monto registrado no coincide con
    comprobante.") → estado Observada.
45. **Trazabilidad:** Creada, Enviada, Revisada, Observada, Corregida, Aprobada con
    fecha, usuario y comentario.
46. **Rendición móvil/PWA:** "Mis Rendiciones", botón grande "+ Nueva rendición" →
    Seleccionar proyecto → Agregar comprobante (Tomar foto / Seleccionar archivo) → OCR
    simulado → "Confirmar y enviar".
47. **Personal y Tareo** (`personnel.html`), tabs Personal, Asignaciones, Tareo, Biometría, Incidencias.
48. **Personal:** DNI · Trabajador · Cargo · Área · Estado · Proyectos · Acciones; datos
    DNI, nombres, apellidos, cargo, área, tipo, costo/hora referencial, estado.
49. **Ficha del trabajador:** datos, cargo, área, proyectos, historial de tareo,
    asistencia, incidencias, costo imputable. No es un RR. HH. completo.
50. **Asignaciones:** Trabajador · Proyecto · Rol · Desde · Hasta · % Asignación; "Asignar trabajador".
51. **Tareo:** Trabajador · Proyecto · Fecha · Entrada · Salida · Horas · Estado; filtros
    proyecto, trabajador, periodo, estado.
52. **Registro manual de tareo** (modal): trabajador, proyecto, fecha, hora inicio, hora
    fin, horas, observación, motivo de registro manual.
53. **Biometría** "Sincronización Biométrica": ZKTeco Oficina Principal · Conectado ·
    última sincronización 08/11/2026 18:05 · 43 registros · 2 errores.
54. **Registros biométricos:** Trabajador · Entrada · Salida · Horas · Estado (Juan Pérez
    08:01 17:03 8h 02m Correcto; Ana Díaz 08:10 — — Incompleto).
55. **Incidencias:** falta entrada, falta salida, marcación duplicada, no identificado;
    Corregir, Justificar, Ignorar con responsable, fecha y motivo.
56. **Flujo:** Biométrico → Asistencia → Tareo → Proyecto → Costos laborales.
57. **Almacén** (`warehouse.html`), "Almacén y Materiales"; tabs Inventario, Movimientos,
    Entradas, Salidas, Kardex, Almacenes.
58. **Inventario:** Código · Material · Categoría · Unidad · Stock · Mínimo · Almacén ·
    Estado (MAT-001 Cable UTP Cat6, Cableado, Metro, 1250, 300, Principal, Disponible).
59. **Alerta de stock:** badge "Stock bajo" si stock < mínimo; también en notificaciones.
60. **Ficha de material:** código, descripción, categoría, unidad, stock actual, mínimo,
    ubicación, costo promedio referencial, últimos movimientos.
61. **Entrada:** fecha, proveedor, OC, almacén, material, cantidad, costo unitario,
    documento, responsable. OC → Recepción → Entrada.
62. **Salida:** proyecto, material, cantidad, fecha, responsable, motivo, documento.
    Almacén → Proyecto; imputa costo.
63. **Devolución:** proyecto, material, cantidad, motivo, estado del material.
64. **Transferencia** (opcional): almacén origen, destino, material, cantidad.
65. **Kardex:** Fecha · Documento · Movimiento · Entrada · Salida · Saldo ·
    Proyecto/Origen (01/03 OC-025 Entrada 500 — 500 Proveedor ABC; 05/03 SAL-015 Salida — 120 380 PR-2027-001).
66. **Costos por Proyecto** (`costs.html`), visualmente importante.
67. **Selector de proyecto** arriba.
68. **KPI:** Presupuesto S/ 185 000 · Comprometido S/ 128 700 · Ejecutado S/ 112 450 ·
    Disponible S/ 72 550 · Ejecución 60.8 %.
69. **Gráfico** presupuesto vs. costo (opcional comprometido y ejecutado).
70. **Costo por fuente:** Compras S/ 47 230 42 % · Personal S/ 30 362 27 % · Rendiciones
    S/ 15 743 14 % · Materiales S/ 13 494 12 % · Otros S/ 5 621 5 %.
71. **Drill-down:** Compras → OC-025, OC-028, OC-032; Rendiciones → R-041, R-045, R-049.
    Todo costo tiene origen identificable.
72. **Costos por partida:** Partida · Presupuesto · Ejecutado · Variación · %; resaltar desviaciones.
73. **Alertas:** "Proyecto ha consumido 82 % del presupuesto con 67 % de avance",
    "Partida 2.1 supera el presupuesto en 8 %".
74. **Gestión Documental** (`documents.html`), integrada con módulos, no copia de Drive.
75. **Filtros:** proyecto, módulo, tipo, fecha, responsable, estado.
76. **Estructura:** PR-2027-001 → Contratos, Presupuestos, Compras, Rendiciones, Personal,
    Planos, Informes, Entregables.
77. **Tabla:** Documento · Tipo · Proyecto · Módulo origen · Versión · Responsable · Fecha.
78. **Ficha documental:** nombre, código, proyecto, tipo, módulo origen, operación
    origen, responsable, fecha, versión, etiquetas, descripción; Vista previa,
    Descargar, Nueva versión, Historial.
79. **Versionado:** V1, V2, V3 con fecha, responsable, comentario.
80. **Documentos generados:** Presupuesto → Cotización PDF; Compras → OC; Rendición →
    Resumen; Tareo → Reporte; Costos → Reporte.
81. **Reportes** (`reports.html`), operativos.
82. **Catálogo:** proyectos, presupuesto vs. ejecución, rendiciones por periodo, compras
    por proyecto, tareo mensual, movimientos de almacén, costos por proyecto,
    documentos pendientes; cada uno con Ver y Exportar.
83. **BI** (`analytics.html`), "Inteligencia de Negocios", "Indicadores para la toma de decisiones".
84. **Filtros BI:** periodo, proyecto, cliente, responsable, estado.
85. **KPI BI:** rentabilidad estimada, presupuesto total, costo total, desviación
    promedio, proyectos en riesgo, rendiciones pendientes.
86. **Gráficos BI** (máx. 4): margen por proyecto, presupuesto vs. costo, distribución
    por fuente, evolución mensual.
87. **Tabla gerencial:** Proyecto · Avance · Presupuesto · Costo · Desviación · Estado.
88. **Drill-down BI:** Empresa → Proyecto → Fuente → Transacción.
89. **Integraciones** (`integrations.html`), para TI.
90. **Cards:** Biometría ZKTeco (Conectado), Software Contable (Sincronización
    pendiente), Correo (Activo), Backup (Correcto), Almacenamiento (Activo).
91. **Historial:** Integración · Última ejecución · Registros · Resultado (ZKTeco 18:00 43
    Correcto; Contabilidad 17:00 27 Correcto).
92. **Error:** "2 registros biométricos no pudieron asociarse con trabajadores." + "Revisar incidencias".
93. **Seguridad** (`security.html`), "Seguridad y Control de Acceso"; tabs Usuarios,
    Roles, Permisos, Sesiones, Auditoría, Backups.
94. **Usuarios:** Usuario · Nombre · Rol · Área · Último acceso · Estado.
95. **Roles:** Gerencia, Administrador, Proyectos, Comercial, Logística, Contabilidad, Trabajador, TI.
96. **Matriz de permisos:** Ver costos (Sí/Parcial/No), Crear OC (No/Sí/No), Registrar
    rendición (Sí/Sí/Sí), Aprobar rendición (Sí/No/No) para Gerencia/Logística/Trabajador.
97. **MFA:** Activado; aplicación autenticadora / correo.
98. **Sesiones:** dispositivo, IP ficticia, ubicación, última actividad, estado.
99. **Auditoría:** Fecha · Usuario · Acción · Módulo · Registro · Resultado (08/11/2026
    10:22 · jperez · Modificó · Rendiciones · R-045 · Correcto).
100. **Backups:** último 08/11/2026 02:00 · Correcto · Automático · próximo 09/11/2026 02:00 · "Ver historial".
101. **Administración** (`settings.html`), "Administración del Sistema"; tabs Empresa,
     Catálogos, Parámetros, Notificaciones, Apariencia, Configuración general.
102. **Empresa:** razón social, RUC, dirección, teléfono, correo, logo, moneda, zona horaria.
103. **Catálogos:** categorías de gasto, tipos de documento, unidades, estados, centros
     de costo, tipos de proyecto, categorías de material.
104. **Bandeja "Aprobaciones Pendientes"** desde Dashboard/header; tabs Presupuestos, Compras, Rendiciones.
105. **Tabla:** Tipo · Código · Responsable · Proyecto · Monto · Fecha · Acción (Revisar, Aprobar, Observar).
106. **Notificaciones** por categoría: Información, Advertencia, Error, Aprobación, Sistema.
107. **Toasts:** "Rendición guardada correctamente.", "Orden de Compra enviada a
     aprobación.", "Proyecto actualizado.", "Sincronización completada."
108. **Confirmaciones** para eliminar, cancelar, cerrar, aprobar ("¿Deseas aprobar la rendición R-045?").
109. **Empty states:** icono + mensaje + acción ("No existen rendiciones pendientes.").
110. **Breadcrumbs** simples (Proyectos / PR-2027-001 / Costos).
111. **Tablas:** búsqueda, filtros, orden, paginación, acciones (visual al menos).
112. **Menú `⋮`** para muchas acciones (Ver, Editar, Duplicar, Historial).
113. **Formularios largos** en secciones, tabs, cards o pasos.
114. **Responsive:** tablas complejas → cards en móvil; prioridad Rendiciones, Tareo, Proyectos, Notificaciones.
115. **Prioridad de pantallas:** Dashboard, Lista de Proyectos, Ficha, Presupuesto,
     Rendiciones, Rendición móvil, Compras, Personal/Tareo/Biometría, Almacén/Kardex,
     Costos, Documentos, BI, CRM, Integraciones, Seguridad.
116. **surtec-peti:** Dashboard, Proyectos, CRM, Presupuestos, Compras, Rendiciones,
     Personal/Tareo, Biometría, Almacén, Costos, Documentos, Reportes, BI,
     Integraciones, Seguridad, Administración (TO-BE 2027–2030).
117. **jy-pmi:** Dashboard, Proyectos, Presupuestos, Compras, Rendiciones, Personal/Tareo,
     Costos, Documentos, Reportes, Seguridad, Administración. Sin CRM ni Almacén.
118. **jy-demo:** Dashboard, Proyectos, Rendiciones, Compras, Personal/Tareo, Costos,
     Documentos. Almacén oculto o "Propuesta futura". Sin Pagos/Tesorería.
119. **Selector "Modo Demo"** opcional solo para desarrollo.
120. **Coherencia:** módulos compartidos iguales entre variantes; solo cambian branding,
     datos, funciones y alcance.
121. **Identidad SurTec:** `#1A365D`, `#0066CC`, `#4A5568`, `#F7FAFC`; logo oficial.
122. **Identidad J&Y:** logo corporativo si existe; si no, branding neutral.
123. **"Ver proyecto"** desde toda operación (R-045 → PR-2027-001; OC-025 → PR-2027-001).
124. **Trazabilidad económica:** Costos → monto → fuente → operación → documento
     (S/ 2 450 → Compras → OC-025 → OC-025.pdf).
125. **Trazabilidad documental:** documento muestra proyecto, módulo, operación, responsable.
126. **Flujo comercial** (PETI): CRM → Oportunidad → Presupuesto → Proyecto.
127. **Flujo de compras:** Proyecto → OC → Recepción → Almacén → Salida → Costo (PMI: Proyecto → OC → Costo).
128. **Flujo de rendiciones:** Trabajador → Proyecto → Comprobante → OCR → Envío →
     Revisión → Corrección → Aprobación → Costo.
129. **Flujo de personal:** Persona → Asistencia → Tareo → Proyecto → Costo laboral.
130. **Flujo de almacén:** Compra → Entrada → Stock → Salida → Proyecto → Costo.
131. **Flujo gerencial:** Datos → Costos → BI → Indicadores → Decisión.
132. **Alertas gerenciales:** > 80 % del presupuesto, partida con desviación, rendiciones
     pendientes > 7 días, OC pendiente, material bajo mínimo, backup fallido.
133. **Terminología** en español (Proyecto, Presupuesto, Cotización, Rendición, Orden de
     Compra, Tareo, Comprobante, Proveedor, Almacén, Material, Costo, Documento,
     Indicador); se aceptan Dashboard, BI, CRM, OCR, MFA.
134. **Moneda:** `S/ 185 000.00` o `S/ 185 000`, consistente.
135. **Fechas:** DD/MM/AAAA.
136. **Personas ficticias:** Carlos Mendoza, Ana Torres, Luis Quispe, María Salazar, José Vargas.
137. **Tres segundos:** reconocer página, proyecto, datos importantes y acción principal.
138. **Una acción principal** evidente por pantalla.
139. **Evitar saturación:** resumen primero, detalle después.
140. **Consistencia** de filtros, tablas, botones, estados, modales y títulos.
141. **Filtros:** principales visibles; secundarios en "Más filtros".
142. **Filtros aplicados** como chips ("Proyecto: PR-2027-001 ×").
143. **Menú lateral** colapsable, iconos consistentes.
144. **Logo** lleva al Dashboard.
145. **Colores de estado:** azul activo/info, gris borrador, verde aprobado, amarillo
     pendiente, rojo riesgo/error; tonos sobrios.
146. **Una familia de iconos.**
147. **Textos:** "Resumen", "Indicadores" en vez de "Overview", "Insights".
148. **Ayuda `?`** con tooltip ("Costo comprometido: Órdenes y obligaciones ya aprobadas
     que todavía pueden no haberse ejecutado.").
149. **Interacciones:** modales, tabs, filtros, toasts, cambio de estado, detalle, navegación.
150. **No implementar:** cálculos financieros complejos, transacciones, concurrencia,
     backend, OCR, biometría, API, PDF completo, correo, permisos reales.
151. **Orden:** B1 Dashboard, Proyectos, Ficha · B2 Presupuestos, Compras · B3
     Rendiciones y móvil · B4 Personal, Tareo, Biometría · B5 Almacén, Kardex · B6 Costos ·
     B7 Documentos, Reportes, BI · B8 CRM, Integraciones, Seguridad, Administración.
152. **Verificar tras cada bloque:** navegación, responsive, datos, links, modales,
     errores JS, consola, build, estilos, modo claro, sidebar, header.
153. **No romper Metis** sin necesidad; no quitar dependencias sin comprobar su uso.
154. **Sin sobreingeniería.**
155. **Resultado visual:** aplicación empresarial real para centralizar, gestionar
     proyectos, gastos, compras, personal, materiales, costos, documentos e indicadores.
156. **Escenarios:** (1) Gerencia: Dashboard → PR-2027-001 → S/ 185 000 / S/ 112 450 →
     Costos → S/ 47 230 de Compras → OC-025 → documento. (2) Trabajador móvil: proyecto →
     foto de boleta → OCR → confirma → envía → administración observa → corrige →
     aprueba → aparece en Costos. (3) Logística: OC → aprobación → recepción → entrada →
     salida al proyecto → Kardex → costo. (4) Huellero → asistencia → tareo → proyecto →
     costo laboral. (5) Comercial: oportunidad → presupuesto → aceptación → proyecto.
157. **Si hay que simplificar:** comprensión, navegación, consistencia, demostración del flujo.
158. **Entrega:** revisar código, reutilizar, crear progresivamente, datos compartidos,
     navegación coherente, variantes, responsive, documentar, sin backend.
159. **Éxito:** poder decir "cada operación queda asociada a un proyecto, los costos se
     consolidan desde sus fuentes y la gerencia consulta información trazable" sin
     explicar dónde está cada función.
160. **Progresivo:** primero shell, branding, sidebar, header, Dashboard, Proyectos y
     Ficha; luego el resto en orden; calidad sobre cantidad.
