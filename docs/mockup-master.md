# Mockup Maestro: base de trabajo

Esta es una aplicación **frontend demostrativa** basada en Metis 3.6.0. No hay
backend, autenticación, OCR, biometría, carga de archivos ni integraciones reales.
Los registros y documentos descritos aquí son ficticios.

## Una base y tres presentaciones

| Modo de build | Empresa visible                       | Datos    | Alcance inicial                   |
| ------------- | ------------------------------------- | -------- | --------------------------------- |
| `surtec-peti` | SurTec Ingeniería y Tecnología S.A.C. | `surtec` | TO-BE PETI completo               |
| `jy-pmi`      | J&Y Ingenieros Consultores S.A.C.     | `jy`     | Alcance contractual PMI           |
| `jy-demo`     | J&Y Ingenieros Consultores S.A.C.     | `jy`     | Demostración empresarial resumida |

La selección ocurre mediante el modo de Vite durante la compilación; no existe
un selector público en la interfaz. Las variantes comparten estructura y
componentes. Los datos de SurTec y J&Y están separados en módulos distintos;
PMI y Demo usan el mismo conjunto ficticio de J&Y. El proyecto, el tema y
el estado del menú lateral usan `variantStorageKey()` para separar los estados
entre presentaciones del mismo dominio.

- Configuración: `src-modern/scripts/config/variants.js`.
- Datos: `src-modern/scripts/data/surtec.js` y `jy.js`.
- Consultas y cálculos: `src-modern/scripts/data/mock-data.js`.
- Logos copiados sin redibujo desde los ZIP entregados: `public-assets/assets/brands/`.
  El logo original pequeño de J&Y se conserva como referencia. Los PNG grandes
  de J&Y son variantes suministradas en el paquete; sus colores de interfaz son
  neutrales y provisionales, no una paleta corporativa oficial.

## Decisiones sobre cifras y estados

Los tres proyectos SurTec especificados suman S/ 426 000 de presupuesto y
S/ 243 150 de costo ejecutado. El Panel General deriva sus KPI
de estos tres registros; **12 proyectos, S/ 1 245 000 y S/ 768 400** describen
un portafolio más amplio que aún no está documentado en los datos mock.
No se mostrarán esos totales hasta añadir proyectos que los sustenten.

PR-2027-001 conserva S/ 185 000 de presupuesto y S/ 112 450 ejecutados.
Las fuentes suman exactamente ese costo: Compras S/ 47 230, Personal
S/ 30 362, Rendiciones S/ 15 743, Materiales S/ 13 494 y Otros S/ 5 621.
Una OC adicional aprobada pero no ejecutada por S/ 16 250 eleva el costo
comprometido a S/ 128 700. El saldo frente al **ejecutado** es S/ 72 550;
el saldo disponible para **nuevos compromisos** es S/ 56 300.

OC-028 y R-045 están atendida/aprobada y ya figuran en costos. Los pendientes
de demostración son OC-033 y R-050. Cable UTP Cat6 tiene 1 250 unidades
frente a mínimo de 300: no genera alerta. El ejemplo de stock bajo es
Conector RJ45, con 80 unidades frente a mínimo de 100. PR-2027-002 sí tiene
riesgo presupuestal: S/ 82 500 ejecutados de S/ 96 000 (85,9 %).

Los documentos son metadatos simulados vinculados a presupuestos u operaciones.
No existe un PDF físico detrás de cada nombre. Los costos ejecutados proceden
de operaciones marcadas con `costSource`; las OC pendientes o aprobadas sin
recepción no se agregan todavía al costo ejecutado.

## Entrega 2: shell y navegación

El header, la barra lateral y el footer se generan desde
`scripts/app-shell-template.mjs` para todas las páginas con marcadores
`APP_HEADER`, `APP_SIDEBAR` y `APP_FOOTER`. La lista y el orden fijo de módulos
están en `src-modern/scripts/config/modules.js`; solo se muestran los módulos
habilitados para cada presentación. No hay selector visible entre empresas o
cursos. Los enlaces de la barra lateral llevan al Panel General o a la vista
preliminar del módulo, nunca a una página genérica de Metis.

