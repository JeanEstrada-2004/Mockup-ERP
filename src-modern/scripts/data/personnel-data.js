/* global __ACTIVE_VARIANT__ */
import { variantStorageKey } from '../config/variants.js';

const surtecAssignments = [
  ['PER-001', 'PR-2027-001', 50],
  ['PER-001', 'PR-2027-002', 50],
  ['PER-002', 'PR-2027-001', 60],
  ['PER-002', 'PR-2027-002', 40],
  ['PER-003', 'PR-2027-001', 50],
  ['PER-003', 'PR-2027-003', 50],
  ['PER-004', 'PR-2027-004', 40],
  ['PER-004', 'PR-2027-006', 60],
  ['PER-005', 'PR-2027-005', 40],
  ['PER-005', 'PR-2027-009', 35],
  ['PER-005', 'PR-2027-012', 25],
];
const jyAssignments = [
  ['PER-JY-001', 'PR-JY-001', 50],
  ['PER-JY-001', 'PR-JY-002', 50],
  ['PER-JY-002', 'PR-JY-001', 50],
  ['PER-JY-002', 'PR-JY-002', 50],
];
// R5 replaces these referential percentages with the payroll allocation set
// by Contabilidad (docs/realineamiento-jy-demo.md › 5.5).
const jyDemoAssignments = [
  ['PER-JY-001', 'PY-26-001', 50],
  ['PER-JY-001', 'PY-26-002', 30],
  ['PER-JY-001', 'PY-26-003', 20],
  ['PER-JY-002', 'PY-26-001', 100],
  ['PER-JY-003', 'PY-26-001', 40],
  ['PER-JY-003', 'PY-26-003', 60],
  ['PER-JY-004', 'PY-26-001', 40],
  ['PER-JY-004', 'PY-26-002', 60],
  ['PER-JY-005', 'PY-26-001', 50],
  ['PER-JY-005', 'PY-26-002', 30],
  ['PER-JY-005', 'PY-26-003', 20],
  ['PER-JY-006', 'PY-26-001', 100],
];
const personnelBuildMode =
  typeof __ACTIVE_VARIANT__ === 'undefined' ? undefined : __ACTIVE_VARIANT__;
const assignmentFixtures =
  personnelBuildMode === 'surtec-peti'
    ? { surtec: surtecAssignments }
    : personnelBuildMode === 'jy-pmi'
      ? { jy: jyAssignments }
      : personnelBuildMode === 'jy-demo'
        ? { 'jy-demo': jyDemoAssignments }
        : { surtec: surtecAssignments, jy: jyAssignments, 'jy-demo': jyDemoAssignments };

const manualKey = variantStorageKey('manual-timesheets');
const incidentKey = variantStorageKey('attendance-incidents');

