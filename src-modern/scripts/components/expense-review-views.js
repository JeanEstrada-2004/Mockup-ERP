// Rendiciones de J&Y (R2, variant.rules.expenseFlow = 'review'): list with
// "Mis Rendiciones" on the phone, and a report page where the spender or
// Administración registers expenses from their evidence, and Administración
// reviews each expense, observes, accepts and hands the report to Contabilidad.
// Everything done here is local to the demonstration: base costs never change.
import { activeVariant } from '../config/variants.js';
import { moduleHref } from '../config/modules.js';
import { getDataForVariant, getProject } from '../data/mock-data.js';
import { formatAmount } from '../data/commercial-data.js';
import {
  EVIDENCE_TYPES,
  EXPENSE_CATEGORIES,
  FIELD_LABELS,
  REVIEW_COST,
  REVIEW_PENDING,
  REVIEW_STATUSES,
  correctedFields,
  evidenceLayout,
  fieldConfidence,
  isFormal,
  itemProblems,
  loadReports,
  nextReportId,
  nextReportNumber,
  reportNumber,
  reportTotals,
  reviewEvent,
  saveReport,
  suggestedValues,
} from '../data/expense-reports.js';
import { formatDate } from './project-views.js';
import { writeProjectId } from './shell.js';
import { syncApprovalCounters } from './approvals-view.js';

const data = getDataForVariant(activeVariant);
const normalize = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
const round = (value) => Math.round((Number(value) || 0) * 100) / 100;
const STATUS_WEIGHT = {
  Presentada: 0,
  Corregida: 0,
  Observada: 1,
  Borrador: 2,
  Aceptada: 3,
  'Entregada a Contabilidad': 4,
};

function workerName(id) {
  return data.workers.find((item) => item.id === id)?.name || '—';
}
function projectName(id) {
  return getProject(data, id)?.name || '—';
}
const notify = () => window.AdminApp?.notificationManager;

// Shared helpers for both components (plain functions only).
const shared = {
  formatAmount,
  formatDate,
  workerName,
  projectName,
  reportNumber,
  categories: EXPENSE_CATEGORIES,
  evidenceTypes: EVIDENCE_TYPES,
  fieldLabels: FIELD_LABELS,
  companyName: activeVariant.company.name,
  typeLabel(item) {
    return EVIDENCE_TYPES[item?.docType]?.label || '—';
  },
  typeShort(item) {
    return EVIDENCE_TYPES[item?.docType]?.short || '—';
  },
  isFormal,
  layout: evidenceLayout,
  docCode(item) {
    return item?.series
      ? `${item.series}-${item.number}`
      : item?.operationCode
        ? `Op. ${item.operationCode}`
        : '—';
  },
  itemCounterpart(item) {
    return item?.vendor || item?.payee || 'Sin documento';
  },
  amountsOf(item) {
    const formal = isFormal(item);
    return {
      vv: formal ? round(item.vv) : 0,
      igv: formal ? round(item.igv) : 0,
      nonTaxed: formal ? round(item.nonTaxed) : 0,
      undocumented: formal ? 0 : round(item.total),
    };
  },
};

