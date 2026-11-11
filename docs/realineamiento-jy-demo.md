# Realineamiento funcional de J&Y Demo — auditoría y propuesta

> Estado: **R1, R2 y R3 terminadas** (11/11/2026); siguiente: R4 (Presupuestos, APU, cotizaciones, OC). Análisis sobre `6b7dc4e`.
> Fuente de requisitos: prompt "Revisión funcional integral" del usuario (secciones 1–40),
> resumido aquí. Este documento es la referencia para las fases R1–R6 (sección 9).

## 0. Resumen en una página

**Qué pasa hoy.** `jy-demo` es una copia recortada de `jy-pmi`. Ambas usan el mismo conjunto
de datos (`data/jy.js`: 2 clientes, 2 proveedores, 2 trabajadores, 2 proyectos, 8
operaciones), el mismo menú y las mismas reglas de SurTec. Esas reglas incluyen la aprobación
formal, la alerta del 80 %, el avance físico y el costo laboral por horas. El Demo además oculta
Presupuestos, Almacén, Reportes, Seguridad, Administración e Integraciones. Hoy el Demo
**parece un ERP genérico con logo de J&Y**.

**Qué debe ser.** Debe ser la propuesta del futuro ERP interno de J&Y, con cada pieza marcada
según su madurez: **AS-IS confirmado**, **propuesta TO-BE** o **por validar**. Los procesos
mejor conocidos (Rendiciones, J&Y Real vs. tratamiento formal, planilla con imputación
porcentual, RxH) se representan con fidelidad. Lo no levantado se muestra con honestidad: los
estados de OC y el Kardex como provisionales, y Pagos como "en levantamiento".

**Cómo hacerlo sin romper PETI ni PMI.** Hacen falta cinco piezas:

1. un **conjunto de datos propio** `data/jy-demo.js`, eliminado por Vite de los otros builds;
2. un **perfil de reglas por variante** (`variant.rules`) que sustituye los `if variant`
   dispersos;
3. **menú y nombres por variante** (`variant.navGroups`, `variant.labels`);
4. **vistas guiadas por los datos**: si un presupuesto tiene partidas, se muestran Partidas y
   APU; si no, se usa la vista actual;
5. **marcas de madurez** que solo existen en el Demo.

SurTec no cambia. PMI conserva exactamente su comportamiento y sus pruebas.

**Tamaño.** Son seis fases (R1–R6), de la base de la variante a Almacén, Pagos y la auditoría
final. Las páginas pasan de 25 a unas 30 (Clientes, Proveedores, Productos y precios, Pagos y
fichas).

---

## 1. Inventario de vistas actuales (Paso 1–2)

Leyenda de variantes: **P** = surtec-peti, **M** = jy-pmi, **D** = jy-demo. "—" = la página
existe en el build pero muestra "no disponible / módulo no incluido".

| Archivo | P | M | D | Propósito | Datos y acciones principales | Relaciones |
|---|---|---|---|---|---|---|
| `index.html` (`dashboardView`) | ✓ | ✓ | ✓ | Inicio ejecutivo | 4–5 KPI con count-up, gráfico "Ejecución frente al avance" (avance físico), costo mensual (área), actividad reciente, acciones rápidas | Proyecto, Costos, Rendiciones, Compras |
| `projects.html` (`projectsList`) | ✓ | ✓ | ✓ | Lista de proyectos | Filtros (búsqueda, estado, cliente, responsable, periodo), "+ Nuevo proyecto" en 3 secciones (`demo-projects` local, código `PR-DEMO-NNN`) | Ficha de proyecto |
| `project.html` (`projectDetail`) | ✓ | ✓ | ✓ | Ficha integral | 9 pestañas: Resumen, Presupuesto, Compras, Rendiciones, Personal, Materiales, Costos, Documentos, Indicadores; flujo de costo (`projectFlowData`) | Todos los módulos |
| `approvals.html` (`approvalsView`) | ✓ | ✓ | ✓ | Bandeja "Aprobaciones Pendientes" | Pestañas según módulos activos (D: Compras y Rendiciones); Aprobar / Observar / Deshacer (`approval-decisions`) | Presupuesto, OC, Rendición |
| `crm.html` (`crmWorkspace`) | ✓ | — | — | Pipeline kanban de 6 etapas | OP-001…006, ganar/perder, convertir en proyecto | Presupuesto, Proyecto |
| `budgets.html` / `budget.html` | ✓ | ✓ | — | Presupuestos y versiones | Lista, "+ Nuevo presupuesto" (líneas cantidad × precio, `demo-budgets`), ficha con 2 partidas **derivadas** del total (`commercialBreakdown`), historial V1…Vn, enviar/aprobar versión | Cliente, Proyecto |
| `purchases.html` / `purchase.html` | ✓ | ✓ | ✓ | Compras y OC | Lista, "+ Nueva OC" (`demo-purchases`), ficha con partidas derivadas, estados Pendiente/Aprobada/Atendida, recepción (P: entrada a almacén) | Proyecto, Proveedor, Almacén, Costos |
| `expenses.html` / `expense.html` | ✓ | ✓ | ✓ | Rendiciones de gastos | Escritorio: tabla. Móvil: "Mis Rendiciones". Asistente de 3 pasos con 3 comprobantes de ejemplo, "OCR" simulado como **ficha de texto**, un monto global No Documentado, estados Borrador → En revisión → Observada → Aprobada, historial | Proyecto, Costos |
| `personnel.html` (`personnelWorkspace`) | ✓ | ✓ | ✓ | Personal y Tareo | Pestañas Personal, Asignaciones (% genérico), Asistencia (horas), Tareo (horas → costo); P añade Biometría (ZKTeco "Conectado") e Incidencias | Trabajador, Proyecto, Costos |
| `worker.html` (`workerDetail`) | ✓ | ✓ | ✓ | Ficha de trabajador | Datos, proyectos asignados, asistencia, tareo, costo laboral, incidencias | Proyecto, Tareo |
| `warehouse.html` / `material.html` | ✓ | — | — | Almacén y Kardex | 7 pestañas (Inventario, Movimientos, Entradas, Salidas, Devoluciones, Kardex, Almacenes), movimientos locales (`demo-movements`), ficha de material con saldo | OC, Proyecto, Costos |
| `costs.html` (`costWorkspace`) | ✓ | ✓ | ✓ | Costos por proyecto | KPI, presupuesto vs. costo, costo por fuente, drill-down a operación, **partidas de control referencial** (reparto fijo 40/25/15/15/5), OC con compromiso abierto | Todas las fuentes |
| `documents.html` / `document.html` | ✓ | ✓ | ✓ | Documentos | Estructura por proyecto (8 carpetas), filtros, documentos "generados"; la ficha tiene vista previa, nueva versión e historial, pero **solo metadatos** (sin imagen) | Operación origen, Proyecto |
| `reports.html` (`reportsWorkspace`) | ✓ | ✓ | — | Catálogo de 8 reportes | Filtros, gráficos D3, "Exportar" simulado | Todas |
| `analytics.html` (BI) | ✓ | — | — | Inteligencia de Negocios | 6 KPI, margen estimado, evolución | Reportes |
| `integrations.html` | ✓ | — | — | Integraciones | Estados "Conectado/Correcto" (decisión 3, credibilidad), historial de sincronización | Personal, Seguridad |
| `security.html` | ✓ | ✓ | — | Seguridad | 8 roles, matriz Sí/Parcial/No, MFA, sesiones, auditoría, respaldos | Todas |
| `settings.html` | ✓ | ✓ | — | Administración (6 pestañas) | Empresa (J&Y: "Por completar"), Catálogos, Parámetros, Notificaciones, Apariencia, General | — |
| `module-preview.html` | aux | aux | aux | Ficha genérica / módulo no incluido | Costos locales `COST-DEMO-*` | Costos |
| `design-system.html` | int | int | int | Referencia visual interna | — | — |

