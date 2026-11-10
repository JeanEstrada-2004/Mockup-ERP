# Brief maestro (primer prompt)

> Transcripción compacta del primer prompt del usuario (10/11/2026). Conserva la
> numeración, los datos y las reglas; se omiten repeticiones de formato. Si el
> usuario aporta el texto original, reemplazar este archivo.

1. **Objetivo.** Mockup funcional visual, sin backend, de una *Plataforma Integrada de
   Gestión y Control de Proyectos* para empresas de ingeniería y tecnología. Entidad
   central: **el Proyecto**, alrededor del cual se relacionan clientes, oportunidades,
   presupuestos, cotizaciones, compras, OC, proveedores, rendiciones, comprobantes,
   personal, asistencia, tareo, materiales, almacén, documentos, costos, indicadores,
   reportes, seguridad, auditoría e integraciones. Reemplaza información dispersa en
   Excel, correo, carpetas, mensajería, sistemas contables y registros manuales.
2. **Es un mockup.** Sin backend, API, base de datos, autenticación, infraestructura,
   biométricos, contabilidad, OCR, generación de documentos, carga de archivos ni
   permisos reales. Debe mostrar cómo sería el sistema, cómo se navega, qué información
   hay, cómo se relacionan los módulos, cómo se ejecutan los flujos y cómo se ven los
   resultados. Se permiten HTML, Bootstrap, Alpine.js, JS, ApexCharts, datos mock en
   JS/JSON, modales, tabs, tablas, filtros simulados, formularios y `localStorage`.
   Priorizar la simplicidad.
3. **No migrar** a React/Vue/Angular/Next/Nuxt. Mantener HTML, Bootstrap 5, Vite,
   Alpine.js, ApexCharts, SCSS y la estructura responsive.
4. **Contexto A — PETI.** Curso Planeamiento Estratégico de TI. Empresa ficticia
   **SurTec Ingeniería y Tecnología S.A.C.** Proyecto: *Transformación Digital para la
   Gestión Integral de Proyectos en SurTec*. Solución TO-BE, horizonte **2027–2030**.
   Versión más completa: Proyectos, CRM, Presupuestos, Compras, Rendiciones, Personal,
   Tareo, Biometría, Almacén, Materiales, Costos, Documentos, Reportes, BI, Seguridad,
   Auditoría, Integraciones, Administración.
5. **Contexto B — PMI.** Cliente **J&Y Ingenieros Consultores S.A.C.**, ejecutora
   **Novacore Systems S.A.C.**; ERP a medida con alcance contractual limitado:
   Plataforma Base, Proyectos, Maestros, Presupuestos, Compras y OC, Rendiciones,
   Personal y Tareo, Costos, Gestión Documental, Reportes/Dashboard, Seguridad,
   Administración. Sin CRM ni Almacén operativo.
6. **Contexto C — propuesta a J&Y.** Demostrativa: Proyectos, Rendiciones, Compras,
   Personal/Tareo, Costos, Documentos e integración. Almacén puede ser propuesta
   complementaria posterior. Pagos/Tesorería no se asume definido.
7. **Un solo mockup maestro** con variantes de configuración (empresa, logo, colores,
   módulos, textos, datos, etiquetas, contexto) sin duplicar código.
8. **Configuraciones:** `surtec-peti`, `jy-pmi`, `jy-demo` (companyName, logo,
   projectName, theme, enabledModules, labels, mockData). Integrarlo con la arquitectura real.
9. **Identidad SurTec:** Azul Corporativo `#1A365D` (navegación, títulos, encabezados,
   botones principales, fondos oscuros) · Azul Integración `#0066CC` (activos, links,
   indicadores, acentos) · Gris Estructural `#4A5568` (texto secundario, bordes) ·
   Blanco Técnico `#F7FAFC` (fondos, tarjetas).
10. **Logo:** usar el archivo oficial sin redibujar, modificar, alterar proporciones,
    tipografía ni agregar slogans.
