import { Modal } from 'bootstrap';
import {
  activeVariant,
  isModuleEnabled,
  variantRule,
  variantStorageKey,
} from '../config/variants.js';
import { moduleHref } from '../config/modules.js';
import { getDataForVariant, getDocument, getDocuments, getProject } from '../data/mock-data.js';
import { formatDate } from './project-views.js';
import { formatAmount } from '../data/commercial-data.js';
import {
  EVIDENCE_TYPES,
  evidenceLayout,
  reportNumber,
  reportTotals,
} from '../data/expense-reports.js';
import { writeProjectId } from './shell.js';

const data = getDataForVariant(activeVariant);
const versionKey = variantStorageKey('document-versions');
const moduleNames = {
  budgets: 'Presupuestos',
  purchases: 'Compras',
  expenses: 'Rendiciones',
  personnel: 'Personal',
  warehouse: 'Almacén',
  costs: 'Costos',
};
// Project folder structure (punto 76). Each folder lists the documents of
// the modules that produce it; the rest are empty folders of the structure.
const FOLDERS = [
  { id: 'contratos', label: 'Contratos', modules: [] },
  { id: 'presupuestos', label: 'Presupuestos', modules: ['budgets'] },
  { id: 'compras', label: 'Compras', modules: ['purchases', 'warehouse'] },
  { id: 'rendiciones', label: 'Rendiciones', modules: ['expenses'] },
  { id: 'personal', label: 'Personal', modules: ['personnel'] },
  { id: 'planos', label: 'Planos', modules: [] },
  { id: 'informes', label: 'Informes', modules: ['costs'] },
  { id: 'entregables', label: 'Entregables', modules: [] },
];

