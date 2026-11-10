# Entrega 6 de 7 — Documentos, Reportes, BI, CRM, Integraciones, Seguridad y Administración

Trabajas en el Mockup Maestro de este repositorio. Sigue el **protocolo común** de
`docs/prompts/README.md`. Requisito: la Entrega 5 figura como **Terminada** en
`docs/plan-mejoras.md`. Lee sus "Notas para la siguiente", `PRODUCT.md` y `DESIGN.md`.

## Objetivo
Completar los módulos de control y sistema (Bloques 7 y 8). Son muchas vistas:
prioriza en este orden Documentos → BI → CRM → Seguridad → Integraciones →
Reportes → Administración, y si el tiempo no alcanza, deja las últimas anotadas en
"Notas para la siguiente" en vez de entregarlas a medias.
Estados simulados creíbles (MFA Activado, ZKTeco Conectado, Backup Correcto), sin
avisos repetidos de "no es real" (decisión de la Entrega 1).

## Tareas

### A. Gestión Documental (`documents.html`, `document.html`)
- Panel lateral o filtros: Proyecto, Módulo, Tipo, Fecha, Responsable, Estado.
- Árbol por proyecto: Contratos, Presupuestos, Compras, Rendiciones, Personal, Planos,
  Informes, Entregables.
- Tabla: Documento · Tipo · Proyecto · Módulo origen · Versión · Responsable · Fecha.
- Ficha: campos del punto 78; Vista previa, Descargar (toast), Nueva versión, Historial
  (V1–V3 con fecha, responsable, comentario). Trazabilidad OC-025.pdf → PR-2027-001 →
  Compras → OC-025.
- Indicador de documentos generados automáticamente (Cotización PDF, OC, Resumen de
  rendición, Reporte de tareo, Reporte de costos).

### B. BI (`analytics.html`, solo PETI)
- Reconvertir la página Metis existente (agregar a `vite.config.js` y al menú como
  "Reportes y BI" o enlace desde Reportes, sin sumar entradas de primer nivel).
- Título "Inteligencia de Negocios", subtítulo "Indicadores para la toma de decisiones".
- Filtros: Periodo, Proyecto, Cliente, Responsable, Estado.
- KPI: Rentabilidad estimada, Presupuesto total, Costo total, Desviación promedio,
  Proyectos en riesgo, Rendiciones pendientes.
- Máximo 4 gráficos, todos con el kit D3: margen por proyecto, presupuesto vs. costo, costos por fuente,
  evolución mensual. Tabla gerencial (punto 87).
- Drill-down Empresa → Proyecto → Fuente → Transacción. Reutilizar cálculos de
  `report-views.js` y quitar de Reportes el BI duplicado.

### C. Reportes (`reports.html`)
- Catálogo de 8 reportes (punto 82) en tarjetas o tabla con Ver y Exportar (toast).
- Reportes operativos para PETI y PMI; ocultos en J&Y Demo.

### D. CRM (`crm.html`, solo PETI)
- Título "Gestión Comercial". Kanban: Prospecto, Contactado, Propuesta, Negociación,
  Ganado, Perdido; tarjeta con cliente, oportunidad, monto, probabilidad, responsable,
  próxima acción. En móvil, columnas desplazables o lista por etapa.
- Ficha de oportunidad (punto 21). Acciones: Generar presupuesto, Registrar actividad,
  Marcar como ganado / perdido, y "Convertir en proyecto" si está ganada.
- Recorrido OP-001 → PRE-001 → PR-2027-001 (ya existe; conservarlo).

### E. Integraciones (`integrations.html`, solo PETI)
- Tarjetas: Biometría ZKTeco (Conectado), Software contable (Sincronización pendiente),
  Correo (Activo), Backup (Correcto), Almacenamiento (Activo).
- Historial: Integración · Última ejecución · Registros · Resultado.
- Error "2 registros biométricos no pudieron asociarse con trabajadores." con
  "Revisar incidencias" → pestaña Incidencias de Personal.

### F. Seguridad (`security.html`, PETI y PMI)
- Título "Seguridad y Control de Acceso"; pestañas Usuarios, Roles, Permisos,
  Sesiones, Auditoría, Backups.
- Roles del punto 95; matriz de permisos (Sí / Parcial / No); MFA Activado
  (aplicación autenticadora / correo); sesiones con dispositivo, IP ficticia,
  ubicación, actividad; auditoría (08/11/2026 10:22 · jperez · Modificó · Rendiciones ·
  R-045 · Correcto) derivada de operaciones; backups (último 08/11/2026 02:00,
  Correcto, Automático, próximo 09/11/2026 02:00, "Ver historial").

### G. Administración (`settings.html`, PETI y PMI)
- Título "Administración del Sistema"; pestañas Empresa, Catálogos, Parámetros,
  Notificaciones, Apariencia, Configuración general.
- Empresa: razón social, RUC, dirección, teléfono, correo, logo, moneda, zona horaria.
- Catálogos del punto 103. Nota única sobre datos de demostración.

## Terminado cuando
- Escenario 5 del punto 156 recorrible; trazabilidad documental demostrable.
- Alcance correcto por variante (también por URL directa).
- Verificación y cierre del protocolo completos.