11. **Filosofía:** profesional, corporativo, tecnológico, ordenado, moderno, limpio,
    intuitivo. Evitar plantilla genérica, cripto, ecommerce, gamer, futurista,
    tarjetas decorativas o saturación.
12. **Usabilidad primero:** el usuario debe encontrar las cosas rápido; máximo 2–3
    niveles (Proyectos → Proyecto ABC → Costos).
13. **Arquitectura de información:** GENERAL (Inicio, Proyectos) · GESTIÓN (CRM,
    Presupuestos, Compras, Rendiciones, Personal y Tareo, Almacén) · CONTROL (Costos,
    Documentos, Reportes y BI) · SISTEMA (Integraciones, Seguridad, Administración).
14. **Ficha Integral de Proyecto** con resumen, información general, presupuesto,
    compras, rendiciones, personal, materiales, costos, documentos, indicadores (tabs).
15. **Selector de proyecto** en el header ("Proyecto actual: PR-2027-001 · …").
16. **Búsqueda global** de proyectos, clientes, proveedores, trabajadores,
    presupuestos, OC, rendiciones y documentos (local sobre mock si es sencillo).
17. **Acciones rápidas** visibles (+ Nuevo proyecto, + Nueva rendición, + Nueva OC,
    + Nuevo presupuesto).
18. **Estados:** Proyecto (Planificado, Activo, En riesgo, Suspendido, Cerrado) ·
    Rendición (Borrador, Enviada, En revisión, Observada, Corregida, Aprobada) ·
    Presupuesto (Borrador, En revisión, Aprobado, Rechazado, Vencido) · OC (Borrador,
    Pendiente, Aprobada, Emitida, Atendida, Cerrada). Badges sencillos, pocos colores,
    significado consistente.
19. **Responsive:** desktop principal; Rendiciones, comprobantes y Tareo muy cuidados en móvil.
20. **PWA/móvil:** web responsive para campo (Mis proyectos, Nueva rendición, Tomar
    fotografía, Registrar tareo, Pendientes). Botones grandes, pocas acciones.
21. **Datos mock coherentes** entre páginas (PR-2027-001: S/ 185 000 presupuesto,
    S/ 112 450 ejecutado, 67 % avance, Activo, cliente Minera del Sur).
22. **Componentes reutilizables:** KPI, tablas, filtros, formularios, modales, alerts,
    badges, dropdowns, tabs, timelines, paginación, breadcrumbs, gráficos, paneles,
    empty states, loading, confirmaciones, toasts. No diseñar lo mismo dos veces.
23. **Reutilizar páginas Metis** (index → Dashboard, users → Personal, products →
    Almacén, orders → Compras, files → Documentos, analytics → BI, reports → Reportes,
    security → Seguridad, settings → Administración, calendar → Tareo), según aporten.
24. **Eliminar contenido genérico:** ecommerce, Revenue, "Go Pro", ThemeWagon/Metis,
    lorem ipsum, usuarios ajenos, métricas SaaS, demos sin valor.
25. **Dashboard orientado a proyectos:** proyectos activos, presupuesto activo, costos
    acumulados, rendiciones pendientes, órdenes pendientes, alertas; presupuesto vs.
    costo, desviaciones, costos por fuente, actividad, tareas.
26. **Módulos previstos (19)** agrupables: Dashboard, Proyectos, CRM, Presupuestos,
    Compras/OC, Rendiciones, Personal, Tareo, Biometría, Almacén, Materiales, Costos,
    Documentos, Reportes, BI, Integraciones, Seguridad, Auditoría, Administración.
27. **Aprobaciones:** bandeja con pendientes de presupuesto, OC, rendición y correcciones.
28. **Notificaciones** adaptadas (R-045 requiere aprobación, OC-028 supera presupuesto,
    stock bajo, desviación > 10 %, error de sincronización biométrica).
29. **Seguridad** visual: usuarios, roles, permisos, sesiones, auditoría, MFA, respaldos, accesos.
30. **Auditoría:** "08/11/2026 10:22 · Juan Pérez · Modificó · Rendición R-045";
    relevante en rendiciones, presupuestos, compras, costos, administración.
