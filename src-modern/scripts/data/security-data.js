// ==========================================================================
// Seguridad y Control de Acceso (puntos 93–100) — simulated, credible states
// ==========================================================================
// Shared by every build: no company record ids or client names here.
// Decision 3 (plan-mejoras): show believable states (MFA Activado, Backup
// Correcto) with the single "Datos de demostración" badge in the header.

export const ROLES = [
  {
    id: 'gerencia',
    name: 'Gerencia',
    scope: 'Indicadores, costos y aprobaciones finales',
    users: 1,
  },
  {
    id: 'administrador',
    name: 'Administrador',
    scope: 'Usuarios, parámetros y catálogos',
    users: 1,
  },
  {
    id: 'proyectos',
    name: 'Proyectos',
    scope: 'Ficha, personal, tareo y costos del proyecto',
    users: 2,
  },
  { id: 'comercial', name: 'Comercial', scope: 'Oportunidades, presupuestos y clientes', users: 1 },
  { id: 'logistica', name: 'Logística', scope: 'Compras, OC, recepción y almacén', users: 1 },
  {
    id: 'contabilidad',
    name: 'Contabilidad',
    scope: 'Rendiciones, comprobantes y cierre de costos',
    users: 1,
  },
  {
    id: 'trabajador',
    name: 'Trabajador',
    scope: 'Registro de rendiciones y tareo desde el celular',
    users: 3,
  },
  { id: 'ti', name: 'TI', scope: 'Integraciones, respaldos y auditoría técnica', users: 1 },
];

// Punto 96: the three columns of the specification plus Contabilidad.
export const PERMISSION_ROLES = ['Gerencia', 'Logística', 'Contabilidad', 'Trabajador'];
export const PERMISSIONS = [
  { action: 'Ver costos', values: ['Sí', 'Parcial', 'Sí', 'No'] },
  { action: 'Crear orden de compra', values: ['No', 'Sí', 'No', 'No'] },
  { action: 'Registrar rendición', values: ['Sí', 'Sí', 'Sí', 'Sí'] },
  { action: 'Aprobar rendición', values: ['Sí', 'No', 'Sí', 'No'] },
  { action: 'Consultar documentos', values: ['Sí', 'Sí', 'Sí', 'Parcial'] },
];

// Role assigned to each worker by position (the data sets differ per company).
export const WORKER_ROLES = ['Proyectos', 'Proyectos', 'Trabajador', 'Logística', 'Contabilidad'];

export const MFA = {
  status: 'Activado',
  methods: 'Aplicación autenticadora o correo',
  coverage: 'Todos los usuarios y aprobaciones sensibles',
  enrolled: '6 de 7 usuarios',
};

export const SESSION_DEVICES = [
  {
    device: 'Windows · Chrome',
    ip: '10.20.4.15',
    location: 'Arequipa',
    activity: 'Hace 5 min',
    status: 'Activa',
  },
  {
    device: 'Android · App móvil',
    ip: '10.20.8.42',
    location: 'Moquegua',
    activity: 'Hace 22 min',
    status: 'Activa',
  },
  {
    device: 'Windows · Edge',
    ip: '10.20.4.31',
    location: 'Arequipa',
    activity: 'Hoy 09:12',
    status: 'Activa',
  },
  {
    device: 'iPhone · Safari',
    ip: '10.20.9.07',
    location: 'Lima',
    activity: 'Ayer 18:40',
    status: 'Cerrada',
  },
];

export const BACKUP = {
  last: '2026-11-08T02:00:00',
  status: 'Correcto',
  mode: 'Automático',
  next: '2026-11-09T02:00:00',
  history: [
    { date: '2026-11-08T02:00:00', size: '4,2 GB', duration: '11 min', status: 'Correcto' },
    { date: '2026-11-07T02:00:00', size: '4,1 GB', duration: '10 min', status: 'Correcto' },
    { date: '2026-11-06T02:00:00', size: '4,1 GB', duration: '12 min', status: 'Correcto' },
  ],
};

// Audit verb per operation type (punto 99).
export const AUDIT_ACTIONS = {
  purchase: 'Aprobó',
  expense: 'Modificó',
  timesheet: 'Registró',
  payroll: 'Imputó',
  rxh: 'Registró',
  material_issue: 'Registró',
  material_return: 'Registró',
  other: 'Ajustó',
};
