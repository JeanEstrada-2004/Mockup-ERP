// Personal de J&Y (R5, rules.laborCost = 'payroll'). Shared by every build, no
// company data here: payroll, RxH, SF100 attendance and field tareo come from
// the data set. What the demonstration records (tareo, signatures, incident
// justifications, imputation drafts, RxH) is local and never changes the
// base personnel cost of the projects.
import { activeVariant, variantStorageKey } from '../config/variants.js';

const keys = {
  tareo: variantStorageKey('tareo-local'),
  signatures: variantStorageKey('tareo-signatures'),
  incidents: variantStorageKey('personnel-incidents'),
  imputations: variantStorageKey('payroll-drafts'),
  rxh: variantStorageKey('rxh-local'),
};
const round = (value) => Math.round((Number(value) || 0) * 100) / 100;
const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'setiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

function read(key, fallback) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || 'null');
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}
function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
const stamp = (data) => ({ at: data.today, user: activeVariant.user.name });

export function monthLabel(month) {
  const [year, number] = month.split('-');
  return `${MONTHS[Number(number) - 1]} ${year}`;
}

// ---- Planilla e imputación ------------------------------------------------
export function payrollMonths(data) {
  return [...new Set((data.payroll || []).map((item) => item.month))].sort().reverse();
}

function imputationDrafts() {
  const parsed = read(keys.imputations, {});
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
}

export function payrollRows(data, month) {
  const drafts = imputationDrafts()[month] || {};
  return (data.payroll || [])
    .filter((item) => item.month === month)
    .map((item) => {
      const imputations = Array.isArray(drafts[item.workerId])
        ? drafts[item.workerId]
        : item.imputations;
      const imputedPct = imputations.reduce((sum, entry) => sum + entry.percent, 0);
      return {
        ...item,
        imputations: imputations.map((entry) => ({
          ...entry,
          amount: round((item.cost * entry.percent) / 100),
        })),
        draft: Array.isArray(drafts[item.workerId]),
        imputedPct,
        imputedAmount: round((item.cost * imputedPct) / 100),
        officeAmount: round((item.cost * (100 - imputedPct)) / 100),
      };
    });
}

export function saveImputationDraft(month, workerId, imputations) {
  const drafts = imputationDrafts();
  drafts[month] = { ...drafts[month], [workerId]: imputations };
  return write(keys.imputations, drafts);
}

export function projectImputation(rows) {
  const totals = new Map();
  for (const row of rows) {
    for (const entry of row.imputations) {
      totals.set(entry.projectId, round((totals.get(entry.projectId) || 0) + entry.amount));
    }
  }
  return [...totals].map(([projectId, amount]) => ({ projectId, amount }));
}

// ---- Asistencia (SF100) ---------------------------------------------------
export function attendanceStatus(row) {
  if (!row.start && !row.end) return 'Sin marcación';
  if (!row.end) return 'Sin salida';
  return 'Completa';
}

export function attendanceRows(data) {
  return (data.attendance || [])
    .map((row) => ({ ...row, status: attendanceStatus(row) }))
    .sort((a, b) => b.date.localeCompare(a.date) || a.workerId.localeCompare(b.workerId));
}

// ---- Tareo de campo --------------------------------------------------------
export function tareoRows(data) {
  const signatures = read(keys.signatures, {});
  const local = read(keys.tareo, []);
  return [
    ...(data.tareo || []).map((row) => ({ ...row, base: true })),
    ...(Array.isArray(local) ? local : []).map((row) => ({ ...row, base: false })),
  ]
    .map((row) =>
      signatures[row.id] ? { ...row, signed: true, signedAt: signatures[row.id] } : row
    )
    .sort((a, b) => b.date.localeCompare(a.date) || a.projectId.localeCompare(b.projectId));
}

export function signTareo(data, id) {
  const signatures = read(keys.signatures, {});
  signatures[id] = stamp(data);
  return write(keys.signatures, signatures);
}

export function addTareo(data, row) {
  const local = read(keys.tareo, []);
  const list = Array.isArray(local) ? local : [];
  const id = `TAR-L-${String(list.length + 1).padStart(3, '0')}`;
  list.push({
    ...row,
    id,
    signed: false,
    recordedBy: null,
    recordedByName: activeVariant.user.name,
  });
  write(keys.tareo, list);
  return id;
}

// ---- Incidencias ------------------------------------------------------------
// Missing marks from the SF100 and unsigned tareo rows ("olvidan firmar").
export function incidentRows(data) {
  const actions = read(keys.incidents, {});
  const fromAttendance = attendanceRows(data)
    .filter((row) => row.status !== 'Completa')
    .map((row) => ({
      id: `INC-${row.id}`,
      kind: row.status === 'Sin salida' ? 'Marcación de salida faltante' : 'Día sin marcaciones',
      source: 'Asistencia SF100',
      workerId: row.workerId,
      projectId: null,
      date: row.date,
    }));
  const fromTareo = tareoRows(data)
    .filter((row) => !row.signed)
    .map((row) => ({
      id: `INC-${row.id}`,
      kind: 'Tareo sin firma',
      source: 'Tareo de campo',
      workerId: row.workerId,
      projectId: row.projectId,
      date: row.date,
      tareoId: row.id,
    }));
  return [...fromAttendance, ...fromTareo]
    .map((item) => ({
      ...item,
      status: actions[item.id]?.status || 'Pendiente',
      reason: actions[item.id]?.reason || '',
      action: actions[item.id] || null,
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function resolveIncident(data, id, status, reason) {
  const actions = read(keys.incidents, {});
  actions[id] = { status, reason, ...stamp(data) };
  return write(keys.incidents, actions);
}

// ---- Recibos por honorarios ---------------------------------------------------
export function rxhRows(data) {
  const local = read(keys.rxh, []);
  return [
    ...(data.rxh || []).map((row) => ({ ...row, base: true })),
    ...(Array.isArray(local) ? local : []).map((row) => ({ ...row, base: false })),
  ].sort((a, b) => b.date.localeCompare(a.date));
}

export function addRxh(row) {
  const local = read(keys.rxh, []);
  const list = Array.isArray(local) ? local : [];
  const id = `RXH-L-${String(list.length + 1).padStart(3, '0')}`;
  list.push({ ...row, id });
  write(keys.rxh, list);
  return id;
}

// ---- People of a project -----------------------------------------------------
// Who works on a project: imputed payroll of the latest month, field tareo and
// recibos por honorarios.
export function projectPeople(data, projectId) {
  const month = payrollMonths(data)[0];
  const ids = new Set([
    ...(data.payroll || [])
      .filter(
        (item) =>
          item.month === month && item.imputations.some((entry) => entry.projectId === projectId)
      )
      .map((item) => item.workerId),
    ...(data.tareo || [])
      .filter((item) => item.projectId === projectId)
      .map((item) => item.workerId),
    ...(data.rxh || [])
      .filter((item) => item.projectId === projectId && item.workerId)
      .map((item) => item.workerId),
  ]);
  return data.workers.filter((worker) => ids.has(worker.id));
}