**Transversal (shell).**

- `app-shell-template.mjs` inserta el header: buscador, selector de proyecto, contador de
  aprobaciones, notificaciones (con la alerta del 80 % e "Error biométrico" en PETI), el
  distintivo "Datos de demostración", el menú y los recorridos. El Demo tiene 4 recorridos
  pensados para SurTec ("Asistencia y costo laboral" va por horas).
- Conmutador oculto con triple clic o Alt + Shift + P.
- Estado local por variante con `variantStorageKey`. Claves usadas: `approval-decisions`,
  `demo-budgets`, `demo-purchases`, `demo-projects`, `expense-demos`, `budget-versions`,
  `demo-assignments`, `manual-timesheets`, `attendance-incidents`, `demo-movements`,
  `crm-stages`, `current-project`.

**Pruebas que tocan jy-demo.**

| Archivo | Qué comprueba del Demo |
|---|---|
| `validate-mock-data.mjs:280` | `getDataForVariant('jy-pmi') === getDataForVariant('jy-demo')` |
| `validate-mock-data.mjs:320` | Totales de cartera del Demo |
| `shell-interaction-test.mjs:400-414` | 2 proyectos, 4 recorridos, sin Reportes ni Seguridad en el menú, BI "no disponible" |
| `commercial-interaction-test.mjs:226-235` | Presupuestos "Módulo no incluido"; flujo de OC con `OC-JY-003` |
| `expense-interaction-test.mjs:91-186` | 2 rendiciones, flujo hasta "Aprobada", sin desborde a 390 px |
| `final-audit.mjs`, `smoke-test.mjs` | 25 páginas; la raíz de Pages abre el Demo |

---

## 2. Clasificación de cada elemento (Paso 3)

Criterio de la sección 39: **A** estándar necesario · **B** buena práctica · **C** opcional ·
**D** supuesto innecesario. Madurez para J&Y: **AS-IS** · **TO-BE** · **Por validar**.

| Elemento actual | Acción para D | Criterio | Madurez | Nota |
|---|---|---|---|---|
| Shell, diseño, tablas, modales, tema oscuro, responsive | **Mantener** | A | — | Base visual aprobada |
| Ficha integral de proyecto (9 pestañas) | **Modificar** | A | TO-BE | Quitar "avance físico" de Indicadores; añadir enlace a Cliente; Materiales solo si hay almacén |
| Lista de proyectos y alta local | **Mantener** | A | TO-BE | Cambiar el prefijo `PR-` (choque con presupuestos, ver §6.1) |
| Gráfico "Ejecución frente al avance" | **Ocultar en J&Y** · Mantener solo en PETI | D para J&Y | Por validar | No sabemos cómo J&Y mide el avance físico |
| Alerta automática del 80 % | **Ocultar en J&Y** · Mantener solo en PETI | D | Por validar | Sustituir por alertas factuales |
| Bandeja "Aprobaciones" | **Reestructurar** → "Pendientes" | A | TO-BE | Bandeja de trabajo, no aprobación multinivel |
| Botón "Aprobar" en rendiciones | **Modificar** → "Aceptar" | A | AS-IS (revisión administrativa) | Vocabulario de revisión |
| CRM completo | **Mantener solo en PETI** | C para J&Y | — | Ya oculto en D |
| BI avanzado (`analytics.html`) | **Mantener solo en PETI** | C | — | Ya oculto en D |
| Presupuesto con líneas cantidad × precio | **Reestructurar** | A | TO-BE | Tipos A (partidas/APU) y B (productos) |
| Partidas derivadas del total (`commercialBreakdown`) | **Ocultar en J&Y** | D | — | Partidas inventadas a partir de un total |
| Historial de versiones del presupuesto | **Mantener** + **Agregar** "Duplicar" | A | TO-BE | Versión ≠ duplicado |
| OC: estados Pendiente/Aprobada/Atendida | **Mantener como TO-BE provisional** | B | Por validar | Marcar "estados provisionales" |
| Recepción de OC → almacén | **Modificar** | A | TO-BE | Separar material (→ almacén) de servicio (→ costo) |
| Rendición: código global `R-JY-001` | **Modificar** | A | AS-IS | Numeración por trabajador y año: N.º 15-2026 |
| Rendición: un trabajador por rendición | **Modificar** | A | AS-IS | Quien gastó ≠ quien prepara ≠ quien revisa |
| Comprobantes de ejemplo como ficha de texto | **Reestructurar** | A | TO-BE | Visor: imagen a la izquierda, datos a la derecha, con zoom |
| "OCR" simulado | **Modificar** | B | TO-BE | "Datos sugeridos", con edición y confianza por campo |
| No Documentado como monto global | **Reestructurar** | A | AS-IS | Cada gasto sin documento es un ítem con motivo |
| Estados de rendición (4) | **Modificar** | A | AS-IS + TO-BE | Ver §5.3 |
| Clasificación del gasto | **Agregar** | A | AS-IS (categorías observadas) | Separada de la descripción; sugerida por IA |
| Costos: KPI y costo por fuente | **Mantener** | A | AS-IS (fuentes confirmadas) | |
| Costos: partidas de control referencial (40/25/15/15/5) | **Ocultar en J&Y** | D | — | Reparto inventado |
| Costos: OC con compromiso abierto | **Mantener** | B | TO-BE | |
| J&Y Real vs. tratamiento formal | **Agregar** | A | AS-IS (concepto de Contabilidad) | Núcleo del módulo |
| Personal: "Asignaciones" con % genérico | **Reestructurar** → Imputación en Planilla | A | AS-IS (imputación por Contabilidad) | El % es contable, no de dedicación |
| Asistencia por horas desde tareo | **Reestructurar** | A | AS-IS (SF100 + Excel) | Asistencia y tareo son procesos distintos |
| Tareo → horas → costo | **Modificar** | A | TO-BE | Registrar jornadas; costo de campo por validar |
| Planilla | **Agregar** | A | AS-IS | Mensual + imputación % |
| RxH | **Agregar** | A | AS-IS (fuente de costo confirmada) | |
| Personal temporal | **Agregar** (mínimo) | B | Por validar | Sin reglas de cálculo |
| Biometría "Conectado" | **Modificar** | A | AS-IS: exportación a Excel; TO-BE: sincronización | Estado honesto |
| Almacén (7 pestañas, varios almacenes) | **Agregar a D (prioridad 4)**, simplificado | B | TO-BE | Un almacén; Kardex marcado como propuesta |
| Documentos: estructura y filtros | **Mantener** | A | TO-BE | |
| Documentos: solo metadatos | **Modificar** | A | TO-BE | Miniatura y visor reales (§5.6) |
| Reportes (8, con BI) | **Agregar a D** como catálogo operativo | A | TO-BE | Unos 13 reportes, sin BI |
| Integraciones con estados "Conectado" | **Agregar a D** con estados honestos | A | Por validar | SF100, OCR, IA, archivos, Contabilidad |
| Seguridad (8 roles, matriz rígida) | **Agregar a D** con 7 roles conceptuales | B | Por validar | Matriz marcada "borrador" |
| Administración (6 pestañas) | **Agregar a D** con catálogos de J&Y | A | TO-BE | Categorías, tipos de evidencia, unidades, monedas |
| Clientes, Proveedores, Productos | **Agregar** | A | AS-IS (existen) / TO-BE (gestión) | Hoy son datos escondidos sin interfaz |
| Cotizaciones, búsqueda de precios, comparador | **Agregar** | A / B / B | TO-BE | Une Presupuestos, Proveedores y Compras |
| Pagos | **Agregar** como "Proceso en levantamiento" | C | Por validar | Sin módulo completo |
| Recorridos de demostración | **Reestructurar** para D | B | — | Los 9 recorridos de la §28 |
| Distintivo único "Datos de demostración" | **Mantener** | A | — | Ver decisión D3 (marcas de madurez) |

