import { statusClass } from '../utils/status.js';
import { Modal } from 'bootstrap';
import { activeVariant } from '../config/variants.js';
import { moduleHref } from '../config/modules.js';
import { getDataForVariant, getProject } from '../data/mock-data.js';
import {
  addManualTimesheet,
  baseAttendance,
  baseTimesheets,
  hoursBetween,
  incidentRows,
  laborCostRows,
  loadManualTimesheets,
  manualAttendance,
  personnelAssignments,
  saveIncidentAction,
} from '../data/personnel-data.js';
import { formatDate } from './project-views.js';
import { formatMoney, writeProjectId } from './shell.js';

const data = getDataForVariant(activeVariant);
const hasBiometrics = activeVariant.enabledModules.includes('biometrics');
const tabs = [
  ['personal', 'Personal'],
  ['asignaciones', 'Asignaciones'],
  ['asistencia', 'Asistencia'],
  ['tareo', 'Tareo'],
  ...(hasBiometrics
    ? [
        ['biometria', 'Biometría'],
        ['incidencias', 'Incidencias'],
      ]
    : []),
];
const normalize = (value) =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
const workerName = (id) => data.workers.find((item) => item.id === id)?.name || '—';
const projectName = (id) => getProject(data, id)?.name || '—';
const workerHref = (id) => moduleHref('personnel', id);
const projectHref = (id) => moduleHref('projects', id);
const costHref = (operationId) => moduleHref('costs', `COST-${operationId}`);
const hoursLabel = (value) =>
  value == null
    ? '—'
    : `${new Intl.NumberFormat('es-PE', { maximumFractionDigits: 2 }).format(value)} h`;

function toast(message) {
  window.AdminApp?.notificationManager?.info(message);
}