La búsqueda global consulta proyectos, clientes, proveedores, personal,
presupuestos, operaciones y documentos del conjunto mock correspondiente. El
selector de proyecto sincroniza el contexto visible y lo conserva en
`localStorage` con una clave distinta por variante. Las notificaciones se
calculan a partir de los registros mock; el menú de usuario muestra acciones
demostrativas. Tema y barra lateral también conservan su estado por variante.

`src-modern/index.html` es un Panel General preliminar con cifras derivadas de
los registros. `src-modern/module-preview.html` da una entrada navegable a los
módulos que se desarrollarán después. Ambas páginas indican que usan datos de
demostración. Los ejemplos antiguos de Metis permanecen en `src-modern/` como
material de referencia, pero se excluyen del build publicable hasta adaptar su
contenido.

## Entrega 3: primer recorrido completo

El recorrido público es `index.html` → `projects.html` → `project.html?id=...`.
El Panel General muestra indicadores del portafolio, gráficos ApexCharts de
presupuesto frente a costo y costos por fuente, actividad derivada de las
operaciones, alertas y accesos rápidos. Todos los importes proceden de
`getProjectFinancials()`, `getPortfolioFinancials()` y `getCostBySource()`.

La lista de Proyectos filtra por código, nombre, cliente y estado. Búsqueda y
estado se guardan en la URL, y la Ficha Integral conserva esos parámetros en
el enlace de regreso. El selector de proyecto del header se sincroniza con la
ficha abierta. La ficha tiene tres secciones navegables por teclado: Resumen e
indicadores (incluye presupuesto y costos), Operaciones (compras, rendiciones,
personal y materiales) y Documentos. Los registros enlazan a vistas adaptadas o
preliminares válidas; los documentos siguen siendo metadatos simulados.

La navegación y las cifras se prueban en las tres variantes bajo una subruta
tipo GitHub Pages. También se revisaron escritorio, tablet, móvil y tema oscuro.

## Entrega 4: presupuestos y compras

`budgets.html` y `budget.html` muestran cotizaciones por proyecto, filtros, ficha,
partidas, importes, estado y versiones. Cada nueva versión se añade al historial
sin reemplazar la versión base. La nota y el estado de las versiones creadas en
la demostración se guardan en `localStorage` bajo una clave propia de cada
variante. El importe y las partidas proceden del presupuesto mock original y no
se editan en esta entrega. Las aprobaciones y el envío a revisión son visuales.

`purchases.html` y `purchase.html` muestran OC, filtros, proveedor, proyecto,
partidas, aprobación, recepción y saldo presupuestario. La aprobación y la
recepción se simulan en la vista actual; al recargar se recupera el estado del
conjunto mock. No cambian costos ejecutados, compromisos ni saldos. Las alertas
comparan cada OC con el saldo disponible para nuevos compromisos y señalan
proyectos con ejecución de al menos 80 %.

Los importes originales son totales mock que ya estaban en los datos compartidos.
El desglose de dos partidas es **referencial** y se calcula para que subtotal e
IGV + IPM (18 %) sumen exactamente el total de cada registro. No representa una
cotización tributaria real. Cada presupuesto y OC enlaza con su proyecto y con
metadatos de un documento mock; las OC que carecían de un identificador de
documento reciben uno simulado sin crear archivos PDF.

## Entrega 5: rendiciones de gastos

`expenses.html` ofrece listado y filtros por búsqueda, proyecto y estado.
`expense.html` permite crear una rendición local en cuatro pasos: seleccionar
proyecto, agregar comprobantes de ejemplo, comparar evidencia y propuesta
editable, y seguir el estado. Los campos incluyen Valor de Venta, IGV, No
Gravado y un gasto No Documentado separado. La propuesta identificada como
«OCR simulado» se copia de ejemplos incorporados al código: no hay cámara,
subida de archivos ni reconocimiento real. Los detalles de comprobante de las
rendiciones base son ilustrativos; solo el código, estado, proyecto y total
proceden de las operaciones mock compartidas.

