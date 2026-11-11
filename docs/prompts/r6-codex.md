# R6 — Cierre del realineamiento de J&Y Demo (traspaso para Codex)

> Escrito el 11/11/2026 al terminar R5 (commit `397dcd8`). Léelo completo antes de tocar código.
> Al terminar, deja todo en un solo commit local (sin `git push`) y avisa qué hiciste.

## 1. Contexto en cinco líneas

- Mockup frontend sin backend (Vite + Alpine + Bootstrap 5 + SCSS + kit D3). Tres builds:
  `surtec-peti` (curso PETI), `jy-pmi` (curso PMI) y `jy-demo` (propuesta real para J&Y).
- Desde el 11/11/2026, **J&Y Demo se realinea con los procesos reales de J&Y Ingenieros
  Consultores** en seis fases (R1–R6). R1–R5 están hechas. **Tu tarea es R6, la última.**
- Regla de oro: cada pieza del Demo se marca como **AS-IS confirmado**, **Propuesta TO-BE** o
  **Por validar**. Nunca presentes una propuesta como si fuera hoy un proceso de J&Y.
- **SurTec PETI y J&Y PMI no deben cambiar su comportamiento.** Todo lo del Demo va detrás de
  `variant.rules` o de módulos habilitados solo en el Demo.
- Datos ficticios. Nada de nombres, RUC ni cifras reales de J&Y.

## 2. Lee esto primero (en este orden)

1. `CLAUDE.md` (convenciones y comandos).
2. `docs/realineamiento-jy-demo.md`: el análisis completo. Para R6 interesan las secciones
   **4** (arquitectura de vistas), **5.6** (visor), **8** (pendientes de validar), **9** (fases)
   y las **notas 10–14** de cada fase (qué se hizo y cómo).
3. `DESIGN.md` (tokens y componentes; no inventes colores).
4. Código de referencia de cómo se hizo cada fase:
   - Reglas por variante: `src-modern/scripts/config/variants.js` (`DEFAULT_RULES`,
     `rules` del Demo, `labels`, `enabledModules`).
   - Bloques por variante en HTML: `<!-- IF regla=valor --> … <!-- ELSE --> … <!-- /IF -->` y
     `<!-- INCLUDE nombre -->` (`src-modern/partials/nombre.html`), resueltos al compilar en
     `scripts/app-shell-template.mjs` › `applyPageBlocks`. Ejemplo completo:
     `src-modern/personnel.html` + `src-modern/partials/personnel-jy.html` +
     `src-modern/scripts/components/personnel-jy-views.js` + `src-modern/scripts/data/personnel-jy.js`.
   - Datos del Demo: `src-modern/scripts/data/jy-demo.js` (función `buildJyDemoData`).
   - Marcas de madurez: atributo `data-maturity="as-is|to-be|validate"` +
     `data-maturity-note="…"` sobre un elemento **sin** `x-text` (ver `utils/maturity.js`).
   - Pruebas de cada fase: `scripts/masters-…`, `expense-review-…`, `jy-control-…`,
     `jy-budgets-…`, `jy-personnel-interaction-test.mjs`.

## 3. Estado del Demo al empezar R6

Menú del Demo hoy: GENERAL (Inicio, Proyectos, Pendientes) · MAESTROS (Clientes, Proveedores,
Productos y precios) · GESTIÓN (Presupuestos, Compras / OC, Rendiciones, Personal) · CONTROL
(Costos y Control Contable, Documentos) · SISTEMA (Integraciones).

Faltan en el Demo: **Almacén, Pagos, Reportes, Seguridad y Administración**. En el Demo, esas
páginas muestran hoy "no disponible" porque sus módulos no están en `jyDemoModules`.

Cifras de cartera del Demo (las comprueba `scripts/validate-mock-data.mjs`): 3 proyectos
activos, presupuesto S/ 407 865.31, costo ejecutado S/ 133 508. Si agregas operaciones con
costo, **actualiza esas cifras en el validador** y explica el cambio en las notas.

## 4. Qué hay que hacer en R6

