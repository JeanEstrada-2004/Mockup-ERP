// Single source for status colours (especificación, punto 145).
//   info     azul     activo / en curso / informativo
//   neutral  gris     borrador / planificado / cerrado
//   success  verde    aprobado / correcto
//   warning  ámbar    pendiente / en revisión / advertencia
//   danger   rojo     riesgo / error / rechazado
// Every view renders a status through statusClass() so the same word always
// gets the same colour. Unknown statuses fall back to neutral.
const TONES = {
  info: [
    'Activo',
    'Activa',
    'Enviada',
    'Emitida',
    'Corregida',
    'Corregido',
    'Enviado al cliente',
    'Propuesta',
    'Imputada',
    'Conectado',
    'En curso',
    'Vigente',
  ],
  neutral: ['Por definir', 'Opcional', 'Reemplazado', 'No aceptado', 'Borrador', 'Planificado', 'Cerrado', 'Cerrada', 'Vencido', 'Ignorada', 'Referencia mock'],
  success: [
    'Aprobado',
    'Aprobada',
    'Atendida',
    'Correcto',
    'Completa',
    'Disponible',
    'Ganado',
    'Registrada',
    'Registrado',
    'Revisada',
    'Justificada',
    'Validado (ejemplo)',
    'Aceptada',
    'Entregada a Contabilidad',
    'Conforme',
    'Aceptado',
  ],
  warning: [
    'Pendiente',
    'En revisión',
    'Observada',
    'Suspendido',
    'Incompleta',
    'Stock bajo',
    'Sincronización pendiente',
    'Negociación',
    'Presentada',
    'No integrado',
    'Observado',
    'No documentado',
  ],
  danger: ['En riesgo', 'Rechazado', 'Rechazada', 'Perdido', 'Error', 'Fallido'],
};

const toneByStatus = new Map(
  Object.entries(TONES).flatMap(([tone, statuses]) => statuses.map((status) => [status, tone]))
);

export function statusTone(status) {
  return toneByStatus.get(status) || 'neutral';
}

export function statusClass(status) {
  return `status-badge status-badge--${statusTone(status)}`;
}