El recorrido local permite enviar, observar con motivo, corregir, reenviar y
aprobar. Cada cambio añade una entrada al historial. Los borradores, datos
editados e historial se guardan en `localStorage` con una clave por variante.
Las entradas usan una fecha ficticia del escenario 2027, no un sello de auditoría.
Una aprobación de demostración crea una relación visible en la vista preliminar
de Costos, señalada como simulada y excluida del costo ejecutado y de los saldos
compartidos. Una rendición base ya aprobada enlaza al detalle de costo mock que
sí está incluido en la fuente Rendiciones.

## Entrega 6: Personal y Tareo

`personnel.html` reúne Personal, Asignaciones, Asistencia y Tareo con filtros.
`worker.html` conecta cada ficha con jornadas, proyectos y costos laborales. Los
nombres y DNI son ficticios. Los porcentajes de asignación y las jornadas son
ejemplos vinculados por IDs; **no reconstruyen una nómina ni una tarifa por hora**.
Los importes laborales proceden exclusivamente de las operaciones TAR del
conjunto compartido. Se pueden abrir esas operaciones desde la ficha y el tareo
en Costos por Proyecto.

El registro manual visual crea una asistencia y un tareo relacionados. Requiere
una asignación existente, fecha dentro del proyecto, horario válido y motivo.
Se guarda en `localStorage` por variante y queda marcado como demostración, sin
sumarse a costos. En `surtec-peti` aparecen además Biometría e Incidencias, con
marcaciones ficticias y acciones de corrección, justificación o descarte locales.
No existe dispositivo conectado, captura biométrica ni sincronización. PMI y
J&Y Demo no muestran esas secciones.

## Entrega 7: Almacén y Materiales

`warehouse.html` y `material.html` muestran inventario, entradas, salidas,
devoluciones y Kardex para SurTec PETI. Las OC ficticias `OC-035`, `OC-202` y
`OC-302` representan compras de inventario recibidas. Su subtotal e IGV se
desglosan desde material, cantidad y precio unitario; **no aumentan el costo
ejecutado**. Las operaciones `SAL-015`, `SAL-201` y `SAL-301` son las únicas
imputaciones a Materiales. `DEV-015` devuelve 20 m del cable: el importe de
`SAL-015` ya es neto de esa devolución y no se registra otro costo.

La existencia inicial ficticia más los movimientos da 1 250 m de Cable UTP
Cat6 (mínimo 300) y 80 conectores RJ45 (mínimo 100). La alerta se muestra solo
para los conectores. PMI y J&Y Demo no muestran Almacén operativo; una URL
directa tampoco habilita sus datos. Todos los movimientos y documentos son
simulados, sin recepción física ni persistencia de inventario.

## Entrega 8: Costos por Proyecto

`costs.html` reúne las cinco fuentes a partir de las mismas operaciones que
alimentan el Panel General y la Ficha Integral. Cada costo ejecutado tiene una
operación y un documento mock. Las OC recibidas de inventario quedan fuera del
ejecutado para evitar duplicar la salida de material. Las OC aprobadas aún
abiertas se muestran aparte como compromisos.

Para `PR-2027-001`: presupuesto S/ 185 000; ejecutado S/ 112 450, compuesto
por Compras S/ 47 230, Personal S/ 30 362, Rendiciones S/ 15 743, Materiales
S/ 13 494 y Otros S/ 5 621. Compromisos abiertos S/ 16 250; comprometido
total S/ 128 700. El saldo frente al ejecutado es S/ 72 550 y el disponible
para nuevos compromisos S/ 56 300. La ejecución es 60,8 %. El gráfico, las
fuentes, el detalle de operación y el resumen de Reportes usan estos cálculos.

Las **partidas de control referencial** distribuyen el presupuesto total entre
fuentes con porcentajes ilustrativos (40/25/15/15/5). No representan partidas
aprobadas ni modifican el presupuesto; sus alertas se basan en esa distribución
y están identificadas como referenciales. La alerta de ejecución general se
activa al 80 % o más del presupuesto ejecutado.

## Entrega 9: documentación y módulos de apoyo

