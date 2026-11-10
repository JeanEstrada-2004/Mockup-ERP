# Prompts de las entregas 1–6

Uso: abrir una **conversación nueva** por entrega y pegar el contenido del archivo
`entrega-N.md` correspondiente. Cada prompt remite a este protocolo común.

## Protocolo común (todas las entregas)

### 1. Antes de tocar código
1. Leer, en este orden:
   - `CLAUDE.md` (convenciones del repositorio);
   - `docs/plan-mejoras.md` (plan, reglas de diseño, decisiones y tabla de estado);
   - `docs/mockup-master.md` (qué se construyó en las Entregas 1–10 originales y por qué);
   - `PRODUCT.md` y `DESIGN.md` (existen a partir de la Entrega 1);
   - la especificación original: `docs/especificacion/01-brief-maestro.md` y
     `docs/especificacion/02-especificacion-funcional.md`. Cuando un prompt cita
     "punto N", se refiere a la numeración de `02-especificacion-funcional.md`.
     Si esos archivos no existen, pedírselos al usuario antes de empezar.
2. Ejecutar `git status` y `git log --oneline -8`. Confirmar en la tabla de estado
   que la entrega anterior figura como **Terminada**. Si no, detenerse y avisar.
   Si hay cambios sin commit que no son de esta entrega, preguntar antes de seguir.
3. Revisar las "Notas para la siguiente" que dejó la entrega anterior.
4. Tomar capturas **antes** (1440×900 y 390×844, modo claro) de las vistas de la entrega.

### 2. Durante el trabajo
- **Adaptar, no reescribir.** Reutilizar componentes compartidos creados en la Entrega 1
  (tabla, filtros, chips, `⋮`, toasts, confirmaciones, tooltips, KPI, badges).
- **Reglas de diseño** de `docs/plan-mejoras.md` y tokens de `DESIGN.md`. Nada de tamaños
  de letra, colores de gráfico o hexes sueltos fuera de la escala y de `chart-palette.js`.
- **Datos:** solo desde `src-modern/scripts/data/`. Ninguna cifra inventada en el HTML.
  Tras tocar datos, `npm run check:mock-data`.
- **Variantes:** respetar `enabledModules` de `variants.js`. Lo exclusivo de PETI no debe
  aparecer en `jy-pmi` ni en `jy-demo`.
- **Convenciones de CLAUDE.md:** sin `<script>` inline ni `onclick`, sin `innerHTML` con
  interpolación, `Alpine.data` con el mismo nombre que el markup, guardar `DOMContentLoaded`,
  `npm run icons` tras usar un ícono nuevo.
- **Skills:**
  - `/impeccable` (Operate mode): `critique` antes de rediseñar una vista, el comando
    específico de la entrega mientras se trabaja, `audit` al final. Su hook revisa cada edición.
  - `emil-design-eng`: reglas de movimiento y micro-interacciones (150–200 ms, `ease-out`,
    solo `transform`/`opacity`, `prefers-reduced-motion`).
- **Textos** en español, términos del punto 133 de la especificación, fechas DD/MM/AAAA,
  montos `S/ 185 000`.
- **No hacer:** backend, API, autenticación real, OCR real, PDF real, nuevas librerías,
  migrar de framework, adelantar trabajo de otra entrega.

### 3. Verificación (obligatoria antes del commit)
En **PowerShell** (Git Bash convierte `/Mockup-ERP/` en una ruta de Windows):

```powershell
npm run lint
npm run check:mock-data
$env:PAGES_BASE='/Mockup-ERP/'; npm run build:variants
npm run test:delivery10
```

- Actualizar las pruebas de `scripts/*-interaction-test.mjs` que fallen por cambios
  intencionales de texto o estructura. Nunca debilitar una prueba para ocultar un error real.
- Capturas **después** con Playwright (`npm run preview:pages`) a 1440 y 390 px,
  claro y oscuro, en las 3 variantes para las vistas tocadas. Comparar con las de antes.
- Consola del navegador sin errores.

### 4. Cierre
1. Actualizar `docs/plan-mejoras.md`: estado **Terminada**, hash del commit y
   "Notas para la siguiente" (decisiones tomadas, pendientes, pruebas cambiadas).
2. Añadir una sección breve a `docs/mockup-master.md` con lo que cambió.
3. Commit único con mensaje `Entrega N: <resumen>`.
4. Responder al usuario con: qué se hizo, qué se verificó (con resultados reales),
   capturas clave, y qué queda para la siguiente entrega. Si algo quedó sin hacer, decirlo.

Si el contexto se resume a mitad de la entrega, volver a leer este protocolo,
el prompt de la entrega y `git status` antes de continuar.