**Herencia de PMI** (sirve tal cual en el Demo): la estructura Proyectos, Rendiciones,
Compras/OC, Personal, Presupuestos, Documentos, Reportes, Integraciones y Seguridad. **Herencia
de PETI que no corresponde a J&Y:** CRM, BI, el 80 %, el avance físico, el costo por hora, el
multinivel de aprobación, los estados "Conectado", el reparto 40/25/15/15/5 y los varios
almacenes.

---

## 3. Matriz de alineamiento (Paso 4)

Prioridad de la §38: **P1** Proyectos, Rendiciones, Costos, Documentos, Clientes, Proveedores ·
**P2** Presupuestos, APU, Insumos, Cotizaciones, OC · **P3** Personal · **P4** Almacén ·
**Posterior** Pagos, BI, CRM.

| Vista/Módulo | Situación actual (D) | J&Y necesita | Brecha | Acción propuesta | Prioridad |
|---|---|---|---|---|---|
| Datos base | Comparte `jy.js` con PMI (2 de todo) | Datos ficticios propios, más ricos | Total | `data/jy-demo.js` separado | P1 (R1) |
| Navegación | Menú de PETI recortado | GENERAL, MAESTROS, GESTIÓN, CONTROL, SISTEMA | Grupos y nombres | `variant.navGroups` + `variant.labels` | P1 (R1) |
| Inicio | KPI + avance físico + 80 % | Visión ejecutiva + contexto de proyecto | Reglas no confirmadas | Panel de proyecto rápido; alertas factuales | P1 (R3) |
| Proyectos | Lista + ficha | Igual + cliente + trazabilidad | Pequeña | Ajustes de pestañas | P1 (R3) |
| Pendientes | "Aprobaciones" (Compras, Rendiciones) | Bandeja de trabajo flexible | Concepto | Reestructurar, 6 tipos | P1 (R3) |
| Clientes | No existe | Lista + ficha | Total | Páginas nuevas | P1 (R1) |
| Proveedores | No existe | Lista + ficha (productos, precios, OC) | Total | Páginas nuevas | P1 (R1) |
| Rendiciones | Flujo de SurTec | Flujo AS-IS de J&Y + evidencias | Grande | Reestructurar modelo y vistas | P1 (R2) |
| Costos | Fuentes + reparto inventado | J&Y Real vs. formal, categorías | Grande | Nuevas pestañas; ocultar el reparto | P1 (R3) |
| Documentos | Metadatos | Visor visual | Media | Componente visor reutilizable | P1 (R2/R3) |
| Presupuestos | Oculto | Tipo A (APU) y Tipo B (productos) | Total | Habilitar con nuevo modelo | P2 (R4) |
| Productos y precios | No existe | Catálogo, búsqueda, cotizaciones, comparador | Total | Página nueva con pestañas | P2 (R4) |
| Compras / OC | Base de PMI | Cotización de origen, recepción separada | Media | Modificar | P2 (R4) |
| Personal | Horas y asignaciones | Asistencia, Tareo, Planilla, RxH | Grande | Reestructurar pestañas | P3 (R5) |
| Integraciones | Oculto | Estados honestos | Media | Habilitar con perfil Demo | P3 (R5) |
| Almacén | Oculto | Un almacén, Kardex TO-BE | Media | Habilitar simplificado | P4 (R6) |
| Pagos | No existe | "En levantamiento" | Pequeña | Página informativa | Posterior (R6) |
| Reportes | Oculto | Catálogo operativo | Media | Habilitar sin BI | P2 (R6) |
| Seguridad | Oculto | Roles conceptuales, auditoría | Pequeña | Habilitar; matriz "borrador" | P3 (R6) |
| Administración | Oculto | Catálogos de J&Y | Media | Habilitar | P2 (R6) |
| CRM, BI | Ocultos | No por ahora | — | Mantener solo en PETI | Posterior |

---

## 4. Arquitectura de vistas final para J&Y Demo (Paso 6)

### 4.1 Menú

```text
GENERAL    Inicio · Proyectos · Pendientes
MAESTROS   Clientes · Proveedores · Productos y precios
GESTIÓN    Presupuestos · Compras / OC · Rendiciones · Personal · Almacén · Pagos
CONTROL    Costos y Control Contable · Documentos · Reportes
SISTEMA    Integraciones · Seguridad · Administración
```

Son 18 entradas, frente a 9 hoy. En el riel colapsado y en móvil hay que comprobar la
altura; si no cabe, MAESTROS puede ir en un solo ítem con pestañas.

### 4.2 Páginas

