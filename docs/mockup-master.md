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
PMI y Demo usan el mismo conjunto ficticio de J&Y. Si se añade persistencia
local, usar `variantStorageKey()` para que el navegador no mezcle estados entre
presentaciones del mismo dominio.

- Configuración: `src-modern/scripts/config/variants.js`.
- Datos: `src-modern/scripts/data/surtec.js` y `jy.js`.
- Consultas y cálculos: `src-modern/scripts/data/mock-data.js`.
- Logos copiados sin redibujo desde los ZIP entregados: `public-assets/assets/brands/`.
  El logo original pequeño de J&Y se conserva como referencia. Los PNG grandes
  de J&Y son variantes suministradas en el paquete; sus colores de interfaz son
  neutrales y provisionales, no una paleta corporativa oficial.

## Decisiones sobre cifras y estados

Los tres proyectos SurTec especificados suman S/ 426 000 de presupuesto y
S/ 243 150 de costo ejecutado. Por ahora el Dashboard deberá derivar sus KPI
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

## Comandos

```text
npm ci
npm run check:mock-data
npm run lint
npm run build
npm run build:variants
```

En el Windows usado para esta revisión, Node necesitó confiar en el almacén
de certificados del sistema para `npm ci`. Se usó solo en el proceso de
instalación: `NODE_OPTIONS=--use-system-ca`. No se desactivó `strict-ssl`.

`npm run build` mantiene la salida Metis existente en `dist-modern/`.
`npm run build:variants` genera tres salidas bajo `dist-pages/`. Por defecto
los assets compilados usan rutas relativas. Cuando se conozca el nombre del
repositorio Pages, `PAGES_BASE=/nombre-del-repo/` producirá bases como
`/nombre-del-repo/surtec-peti/`.

## Pendiente para las siguientes entregas

La configuración y los datos ya están conectados al punto de entrada JS, pero
la interfaz HTML todavía muestra contenido Metis. La entrega 2 adaptará el
shell y hará visibles los logos y módulos apropiados. Vite recompone las rutas
de assets declaradas en HTML según la base de cada build; quedan por revisar
las rutas absolutas escritas dentro de JavaScript y el contenido interno del
manifiesto PWA (`start_url`, iconos y capturas inexistentes). Esta carpeta aún
no contiene `.git` ni un repositorio remoto configurado. No se ha publicado
ningún sitio.

El build y ESLint funcionan. `npm run test:build` continúa sin poder completar
su prueba de navegador porque el script Metis requiere `playwright`, paquete
que no figura en las dependencias del template. `npm run format:check` también
reporta numerosos archivos originales de Metis; no se reformateó toda la
plantilla para evitar un cambio ajeno a esta entrega.