### 4.1 Almacén y materiales (prioridad 4, TO-BE)

J&Y **no tiene un proceso formal de almacén**; Contabilidad mencionó "un documento parecido a
un Kardex". Aquí sí se diseña un estándar, pero todo va marcado **Propuesta TO-BE** y el Kardex
nunca se presenta como algo que J&Y ya usa.

- Habilita `warehouse` en `jyDemoModules`. Crea una regla, por ejemplo
  `warehouseMode: 'multi'` (por defecto) / `'single'` (Demo): **un solo almacén**
  ("Almacén principal", con ubicación y responsable). Con un solo almacén, oculta
  transferencias y la pestaña de almacenes múltiples.
- Datos: materiales del Demo a partir del catálogo `PRODUCTS` (por ejemplo `MAT-01…MAT-10`),
  con stock, mínimo y ubicación. Una **OC de material nueva** (por ejemplo `OC-26-005`,
  `receptionKind: 'Material'`, `costSource: null`, con `inventoryLine`) que entra a almacén, y
  **salidas a proyecto** (`material_issue`, `costSource: 'materials'`) que generan el costo del
  proyecto. Agrega una devolución y un ajuste (merma o corrección) con motivo.
- Ojo: `src-modern/scripts/data/warehouse-data.js` › `warehouseMovements(data)` hoy tiene
  `if (data.id !== 'surtec') return [];` y usa *fixtures* de SurTec. Generalízalo **guiado por
  datos** (movimientos en `jy-demo.js`, por ejemplo `data.warehouseMovements`) sin romper
  SurTec. Las OC de material que ya existen en el Demo (OC-26-001…003) **ya cuentan como costo
  de Compras**: no las vuelvas a contar como material.
- Kardex por material: fecha, documento, entrada, salida, saldo, proyecto y responsable,
  generado desde los movimientos. Marca `data-maturity="to-be"` con la nota "Propuesta: Kardex
  generado desde los movimientos; hoy J&Y no tiene un Kardex formal".
- Ajustes (merma, pérdida, corrección, ajuste de inventario) siempre con motivo, usuario y fecha.

### 4.2 Pagos — "Proceso en levantamiento"

No conocemos el proceso. **No construyas un módulo completo.**

- Nuevo módulo `payments` ("Pagos"), solo en el Demo, en GESTIÓN después de Almacén
  (`NAV_GROUPS`, `MODULES`, `moduleHref`, `vite.config.js` input, `main.js`,
  `initShellActions` en `components/shell.js`). Nueva página `src-modern/payments.html`, con el
  patrón "no disponible" en las otras variantes (como `products.html`). Total: **31 páginas**
  (actualiza `scripts/final-audit.mjs`, `CLAUDE.md` y `README.md`).
- Contenido: título "Pagos — Proceso en levantamiento" (`data-maturity="validate"`).
  - **Lo que se sabe (AS-IS):** proceso separado; operaciones bancarias, principalmente BCP;
    existen constancias; algunos pagos se relacionan con facturas; archivo documental físico.
  - **Lo que falta levantar:** estados, autorizaciones, pagos parciales, beneficiarios,
    prioridades, flujo completo.
  - Una **vista conceptual** de cómo se vería un pago vinculado a su OC o factura y a su
    constancia. Puedes reutilizar el visor de evidencia (`partials/evidence-viewer.html`,
    layout `transfer`), sin logos de bancos. Márcala "Propuesta TO-BE".

### 4.3 Reportes operativos (sin BI)

- Habilita `reports` en el Demo (no `bi`; `analytics.html` debe seguir "no disponible").
- Regla, por ejemplo `reportsCatalog: 'operational'`: catálogo de J&Y (§22 del análisis):
  costos por proyecto, por fuente y por categoría; rendiciones; gastos sin documento; compras;
  proveedores; personal; planilla imputada; tareo; materiales; movimientos de almacén;
  presupuesto vs. costo.
- Reutiliza `components/report-views.js` y sus gráficos del kit D3 donde se pueda; los datos
  salen de `data/cost-treatment.js` (`costLines`, `groupLines`), `data/expense-reports.js`,
  `data/personnel-jy.js` y los movimientos de almacén. "Exportar" es simulado (toast).
