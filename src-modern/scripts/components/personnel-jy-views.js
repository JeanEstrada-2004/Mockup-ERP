// Personal de J&Y (R5): Personal, Asistencia (SF100), Tareo de campo,
// Planilla e imputación, RxH, Biometría e Incidencias, and the worker page.
// No hourly labour cost: payroll is imputed to projects by an estimated %
// set by Contabilidad, and temporary staff are paid with RxH.
import { Modal } from 'bootstrap';
import { activeVariant } from '../config/variants.js';
import { moduleHref } from '../config/modules.js';
import { getDataForVariant, getProject } from '../data/mock-data.js';
import { formatAmount } from '../data/commercial-data.js';
import { loadReports, reportNumber, reportTotals } from '../data/expense-reports.js';
import {
  addRxh,
  addTareo,
  attendanceRows,
  incidentRows,
  monthLabel,
  payrollMonths,
  payrollRows,
  projectImputation,
  resolveIncident,
  rxhRows,
  saveImputationDraft,
  signTareo,
  tareoRows,
} from '../data/personnel-jy.js';
import { formatDate } from './project-views.js';

const data = getDataForVariant(activeVariant);
const TABS = [
  ['personal', 'Personal'],
  ['asistencia', 'Asistencia'],
  ['tareo', 'Tareo'],
  ['planilla', 'Planilla'],
  ['rxh', 'RxH'],
  ['biometria', 'Biometría'],
  ['incidencias', 'Incidencias'],
];
const notify = () => window.AdminApp?.notificationManager;

const helpers = {
  formatAmount,
  formatDate,
  monthLabel,
  workers: data.workers,
  projects: data.projects.filter((item) => item.status !== 'Cerrado'),
  workerName: (id) => data.workers.find((item) => item.id === id)?.name || '—',
  worker: (id) => data.workers.find((item) => item.id === id) || null,
  projectName: (id) => getProject(data, id)?.name || '—',
  workerHref: (id) => moduleHref('personnel', id),
  projectHref: (id) => moduleHref('projects', id),
  costHref: (id) => moduleHref('costs', `COST-${id}`),
};