| Página | Estado | Pestañas o secciones en D |
|---|---|---|
| `index.html` | Reutilizar (perfil D) | KPI: proyectos activos, costo J&Y Real acumulado, rendiciones por revisar, OC en curso, presupuestos activos · panel "Proyecto en contexto" con presupuesto, costo real, rendiciones, compras, personal, materiales y documentos · costo por fuente · costo mensual · alertas factuales · actividad |
| `projects.html` / `project.html` | Reutilizar | Resumen · Presupuesto · Compras · Rendiciones · Personal · Materiales · Costos · Documentos · Indicadores (sin avance físico) |
| `approvals.html` | Reutilizar con perfil "Pendientes" | Rendiciones por revisar · Gastos observados · Presupuestos por revisar · OC pendientes · Documentos faltantes · Incidencias |
| **`clients.html` + `client.html`** | **Nueva** | Lista (RUC, razón social, nombre comercial, sector, contacto, estado) · ficha: General · Contactos · Proyectos · Presupuestos · Documentos · Historial |
| **`suppliers.html` + `supplier.html`** | **Nueva** | Lista (RUC, razón social, especialidad, marcas, categorías, estado) · ficha: General · Contactos · Productos y servicios · Precios conocidos · Cotizaciones · OC · Proyectos · Documentos |
| **`products.html`** | **Nueva** | Catálogo · Búsqueda de precios (histórico interno, proveedores, última cotización) · Cotizaciones (con adjunto) · Comparador |
| `budgets.html` / `budget.html` | Reutilizar + vistas nuevas | Lista con tipo y código `PR2606-0022-V2-GM` · Tipo A: Resumen · Partidas y metrados · APU · Insumos · Precios y cotizaciones · Versiones · Tipo B: Resumen · Especificaciones · Opciones de proveedor · Comparación · Versiones · Resumen: costo directo + gastos generales + utilidad = precio cliente |
| `purchases.html` / `purchase.html` | Reutilizar | Lista con cotización de origen · ficha con condiciones y entrega · recepción: material → entrada a almacén; servicio → costo |
| `expenses.html` / `expense.html` | Reutilizar, reestructurar | Escritorio (Administración): lista N.º-año, responsable, preparó, proyecto, total, situación · ficha: gastos con visor de evidencia, revisión por gasto, historial · Móvil (trabajador): Mis Rendiciones → Nueva → proyecto → foto → datos sugeridos → confirmar → presentar |
| `personnel.html` / `worker.html` | Reutilizar, reestructurar | Personal (tipo: oficina, campo, temporal) · Asistencia (SF100) · Tareo (por proyecto, jornadas) · Planilla (mensual + imputación %) · RxH · Biometría · Incidencias |
| `warehouse.html` / `material.html` | Reutilizar (perfil D) | Materiales · Entradas · Salidas · Devoluciones · Transferencias (solo si hay más de una ubicación) · Ajustes · Kardex (marcado como propuesta) |
| **`payments.html`** | **Nueva** (ligera) | "Proceso en levantamiento": qué se sabe (BCP, constancias, facturas, archivo físico) · qué falta levantar · vista conceptual de una constancia |
| `costs.html` | Reutilizar + pestañas | Por fuente · Detalle trazable · J&Y Real vs. tratamiento formal · Por categoría · Consolidación (periodo, responsable, documento) |
| `documents.html` / `document.html` | Reutilizar + visor | Miniaturas · visor con zoom · relación con módulo, registro de origen, versión |
| `reports.html` | Reutilizar (catálogo D) | Unos 13 reportes operativos (§22), sin BI |
| `integrations.html` | Reutilizar (perfil D) | SF100, OCR, IA/clasificación, almacenamiento documental, Contabilidad (exportación), correo (opcional), con estados honestos |
| `security.html` | Reutilizar | Usuarios · roles conceptuales (7) · permisos (borrador) · auditoría · sesiones · respaldos |
| `settings.html` | Reutilizar | Empresa · categorías de gasto · tipos de documento o evidencia · unidades · monedas · estados · parámetros |
| `crm.html`, `analytics.html` | Siguen "no disponible" en D | — |

Hay **6 páginas nuevas** (clients, client, suppliers, supplier, products, payments), que llevan
el total a **31**. Se pueden reducir a 4 si las fichas de cliente y proveedor se abren como
panel dentro de su lista; recomiendo páginas propias para que "Ver cliente" tenga una URL.

### 4.3 Relaciones (los 9 recorridos de la §28)

| # | Recorrido | Cómo se representa | Fase |
|---|---|---|---|
| 1 | Cliente → Presupuesto → Partidas → APU → Insumos → Proveedor → Cotización → Presupuesto final | `client.html` → `budget.html#partidas` → APU → Insumos (precio elegido enlaza a cotización) → `supplier.html` | R4 |
| 2 | Presupuesto → compra → OC → proveedor → recepción | Insumo "Generar OC" → `purchase.html` (cotización de origen) → recepción | R4 |
| 3 | OC → material → entrada → salida a proyecto → costo | Recepción → entrada de almacén → salida → costo de Materiales | R6 |
| 4 | Trabajador → gasto → evidencia → rendición → revisión → Contabilidad → clasificación → costo | Rendición móvil → revisión → "Entregada a Contabilidad" → clasificación → costo de Rendiciones | R2–R3 |
| 5 | SF100 → asistencia → planilla → % imputación → proyecto → costo | Asistencia → Planilla del mes → imputación → costo de Personal | R5 |
| 6 | Personal de campo → tareo → proyecto → costo | Tareo por proyecto; costo "por validar" (sin tarifa automática) | R5 |
| 7 | RxH → proyecto → costo | Pestaña RxH → costo de Personal | R5 |
| 8 | Costo → fuente → operación → documento | Ya existe (`projectFlowData`); se añade el visor del documento | R3 |
| 9 | Proyecto → todos los módulos | Ficha de proyecto | R3 |

Los recorridos guiados del Demo (hoy 4) pasan a ser estos 9, o una selección de 6.

---

## 5. Diseño funcional de los módulos clave

### 5.1 Núcleo de datos (`data/jy-demo.js`)

Todo es ficticio, sin clientes, trabajadores ni cifras reales de J&Y (regla 43 del brief).
Las fechas van en 2026, coherentes con la nomenclatura `PR26…`.

| Entidad | Volumen sugerido | Campos nuevos frente a `jy.js` |
|---|---|---|
| Clientes | 5 | RUC, nombre comercial, dirección, teléfono, correo, contactos[], estado |
| Proveedores | 6 | RUC, contactos[], especialidad, marcas[], categorías[], estado |
| Productos y materiales | 12 | código, categoría, unidad, marca, especificación; los materiales llevan stock y mínimo |
| Precios y cotizaciones | unas 15 | proveedor, producto, precio, moneda, fecha, vigencia, adjunto, observaciones |
| Trabajadores | 8 | tipo (oficina / campo / temporal), régimen (planilla / RxH) |
| Proyectos | 4 | código no `PR-` (ver §6.1), ubicación, cliente |
| Presupuestos | 3 | tipo A/B, código, versiones[], partidas jerárquicas con APU, insumos, GG %, utilidad % |
| OC | 4 | cotización de origen, ítems, condiciones, entrega, tipo (material / servicio) |
| Rendiciones | 5 con unos 18 gastos | número personal y año, spentBy, preparedBy, reviewedBy, gastos[] con tipo de evidencia, categoría, V.V./IGV/No gravado/total, documentado sí o no, motivo |
| Planilla | 2 meses | costo mensual por persona e imputaciones [{proyecto, %}] |
| RxH | 4 | persona, DNI/RUC, proyecto, concepto, fecha, importe |
| Asistencia | 2 semanas | origen SF100 o Excel, entrada, salida, incidencia |
| Tareo | 2 semanas | proyecto, jornada, observación, responsable |
| Movimientos de almacén | unos 10 | entrada, salida, devolución, ajuste |