- No muestres avance físico ni la alerta del 80 % (`physicalProgress: false`,
  `budgetAlertPercent: null` ya existen en el Demo).

### 4.4 Seguridad (capacidad transversal, sin protagonismo)

- Habilita `security` en el Demo. Regla, por ejemplo `securityProfile: 'jy'`.
- Roles conceptuales (§33): Gerencia / Ingeniero, Administración, Contabilidad, trabajador de
  oficina, trabajador de campo, encargado de proyecto, administrador del sistema. La matriz de
  permisos va marcada **"Borrador · por validar"**; no la presentes como definitiva.
- **Auditoría transversal**: lista eventos reales del Demo (historial de rendiciones, versiones
  de presupuestos, ediciones de clientes y proveedores, imputaciones, firmas de tareo,
  incidencias), con fecha, usuario, acción, registro y motivo. Toma los datos base y lo que haya
  en `localStorage` mediante las funciones `load*` existentes.
- No afirmes "MFA Activado" ni "Backup Correcto" en el Demo: muéstralos como propuesta.

### 4.5 Administración (datos maestros y configuración)

- Habilita `administration` en el Demo. Catálogos de J&Y:
  - categorías de gasto (`EXPENSE_CATEGORIES`);
  - tipos de documento o evidencia (`EVIDENCE_TYPES`);
  - unidades;
  - monedas;
  - estados configurables: rendición (`REVIEW_STATUSES`), presupuesto (`BUDGET_STATUSES`) y OC (provisionales).
- Agrega accesos a Clientes, Proveedores y Productos.
- Empresa: J&Y es real; deja "Por completar con la empresa" (ya ocurre porque el Demo no tiene
  `company.legal`).
- Parámetros: quita del Demo la "Alerta de ejecución de presupuesto: desde 80 %" y el reparto
  referencial. Muestra GG y utilidad por defecto como "Por validar".

### 4.6 Recorridos de demostración del Demo

Reemplaza los recorridos del Demo (hoy 4, en `scripts/app-shell-template.mjs` ›
`renderDemoTours`) por los recorridos de la §4.3 del análisis, por ejemplo:

1. Cliente → Presupuesto → Partidas → APU → Insumos → Cotización.
2. Presupuesto → Generar OC → Proveedor.
3. OC de material → Entrada → Salida a proyecto → Costo.
4. Rendición → Revisión → Contabilidad → Costo.
5. SF100 → Planilla → Imputación → Costo.
6. Costo → Fuente → Operación → Documento.

Cada paso debe abrir una URL que exista. Actualiza
`verifyDemoTours('jy-demo', 4)` en `scripts/shell-interaction-test.mjs`.

### 4.7 Cierre

- Marcas de madurez en todas las vistas nuevas.
- Móvil a 390 px sin desborde horizontal; tema oscuro correcto.
- `docs/realineamiento-jy-demo.md`:
  - cambia el estado a "R1–R6 terminadas";
  - agrega "## 15. Notas de R6" con el mismo estilo de las notas 10–14;
  - revisa la §8 (pendientes de validar con J&Y) por si R6 agrega preguntas.
- Actualiza también `docs/plan-mejoras.md` (párrafo final), `docs/mockup-master.md`,
  `PRODUCT.md` (fila de `jy-demo`), `DESIGN.md` (componentes nuevos) y `CLAUDE.md`
  (`test:jy-…` nuevo y número de páginas).

## 5. Pruebas (obligatorio)

- Nueva prueba `scripts/jy-closing-interaction-test.mjs` (`npm run test:jy-closing`, súmala a
  `scripts/verify-delivery-ten.mjs`). Copia la estructura de
  `scripts/jy-personnel-interaction-test.mjs`. Debe cubrir:
  - almacén: un almacén, entrada desde la OC, salida a proyecto que suma costo de Materiales y
    Kardex con saldo;
  - pagos: "en levantamiento", sin flujo inventado;
  - reportes: catálogo operativo, sin BI, y una cifra que coincida con Costos;
  - seguridad: roles conceptuales y auditoría con eventos;
  - administración: catálogos de J&Y, sin el 80 %;
  - recorridos;
  - en SurTec y PMI, comprobar que esas vistas siguen como antes.