`documents.html` reúne referencias de documentos por proyecto, módulo,
operación y tipo. `document.html` muestra responsable ficticio, versión y
relaciones con el proyecto y el registro de origen. La vista previa representa
metadatos; no hay archivos PDF. Las nuevas versiones son acciones visuales
guardadas únicamente en el navegador y separadas por variante.

`reports.html` ofrece reportes operativos para SurTec PETI y J&Y PMI. El panel
BI gerencial solo aparece en PETI. Sus importes se calculan desde los mismos
proyectos y operaciones que Panel General, Ficha Integral y Costos. El filtro
de periodo acota los movimientos y la vista mensual; los KPI acumulados
conservan todo el historial del proyecto. Los enlaces llevan del indicador al
proyecto, a su fuente de costo y al registro.

`crm.html`, exclusivo de PETI, recorre OP-001 → PRE-001 → PR-2027-001 con
registros ficticios. `integrations.html`, también exclusivo de PETI, describe
cinco conexiones propuestas sin dispositivos conectados ni sincronizaciones.
`security.html`, disponible en PETI y PMI, presenta perfiles y permisos de
ejemplo, MFA sin implementar, ausencia de sesiones reales, referencias de
operaciones que no constituyen un registro de auditoría y respaldos no
ejecutados. `settings.html`, disponible en PETI y PMI, presenta la empresa,
catálogos de los módulos habilitados y parámetros de muestra en solo lectura.
J&Y Demo no expone Reportes, CRM, Integraciones, Seguridad ni Administración.

## Entrega 10: verificación final y GitHub Pages

Los cinco escenarios del segundo prompt se comprueban con
`npm run test:delivery10`: (1) gerencia → PR-2027-001 → Costos → Compras →
OC-025 → documento; (2) rendición móvil → observación → corrección →
aprobación → Costos; (3) OC → recepción → entrada → Kardex → salida → costo;
(4) asistencia simulada → tareo → proyecto → costo laboral; y
(5) oportunidad OP-001 → presupuesto PRE-001 → proyecto PR-2027-001.
Las acciones de foto, OCR, huellero, aprobación y recepción representan un
recorrido visual, no dispositivos ni operaciones reales.

La auditoría abre las 22 vistas de cada build en escritorio y móvil, comprueba
enlaces visibles, assets, búsqueda, logos, alcance, tema claro/oscuro,
etiquetas básicas de accesibilidad y consola. El build separa los datos
operativos y los logos de SurTec y J&Y; los manifiestos tienen nombre, iconos
y rutas relativas por variante. La raíz de Pages redirige a J&Y Demo sin un
selector público. Una URL directa a una vista no habilitada muestra un
estado de indisponibilidad.

El workflow `.github/workflows/pages.yml` usa las acciones oficiales
`configure-pages`, `upload-pages-artifact` y `deploy-pages` para subir
**solo `dist-pages/`** desde la rama predeterminada. El repositorio debe
configurarse en GitHub con **Settings → Pages → Source: GitHub Actions**.
El workflow calcula la subruta desde el nombre real del repositorio; si es
un repositorio de usuario terminado en `.github.io`, usa la raíz `/`.
No hay un remoto Git configurado ni una publicación confirmada en este
equipo.

Para una comprobación local equivalente a Pages en PowerShell:

```powershell
$env:PAGES_BASE='/Mockup-ERP/'  # sustituir por /nombre-real-del-repositorio/
npm run build:variants
npm run test:delivery10
npm run preview:pages
```

Con ese ejemplo local, las direcciones son
`http://127.0.0.1:4174/Mockup-ERP/surtec-peti/`,
`http://127.0.0.1:4174/Mockup-ERP/jy-pmi/` y
`http://127.0.0.1:4174/Mockup-ERP/jy-demo/`.
Tras una publicación real en un repositorio de proyecto, el patrón esperado
es `https://<usuario-o-organización>.github.io/<repositorio>/<variante>/`.
No se fija aquí una URL pública porque el remoto todavía no está definido.

## Comandos