Las fuentes de costo (`operations`) se **derivan** de estas entidades: gastos aceptados, OC
de servicio recibidas, salidas de material, planilla imputada y RxH. Así las cifras salen de un
solo lugar y coinciden entre vistas.

### 5.2 Presupuestos

- **Tipo A.** Árbol de partidas (6 → 6.1 → 6.1.1) con unidad y metrado. Cada partida hoja
  tiene un APU con tres grupos de recursos: mano de obra, materiales y equipos. Cada recurso
  lleva código, descripción, unidad, cuadrilla, rendimiento, precio y parcial, y el costo
  directo se calcula. La pestaña **Insumos** consolida los recursos de todas las partidas
  (cantidad total y precio referencial) y elige proveedor, enlazando a Búsqueda de precios.
- **Tipo B.** Especificaciones del cliente, opciones por proveedor y comparación, sin APU.
- **Resumen.** Costo directo + gastos generales + utilidad = precio cliente. Las cifras
  internas se ocultan con un interruptor de rol, una simulación visual de permisos.
- **Código.** `PR2606-0022-V2-GM` se muestra tal cual. Solo se interpretan PR, año, mes y
  versión; "GM" y el alcance del correlativo quedan *por validar*.
- **Versionado vs. duplicado.** "Nueva versión" conserva la identidad (V3, mismo código
  base). "Duplicar" crea otro código (`PR2611-0031-V1-…`) con referencia "copiado de".

### 5.3 Rendiciones

- **Identidad.** "N.º 15-2026 · María Salazar": el número es por trabajador y año. El id
  interno es un valor técnico que no se muestra.
- **Personas.** *Realizó el gasto*, *preparó la rendición* (por ejemplo, la Administradora con
  fotos de campo) y *revisó*.
- **Estados propuestos para D** (TO-BE provisional; el vocabulario sale del AS-IS):
  Borrador → Presentada → Observada → Corregida → Aceptada → Entregada a Contabilidad. No hay
  "Aprobada" ni niveles. "Autorizado por" es un campo de texto opcional (WhatsApp, verbal,
  directa o contexto previo), sin flujo.
- **Gasto.** Ítem, fecha, tipo de documento, serie y número, RUC, razón social, descripción,
  **clasificación** (separada de la descripción), V.V., No gravado, IGV, total y evidencia.
- **Evidencia.** Factura, boleta, PDF, foto, captura de billetera digital (Yape o Plin),
  transferencia, depósito u otro. Se ve en un **visor** con la imagen a la izquierda y los
  datos a la derecha, con zoom.
  - Las imágenes son **ilustraciones genéricas** generadas en SVG desde los datos, sin logos
    de bancos ni billeteras.
- **Datos sugeridos.** Etiqueta "Datos sugeridos", confianza por campo y edición. Un cambio
  humano queda en el historial.
- **Clasificación sugerida.** "IA propone: Movilidad". El usuario confirma o corrige y queda
  la traza.
- **Gasto no documentado.** Es un ítem propio con fecha, proyecto, monto, descripción,
  responsable y motivo, y la marca **NO DOCUMENTADO**. Nunca genera un comprobante.
- **Revisión administrativa.** Por gasto: OK / Observado / Corregido por Administración (cambio
  menor con traza). Por rendición: Observar, Aceptar y Entregar a Contabilidad.
- **Historial.** Creada, modificada, presentada, revisada, observada, corregida y aceptada,
  con fecha, hora, usuario y comentario.

### 5.4 Costos y Control Contable

- **Por fuente.** Rendiciones, Compras, Personal (planilla imputada + RxH), Materiales y
  Otros, cada una con drill-down.
- **J&Y Real.** El costo económico ocurrido, incluido lo no documentado.
- **Tratamiento formal.** V.V. · IGV · No gravado · No documentado. Es una vista paralela del
  mismo gasto, sin reglas tributarias automáticas.
- **Por categoría.** Las 10 categorías observadas, configurables en Administración.
- **Consolidación.** Por proyecto, fuente, categoría, periodo, responsable y documento.
  Liquidaciones y valorizaciones: *por validar*, no se implementan.

### 5.5 Personal

| Pestaña | Contenido | Madurez |
|---|---|---|
| Personal | Tipo oficina / campo / temporal; régimen planilla / RxH | AS-IS |
| Asistencia | SF100 → hoy exportación a Excel; entrada, salida, incidencia | AS-IS (Excel) / TO-BE (sincronización) |
| Tareo | Por proyecto: trabajador, fecha, jornada, observación, responsable; firma digital | TO-BE (hoy, lista con firmas) |
| Planilla | Costo mensual e imputación a uno o varios proyectos (%) → importe | AS-IS (% estimado por Contabilidad) |
| RxH | Persona, documento, DNI/RUC, proyecto, concepto, fecha, importe | AS-IS (fuente de costo) |
| Biometría | Equipo SF100, estado "No integrado: exportación manual" | AS-IS |
| Incidencias | Olvidos de firma o marcación, sin marcación | TO-BE |

Se elimina del Demo el costo por hora y la cadena biometría → tareo → costo. Personal temporal
aparece como tipo de trabajador con la nota "modalidad y cálculo por levantar".

### 5.6 Visor de documentos (componente compartido)

`evidenceViewer` (Alpine) dibuja una ilustración del documento desde los datos (`x-text`,
nunca `innerHTML`). Plantillas: factura, boleta, ticket, captura de pago digital,
transferencia o depósito, foto de documento, PDF de varias páginas, cotización y RxH. Incluye
miniatura, vista ampliada con zoom y descarga simulada. Lo usan Rendiciones, Documentos,
Cotizaciones, RxH y Pagos.

---

## 6. Impacto técnico (Paso 5)

### 6.1 Cambios estructurales