export function personnelJyWorkspace() {
  const params = new URLSearchParams(location.search);
  const months = payrollMonths(data);
  const record = params.get('record') || '';
  const monthFromRecord = /^PLA-(\d{2})(\d{2})-/.exec(record);
  return {
    ...helpers,
    tabs: TABS,
    tab: TABS.some(([id]) => id === params.get('tab')) ? params.get('tab') : 'personal',
    record,
    months,
    month: monthFromRecord ? `20${monthFromRecord[1]}-${monthFromRecord[2]}` : months[0],
    sf100: data.sf100,
    attendance: [],
    tareo: [],
    incidents: [],
    rxh: [],
    payroll: [],
    workerFilter: data.workers.some((item) => item.id === params.get('worker'))
      ? params.get('worker')
      : '',
    projectFilter: getProject(data, params.get('project')) ? params.get('project') : '',
    tareoForm: { projectId: '', workerId: '', date: data.today, shift: 'Completa', note: '' },
    tareoError: '',
    imputationTarget: null,
    imputationForm: [],
    imputationError: '',
    incidentTarget: null,
    incidentReason: '',
    rxhForm: {
      person: '',
      docId: '',
      workerId: '',
      projectId: '',
      concept: '',
      number: '',
      date: data.today,
      amount: '',
    },
    rxhError: '',
    init() {
      this.reload();
      document.title = `Personal · ${activeVariant.company.shortName}`;
    },
    reload() {
      this.attendance = attendanceRows(data);
      this.tareo = tareoRows(data);
      this.incidents = incidentRows(data);
      this.rxh = rxhRows(data);
      this.payroll = payrollRows(data, this.month);
    },
    setTab(id) {
      this.tab = id;
      const next = new URL(location.href);
      next.searchParams.set('tab', id);
      next.searchParams.delete('record');
      history.replaceState(null, '', next);
    },
    setMonth(month) {
      this.month = month;
      this.payroll = payrollRows(data, month);
    },
    // ---- Personal -------------------------------------------------------
    projectsOf(workerId) {
      const latest = payrollRows(data, this.months[0]).find((item) => item.workerId === workerId);
      const ids = new Set([
        ...(latest?.imputations || []).map((item) => item.projectId),
        ...this.tareo.filter((item) => item.workerId === workerId).map((item) => item.projectId),
        ...this.rxh.filter((item) => item.workerId === workerId).map((item) => item.projectId),
      ]);
      return [...ids];
    },
    countKind(kind) {
      return data.workers.filter((item) => item.kind === kind).length;
    },
    // ---- Asistencia, tareo, incidencias -----------------------------------
    get filteredAttendance() {
      return this.attendance.filter(
        (item) => !this.workerFilter || item.workerId === this.workerFilter
      );
    },
    get filteredTareo() {
      return this.tareo.filter(
        (item) =>
          (!this.workerFilter || item.workerId === this.workerFilter) &&
          (!this.projectFilter || item.projectId === this.projectFilter)
      );
    },
    get pendingIncidents() {
      return this.incidents.filter((item) => item.status === 'Pendiente');
    },
    get fieldWorkers() {
      return data.workers.filter((item) => ['Campo', 'Temporal'].includes(item.kind));
    },
    importSf100() {
      notify()?.info(
        'Importación simulada: hoy el SF100 se descarga a Excel; la propuesta es sincronizarlo con la plataforma.'
      );
    },
    openTareo() {
      this.tareoForm = {
        projectId: this.projectFilter || '',
        workerId: '',
        date: data.today,
        shift: 'Completa',
        note: '',
      };
      this.tareoError = '';
      Modal.getOrCreateInstance(document.getElementById('jy-tareo-modal')).show();
    },
    saveTareo() {
      const form = this.tareoForm;
      if (!getProject(data, form.projectId) || !this.worker(form.workerId) || !form.date) {
        this.tareoError = 'Selecciona el proyecto, el trabajador y la fecha.';
        return;
      }
      if (this.tareo.some((item) => item.workerId === form.workerId && item.date === form.date)) {
        this.tareoError = 'Ese trabajador ya tiene tareo registrado en esa fecha.';
        return;
      }
      addTareo(data, { ...form, note: form.note.trim().slice(0, 160) });
      Modal.getOrCreateInstance(document.getElementById('jy-tareo-modal')).hide();
      this.reload();
      notify()?.success('Tareo registrado; queda pendiente de firma.');
    },
    sign(row) {
      if (row.signed) return;
      signTareo(data, row.id);
      this.reload();
      notify()?.success(`Tareo de ${this.workerName(row.workerId)} firmado.`);
    },
    openIncident(item) {
      this.incidentTarget = item;
      this.incidentReason = '';
      Modal.getOrCreateInstance(document.getElementById('jy-incident-modal')).show();
    },
    resolve(status) {
      const reason = this.incidentReason.trim().slice(0, 200);
      if (!this.incidentTarget || !reason) return;
      if (this.incidentTarget.tareoId && status === 'Corregida')
        signTareo(data, this.incidentTarget.tareoId);
      resolveIncident(data, this.incidentTarget.id, status, reason);
      Modal.getOrCreateInstance(document.getElementById('jy-incident-modal')).hide();
      this.reload();
      notify()?.success(`Incidencia ${status.toLowerCase()}.`);
    },
    // ---- Planilla ----------------------------------------------------------
    get projectTotals() {
      return projectImputation(this.payroll);
    },
    get payrollTotal() {
      return this.payroll.reduce((sum, item) => sum + item.cost, 0);
    },
    get imputedTotal() {
      return this.payroll.reduce((sum, item) => sum + item.imputedAmount, 0);
    },
    payrollOperation(projectId) {
      const [year, number] = this.month.split('-');
      return `PLA-${year.slice(2)}${number}-${projectId.slice(-3)}`;
    },
    openImputation(row) {
      this.imputationTarget = row;
      this.imputationForm = this.projects
        .filter((project) => project.status !== 'Planificado')
        .map((project) => ({
          projectId: project.id,
          percent: row.imputations.find((item) => item.projectId === project.id)?.percent || 0,
        }));
      this.imputationError = '';
      Modal.getOrCreateInstance(document.getElementById('jy-imputation-modal')).show();
    },
    get imputationSum() {
      return this.imputationForm.reduce((sum, item) => sum + (Number(item.percent) || 0), 0);
    },
    saveImputation() {
      const values = this.imputationForm.map((item) => ({
        projectId: item.projectId,
        percent: Number(item.percent) || 0,
      }));
      if (
        values.some((item) => item.percent < 0 || item.percent > 100) ||
        this.imputationSum > 100
      ) {
        this.imputationError = 'Cada porcentaje va de 0 a 100 y la suma no puede pasar de 100 %.';
        return;
      }
      saveImputationDraft(
        this.month,
        this.imputationTarget.workerId,
        values.filter((item) => item.percent > 0)
      );
      Modal.getOrCreateInstance(document.getElementById('jy-imputation-modal')).hide();
      this.payroll = payrollRows(data, this.month);
      notify()?.success(
        'Propuesta de imputación guardada en esta demostración; el costo registrado no cambia.'
      );
    },
    // ---- RxH ---------------------------------------------------------------
    get rxhTotal() {
      return this.rxh.reduce((sum, item) => sum + item.amount, 0);
    },
    openRxh() {
      this.rxhForm = {
        person: '',
        docId: '',
        workerId: '',
        projectId: '',
        concept: '',
        number: '',
        date: data.today,
        amount: '',
      };
      this.rxhError = '';
      Modal.getOrCreateInstance(document.getElementById('jy-rxh-modal')).show();
    },
    pickRxhWorker() {
      const worker = this.worker(this.rxhForm.workerId);
      if (worker) this.rxhForm.person = worker.name;
    },
    saveRxh() {
      const form = this.rxhForm;
      const amount = Math.round(Number(form.amount) * 100) / 100;
      if (
        !form.person.trim() ||
        !/^(10|15|17)\d{9}$/.test(form.docId.trim()) ||
        !getProject(data, form.projectId) ||
        !(amount > 0) ||
        !form.number.trim()
      ) {
        this.rxhError =
          'Completa persona, RUC de persona natural (11 dígitos), número, proyecto e importe.';
        return;
      }
      addRxh({
        number: form.number.trim().slice(0, 20),
        person: form.person.trim().slice(0, 80),
        docId: form.docId.trim(),
        workerId: form.workerId || null,
        projectId: form.projectId,
        concept: form.concept.trim().slice(0, 120) || 'Servicios prestados',
        date: form.date,
        amount,
      });
      Modal.getOrCreateInstance(document.getElementById('jy-rxh-modal')).hide();
      this.reload();
      notify()?.success('Recibo por honorarios registrado en esta demostración.');
    },
  };
}

export function workerJyDetail() {
  const params = new URLSearchParams(location.search);
  const worker = data.workers.find((item) => item.id === params.get('id')) || null;
  const months = payrollMonths(data);
  return {
    ...helpers,
    worker,
    payroll: worker
      ? months
          .map((month) => ({
            month,
            row: payrollRows(data, month).find((item) => item.workerId === worker.id),
          }))
          .filter((item) => item.row)
      : [],
    tareo: worker ? tareoRows(data).filter((item) => item.workerId === worker.id) : [],
    attendance: worker ? attendanceRows(data).filter((item) => item.workerId === worker.id) : [],
    rxh: worker ? rxhRows(data).filter((item) => item.workerId === worker.id) : [],
    reports: worker
      ? loadReports(data)
          .filter((item) => item.workerId === worker.id)
          .map((item) => ({ ...item, label: reportNumber(item), total: reportTotals(item).total }))
      : [],
    init() {
      if (worker) document.title = `${worker.name} · ${activeVariant.company.shortName}`;
    },
    get latestImputation() {
      return this.payroll[0]?.row || null;
    },
    reportHref(id) {
      return `./expense.html?id=${encodeURIComponent(id)}`;
    },
  };
}