// Documents the system generates on its own (punto 80).
const GENERATED = [
  { type: 'Presupuesto', label: 'Cotización PDF', module: 'budgets' },
  { type: 'Orden de compra', label: 'Orden de compra', module: 'purchases' },
  { type: 'Rendición', label: 'Resumen de rendición', module: 'expenses' },
  { type: 'Tareo', label: 'Reporte de tareo', module: 'personnel' },
  { type: 'Ajuste de costo', label: 'Reporte de costos', module: 'costs' },
];

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}
function workerName(id) {
  return data.workers.find((item) => item.id === id)?.name || '—';
}
function projectName(id) {
  return getProject(data, id)?.name || '—';
}
function loadVersions(document) {
  try {
    const parsed = JSON.parse(localStorage.getItem(versionKey) || '{}');
    const items = parsed?.[document.id];
    return Array.isArray(items)
      ? items.filter(
          (item) =>
            Number.isSafeInteger(item.version) &&
            item.version > document.version &&
            typeof item.comment === 'string' &&
            item.comment.length <= 200
        )
      : [];
  } catch {
    return [];
  }
}
function saveVersion(document, record) {
  try {
    const parsed = JSON.parse(localStorage.getItem(versionKey) || '{}');
    const state = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    state[document.id] = [...loadVersions(document), record];
    localStorage.setItem(versionKey, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
const round = (value) => Math.round((Number(value) || 0) * 100) / 100;

// R3 (J&Y Demo, variant.rules.documentViewer): what the document looks like.
// Evidence of a rendición shows the receipt itself; documents the platform
// generates (rendición, orden de compra, others) show an illustrated sheet.
function documentVisual(doc) {
  if (!doc) return null;
  const project = getProject(data, doc.projectId);
  const projectLabel = `${doc.projectId} · ${project?.name || ''}`;
  const report = data.expenseReports?.find((item) => item.id === doc.operationId);
  if (doc.evidenceItemId && report) {
    const item = report.items.find((entry) => entry.id === doc.evidenceItemId);
    if (item) return { ...item, ...(item.evidence || {}) };
  }
  if (report) {
    return {
      layout: 'report',
      viewerLabel: 'Rendición de gastos',
      number: reportNumber(report),
      workerName: workerName(report.workerId),
      preparedName: workerName(report.preparedBy),
      projectLabel,
      date: report.date,
      totals: reportTotals(report),
      lines: report.items.map((item, index) => ({
        index: index + 1,
        doc: item.series
          ? `${EVIDENCE_TYPES[item.docType].short} ${item.series}-${item.number} · ${item.vendor}`
          : `${EVIDENCE_TYPES[item.docType].short}${item.payee ? ` · ${item.payee}` : ''}`,
        description: item.description,
        total: item.total,
      })),
    };
  }
  const operation = data.operations.find((item) => item.id === doc.operationId);
  if (operation?.type === 'purchase') {
    const supplier = data.suppliers.find((item) => item.id === operation.supplierId);
    const vv = round(operation.amount / 1.18);
    return {
      layout: 'order',
      viewerLabel: 'Orden de compra',
      orderId: operation.id,
      supplierName: supplier?.name || '—',
      supplierRuc: supplier?.ruc || '—',
      projectLabel,
      date: operation.date,
      description: operation.description || 'Suministro o servicio',
      vv,
      igv: round(operation.amount - vv),
      total: operation.amount,
      status: operation.status,
    };
  }
  const budget = data.budgets.find((item) => item.id === doc.operationId);
  return {
    layout: 'sheet',
    viewerLabel: doc.type,
    title: doc.type.toUpperCase(),
    code: budget ? `${budget.id}-V${budget.version}` : doc.operationId,
    subtitle: project?.name || '',
    lines: [
      { label: 'Proyecto', value: projectLabel },
      { label: 'Operación', value: operation?.label || doc.operationId },
      { label: 'Responsable', value: workerName(doc.responsibleId) },
      { label: 'Fecha', value: formatDate(doc.date) },
      ...(operation || budget
        ? [{ label: 'Importe', value: formatAmount((operation || budget).amount) }]
        : []),
      { label: 'Situación', value: operation?.status || budget?.status || doc.status },
    ],
  };
}

function listParams(params) {
  const next = new URLSearchParams();
  for (const key of ['search', 'project', 'module', 'type']) {
    const value = params.get(key);
    if (value) next.set(key, value);
  }
  return next;
}

export function documentsWorkspace() {
  const params = new URLSearchParams(location.search);
  return {
    documents: getDocuments(data),
    projects: data.projects,
    modules: Object.entries(moduleNames).filter(([id]) =>
      getDocuments(data).some((doc) => doc.module === id)
    ),
    types: [...new Set(getDocuments(data).map((item) => item.type))],
    search: (params.get('search') || '').slice(0, 120),
    projectFilter: data.projects.some((item) => item.id === params.get('project'))
      ? params.get('project')
      : '',
    moduleFilter: moduleNames[params.get('module')] ? params.get('module') : '',
    typeFilter: (params.get('type') || '').slice(0, 80),
    responsibleFilter: data.workers.some((item) => item.id === params.get('responsible'))
      ? params.get('responsible')
      : '',
    folderFilter: FOLDERS.some((item) => item.id === params.get('folder'))
      ? params.get('folder')
      : '',
    get responsibles() {
      const ids = [...new Set(this.documents.map((item) => item.responsibleId).filter(Boolean))];
      return ids.map((id) => ({ id, name: workerName(id) }));
    },
    get folders() {
      const scoped = this.documents.filter(
        (item) => !this.projectFilter || item.projectId === this.projectFilter
      );
      return FOLDERS.map((folder) => ({
        ...folder,
        count: scoped.filter((item) => folder.modules.includes(item.module)).length,
      }));
    },
    get generated() {
      return GENERATED.filter((item) => isModuleEnabled(item.module)).map((item) => ({
        ...item,
        count: this.documents.filter((doc) => doc.module === item.module).length,
      }));
    },
    selectFolder(id) {
      this.folderFilter = this.folderFilter === id ? '' : id;
      this.updateUrl();
    },
    formatDate,
    workerName,
    projectName,
    moduleName: (id) => moduleNames[id] || id,
    projectHref: (id) => moduleHref('projects', id),
    get filtered() {
      const term = normalize(this.search.trim());
      return this.documents
        .filter(
          (item) =>
            (!term ||
              normalize(
                `${item.id} ${item.fileName} ${item.operationId} ${projectName(item.projectId)} ${workerName(item.responsibleId)}`
              ).includes(term)) &&
            (!this.projectFilter || item.projectId === this.projectFilter) &&
            (!this.moduleFilter || item.module === this.moduleFilter) &&
            (!this.responsibleFilter || item.responsibleId === this.responsibleFilter) &&
            (!this.folderFilter ||
              FOLDERS.find((folder) => folder.id === this.folderFilter)?.modules.includes(
                item.module
              )) &&
            (!this.typeFilter || item.type === this.typeFilter)
        )
        .sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
    },
    detailHref(item) {
      const query = listParams(
        new URLSearchParams({
          search: this.search.trim(),
          project: this.projectFilter,
          module: this.moduleFilter,
          type: this.typeFilter,
          responsible: this.responsibleFilter,
          folder: this.folderFilter,
        })
      );
      query.set('id', item.id);
      return `./document.html?${query}`;
    },
    updateUrl() {
      const query = listParams(
        new URLSearchParams({
          search: this.search.trim(),
          project: this.projectFilter,
          module: this.moduleFilter,
          type: this.typeFilter,
        })
      );
      history.replaceState(null, '', `./documents.html${query.size ? `?${query}` : ''}`);
    },
    clearFilters() {
      this.search = '';
      this.projectFilter = '';
      this.moduleFilter = '';
      this.typeFilter = '';
      this.responsibleFilter = '';
      this.folderFilter = '';
      this.updateUrl();
    },
  };
}

export function documentDetail() {
  const params = new URLSearchParams(location.search);
  const document = getDocument(data, params.get('id'));
  const project = document ? getProject(data, document.projectId) : null;
  const costOrigin =
    params.get('from') === 'costs' &&
    data.operations.some(
      (item) =>
        item.id === params.get('operation') &&
        item.projectId === params.get('project') &&
        item.costSource === params.get('source')
    );
  const backQuery = listParams(params);
  const backHref = costOrigin
    ? `./costs.html?${new URLSearchParams({ project: params.get('project'), source: params.get('source'), operation: params.get('operation') })}`
    : `./documents.html${backQuery.size ? `?${backQuery}` : ''}`;
  return {
    document,
    project,
    backHref,
    backLabel: costOrigin ? 'Volver a Costos' : 'Volver a Documentos',
    // ---- Visual preview (R3) ----
    hasViewer: variantRule('documentViewer') && Boolean(document),
    ev: variantRule('documentViewer') ? documentVisual(document) : null,
    zoom: 1,
    viewerFull: false,
    formatAmount,
    companyName: activeVariant.company.name,
    layout(item) {
      return item?.layout || evidenceLayout(item);
    },
    typeLabel(item) {
      return item?.viewerLabel || EVIDENCE_TYPES[item?.docType]?.label || document?.type || '';
    },
    zoomBy(step) {
      this.zoom = Math.min(2, Math.max(0.75, Math.round((this.zoom + step) * 100) / 100));
    },
    toggleFull() {
      this.viewerFull = !this.viewerFull;
      if (!this.viewerFull) this.zoom = 1;
    },
    extras: [],
    versionComment: '',
    error: '',
    formatDate,
    workerName,
    moduleName: (id) => moduleNames[id] || id,
    get versions() {
      if (!document) return [];
      const base = Array.from({ length: document.version }, (_, index) => ({
        version: index + 1,
        date: document.date,
        responsibleId: document.responsibleId,
        comment:
          index + 1 === document.version
            ? 'Versión de referencia del conjunto mock.'
            : 'Versión histórica referencial.',
        simulated: true,
      }));
      return [...base, ...this.extras].sort((a, b) => b.version - a.version);
    },
    get latestVersion() {
      return this.versions[0]?.version || 0;
    },
    get originHref() {
      if (!document) return null;
      if (document.module === 'costs') return moduleHref('costs', `COST-${document.operationId}`);
      if (document.evidenceItemId)
        return `${moduleHref('expenses', document.operationId)}&item=${encodeURIComponent(document.evidenceItemId)}`;
      return moduleHref(document.module, document.operationId);
    },
    get projectHref() {
      return project ? moduleHref('projects', project.id) : null;
    },
    init() {
      if (!document) return;
      window.document.title = `${this.document.id} · Documento · ${activeVariant.company.shortName}`;
      writeProjectId(this.document.projectId);
      this.extras = loadVersions(this.document);
    },
    download() {
      window.AdminApp?.notificationManager?.info(
        `Descarga simulada de ${document.fileName}: en el sistema real se descargaría el archivo vigente.`
      );
    },
    openPreview() {
      Modal.getOrCreateInstance(window.document.getElementById('document-preview-modal')).show();
    },
    openVersion() {
      this.versionComment = '';
      this.error = '';
      Modal.getOrCreateInstance(window.document.getElementById('document-version-modal')).show();
    },
    addVersion() {
      const comment = this.versionComment.trim().slice(0, 200);
      if (!comment) {
        this.error = 'Escribe un comentario para la versión de demostración.';
        return;
      }
      const record = {
        version: this.latestVersion + 1,
        date: this.document.date,
        responsibleId: this.document.responsibleId,
        comment,
        simulated: true,
      };
      if (!saveVersion(this.document, record)) {
        this.error = 'No se pudo guardar esta versión local.';
        return;
      }
      this.extras = loadVersions(this.document);
      Modal.getOrCreateInstance(window.document.getElementById('document-version-modal')).hide();
      window.AdminApp?.notificationManager?.info(
        `V${record.version} añadida como metadato de demostración; no se creó un archivo.`
      );
    },
  };
}
