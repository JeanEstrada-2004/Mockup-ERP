# Entrega 1 de 6 — Base del sistema de diseño

Trabajas en el Mockup Maestro (ERP de gestión de proyectos, sin backend) de este
repositorio. Primero sigue el **protocolo común** de `docs/prompts/README.md`, paso 1.
Esta es la primera entrega: no hay una anterior que comprobar, pero sí lee
`docs/plan-mejoras.md` completo, incluida la sección "Entrega 1".

## Objetivo
Dejar una base visual y de componentes sólida **antes** de rediseñar cualquier módulo.
Al terminar, todas las vistas existentes deben verse con la identidad de su variante,
con letra legible y sin avisos repetidos, aunque su contenido todavía no cambie.

## Tareas

### A. Contexto de diseño
- `/impeccable init` → `PRODUCT.md` (propósito, usuarios: gerencia, administración,
  logística, trabajador de campo; las 3 variantes; tono sobrio y corporativo; presentación
  en proyector y capturas; reglas de los prompts resumidas en `docs/plan-mejoras.md`).
- `/impeccable document` → `DESIGN.md` con tokens, escala, estados y componentes.

### B. Paleta y tipografía
- Conectar el color de la variante a Bootstrap: `--brand-primary` / `--brand-accent`
  (inyectados por `scripts/app-shell-template.mjs`) deben gobernar botón principal,
  enlaces, foco, pestaña y menú activos. Hoy `$primary` sigue en `#2563eb`
  (`src-modern/styles/scss/abstracts/_variables.scss`).
  SurTec: `#1A365D` botón principal/títulos, `#0066CC` activo/enlaces/foco, `#4A5568`
  texto secundario, `#F7FAFC` fondo. J&Y: paleta neutral actual.
- Escala tipográfica única 12/13/14/16/20/28 px como variables. Reemplazar los ~90
  `font-size` sueltos entre 0,63 y 0,79rem (`_project-workspace.scss`, `_app-shell.scss`,
  `_commercial-workspace.scss`, `_expense-workspace.scss`, etc.). Mínimo 12 px; tablas
  y formularios 14 px. Montos con `font-variant-numeric: tabular-nums` y a la derecha.
- Estados: un único mapa de badges (azul activo, gris borrador, verde aprobado,
  ámbar pendiente, rojo riesgo) con tonos suaves y contraste AA en claro y oscuro.
- `chart-palette.js`: primera serie = acento de la variante, manteniendo la validación existente.
- Revisar `_metis-restoration.scss`: quitar reglas duplicadas o contradictorias.
- Usar `/impeccable typeset` y `/impeccable colorize` como guía.

### C. Shell
- Logos: SurTec más visible y alineado; J&Y sin recuadro blanco ni recorte.
  Usar los archivos de `public-assets/assets/brands/` sin modificarlos.
- Selector de proyecto: chip compacto con código + nombre corto, sin texto cortado;
  lista desplegable con código, nombre, cliente y estado.
- Menú de usuario: "Jean Estrada · Administrador" con Perfil, Configuración, Cerrar sesión
  (acciones simuladas con toast).
- Notificaciones con categorías (Aprobación, Advertencia, Error, Sistema) y los
  ejemplos del punto 3 de la especificación que existan en los datos.
- Botón de Aprobaciones con contador en el header (enlazará a `approvals.html`,
  que se crea en la Entrega 3; mientras tanto abre un panel con la lista).
- Un distintivo único "Datos de demostración" en el header.
- Logo/nombre lleva al Panel. Menú lateral colapsable con íconos consistentes.

### D. Componentes compartidos (un módulo JS + un parcial SCSS)
Tabla (búsqueda, filtros visibles + "Más filtros", chips de filtros aplicados con ×,
orden por columna, paginación, menú `⋮`, estado vacío con ícono + mensaje + acción,
tarjetas en móvil), toast, modal de confirmación, tooltip `?`, tarjeta KPI clicable,
badge de estado. Aplicar estilos de movimiento con `emil-design-eng`.
Aplicarlos al menos a **una** tabla existente como prueba (p. ej. `projects.html`);
el resto se migra en sus entregas.

### E. Avisos
Retirar los avisos repetidos de "no es real" de las vistas (security, personnel,
integrations, expense, costs…) usando `/impeccable clarify`. Mantener solo el
distintivo del header y una nota en Administración. No eliminar información
funcional útil (por ejemplo, qué costos se incluyen en el ejecutado).

### F. Datos
- 9 proyectos SurTec nuevos → 12 en total, presupuesto S/ 1 245 000 y costo
  S/ 768 400. PR-2027-001/002/003 **no cambian**. Estados variados (Planificado,
  Activo, En riesgo, Suspendido, Cerrado). Cada uno con operaciones mínimas que
  sustenten su costo por fuente. Actualizar `scripts/validate-mock-data.mjs` con los
  nuevos totales.
- Usuario actual Jean Estrada (Administrador).

## Fuera de alcance
Rediseñar el contenido del Panel, Proyectos, Ficha u otros módulos (Entregas 2–5).

## Terminado cuando
- Las 3 variantes muestran su paleta en botones, enlaces y activo; ningún texto < 12 px.
- Header y logos corregidos; un solo aviso de demostración.
- Componentes compartidos documentados en `DESIGN.md` y usados en una tabla real.
- `check:mock-data` valida 12 proyectos y los totales.
- Verificación y cierre del protocolo completos.