| Cambio | Archivos | Riesgo para P/M | Mitigación |
|---|---|---|---|
| Data set propio del Demo | `data/jy-demo.js` (nuevo); `mock-data.js` (rama `jy-demo` en `dataSets`); `variants.js` (`dataSet: 'jy-demo'`); `personnel-data.js` (fixtures) | Bajo: P y M siguen con su data set | Vite elimina el data set ajeno (la trampa de final-audit ya lo exige) |
| Perfil de reglas `variant.rules` | `variants.js` y los componentes que hoy preguntan por módulos | Medio: toca componentes compartidos | Valores por defecto = comportamiento actual; P y M no declaran nada nuevo |
| Menú y nombres por variante | `modules.js` (`NAV_GROUPS` → `navGroupsFor(variant)`, `moduleLabel` con `variant.labels`); `app-shell-template.mjs` | Bajo | Por defecto, los grupos actuales |
| Prefijo de código de proyecto | `modules.js` (`moduleHref('costs')` usa `PR-`), datos de D | Medio | Enrutar por tipo de registro, no por prefijo |
| Módulos nuevos (`clients`, `suppliers`, `products`, `payments`) | `modules.js`, `vite.config.js`, páginas nuevas, `main.js` | Bajo | En P y M muestran "no disponible", como `crm.html` |
| Presupuesto Tipo A/B | `commercial-views.js` → `budget-model.js` nuevo; `budget.html` | Medio | **Guiado por datos**: si el presupuesto tiene `items[]`, se usa la vista nueva; si no, la actual |
| Rendición J&Y | `expense-views.js`, `expense-demo.js`, `expense.html`, `expenses.html` | **Alto**: es la pantalla más probada | `rules.expense = 'review'` solo en D; las pruebas de P y M no cambian |
| Costos J&Y Real / formal | `cost-views.js`, `cost-data.js`, `costs.html` | Medio | Pestañas nuevas solo con `rules.costTreatment`; el reparto 40/25/… solo si `rules.controlAllocation` |
| Personal | `personnel-views.js`, `personnel-data.js`, `personnel.html`, `worker.html` | Medio | Pestañas por perfil (`rules.labor = 'payroll'` en D, `'hours'` en P y M) |
| Pendientes | `approvals-view.js`, `approval-demo.js`, `mock-data.js` (`getPendingApprovals`) | Medio: contadores del header | Tipos de pendiente por perfil; `syncApprovalCounters` se mantiene |
| Visor de evidencia | `components/evidence-viewer.js` (nuevo), estilos en `_design-system.scss` | Bajo | Componente nuevo; tokens de DESIGN.md |
| Marcas de madurez | `utils/maturity.js` (nuevo), estilo `.maturity` | Bajo | Solo se pintan si `rules.maturityTags` |

### 6.2 Perfil de reglas propuesto

```js
// variants.js — valores por defecto = comportamiento actual (P y M no cambian)
rules: {
  approvalsMode: 'approval',     // D: 'worklist'  → "Pendientes"
  expenseFlow: 'approval',       // D: 'review'    → Presentada…Entregada a Contabilidad
  expenseNumbering: 'global',    // D: 'worker-year' → N.º 15-2026
  laborCost: 'hours',            // D: 'payroll'   → planilla + imputación + RxH
  budgetAlertPercent: 80,        // D: null
  physicalProgress: true,        // D: false
  controlAllocation: true,       // D: false (reparto 40/25/15/15/5)
  costTreatment: false,          // D: true  (J&Y Real vs. formal)
  integrationStates: 'credible', // D: 'honest'
  maturityTags: false,           // D: true
}
```

### 6.3 Pruebas que deben cambiar (sin rebajar la comprobación funcional)

- `validate-mock-data.mjs:280`: pasa a `notEqual`. Se añaden validaciones del Demo:
  - numeración única por trabajador y año;
  - total del gasto = V.V. + IGV + No gravado;
  - un gasto no documentado no tiene RUC ni serie;
  - las imputaciones de cada persona y mes suman como máximo 100 %;
  - los costos derivados cuadran con las fuentes.
- `shell-interaction-test.mjs:400-404`: menú del Demo (18 entradas, grupo MAESTROS), recorridos
  nuevos y presencia de Reportes y Seguridad.
- `commercial-interaction-test.mjs:226-235`: el Demo deja de mostrar "Módulo no incluido"; se
  añade un flujo de APU e insumos a cotización y OC.
- `expense-interaction-test.mjs`: el flujo del Demo pasa a Presentada → Observada → Corregida
  → Aceptada → Entregada; se añaden el visor, el gasto no documentado y la numeración. P y M
  siguen igual.
- `personnel-interaction-test.mjs`, `cost-interaction-test.mjs`,
  `warehouse-interaction-test.mjs` y `delivery-nine-interaction-test.mjs`: escenarios del Demo.
- `smoke-test.mjs` y `final-audit.mjs`: de 25 a unas 31 páginas. El final-audit debe seguir
  comprobando que no hay ids de una empresa en otro build.

---

## 7. Respuestas a las 14 preguntas de la §40

1. **¿Qué tiene hoy el mockup?** 25 páginas y 3 builds sobre un solo modelo de datos (proyecto
   → operaciones → costos por fuente). El Demo ve 9 módulos con 2 proyectos y comparte datos
   con PMI.
2. **¿Qué representa bien a J&Y?** El proyecto como eje; las fuentes de costo (Rendiciones,
   Compras, Personal, Materiales); la rendición móvil con "Mis Rendiciones"; V.V., IGV, No
   gravado y No documentado visibles; la Observación con motivo; la trazabilidad costo →
   operación → documento; la estructura documental por proyecto.
3. **¿Qué es demasiado genérico?** Presupuestos (cantidad × precio), las partidas derivadas de
   un total, los comprobantes como ficha de texto, el No Documentado global, el personal por
   horas, Documentos sin imagen y los clientes y proveedores sin interfaz.
4. **¿Qué es herencia de PETI?** CRM, BI, la alerta del 80 %, el avance físico, la biometría
   "Conectado", varios almacenes, el reparto de control 40/25/…, la matriz de permisos rígida y
   la aprobación formal.
5. **¿Qué es herencia de PMI?** El alcance modular (Proyectos, Rendiciones, Compras, Personal,
   Presupuestos, Documentos, Reportes, Integraciones, Seguridad) y la idea de que el Demo es
   "PMI reducido".
6. **¿Qué falta?** Todo lo de la §30: maestros, APU, insumos, precios, cotizaciones,
   comparador, numeración personal, preparador, clasificación, J&Y Real, Planilla, imputación,
   RxH, la diferencia entre Asistencia y Tareo, el Kardex como TO-BE, Pagos y la auditoría
   transversal.
7. **¿Qué vistas agregar?** Clientes, Cliente, Proveedores, Proveedor, Productos y precios, y
   Pagos.
8. **¿Qué vistas modificar?** Inicio, Proyecto, Pendientes, Presupuesto, OC, Rendición,
   Personal, Trabajador, Costos, Documento, Reportes, Integraciones, Seguridad y
   Administración.
9. **¿Qué ocultar en el Demo?** CRM, BI, el gráfico de avance físico, la alerta del 80 %, el
   reparto de control, el costo por hora, "Asignaciones" genéricas y los estados
   "Conectado".
10. **¿Cómo se conecta la información?** Mediante entidades únicas (Proyecto, Cliente,
    Proveedor, Trabajador, Producto y Documento). Los costos se derivan de las operaciones,
    nunca se escriben a mano. Ver los recorridos de §4.3.
11. **¿Cómo se ve al final?** Con el mismo diseño, un menú de 5 grupos y marcas de madurez
    discretas. Las vistas cuentan el proceso real de J&Y y dicen con claridad qué es
    propuesta y qué falta levantar.
12. **¿Qué se puede cambiar sin afectar a las otras variantes?** El data set propio, las
    páginas nuevas (que en P y M quedan como "no disponible"), las vistas guiadas por datos
    (APU), el perfil `rules` con valores por defecto iguales a los actuales y las marcas de
    madurez.
13. **¿Qué componentes se reutilizan?** El shell, las tablas con filtros y orden, las
    pestañas, los modales, los toasts, el kit D3 completo, `projectFlowData`, la estructura
    documental, el asistente de rendición, los movimientos de almacén, la auditoría de
    Seguridad y los contadores de pendientes.