```powershell
npm ci
npm run dev:surtec       # o dev:jy-pmi / dev:jy-demo
npm run check:mock-data
npm run lint
npm run build
npm run build:variants
npm run test:shell
npm run test:commercial
npm run test:expenses
npm run test:personnel
npm run test:warehouse
npm run test:costs
npm run test:delivery9
npm run test:delivery10
npm run preview:pages
```

En este equipo Windows, para la instalación se usó
`$env:NODE_OPTIONS='--use-system-ca'; npm ci`. Esto mantiene activa la
verificación TLS. `npm run build` genera `dist-modern/` con las 22 vistas
adaptadas. `npm run build:variants` genera las tres salidas en `dist-pages/`.
Para GitHub Pages, el workflow calcula `PAGES_BASE` y publica
`dist-pages/`. El comando local permite probar la misma subruta antes
de subir los archivos.

`npm run test:shell` prueba navegación, búsqueda, proyecto, notificaciones,
tema, menú lateral y las tres variantes en Chromium. Para probar la subruta,
configurar el mismo `PAGES_BASE` antes de ejecutar el test. `npm run test`
verifica que todas las páginas compiladas carguen sin errores ni peticiones
externas.

`npm run test:commercial` recorre listas, filtros, fichas, versiones, modales,
enlaces a proyectos y documentos, estados simulados, alertas y vista móvil en las
tres variantes. También comprueba errores de consola. Requiere ejecutar antes
`npm run build:variants` con el mismo `PAGES_BASE`.

`npm run test:expenses` comprueba creación, edición de datos propuestos,
observación, corrección, aprobación, historial, relación con Costos, enlaces y
diseño móvil en las tres variantes. Requiere `dist-pages/` creado con el mismo
`PAGES_BASE`.

`npm run test:personnel` recorre Persona → Asistencia → Tareo → Proyecto → Costo,
valida el formulario manual y la separación de variantes, prueba las acciones
de incidencias PETI y revisa la vista móvil. Requiere el build de variantes con
el mismo `PAGES_BASE`.

`npm run test:warehouse` comprueba stock, alertas, navegación OC → recepción →
Kardex → salida → costo, móvil y alcance por variante. `npm run test:costs`
verifica las fuentes y KPIs de las tres variantes, el retorno del documento,
la coincidencia con Panel/Ficha/Reportes, modo oscuro y móvil. Ambos necesitan
`dist-pages/` con el mismo `PAGES_BASE`.

`npm run test:delivery9` comprueba las seis secciones de la entrega 9, sus
filtros y estados vacíos, relaciones entre registros, alcance por variante,
vista móvil y errores de consola. Requiere `dist-pages/` compilado con el
mismo `PAGES_BASE`.

## Límites y siguientes entregas

La Ficha Integral muestra registros y relaciones mock útiles. No hay
descargas reales, autenticación, integración, biometría, MFA, auditoría
persistente ni respaldos. Las ediciones locales de Rendiciones y Documentos
no constituyen asientos contables ni modifican el conjunto base.

No hay repositorio remoto configurado ni sitio publicado. El build muestra una
advertencia por el tamaño del paquete de ApexCharts; la carga de gráficos ya es
diferida hasta abrir el Panel General. `npm run format:check` sigue reportando
archivos originales de Metis; los archivos nuevos de esta entrega sí se
formatearon. `npm audit --audit-level=high` pasa tras las actualizaciones
compatibles del lockfile. Quedan cuatro avisos moderados en la cadena de
desarrollo de ESLint/`minimatch`; su corrección automática exige una
migración mayor de ESLint que no se hizo en esta entrega. Las comprobaciones
de accesibilidad cubren estructura, nombres y etiquetas básicas, pero no
equivalen a una auditoría WCAG completa.

## Mejoras — Entrega 1: base del sistema de diseño (10/11/2026)

Plan completo y estado en `docs/plan-mejoras.md`; especificación original en
`docs/especificacion/`; contexto de producto y sistema visual en `PRODUCT.md` y `DESIGN.md`.

- **Marca por variante:** `app-shell-template.mjs` deriva de `theme.primary/accent` una paleta
  clara y oscura (`--brand-*`) que gobierna Bootstrap: botón principal en Azul Corporativo
  `#1A365D`, enlaces, foco y activo en Azul Integración `#0066CC` para SurTec.