31. **Accesibilidad:** sin texto pequeño, bajo contraste, tablas ilegibles, botones
    pequeños ni formularios larguísimos (usar secciones, tabs, pasos, acordeones).
32. **Divulgación progresiva:** lista resumida (código, proyecto, cliente, avance,
    presupuesto, costo, estado); detalle al entrar.
33. **Breadcrumbs** solo cuando ayuden (Proyectos / PR-2027-001 / Costos).
34. **Consistencia de acciones:** Guardar (principal), Cancelar (secundario), Eliminar (peligro).
35. **Modo oscuro** puede mantenerse; el modo principal de presentación es **claro**.
36. **No sobrecomplicar:** sin validaciones complejas, persistencia avanzada, auth,
    archivos reales, OCR, WebSockets, backend, Docker.
37. **Flujo general:** Cliente/Oportunidad → Presupuesto → Proyecto → (Compras,
    Rendiciones, Personal/Tareo, Materiales, Documentos) → Costos → Reportes/BI →
    Decisiones. Transversal: Seguridad, Auditoría, Integraciones, Gestión Documental.
38. **Criterio UX:** ¿dónde estoy?, ¿qué proyecto veo?, ¿qué puedo hacer?, ¿qué debo
    revisar?, ¿qué está pendiente?, ¿cuál es el estado?, ¿cómo regreso?
39. **Evitar saturación:** títulos claros, cards solo con valor, tablas ordenadas,
    gráficos limitados, filtros compactos, whitespace.
40. **Uso:** exposición universitaria, feria, capturas, presentación PETI y PMI, empresa.
41. **Datos compartidos:** clientes Minera del Sur S.A., Industria Andina S.A.C.,
    Clínica Regional del Sur; proyectos PR-2027-001/002/003; proveedores TechSupply
    Perú S.A.C., Redes Industriales del Sur S.A.C., ElectroData S.A.C.
42. **Perú:** S/, IGV, RUC, DNI, factura, boleta, OC, recibo por honorarios, DD/MM/AAAA.
43. **Nombres ficticios;** nunca datos reales de trabajadores de J&Y.
44. **Proceso:** Fase 1 análisis · Fase 2 shell · Fase 3 Dashboard · Fase 4 Proyectos ·
    Fase 5 módulos según el segundo prompt.
45. **Segundo prompt** define módulos en detalle; no inventar flujos complejos antes.
46. **Antes de modificar:** inspeccionar, reutilizar, revisar sidebar, build, dependencias,
    assets, responsive; no romper lo existente.
47. **Después de cada bloque:** compila, Vite, sin errores JS, enlaces, sidebar,
    responsive, modo claro, sin recursos faltantes, sin texto de Metis.
48. **Adaptar, no reescribir.**
49. **Estructura de archivos:** reorganizar solo si mejora; sin sobreingeniería.
50. **Resultado:** demostrar cómo SurTec gestiona un proyecto desde su creación hasta su
    análisis económico, cómo las áreas generan información vinculada al proyecto, cómo
    se consolidan costos, cómo gerencia obtiene indicadores, trazabilidad e integraciones.
51. **Experiencia:** Dashboard → ver qué pasa → Proyectos → proyecto → entender su
    situación → revisar presupuesto, compras, rendiciones, personal, materiales, costos →
    documento de sustento → reportes → regresar fácilmente.
52. **Tres conceptos:** INTEGRACIÓN, TRAZABILIDAD, CONTROL.
53. **PETI** = estado objetivo completo; **PMI** = alcance contractual; **J&Y Demo** =
    demostración para la empresa real. Sin interfaces contradictorias.
54. Actuar como desarrollador frontend, diseñador de sistemas empresariales, UX,
    analista funcional y arquitecto de información.
55. **Primer resultado:** revisar, explicar estructura, reutilización y problemas,
    preparar la base, no desarrollar todos los módulos todavía.