14. **¿Qué validar con J&Y?** La lista de la §8.

---

## 8. Pendientes de validar con J&Y

| # | Tema | Pregunta |
|---|---|---|
| 1 | Código de presupuesto | ¿Qué significa "GM"? ¿El correlativo 0022 es mensual, anual o global? |
| 2 | Código de proyecto | ¿Cómo codifica J&Y sus proyectos? (Evitar `PR`, que es presupuesto.) |
| 3 | APU | ¿Usan S10 u otra herramienta? ¿Los GG y la utilidad son % fijos o por presupuesto? |
| 4 | Costos internos | ¿Quién puede ver el costo interno y el margen? |
| 5 | Rendición: estados | ¿Existe un paso "Entregada a Contabilidad"? ¿Quién la da por aceptada? |
| 6 | Rendición: numeración | ¿Se reinicia cada año por trabajador? ¿Quién la asigna? |
| 7 | Categorías de gasto | ¿La lista de 10 es completa? ¿Quién las asigna (Administración o Contabilidad)? |
| 8 | Imputación de planilla | ¿Con qué periodicidad se fija el %? ¿Dónde se registra hoy? |
| 9 | Personal de campo | ¿Cómo se valoriza el tareo (jornal, contrato, RxH)? |
| 10 | Temporales | Modalidad, cálculo, documentos y pagos |
| 11 | OC | Estados reales, quién emite y si requiere autorización |
| 12 | Avance físico | ¿Se mide formalmente? ¿Con qué fuente? |
| 13 | Almacén | ¿Cuántas ubicaciones? Estructura del "documento parecido a un Kardex" |
| 14 | Pagos | Estados, autorizaciones, pagos parciales y beneficiarios |
| 15 | Moneda | ¿Hay operaciones en USD (cotizaciones de equipos)? |
| 16 | Roles | Personas y responsabilidades reales (Gerencia/Ingeniero, Administración, Contabilidad, encargado de proyecto) |
| 17 | Contabilidad | ¿Qué sistema o formato usan para intercambiar información? |

---

## 9. Plan por fases

Cada fase deja las tres variantes funcionando y la batería completa en verde.

| Fase | Contenido | Resultado visible |
|---|---|---|
| **R1 — Base de la variante** | `jy-demo.js` separado; `variant.rules`, `labels` y `navGroups`; marcas de madurez; código de proyecto; Clientes y Proveedores (lista y ficha); pruebas de datos | Menú nuevo del Demo; maestros navegables |
| **R2 — Rendiciones J&Y** | Modelo nuevo (numeración, tres personas, gastos con categoría), visor de evidencia, datos y clasificación sugeridos, gasto no documentado, revisión administrativa, historial, flujo móvil | Rendición fiel al AS-IS |
| **R3 — Control** | Costos (J&Y Real vs. formal, categoría, consolidación); Documentos con visor; Pendientes; Inicio y ficha de proyecto sin reglas no confirmadas | Trazabilidad completa del gasto al costo |
| **R4 — Presupuestos y compras** | Tipo A (partidas, APU, insumos), Tipo B, Productos y precios (búsqueda, cotizaciones, comparador), versión vs. duplicado, OC con cotización de origen y recepción separada | Recorridos 1 y 2 |
| **R5 — Personal** | Asistencia (SF100), Tareo, Planilla e imputación, RxH, temporales, incidencias; Integraciones con estados honestos | Recorridos 5, 6 y 7 |
| **R6 — Cierre** | Almacén simplificado con Kardex TO-BE, Pagos en levantamiento, Reportes operativos, Seguridad y Administración con catálogos de J&Y, recorridos guiados nuevos, auditoría final | Demo completo |

Decisiones del usuario (11/11/2026): **D1** Clientes y Proveedores también en PMI (y en PETI, que es la versión completa) · **D2** proyectos `PY-26-NNN` · **D3** marcas con interruptor (menú de usuario o Alt + Shift + V), ocultas por defecto · **D4** escenario 2026 · **D5** fichas en páginas propias.

Preguntas originales:

- **D1.** ¿Clientes y Proveedores también en PMI? Su alcance incluye Maestros.
- **D2.** ¿Qué código ficticio de proyecto usar en el Demo?
- **D3.** Marcas de madurez: ¿siempre visibles o con un interruptor? Hoy PRODUCT.md pide un
  solo distintivo de demostración.
- **D4.** ¿Fechas del Demo en 2026?
- **D5.** ¿Páginas propias para las fichas de cliente y proveedor, o paneles?

---

## 10. Notas de R1 (11/11/2026)

- **Datos propios del Demo:** `data/jy-demo.js` (5 clientes, 6 proveedores, 6 trabajadores con
  `kind` Oficina/Campo/Temporal y `regime` Planilla/RxH, 4 proyectos `PY-26-001…004`,
  presupuestos `PR2602-0008`…, 12 operaciones, escenario `today: 2026-07-15`). `mock-data.js` y
  `personnel-data.js` eligen el conjunto por build; los ayudantes de datos llevan
  `/* @__NO_SIDE_EFFECTS__ */` para que rolldown no deje datos de otra variante en el bundle
  (`final-audit` lo comprueba con ids de las otras dos variantes).
- **Configuración:** `variants.js` › `DEFAULT_RULES` + `variant.rules` (por ahora
  `maturityTags`), `variantRule(key)`, `variant.labels` (Demo: "Compras / OC"). Grupo MAESTROS en
  `NAV_GROUPS`. `moduleHref` reconoce proyectos `PR-` y `PY-`.
- **Fechas por conjunto de datos:** `data.today` y `data.exampleDate` alimentan comprobantes de
  ejemplo, eventos locales, tareo manual y el parámetro "Escenario AAAA" de Administración.
- **Clientes y Proveedores** (`clients.html`, `client.html`, `suppliers.html`, `supplier.html`;
  `components/master-views.js`; `data/master-data.js`): KPI, filtros en la URL, tabla y tarjetas
  móviles, alta y edición en modal (RUC validado y único; en registros base RUC y razón social
  no se editan), fichas con pestañas e historial con usuario y fecha. Los cambios se guardan en
  `demo-clients` / `demo-suppliers` y no alteran proyectos, compras ni costos. Enlaces Proyecto →
  Cliente, OC → Proveedor y búsqueda global → ficha.
- **Marcas de madurez** (`utils/maturity.js`): `data-maturity="as-is|to-be|validate"` +
  `data-maturity-note`. En R1 marcan los maestros (TO-BE) y, como "Por validar", el avance
  físico del Inicio, el reparto de control de Costos, las asignaciones de Personal, los estados de
  OC y la numeración/estados de Rendiciones; el tareo de campo es TO-BE.
- **Pruebas:** nueva `masters-interaction-test.mjs` (`npm run test:masters`, incluida en
  `test:delivery10`); `validate-mock-data` valida maestros, separación PMI/Demo, códigos `PY-26`
  y fechas 2026; el resto de pruebas usan los ids del Demo (`PY-26-001`, `OC-26-004`).