- **Tipografía:** escala 12/13/14/16/18/20/28 px (`--fs-*`); 210 tamaños sueltos convertidos.
  Ningún texto del ERP queda bajo 12 px. Cifras tabulares.
- **Header:** logos oficiales recortados a su área dibujada sin modificar los archivos,
  selector con nombre corto, un único distintivo "Datos de demostración", Aprobaciones con
  contador, notificaciones por categoría, usuario Jean Estrada · Administrador.
- **Componentes compartidos:** `utils/status.js` (5 tonos de estado), `utils/data-table.js`
  (orden, paginación, chips de filtros), capa `_design-system.scss` (tabla, menú `⋮`,
  tooltip de ayuda, movimiento breve, superficies del navegador). Referencia: Proyectos.
- **Datos:** 15 proyectos SurTec; los 12 en ejecución suman S/ 1 245 000 y S/ 768 400.
  Reportes y BI abren con el mismo alcance que el Panel.
- **Avisos:** se retiraron las alertas "no es real" de cada página y las etiquetas
  "ficticio/simulado" de títulos y columnas; la reglas funcionales se conservaron.

## Mejoras — Entrega 2: sistema visual "Red de Integración" y kit D3 (10/11/2026)

Referencia aprobada: `docs/referencia/red-de-integracion.html`. Reglas, tokens, clases y
API del kit en `DESIGN.md`.

- **Shell:** riel de navegación a toda la altura (azul profundo en SurTec, pizarra en J&Y)
  con el logo oficial sin alterar sobre una placa del color de fondo de su archivo y la
  etiqueta de presentación (**PETI** · TO-BE 2027–2030, **PMI** · ERP contractual,
  **Demo** · Propuesta para J&Y), a pedido del usuario para distinguir las tres
  presentaciones. Riel contraído con isotipo; en móvil el header muestra isotipo y código.
  Header limpio de 70 px. Pantalla completa (sin `max-width: 1700px`); se eliminó
  `_metis-restoration.scss` y se vaciaron los temas claro/oscuro de Metis.
- **Tokens:** superficies, tinta, series `--s1..--s4`, estados `--good/--warn/--bad`,
  `--rail*`, `--hero-*`, `--solid`, escala `--fs-*` (cuerpo 15 px, página 30, KPI 32).
  Corregido: la paleta por variante se inyecta con `html:root` (J&Y mostraba los colores de
  SurTec desde la Entrega 1) y la fuente Inter se declara como `'Inter Variable'` (antes
  caía a Segoe UI). Plus Jakarta Sans autoalojada para títulos y cifras.
- **Componentes:** franja de KPI, bloque protagonista con textura de red, paneles,
  botones, píldoras, tablas, un solo estilo de pestañas, menús, modales, toasts,
  confirmaciones, alertas y formularios. Movimiento: `x-count` (cifras que cuentan),
  gráficos que se dibujan, botones con escala al presionar, entrada breve del contenido;
  todo con `prefers-reduced-motion`.
- **Kit D3** (`src-modern/scripts/charts/`): `flow`, `execution-bars`, `area`, `sparkline`,
  `split-bar`, `donut`, `bars`, más `theme`, `tooltip` y `base`. Paleta validada con la
  skill `dataviz` en claro y oscuro para ambas marcas (azul oscuro de SurTec re-escalonado
  a `#3d85e6`). Migrados Panel, Costos y Reportes › BI: ninguna vista del ERP usa ya
  ApexCharts.
- **Panel:** solo cambió la forma de los 4 KPI (franja con conteo) y sus gráficos pasaron
  a D3; el contenido se rediseña en la Entrega 3.
- **Sistema visual** (`design-system.html`, fuera del menú): todos los componentes y los
  7 patrones con datos reales de la variante. Es la referencia de las Entregas 3–7.
- **Capturas:** `scripts/capture-views.mjs` → `screenshots/entregas/entrega-2-antes/` y
  `entrega-2-despues/`.