export function expenseReviewList() {
  const params = new URLSearchParams(location.search);
  return {
    ...shared,
    records: [],
    projects: data.projects,
    statuses: REVIEW_STATUSES,
    search: (params.get('search') || '').slice(0, 120),
    projectFilter: data.projects.some((item) => item.id === params.get('project'))
      ? params.get('project')
      : '',
    workerFilter: data.workers.some((item) => item.id === params.get('worker'))
      ? params.get('worker')
      : '',
    statusFilter: REVIEW_STATUSES.includes(params.get('status')) ? params.get('status') : '',
    init() {
      this.records = loadReports(data).map((report) => ({
        ...report,
        totals: reportTotals(report),
      }));
    },
    get workers() {
      const ids = new Set(this.records.map((item) => item.workerId));
      return data.workers.filter((item) => ids.has(item.id));
    },
    get filtered() {
      const term = normalize(this.search.trim());
      return this.records
        .filter((item) => {
          const text = `${reportNumber(item)} ${item.number}-${item.year} ${workerName(item.workerId)} ${workerName(item.preparedBy)} ${item.projectId} ${projectName(item.projectId)}`;
          return (
            (!term || normalize(text).includes(term)) &&
            (!this.projectFilter || item.projectId === this.projectFilter) &&
            (!this.workerFilter || item.workerId === this.workerFilter) &&
            (!this.statusFilter || item.status === this.statusFilter)
          );
        })
        .sort(
          (a, b) =>
            (STATUS_WEIGHT[a.status] ?? 5) - (STATUS_WEIGHT[b.status] ?? 5) ||
            b.date.localeCompare(a.date)
        );
    },
    get toReview() {
      return this.records.filter((item) => REVIEW_PENDING.includes(item.status));
    },
    get observedCount() {
      return this.records.filter((item) => item.status === 'Observada').length;
    },
    get acceptedPending() {
      return this.records.filter((item) => item.status === 'Aceptada').length;
    },
    get delivered() {
      return this.records.filter((item) => item.status === 'Entregada a Contabilidad');
    },
    get deliveredAmount() {
      return this.delivered.reduce((sum, item) => sum + item.totals.total, 0);
    },
    get undocumentedAmount() {
      return round(
        this.records
          .filter((item) => item.status !== 'Borrador')
          .reduce((sum, item) => sum + item.totals.undocumented, 0)
      );
    },
    get myRecords() {
      return this.filtered.slice(0, 8);
    },
    detailHref(item) {
      return `./expense.html?id=${encodeURIComponent(item.id)}`;
    },
    updateUrl() {
      const next = new URLSearchParams();
      if (this.search.trim()) next.set('search', this.search.trim());
      if (this.projectFilter) next.set('project', this.projectFilter);
      if (this.workerFilter) next.set('worker', this.workerFilter);
      if (this.statusFilter) next.set('status', this.statusFilter);
      history.replaceState(null, '', `./expenses.html${next.size ? `?${next}` : ''}`);
    },
    clearFilters() {
      this.search = '';
      this.projectFilter = '';
      this.workerFilter = '';
      this.statusFilter = '';
      this.updateUrl();
    },
  };
}

function emptyCreateForm(projectId) {
  return {
    projectId: getProject(data, projectId) ? projectId : '',
    workerId: '',
    preparedBy: '',
    date: data.today,
    authorization: '',
    notes: '',
  };
}