function shiftedDate(iso, days) {
  const date = new Date(`${iso}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function personnelAssignments(data) {
  return assignmentFixtures[data.id].map(([workerId, projectId, percent]) => {
    const project = data.projects.find((item) => item.id === projectId);
    return {
      id: `ASIG-${workerId}-${projectId}`,
      workerId,
      projectId,
      role: data.workers.find((item) => item.id === workerId)?.role || 'Asignado',
      from: project.startDate,
      to: project.endDate,
      percent,
      simulated: true,
    };
  });
}

export function baseAttendance(data, includeBiometrics = false) {
  const rows = data.operations
    .filter((item) => item.type === 'timesheet')
    .flatMap((operation) =>
      [-2, -1].map((offset, index) => ({
        id: `ASI-${operation.id}-${index + 1}`,
        operationId: operation.id,
        workerId: operation.workerId,
        projectId: operation.projectId,
        date: shiftedDate(operation.date, offset),
        start: index ? '08:30' : '08:00',
        end: '16:00',
        hours: index ? 7.5 : 8,
        status: 'Completa',
        source: includeBiometrics ? 'Marcación simulada' : 'Ejemplo manual',
        simulated: true,
      }))
    );
  if (personnelBuildMode !== 'jy-pmi' && personnelBuildMode !== 'jy-demo' && includeBiometrics) {
    rows.push({
      id: 'ASI-INC-001',
      operationId: null,
      workerId: 'PER-002',
      projectId: 'PR-2027-001',
      date: '2027-04-02',
      start: '08:10',
      end: null,
      hours: null,
      status: 'Incompleta',
      source: 'Marcación simulada',
      simulated: true,
    });
  }
  return rows.sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
}

export function baseTimesheets(data) {
  return data.operations
    .filter((item) => item.type === 'timesheet')
    .flatMap((operation) =>
      [-2, -1].map((offset, index) => ({
        id: `TR-${operation.id}-${index + 1}`,
        attendanceId: `ASI-${operation.id}-${index + 1}`,
        operationId: operation.id,
        workerId: operation.workerId,
        projectId: operation.projectId,
        date: shiftedDate(operation.date, offset),
        start: index ? '08:30' : '08:00',
        end: '16:00',
        hours: index ? 7.5 : 8,
        status: 'Validado (ejemplo)',
        manual: false,
        simulated: true,
      }))
    )
    .sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
}

export function loadManualTimesheets(data) {
  try {
    const parsed = JSON.parse(localStorage.getItem(manualKey) || '[]');
    if (!Array.isArray(parsed)) return [];
    const assignments = personnelAssignments(data);
    return parsed.filter(
      (item) =>
        item &&
        /^TR-DEMO-\d{3,}$/.test(item.id || '') &&
        assignments.some(
          (assignment) =>
            assignment.workerId === item.workerId && assignment.projectId === item.projectId
        ) &&
        /^\d{4}-\d{2}-\d{2}$/.test(item.date || '') &&
        Number.isFinite(item.hours) &&
        item.hours > 0 &&
        item.hours <= 16 &&
        typeof item.reason === 'string'
    );
  } catch {
    return [];
  }
}

export function addManualTimesheet(data, entry) {
  try {
    const records = loadManualTimesheets(data);
    const next = records.reduce((max, item) => Math.max(max, Number(item.id.slice(8)) || 0), 0) + 1;
    const id = `TR-DEMO-${String(next).padStart(3, '0')}`;
    const record = {
      ...entry,
      id,
      attendanceId: `ASI-DEMO-${String(next).padStart(3, '0')}`,
      operationId: null,
      status: 'Registrado (demo)',
      manual: true,
      simulated: true,
    };
    localStorage.setItem(manualKey, JSON.stringify([...records, record]));
    return record;
  } catch {
    return null;
  }
}

export function manualAttendance(data) {
  return loadManualTimesheets(data).map((item) => ({
    id: item.attendanceId,
    operationId: null,
    workerId: item.workerId,
    projectId: item.projectId,
    date: item.date,
    start: item.start,
    end: item.end,
    hours: item.hours,
    status: 'Manual (demo)',
    source: 'Registro manual visual',
    simulated: true,
  }));
}

// Biometric device shown in Personal › Biometría (punto 53). Simulated
// state: "Conectado" is a credible demo status (decision 3), not a live link.
export const BIOMETRIC_DEVICE = {
  name: 'ZKTeco · Oficina Principal',
  status: 'Conectado',
  lastSync: '2026-11-08T18:05:00',
  records: 43,
};

export function incidentRows(data, includeBiometrics = false) {
  if (!includeBiometrics) return [];
  const attendance = baseAttendance(data, true).find((item) => item.id === 'ASI-INC-001');
  let actions = {};
  try {
    actions = JSON.parse(localStorage.getItem(incidentKey) || '{}') || {};
  } catch {
    /* optional demo state */
  }
  return [
    {
      id: 'INC-001',
      attendanceId: attendance.id,
      workerId: attendance.workerId,
      projectId: attendance.projectId,
      date: attendance.date,
      type: 'Falta salida',
      status: actions['INC-001']?.status || 'Pendiente',
      reason: actions['INC-001']?.reason || '',
      action: actions['INC-001']?.action || null,
      responsible: actions['INC-001']?.responsible || null,
      actionDate: actions['INC-001']?.actionDate || null,
      simulated: true,
    },
    {
      // Punto 92: a fingerprint read the device could not match to a worker.
      id: 'INC-002',
      attendanceId: null,
      workerId: null,
      projectId: attendance.projectId,
      date: attendance.date,
      type: 'No identificado',
      note: 'Marcación 07:58 con huella sin trabajador asociado.',
      status: actions['INC-002']?.status || 'Pendiente',
      reason: actions['INC-002']?.reason || '',
      action: actions['INC-002']?.action || null,
      responsible: actions['INC-002']?.responsible || null,
      actionDate: actions['INC-002']?.actionDate || null,
      simulated: true,
    },
  ];
}

export function saveIncidentAction(id, action, reason) {
  try {
    const actions = JSON.parse(localStorage.getItem(incidentKey) || '{}') || {};
    actions[id] = {
      action,
      reason,
      status: action === 'Ignorar' ? 'Ignorada' : 'Revisada',
      responsible: 'Usuario de demostración',
      actionDate: '2027-04-03',
    };
    localStorage.setItem(incidentKey, JSON.stringify(actions));
    return true;
  } catch {
    return false;
  }
}

export function laborCostRows(data, workerId) {
  return data.operations
    .filter(
      (item) =>
        item.type === 'timesheet' &&
        item.costSource === 'personnel' &&
        (!workerId || item.workerId === workerId)
    )
    .map((item) => ({
      id: `COST-${item.id}`,
      operationId: item.id,
      workerId: item.workerId,
      projectId: item.projectId,
      amount: item.amount,
      date: item.date,
    }));
}

export function hoursBetween(start, end) {
  if (!/^\d{2}:\d{2}$/.test(start || '') || !/^\d{2}:\d{2}$/.test(end || '')) return 0;
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  return Math.round(((endH * 60 + endM - startH * 60 - startM) / 60) * 100) / 100;
}
