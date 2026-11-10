# Entrega 6 de 6 — Limpieza, recorridos de demostración y verificación final

Trabajas en el Mockup Maestro de este repositorio. Sigue el **protocolo común** de
`docs/prompts/README.md`. Requisito: la Entrega 5 figura como **Terminada** en
`docs/plan-mejoras.md`. Lee sus "Notas para la siguiente": si dejó vistas pendientes,
termínalas **primero**.

## Objetivo
Dejar el mockup listo para presentar ante docentes y la empresa: sin restos de la
plantilla, coherente en todas las vistas y con un camino guiado para la exposición.

## Tareas

### A. Pendientes de la Entrega 5
Completar lo anotado en "Notas para la siguiente", si existe.

### B. Limpieza de Metis
- Identificar páginas y componentes heredados sin uso (`users`, `products`, `orders`,
  `files`, `messages`, `calendar`, `help`, `forms`, `elements*`, sus `components/*.js`
  y `styles/scss/pages/_*.scss`). Antes de borrar, comprobar con búsqueda que nada los
  importa. Retirar sus casos de `main.js`.
- Páginas de autenticación y error (`login`, `404`, `500`, etc.): adaptarlas a la
  marca de la variante si se enlazan desde el menú de usuario; si no, retirarlas.
- `npm run icons` para regenerar el subconjunto sin íconos sobrantes.
- `package.json`: nombre, descripción, autor y palabras clave del mockup; quitar
  scripts que apunten a archivos eliminados.
- Actualizar `CLAUDE.md`, `README.md` y `docs/mockup-master.md` para que describan
  el proyecto actual (número de vistas, comandos, pruebas vigentes).
- Revisar el aviso del paquete de ApexCharts > 600 kB: dividirlo si es sencillo; si no, documentarlo.

### C. Recorridos de demostración
- Panel discreto (desde el menú de usuario o el distintivo "Datos de demostración")
  con los 5 escenarios del punto 156; cada paso es un enlace a la vista exacta.
- Debe funcionar en las 3 variantes mostrando solo los escenarios de su alcance
  (por ejemplo, sin Almacén ni CRM en J&Y Demo).

### D. Auditoría final
- `/impeccable audit` y `/impeccable polish` sobre todas las vistas.
- Revisar el criterio de tres segundos (punto 137) y las 7 preguntas del brief
  (¿dónde estoy?, ¿qué proyecto?, ¿qué puedo hacer?, …) en cada vista.
- Capturas de todas las vistas en las 3 variantes, 1440 y 390 px, claro y oscuro.
  Corregir lo que salga mal antes de cerrar.
- Ejecutar todas las pruebas `npm run test:*` vigentes, no solo `test:delivery10`.

### E. Opcional — diagramas para los informes
Con la skill `archify`, si el usuario lo confirma: flujo general del punto 37,
modelo de entidades alrededor del Proyecto, arquitectura TO-BE PETI y secuencia de
una rendición. Exportarlos a `docs/diagramas/`.

## Terminado cuando
- No queda texto, página ni código de Metis visible o sin uso.
- Los 5 escenarios funcionan en las variantes que corresponden.
- Todas las pruebas pasan y la documentación describe el estado real.
- Tabla de estado completa en `docs/plan-mejoras.md`; commit `Entrega 6: ...`.