- `scripts/validate-mock-data.mjs`: reglas de almacén (stock = apertura + entradas − salidas
  + devoluciones ± ajustes; la salida genera el costo; cifras de cartera actualizadas).
- **Las pruebas antiguas que hoy afirman "no disponible" en el Demo** (warehouse, reports,
  security, administration en `warehouse-interaction-test.mjs` y
  `delivery-nine-interaction-test.mjs`) deben cambiar: compruebas la vista nueva del Demo y
  mantienes la comprobación de PMI. No rebajes ninguna comprobación funcional (regla de
  `CLAUDE.md`).
- `scripts/final-audit.mjs`: 31 páginas; sigue comprobando que ningún build contiene ids de otra
  variante.

### Comandos (en **PowerShell**, no en Git Bash: Git Bash altera `/Mockup-ERP/`)

```powershell
npm run icons          # si agregas un icono bi-*
npm run lint
npm run check:mock-data
$env:PAGES_BASE='/Mockup-ERP/'; node scripts/build-variants.mjs
node scripts/jy-closing-interaction-test.mjs
node scripts/verify-delivery-ten.mjs   # batería completa (~10 min); todo en verde
npm run build; npm test                # prueba de humo
```

`node scripts/build-variants.mjs` **no** corre `check:mock-data`: córrelo aparte.

## 6. Trampas conocidas (ya nos pasaron)

- **Datos que se filtran a otro build.** En `jy-demo.js`, toda función auxiliar lleva
  `/* @__NO_SIDE_EFFECTS__ */`. Todo arreglo construido con `.map`, `.flatMap` o spread a nivel de
  módulo va dentro de una llamada pura, por ejemplo
  `const X = /* @__PURE__ */ (() => [ … ])();`. Si no, rolldown deja datos del Demo en
  SurTec/PMI y `final-audit` falla ("incluye PY-26-001"). Compruébalo contando `PY-26-001` en
  `dist-pages/*/assets/*.js`.
- Los módulos de `data/` distintos de `surtec.js`, `jy.js` y `jy-demo.js` van en **todos** los
  builds: nunca pongas ahí ids ni nombres de una empresa.
- `d-block` de Bootstrap lleva `!important` y **anula `x-show`**. Usa `.show-block`.
- `x-show` se aplica en el siguiente ciclo: en las pruebas, espera a que el panel sea visible
  tras hacer clic en una pestaña.
- No pongas `data-maturity` en un elemento con `x-text`: el texto borraría la marca.
- Los encabezados `th` salen en mayúsculas por el estilo global; donde no convenga, usa
  `text-transform: none` (ver `.compare-table`).
- Ids, clases y `data-page` **no pueden empezar por `bi-`** (el generador de iconos los toma
  como iconos).
- Fechas del Demo: escenario 2026 (`data.today = '2026-07-15'`). Montos con céntimos con
  `formatAmount` ("S/ 1 250.00").
- Los modales de Bootstrap ignoran el cierre durante su animación de apertura: en pruebas,
  espera a que esté abierto del todo.
- Edita archivos con Python o con la herramienta de edición, no con `Set-Content` de
  PowerShell (añade BOM).
- Si cambias una estructura que prueban los scripts, actualiza la aserción **sin** rebajar la
  comprobación.

## 7. Al terminar

- Batería completa en verde, `npm test` en verde, `lint` y `check:mock-data` sin errores.
- Un commit con el mensaje
  `R6 de J&Y Demo: almacén, pagos en levantamiento, reportes, seguridad, administración y cierre`
  y al final la línea de coautoría que uses.
- **No hagas `git push`.** El usuario revisa y decide cuándo publicar.
- Resume al usuario, en español y brevemente: qué se ve nuevo en el Demo, cifras que
  cambiaron y qué quedó "por validar" con J&Y.