export function personnelWorkspace() {
  const params = new URLSearchParams(location.search);
  const requestedTab = params.get('tab');
  const requestedWorker = params.get('worker');
  const requestedProject = params.get('project');
  return {
    tab: tabs.some(([id]) => id === requestedTab) ? requestedTab : 'personal',
    tabs,
    hasBiometrics,
    workers: data.workers,
    projects: data.projects,
    assignments: personnelAssignments(data),
    attendance: [],
    timesheets: [],
    incidents: [],
    search: params.get('search') || '',
    workerFilter: data.workers.some((item) => item.id === requestedWorker) ? requestedWorker : '',
    projectFilter: getProject(data, requestedProject) ? requestedProject : '',
    periodFilter: params.get('period') || '',
    statusFilter: params.get('status') || '',
    sourceOperationFilter: params.get('record') || '',
    form: {
      workerId: '',
      projectId: '',
      date: '2027-04-03',
      start: '08:00',
      end: '16:00',
      reason: '',
      note: '',
    },
    formError: '',
    incidentForm: { id: '', action: '', reason: '' },
    incidentError: '',
    workerName,
    projectName,
    workerHref,
    projectHref,
    costHref,
    statusClass,
    formatDate,
    formatMoney,
    hoursLabel,
    init() {
      this.refresh();
      document.title = `Personal y Tareo · ${activeVariant.company.shortName}`;
    },
    refresh() {
      this.attendance = [...baseAttendance(data, hasBiometrics), ...manualAttendance(data)].sort(
        (a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id)
      );
      this.timesheets = [...baseTimesheets(data), ...loadManualTimesheets(data)].sort(
        (a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id)
      );
      this.incidents = incidentRows(data, hasBiometrics);
    },
    get periods() {
      return [...new Set(this.attendance.map((item) => item.date.slice(0, 7)))].sort().reverse();
    },
    matches(row) {
      const label = `${row.id || ''} ${workerName(row.workerId)} ${projectName(row.projectId)} ${row.role || ''} ${row.dni || ''}`;
      return (
        (!this.search.trim() || normalize(label).includes(normalize(this.search.trim()))) &&
        (!this.workerFilter ||
          row.workerId === this.workerFilter ||
          row.id === this.workerFilter) &&
        (!this.projectFilter ||
          row.projectId === this.projectFilter ||
          (row.id &&
            this.assignments.some(
              (item) => item.workerId === row.id && item.projectId === this.projectFilter
            ))) &&
        (!this.periodFilter || !row.date || row.date.startsWith(this.periodFilter)) &&
        (!this.statusFilter || row.status === this.statusFilter)
      );
    },
    get filteredWorkers() {
      return this.workers.filter((worker) => this.matches({ ...worker, workerId: worker.id }));
    },
    get filteredAssignments() {
      return this.assignments.filter((item) => this.matches(item));
    },
    get filteredAttendance() {
      return this.attendance.filter((item) => this.matches(item));
    },
    get filteredTimesheets() {
      return this.timesheets.filter(
        (item) =>
          this.matches(item) &&
          (!this.sourceOperationFilter || item.operationId === this.sourceOperationFilter)
      );
    },
    get filteredIncidents() {
      return this.incidents.filter((item) => this.matches(item));
    },
    get biometricRows() {
      return hasBiometrics
        ? this.filteredAttendance.filter((item) => item.source === 'Marcación simulada')
        : [];
    },
    get formHours() {
      return hoursBetween(this.form.start, this.form.end);
    },
    get formProjects() {
      return this.assignments
        .filter((item) => item.workerId === this.form.workerId)
        .map((item) => getProject(data, item.projectId));
    },
    setTab(id) {
      if (!tabs.some(([tabId]) => tabId === id)) return;
      if (id !== this.tab) this.statusFilter = '';
      if (id !== 'tareo') this.sourceOperationFilter = '';
      this.tab = id;
      this.updateUrl();
    },
    updateUrl() {
      const next = new URL(location.href);
      for (const key of ['tab', 'search', 'worker', 'project', 'period', 'status', 'record'])
        next.searchParams.delete(key);
      if (this.tab !== 'personal') next.searchParams.set('tab', this.tab);
      if (this.search.trim()) next.searchParams.set('search', this.search.trim());
      if (this.workerFilter) next.searchParams.set('worker', this.workerFilter);
      if (this.projectFilter) next.searchParams.set('project', this.projectFilter);
      if (this.periodFilter) next.searchParams.set('period', this.periodFilter);
      if (this.statusFilter) next.searchParams.set('status', this.statusFilter);
      if (this.sourceOperationFilter) next.searchParams.set('record', this.sourceOperationFilter);
      history.replaceState(null, '', next);
    },
    clearFilters() {
      this.search = '';
      this.workerFilter = '';
      this.projectFilter = '';
      this.periodFilter = '';
      this.statusFilter = '';
      this.sourceOperationFilter = '';
      this.updateUrl();
    },
    openManual() {
      this.form = {
        workerId: this.workerFilter || '',
        projectId: '',
        date: '2027-04-03',
        start: '08:00',
        end: '16:00',
        reason: '',
        note: '',
      };
      this.formError = '';
      Modal.getOrCreateInstance(document.getElementById('personnel-manual-modal')).show();
    },
    saveManual() {
      const project = getProject(data, this.form.projectId);
      const assigned = this.assignments.some(
        (item) => item.workerId === this.form.workerId && item.projectId === this.form.projectId
      );
      if (
        !assigned ||
        !project ||
        this.form.date < project.startDate ||
        this.form.date > project.endDate ||
        this.formHours <= 0 ||
        this.formHours > 16 ||
        !this.form.reason.trim()
      ) {
        this.formError =
          'Selecciona una asignación válida, una fecha dentro del proyecto, horas entre 0 y 16 y un motivo.';
        return;
      }
      const saved = addManualTimesheet(data, {
        workerId: this.form.workerId,
        projectId: this.form.projectId,
        date: this.form.date,
        start: this.form.start,
        end: this.form.end,
        hours: this.formHours,
        reason: this.form.reason.trim().slice(0, 120),
        note: this.form.note.trim().slice(0, 200),
      });
      if (!saved) {
        this.formError = 'No se pudo guardar el registro en este navegador.';
        return;
      }
      this.refresh();
      this.tab = 'tareo';
      this.workerFilter = saved.workerId;
      this.projectFilter = saved.projectId;
      this.periodFilter = saved.date.slice(0, 7);
      this.statusFilter = '';
      this.sourceOperationFilter = '';
      this.updateUrl();
      writeProjectId(saved.projectId);
      Modal.getOrCreateInstance(document.getElementById('personnel-manual-modal')).hide();
      toast(`${saved.id}: tareo manual de demostración registrado; no altera el costo laboral.`);
    },
    openIncident(id, action) {
      if (!hasBiometrics) return;
      this.incidentForm = { id, action, reason: '' };
      this.incidentError = '';
      Modal.getOrCreateInstance(document.getElementById('personnel-incident-modal')).show();
    },
    resolveIncident() {
      const reason = this.incidentForm.reason.trim().slice(0, 200);
      if (!reason) {
        this.incidentError = 'Escribe el motivo de la acción simulada.';
        return;
      }
      if (!saveIncidentAction(this.incidentForm.id, this.incidentForm.action, reason)) {
        this.incidentError = 'No se pudo guardar la acción en este navegador.';
        return;
      }
      this.refresh();
      Modal.getOrCreateInstance(document.getElementById('personnel-incident-modal')).hide();
      toast(`Incidencia ${this.incidentForm.id}: acción simulada registrada.`);
    },
  };
}

export function workerDetail() {
  const id = new URLSearchParams(location.search).get('id');
  const worker = data.workers.find((item) => item.id === id) || null;
  const assignments = worker
    ? personnelAssignments(data).filter((item) => item.workerId === id)
    : [];
  return {
    worker,
    assignments,
    hasBiometrics,
    attendance: worker
      ? [...baseAttendance(data, hasBiometrics), ...manualAttendance(data)]
          .filter((item) => item.workerId === id)
          .sort((a, b) => b.date.localeCompare(a.date))
      : [],
    timesheets: worker
      ? [...baseTimesheets(data), ...loadManualTimesheets(data)]
          .filter((item) => item.workerId === id)
          .sort((a, b) => b.date.localeCompare(a.date))
      : [],
    incidents: worker
      ? incidentRows(data, hasBiometrics).filter((item) => item.workerId === id)
      : [],
    costs: worker ? laborCostRows(data, id) : [],
    projectName,
    projectHref,
    costHref,
    formatDate,
    formatMoney,
    hoursLabel,
    statusClass,
    get costTotal() {
      return this.costs.reduce((sum, item) => sum + item.amount, 0);
    },
    get attendanceHref() {
      return `./personnel.html?tab=asistencia&worker=${encodeURIComponent(id)}`;
    },
    get timesheetHref() {
      return `./personnel.html?tab=tareo&worker=${encodeURIComponent(id)}`;
    },
    init() {
      document.title = worker
        ? `${worker.name} · Personal · ${activeVariant.company.shortName}`
        : 'Trabajador no encontrado';
      if (assignments[0]) writeProjectId(assignments[0].projectId);
    },
  };
}
