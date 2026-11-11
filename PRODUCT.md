# PRODUCT.md — Plataforma Integrada de Gestión y Control de Proyectos

## Qué es
Mockup frontend navegable (sin backend) de un ERP modular para empresas de ingeniería y
tecnología en Perú. **El proyecto es la entidad central**: presupuestos, compras,
rendiciones, personal, tareo, materiales, documentos y costos se relacionan con un proyecto
y se consolidan en indicadores para la gerencia.

Tres conceptos que la interfaz debe transmitir: **integración**, **trazabilidad**, **control**.

## Presentaciones (un solo código, tres builds)
| Variante | Empresa | Contexto | Alcance |
|---|---|---|---|
| `surtec-peti` | SurTec Ingeniería y Tecnología S.A.C. | Curso PETI, solución TO-BE 2027–2030 | Completo: incluye CRM, Almacén, Biometría, BI, Integraciones |
| `jy-pmi` | J&Y Ingenieros Consultores S.A.C. | Curso PMI, ERP contractual (ejecutora Novacore Systems) | Sin CRM ni Almacén |
| `jy-demo` | J&Y Ingenieros Consultores S.A.C. | Propuesta del futuro ERP interno de J&Y (realineamiento R1–R6) | Proyectos, Clientes, Proveedores, Compras, Rendiciones, Personal, Costos, Documentos; crece por fases |

Clientes y Proveedores (MAESTROS) existen en las tres presentaciones. J&Y Demo tiene datos
propios (escenario 2026) y distingue lo **confirmado (AS-IS)**, lo **propuesto (TO-BE)** y lo
**por validar** con marcas que el presentador muestra desde el menú de usuario o con
Alt + Shift + V. Ver `docs/realineamiento-jy-demo.md`.

## Usuarios
- **Gerencia:** ve el estado del portafolio y decide. Necesita cifras confiables y rastreables.
- **Administración / contabilidad:** revisa y aprueba rendiciones, compras y presupuestos.
- **Logística:** órdenes de compra, recepción, almacén.
- **Jefe de proyecto:** ficha integral, costos, personal asignado.
- **Trabajador de campo:** registra rendiciones y tareo desde el celular (experiencia móvil cuidada).

## Dónde se usa
Exposición universitaria y feria (proyector, luz de sala), capturas para informes PETI/PMI
y conversación con la empresa. **Modo claro es el principal**; el oscuro debe funcionar.

## Tono
Profesional, corporativo, sobrio, en español de Perú (S/, IGV, RUC, DNI, DD/MM/AAAA).
Debe parecer una herramienta empresarial real, no una plantilla, ni un dashboard cripto,
ni un e-commerce. Los datos son ficticios: un solo distintivo "Datos de demostración" en el
header lo indica; las vistas muestran estados creíbles sin repetir advertencias.

## Reglas de producto
- En tres segundos el usuario reconoce página, proyecto, datos importantes y acción principal.
- Una acción principal por pantalla. Resumen primero, detalle después.
- Máximo 2–3 niveles de navegación. Todo registro relacionado ofrece "Ver proyecto".
- Las cifras son coherentes entre vistas (PR-2027-001: S/ 185 000 presupuesto,
  S/ 112 450 ejecutado). Ninguna cifra se inventa en el HTML.
- Sin backend, OCR, biometría, PDF ni permisos reales: se simulan visualmente.

## Fuentes
- Especificación: `docs/especificacion/01-brief-maestro.md` y `02-especificacion-funcional.md`.
- Plan y estado de entregas: `docs/plan-mejoras.md`. Historia: `docs/mockup-master.md`.
- Sistema visual: `DESIGN.md`.