- **Para R2:** la rendición del Demo sigue el flujo heredado (Aprobada, `R-26-NNN`); R2 introduce
  numeración por trabajador y año, las tres personas, gastos con categoría, visor de evidencia,
  gasto no documentado y el vocabulario de revisión, detrás de `variant.rules`.

## 11. Notas de R2 (11/11/2026) — Rendiciones de J&Y

- **Regla:** `variant.rules.expenseFlow = 'review'` (Demo); PETI y PMI siguen con `'approval'`.
- **Vistas solo del Demo, sin tocar PETI/PMI:** `expenses.html` y `expense.html` envuelven su
  contenido en `<!-- IF expenseFlow=review --><!-- INCLUDE expense-review-… --><!-- ELSE -->…<!-- /IF -->`;
  el plugin del shell resuelve los bloques al compilar (`applyPageBlocks`). Parciales en
  `src-modern/partials/`; componentes `expenseReviewList` / `expenseReviewDetail`
  (`components/expense-review-views.js`); modelo y reglas en `data/expense-reports.js`.
- **Datos:** `jy-demo.js` › `expenseReports` (6 rendiciones, 27 gastos, una por cada situación:
  Presentada, Observada, Corregida, Aceptada, Entregada a Contabilidad ×2) y `expenseSamples`
  (5 evidencias para "Tomar foto / Subir archivo"). Las operaciones de costo de tipo rendición se
  **derivan** de los gastos (`expenseOperation`): solo las aceptadas o entregadas son costo; llevan
  `label` "N.º 7-2026". Costo ejecutado de la cartera: S/ 127 618.
- **AS-IS representado:** numeración por trabajador y año; responsable del gasto, quien prepara
  (la Administradora con fotos de campo) y quien revisa; autorización informal como texto;
  columnas V.V., IGV, No gravado y No documentado; gasto sin documento con motivo, marcado
  NO DOCUMENTADO y sin comprobante ficticio.
- **TO-BE (marcado):** visor de evidencia (factura/boleta, foto de boleta, captura de Yape/Plin,
  constancia de transferencia/depósito) con zoom y vista ampliada; datos sugeridos por OCR con
  confianza por campo y corrección humana registrada; clasificación sugerida por IA; revisión por
  gasto (Conforme / Observado / Corregido / corrección administrativa); historial con usuario.
- **Por validar:** nombres exactos de las situaciones (Presentada → Observada → Corregida →
  Aceptada → Entregada a Contabilidad), si la entrega a Contabilidad es un paso explícito y que el
  costo se reconozca al aceptar.
- **Tratamiento:** las evidencias sin comprobante tributario (Yape, Plin, transferencias, sin
  documento) se registran como No documentado; no hay reglas tributarias automáticas.
- **Bandeja:** en el Demo, las rendiciones pendientes salen de su estado (base o local) y solo
  ofrecen "Revisar"; los contadores del encabezado se actualizan al cambiar el estado.
- **Pruebas:** `expense-review-interaction-test.mjs` (`npm run test:jy-expenses`, en
  `test:delivery10`); `validate-mock-data` valida numeración, personas, gastos (`itemProblems`),
  totales y costo derivado; la prueba de rendiciones antigua cubre PETI y PMI.
- **Corrección transversal:** `d-block` de Bootstrap lleva `!important` y anulaba `x-show`
  (por ejemplo, "Simulación local" en todas las filas de Rendiciones de PETI/PMI). Usar
  `.show-block` cuando un elemento con `x-show` debe ser bloque.
- **Para R3:** Costos muestra todavía el id técnico `R-26-NNN`; usar `operation.label`. Añadir
  J&Y Real vs. tratamiento formal y la clasificación por categoría con los gastos de las
  rendiciones.

## 12. Notas de R3 (11/11/2026) — Control: Costos, Documentos, Pendientes, Inicio

- **Reglas nuevas** (`DEFAULT_RULES`, Demo entre paréntesis): `approvalsMode` (`'worklist'`),
  `physicalProgress` (`false`), `budgetAlertPercent` (`null`), `controlAllocation` (`false`),
  `costTreatment` (`true`), `documentViewer` (`true`). Etiquetas del Demo: "Pendientes" y
  "Costos y Control Contable". PETI y PMI conservan los valores por defecto.
- **Costos y Control Contable** (`data/cost-treatment.js`, `partials/cost-treatment.html`):
  cada costo ejecutado se descompone en líneas (los gastos de una rendición, una OC, el tareo o
  un ajuste) con fuente, categoría, responsable, periodo y documento. **J&Y Real** = suma de
  todas las líneas = costo ejecutado (validado). **Tratamiento formal**: V.V., IGV, No gravado,
  No documentado y "Sin desglose tributario" (planilla y ajustes). Sin reglas tributarias
  automáticas; queda por validar con Contabilidad si el IGV con crédito fiscal se resta del
  costo real. Costos por categoría (gráfico de barras del kit) y **Consolidación** por fuente,
  categoría, periodo, responsable o proyecto, para el proyecto o todo el portafolio, con detalle
  que abre el gasto de origen. Sin avance físico, sin alerta del 80 % y sin el reparto
  referencial 40/25/15/15/5. Las operaciones muestran "N.º 7-2026".
- **Datos:** las operaciones del Demo llevan `category` y `description`; las evidencias con
  documento de cada rendición son documentos (`getDocuments` › `evidenceItemId`); los gastos sin
  documento no tienen documento.
- **Documentos** (`partials/evidence-viewer.html`, compartido con la rendición): vista del
  documento con zoom y vista ampliada. Evidencias: el comprobante; rendición: hoja con sus
  gastos y totales; OC: orden ilustrada; otros: hoja resumen. "Abrir operación de origen" de una
  evidencia abre su gasto.
- **Pendientes** (`data/worklist.js`, `partials/worklist.html`): bandeja de tareas, no de
  aprobaciones: rendiciones por revisar, observadas (con el motivo), por entregar a
  Contabilidad, OC pendientes y documentos faltantes. Cada fila lleva a su registro con la
  acción siguiente. El contador del encabezado y del riel cuenta todas las tareas (6 al inicio).
- **Inicio:** "Proyecto en contexto" reemplaza "Ejecución frente al avance" (presupuesto, costo
  J&Y Real, disponible, rendiciones, compras, personal, documentos); el bloque principal muestra
  Pendientes. **Proyecto:** KPI de rendiciones en lugar de avance; sin avance físico en la ficha
  ni en la lista.
- **Plugin:** los `INCLUDE` pueden anidarse (hasta 4 niveles).
- **Riel:** los nombres largos de módulo pasan a dos líneas en lugar de ensanchar el riel.
- **Pruebas:** `jy-control-interaction-test.mjs` (`npm run test:jy-control`, en
  `test:delivery10`); `validate-mock-data` comprueba el desglose de cada línea, J&Y Real =
  ejecutado en las tres variantes y un documento por evidencia; la prueba de R2 usa el contador
  de Pendientes.
- **Para R4:** Presupuestos (Tipo A con partidas, APU e insumos; Tipo B de productos),
  Productos y precios, cotizaciones y comparador, OC con cotización de origen.