export function expenseReviewDetail() {
  const params = new URLSearchParams(location.search);
  const reports = loadReports(data);
  const record = reports.find((item) => item.id === params.get('id')) || null;
  return {
    ...shared,
    record,
    isNew: params.get('new') === '1' && !record,
    projects: data.projects.filter((item) => item.status !== 'Cerrado'),
    workers: data.workers,
    statuses: REVIEW_STATUSES,
    create: emptyCreateForm(params.get('project')),
    createError: '',
    selectedId:
      record?.items.find((item) => item.id === params.get('item'))?.id ||
      record?.items[0]?.id ||
      null,
    draft: null,
    draftMode: '',
    draftError: '',
    itemNote: '',
    itemObserveOpen: false,
    reportNote: '',
    reportObserveOpen: false,
    zoom: 1,
    viewerFull: false,
    sampleIndex: 0,
    init() {
      if (this.record) writeProjectId(this.record.projectId);
      document.title = `${this.record ? `Rendición ${reportNumber(this.record)}` : 'Nueva rendición'} · ${activeVariant.company.shortName}`;
    },
    // ---- Report -------------------------------------------------------
    get totals() {
      return reportTotals(this.record);
    },
    get project() {
      return getProject(data, this.record?.projectId);
    },
    get projectHref() {
      return this.project ? moduleHref('projects', this.project.id) : null;
    },
    get costHref() {
      return this.record?.base &&
        REVIEW_COST.includes(
          data.expenseReports?.find((item) => item.id === this.record.id)?.status
        )
        ? moduleHref('costs', `COST-${this.record.id}`)
        : null;
    },
    get canEdit() {
      return Boolean(this.record) && ['Borrador', 'Observada'].includes(this.record.status);
    },
    get canReview() {
      return Boolean(this.record) && REVIEW_PENDING.includes(this.record.status);
    },
    get canAccept() {
      return (
        this.canReview &&
        this.record.items.length > 0 &&
        this.record.items.every((item) => item.review === 'Conforme')
      );
    },
    get canSubmit() {
      return (
        this.canEdit &&
        this.record.items.length > 0 &&
        this.record.items.every((item) => itemProblems(item).length === 0) &&
        !this.record.items.some((item) => item.review === 'Observado')
      );
    },
    get submitLabel() {
      return this.record?.status === 'Observada' ? 'Presentar corrección' : 'Presentar rendición';
    },
    get pendingItems() {
      return this.record
        ? this.record.items.filter((item) => item.review !== 'Conforme').length
        : 0;
    },
    get stepIndex() {
      const status = this.record?.status;
      if (status === 'Borrador') return 0;
      if (status === 'Presentada') return 1;
      if (['Observada', 'Corregida'].includes(status)) return 2;
      if (status === 'Aceptada') return 3;
      return 4;
    },
    steps: ['Borrador', 'Presentada', 'Revisión', 'Aceptada', 'Entregada a Contabilidad'],
    get history() {
      return [...(this.record?.history || [])].sort((a, b) => b.at.localeCompare(a.at));
    },
    get nextNumberLabel() {
      if (!this.create.workerId) return 'Se asigna al elegir al responsable del gasto';
      const year = Number(String(this.create.date || data.today).slice(0, 4));
      return `N.º ${nextReportNumber(loadReports(data), this.create.workerId, year)}-${year} de ${workerName(this.create.workerId)}`;
    },
    persist(action, note = '') {
      if (action) this.record.history.push(reviewEvent(data, action, note));
      if (!saveReport(this.record)) notify()?.error('No se pudo guardar en este navegador.');
      // Header and rail pending counters follow the report's new state.
      syncApprovalCounters();
    },
    createReport() {
      const form = this.create;
      if (
        !getProject(data, form.projectId) ||
        !data.workers.some((item) => item.id === form.workerId)
      ) {
        this.createError = 'Selecciona el proyecto y al responsable del gasto.';
        return;
      }
      const all = loadReports(data);
      const year = Number(String(form.date || data.today).slice(0, 4));
      const preparedBy = form.preparedBy || form.workerId;
      this.record = {
        id: nextReportId(all),
        workerId: form.workerId,
        number: nextReportNumber(all, form.workerId, year),
        year,
        projectId: form.projectId,
        date: form.date || data.today,
        preparedBy,
        reviewerId: data.workers.find((item) => item.area === 'Administración')?.id || preparedBy,
        status: 'Borrador',
        authorization: form.authorization.trim().slice(0, 200),
        notes: form.notes.trim().slice(0, 200),
        items: [],
        history: [],
        base: false,
      };
      this.persist(
        'Creada',
        preparedBy === form.workerId ? '' : `Preparada por ${workerName(preparedBy)}.`
      );
      this.isNew = false;
      this.createError = '';
      writeProjectId(this.record.projectId);
      history.replaceState(null, '', `./expense.html?id=${encodeURIComponent(this.record.id)}`);
      document.title = `Rendición ${reportNumber(this.record)} · ${activeVariant.company.shortName}`;
      notify()?.success(`Borrador ${reportNumber(this.record)} creado.`);
    },
    submit() {
      if (!this.canSubmit) {
        notify()?.warning('Completa los datos de cada gasto antes de presentar.');
        return;
      }
      const correcting = this.record.status === 'Observada';
      this.record.status = correcting ? 'Corregida' : 'Presentada';
      this.persist(
        correcting ? 'Corregida' : 'Presentada',
        correcting ? 'Corrección presentada para revisión.' : ''
      );
      notify()?.success(
        correcting ? 'Corrección presentada.' : `Rendición ${reportNumber(this.record)} presentada.`
      );
    },
    toggleReportObserve() {
      this.reportObserveOpen = !this.reportObserveOpen;
      this.reportNote = '';
    },
    observeReport() {
      if (!this.canReview) return;
      const note = this.reportNote.trim().slice(0, 300);
      const observed = this.record.items.filter((item) => item.review === 'Observado');
      if (!note && !observed.length) {
        notify()?.warning('Escribe la observación u observa al menos un gasto.');
        return;
      }
      this.record.status = 'Observada';
      const detail = observed.map((item) => `Ítem ${this.itemIndex(item)}`).join(', ');
      this.persist(
        'Observada',
        [note, detail && `Gastos observados: ${detail}.`].filter(Boolean).join(' ')
      );
      this.reportObserveOpen = false;
      notify()?.warning(`Rendición ${reportNumber(this.record)} observada.`);
    },
    async accept() {
      if (!this.canAccept) return;
      const accepted = notify()
        ? await notify().confirm({
            title: `¿Aceptar la rendición ${reportNumber(this.record)}?`,
            text: `${workerName(this.record.workerId)} · ${formatAmount(this.totals.total)}. Queda lista para entregarse a Contabilidad.`,
            icon: 'question',
            confirmButtonText: 'Aceptar rendición',
            cancelButtonText: 'Cancelar',
          })
        : true;
      if (!accepted) return;
      this.record.status = 'Aceptada';
      this.persist('Aceptada');
      notify()?.success(`Rendición ${reportNumber(this.record)} aceptada.`);
    },
    deliver() {
      if (this.record?.status !== 'Aceptada') return;
      this.record.status = 'Entregada a Contabilidad';
      this.persist(
        'Entregada a Contabilidad',
        'Información digital y evidencias enviadas a Contabilidad.'
      );
      notify()?.success('Rendición entregada a Contabilidad.');
    },
    // ---- Expenses -----------------------------------------------------
    get selected() {
      return this.record?.items.find((item) => item.id === this.selectedId) || null;
    },
    // What the evidence shows (the document itself), not what was registered.
    get ev() {
      const item = this.draft || this.selected;
      return item ? { ...item, ...(item.evidence || {}) } : null;
    },
    itemIndex(item) {
      return this.record.items.indexOf(item) + 1;
    },
    selectItem(id) {
      if (this.draft) return;
      this.selectedId = id;
      this.itemObserveOpen = false;
      this.zoom = 1;
      const next = new URL(location.href);
      next.searchParams.set('item', id);
      history.replaceState(null, '', next);
      this.$nextTick(() =>
        document.getElementById('expense-item-panel')?.scrollIntoView({ block: 'nearest' })
      );
    },
    suggestion(field) {
      return this.selected ? suggestedValues(this.selected)?.[field] : null;
    },
    confidence(field) {
      return this.selected ? fieldConfidence(this.selected, field) : null;
    },
    corrected(field) {
      return this.selected ? correctedFields(this.selected).includes(field) : false;
    },
    draftConfidence(field) {
      return this.draft ? fieldConfidence(this.draft, field) : null;
    },
    draftSuggestion(field) {
      return this.draft ? suggestedValues(this.draft)?.[field] : null;
    },
    get draftProblems() {
      return this.draft ? itemProblems(this.draft) : [];
    },
    capture(source) {
      if (!this.canEdit || this.draft) return;
      const samples = data.expenseSamples || [];
      if (!samples.length) return;
      const sample = samples[this.sampleIndex % samples.length];
      this.sampleIndex += 1;
      const truth = Object.fromEntries(
        [
          'date',
          'series',
          'number',
          'ruc',
          'vendor',
          'description',
          'vv',
          'igv',
          'nonTaxed',
          'total',
          'payee',
          'operationCode',
          'account',
          'buyer',
        ]
          .filter((key) => sample[key] !== undefined)
          .map((key) => [key, sample[key]])
      );
      // Registered values start as the OCR proposal; the person checks them
      // against the image and corrects what was misread.
      this.draft = {
        ...sample,
        ...(sample.suggested || {}),
        id: `${this.record.id}-${String(this.record.items.length + 1).padStart(2, '0')}-${Date.now() % 10000}`,
        category: sample.suggestedCategory,
        review: 'Pendiente',
        reviewNote: '',
        evidence: truth,
        source,
      };
      this.draftMode = 'new';
      this.draftError = '';
      this.selectedId = null;
      notify()?.info(
        `${source === 'foto' ? 'Foto tomada' : 'Archivo cargado'}: revisa los datos sugeridos antes de confirmar.`
      );
    },
    addWithoutDocument() {
      if (!this.canEdit || this.draft) return;
      this.draft = {
        id: `${this.record.id}-${String(this.record.items.length + 1).padStart(2, '0')}-${Date.now() % 10000}`,
        date: data.today,
        docType: 'sin-documento',
        series: '',
        number: '',
        ruc: '',
        vendor: '',
        description: '',
        category: '',
        suggestedCategory: '',
        vv: 0,
        igv: 0,
        nonTaxed: 0,
        total: '',
        review: 'Pendiente',
        reviewNote: '',
        justification: '',
      };
      this.draftMode = 'new';
      this.draftError = '';
      this.selectedId = null;
    },
    editItem(item, mode = 'edit') {
      if (!item || this.draft) return;
      this.draft = JSON.parse(JSON.stringify(item));
      this.draftMode = mode;
      this.draftError = '';
      this.selectedId = item.id;
    },
    cancelDraft() {
      const wasNew = this.draftMode === 'new';
      this.draft = null;
      this.draftMode = '';
      this.draftError = '';
      if (wasNew) this.selectedId = this.record.items.at(-1)?.id || null;
    },
    saveDraft() {
      const draft = this.draft;
      for (const key of ['vv', 'igv', 'nonTaxed', 'total']) draft[key] = round(draft[key]);
      if (!isFormal(draft)) Object.assign(draft, { vv: 0, igv: 0, nonTaxed: 0 });
      const problems = itemProblems(draft);
      if (problems.length) {
        this.draftError = `Revisa: ${problems.join(', ')}.`;
        return;
      }
      if (this.draftMode === 'new') {
        const fixed = correctedFields(draft).map((field) => FIELD_LABELS[field]);
        const categoryChanged =
          draft.suggestedCategory && draft.category !== draft.suggestedCategory;
        this.record.items.push(draft);
        this.persist(
          `Agregó el ítem ${this.record.items.length}`,
          [
            this.typeLabel(draft),
            fixed.length && `corrigió ${fixed.join(', ')} sugerido por OCR`,
            categoryChanged &&
              `clasificación ${draft.category} (sugerida: ${draft.suggestedCategory})`,
          ]
            .filter(Boolean)
            .join(' · ')
        );
      } else {
        const index = this.record.items.findIndex((item) => item.id === draft.id);
        const before = this.record.items[index];
        const changed = Object.keys(FIELD_LABELS).filter(
          (key) => String(before[key] ?? '') !== String(draft[key] ?? '')
        );
        if (this.draftMode === 'review') {
          draft.review = 'Conforme';
          draft.reviewNote = '';
        } else if (before.review === 'Observado') {
          draft.review = 'Corregido';
        }
        this.record.items.splice(index, 1, draft);
        this.persist(
          this.draftMode === 'review'
            ? `Corrección administrativa del ítem ${index + 1}`
            : `Corrigió el ítem ${index + 1}`,
          changed.length
            ? `Campos: ${changed.map((key) => FIELD_LABELS[key]).join(', ')}.`
            : 'Sin cambios de datos.'
        );
      }
      this.selectedId = draft.id;
      this.draft = null;
      this.draftMode = '';
      this.draftError = '';
      notify()?.success('Gasto guardado.');
    },
    removeItem(item) {
      if (!this.canEdit || this.record.status !== 'Borrador') return;
      const index = this.itemIndex(item);
      this.record.items = this.record.items.filter((entry) => entry.id !== item.id);
      this.selectedId = this.record.items[0]?.id || null;
      this.persist(`Retiró el ítem ${index}`, item.description);
    },
    markConforme(item) {
      if (!this.canReview) return;
      item.review = 'Conforme';
      item.reviewNote = '';
      this.persist(`Ítem ${this.itemIndex(item)} conforme`);
      const next = this.record.items.find((entry) => entry.review !== 'Conforme');
      if (next) this.selectItem(next.id);
    },
    toggleItemObserve() {
      this.itemObserveOpen = !this.itemObserveOpen;
      this.itemNote = '';
    },
    observeItem(item) {
      const note = this.itemNote.trim().slice(0, 240);
      if (!this.canReview || !note) {
        notify()?.warning('Escribe qué debe corregirse en este gasto.');
        return;
      }
      item.review = 'Observado';
      item.reviewNote = note;
      this.persist(`Observó el ítem ${this.itemIndex(item)}`, note);
      this.itemObserveOpen = false;
    },
    // ---- Viewer -------------------------------------------------------
    zoomBy(step) {
      this.zoom = Math.min(2, Math.max(0.75, Math.round((this.zoom + step) * 100) / 100));
    },
    toggleFull() {
      this.viewerFull = !this.viewerFull;
      if (!this.viewerFull) this.zoom = 1;
    },
  };
}
