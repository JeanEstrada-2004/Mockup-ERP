import { statusClass } from '../utils/status.js';
import { activeVariant } from '../config/variants.js';
import { moduleHref } from '../config/modules.js';
import { getDataForVariant, getProject } from '../data/mock-data.js';
import { commercialBreakdown, formatAmount } from '../data/commercial-data.js';
import {
  approvedExpenseCosts,
  demoCostId,
  expenseEvent,
  expenseExamples,
  expenseTotals,
  loadExpenseDemos,
  nextExpenseId,
  saveExpenseDemo,
} from '../data/expense-demo.js';
import { formatDate } from './project-views.js';
import { writeProjectId } from './shell.js';
import { tableControls } from '../utils/data-table.js';

const data = getDataForVariant(activeVariant);
const sourceExpenses = data.operations.filter((item) => item.type === 'expense');
const statuses = ['Borrador', 'En revisión', 'Observada', 'Aprobada'];
const normalize = (value) =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

function sourceRecord(operation) {
  const amounts = commercialBreakdown(operation.amount, 'purchase');
  const isPending = operation.status === 'En revisión';
  const value = isPending ? 800 : amounts.subtotal;
  const igv = isPending ? 144 : amounts.tax;
  const nonTaxed = isPending ? 206 : 0;
  const undocumentedAmount = isPending ? 100 : 0;
  const evidence = {
    id: 'base-example',
    label: 'Comprobante ilustrativo',
    number: `EJ-${operation.id}`,
    vendor: 'Proveedor de ejemplo',
    ruc: '20100000001',
    date: operation.date,
    description: 'Detalle ilustrativo de la rendición mock',
    value,
    igv,
    nonTaxed,
  };
  return {
    id: operation.id,
    projectId: operation.projectId,
    workerId: operation.workerId,
    status: operation.status,
    base: true,
    items: [{ ...evidence, evidence }],
    undocumentedAmount,
    undocumentedNote: isPending ? 'Movilidad de ejemplo sin comprobante' : '',
    history: [
      {
        label: `Estado mock: ${operation.status}`,
        note: 'El detalle de comprobante es ilustrativo; el total coincide con los datos compartidos.',
        at: `${operation.date}T12:00:00`,
        simulated: true,
      },
    ],
  };
}

function allExpenses() {
  return [
    ...sourceExpenses.map((item) => ({ ...item, base: true })),
    ...loadExpenseDemos().map((item) => ({
      id: item.id,
      projectId: item.projectId,
      workerId: null,
      status: item.status,
      amount: expenseTotals(item).total,
      date: item.history[0]?.at.slice(0, 10) || '',
      base: false,
    })),
  ];
}

function workerName(workerId) {
  return data.workers.find((item) => item.id === workerId)?.name || 'Usuario de demostración';
}

function projectName(projectId) {
  return getProject(data, projectId)?.name || '—';
}

function toast(message) {
  window.AdminApp?.notificationManager?.info(message);
}

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Setiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];
function periodLabel(period) {
  const [year, month] = period.split('-').map(Number);
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

export function expensesList() {
  return {
    // Chips only; this list keeps its own ordering (most recent first).
    ...tableControls({
      chipDefs: [
        { key: 'search', label: 'Búsqueda' },
        { key: 'projectFilter', label: 'Proyecto' },
        { key: 'responsibleFilter', label: 'Responsable', format: (id) => workerName(id) },
        { key: 'statusFilter', label: 'Estado' },
        { key: 'periodFilter', label: 'Periodo', format: periodLabel },
      ],
    }),
    records: [],
    projects: data.projects,
    search: '',
    projectFilter: '',
    responsibleFilter: '',
    statusFilter: '',
    periodFilter: '',
    periodLabel,
    formatAmount,
    formatDate,
    projectName,
    workerName,
    statusClass,
    init() {
      this.records = allExpenses();
      const params = new URLSearchParams(location.search);
      this.search = params.get('search') || '';
      this.projectFilter = data.projects.some((item) => item.id === params.get('project'))
        ? params.get('project')
        : '';
      this.statusFilter = statuses.includes(params.get('status')) ? params.get('status') : '';
      this.responsibleFilter = this.responsibles.some(
        (item) => item.id === params.get('responsible')
      )
        ? params.get('responsible')
        : '';
      this.periodFilter = this.periods.includes(params.get('period')) ? params.get('period') : '';
    },
    get responsibles() {
      const ids = [...new Set(this.records.map((item) => item.workerId).filter(Boolean))];
      return ids.map((id) => ({ id, name: workerName(id) }));
    },
    get periods() {
      return [...new Set(this.records.map((item) => item.date?.slice(0, 7)).filter(Boolean))]
        .sort()
        .reverse();
    },
    // "Mis Rendiciones" (móvil): drafts and observed ones first, then the rest.
    get myRecords() {
      const weight = { Borrador: 0, Observada: 1, 'En revisión': 2, Aprobada: 3 };
      return [...this.records]
        .sort(
          (a, b) =>
            (weight[a.status] ?? 4) - (weight[b.status] ?? 4) || b.date.localeCompare(a.date)
        )
        .slice(0, 5);
    },
    onFiltersChange() {
      this.updateUrl();
    },
    get filtered() {
      const term = normalize(this.search.trim());
      return this.records
        .filter((item) => {
          const text = `${item.id} ${item.projectId} ${projectName(item.projectId)} ${workerName(item.workerId)}`;
          return (
            (!term || normalize(text).includes(term)) &&
            (!this.projectFilter || item.projectId === this.projectFilter) &&
            (!this.responsibleFilter || item.workerId === this.responsibleFilter) &&
            (!this.periodFilter || item.date?.startsWith(this.periodFilter)) &&
            (!this.statusFilter || item.status === this.statusFilter)
          );
        })
        .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
    },
    detailHref(item) {
      const params = new URLSearchParams({ id: item.id });
      if (this.search.trim()) params.set('search', this.search.trim());
      if (this.projectFilter) params.set('project', this.projectFilter);
      if (this.statusFilter) params.set('status', this.statusFilter);
      return `./expense.html?${params}`;
    },
    updateUrl() {
      const params = new URLSearchParams();
      if (this.search.trim()) params.set('search', this.search.trim());
      if (this.projectFilter) params.set('project', this.projectFilter);
      if (this.statusFilter) params.set('status', this.statusFilter);
      if (this.responsibleFilter) params.set('responsible', this.responsibleFilter);
      if (this.periodFilter) params.set('period', this.periodFilter);
      history.replaceState(null, '', `./expenses.html${params.size ? `?${params}` : ''}`);
    },
    clearFilters() {
      this.search = '';
      this.projectFilter = '';
      this.responsibleFilter = '';
      this.periodFilter = '';
      this.statusFilter = '';
      this.updateUrl();
    },
  };
}

export function expenseDetail() {
  const params = new URLSearchParams(location.search);
  const source = sourceExpenses.find((item) => item.id === params.get('id'));
  const demo = loadExpenseDemos().find((item) => item.id === params.get('id'));
  const record = source ? sourceRecord(source) : demo || null;
  const isNew = params.get('new') === '1' && !record;
  const backParams = new URLSearchParams();
  if (params.get('search')) backParams.set('search', params.get('search').slice(0, 120));
  if (data.projects.some((item) => item.id === params.get('project')))
    backParams.set('project', params.get('project'));
  if (statuses.includes(params.get('status'))) backParams.set('status', params.get('status'));
  return {
    record,
    isNew,
    projects: data.projects,
    examples: expenseExamples(data),
    projectChoice: data.projects.some((item) => item.id === params.get('project'))
      ? params.get('project')
      : '',
    step: isNew
      ? 1
      : !record
        ? 0
        : record.status === 'Borrador'
          ? record.items.length
            ? 3
            : 2
          : 4,
    activeItemId: null,
    observationOpen: false,
    observationNote: '',
    error: '',
    backHref: `./expenses.html${backParams.size ? `?${backParams}` : ''}`,
    formatAmount,
    formatDate,
    statusClass,
    workerName,
    projectName,
    get project() {
      return getProject(data, this.record?.projectId);
    },
    get totals() {
      return expenseTotals(this.record);
    },
    get activeItem() {
      return this.record?.items.find((item) => item.id === this.activeItemId) || null;
    },
    get isEditable() {
      return (
        this.record && !this.record.base && ['Borrador', 'Observada'].includes(this.record.status)
      );
    },
    get costHref() {
      return this.record?.status === 'Aprobada' && !this.record.base
        ? moduleHref('costs', demoCostId(this.record.id))
        : this.record?.base && source?.costSource
          ? moduleHref('costs', `COST-${this.record.id}`)
          : null;
    },
    get projectHref() {
      return this.project ? moduleHref('projects', this.project.id) : null;
    },
    get hasDemoCost() {
      return (
        this.record &&
        approvedExpenseCosts(this.record.projectId).some(
          (item) => item.expenseId === this.record.id
        )
      );
    },
    init() {
      if (this.record) {
        this.activeItemId = this.record.items[0]?.id || null;
        writeProjectId(this.record.projectId);
      }
      document.title = `${this.record?.id || 'Nueva rendición'} · ${activeVariant.company.shortName}`;
    },
    selectProject() {
      if (!getProject(data, this.projectChoice)) return;
      this.record = {
        id: nextExpenseId(),
        projectId: this.projectChoice,
        status: 'Borrador',
        base: false,
        items: [],
        undocumentedAmount: 0,
        undocumentedNote: '',
        history: [expenseEvent('Borrador creado', 'Proyecto seleccionado en esta demostración.')],
      };
      if (!saveExpenseDemo(this.record)) {
        this.error = 'No se pudo guardar el borrador en este navegador.';
        this.record = null;
        return;
      }
      writeProjectId(this.projectChoice);
      history.replaceState(null, '', `./expense.html?id=${encodeURIComponent(this.record.id)}`);
      this.isNew = false;
      this.step = 2;
      document.title = `${this.record.id} · ${activeVariant.company.shortName}`;
    },
    captureSources: [
      { id: 'photo', label: 'Tomar foto', icon: 'bi-camera' },
      { id: 'image', label: 'Subir imagen', icon: 'bi-image' },
      { id: 'pdf', label: 'Adjuntar PDF', icon: 'bi-file-earmark-pdf' },
    ],
    capture(sourceId) {
      if (!this.isEditable) return;
      const used = new Set(this.record.items.map((item) => item.number));
      const example = this.examples.find((item) => !used.has(item.number)) || this.examples[0];
      if (!example) return;
      this.addExample(example.id);
      const source = this.captureSources.find((item) => item.id === sourceId);
      toast(
        `${source?.label || 'Comprobante'}: se usó el comprobante de ejemplo ${example.number}. Revisa los datos propuestos por OCR.`
      );
    },
    addExample(exampleId) {
      if (!this.isEditable) return;
      const example = this.examples.find((item) => item.id === exampleId);
      if (!example) return;
      const item = {
        ...example,
        id: `ITEM-${Date.now()}-${this.record.items.length + 1}`,
        evidence: { ...example },
      };
      this.record.items.push(item);
      this.activeItemId = item.id;
      this.record.history.push(expenseEvent('Comprobante de ejemplo agregado', example.label));
      this.persist();
      this.error = '';
      toast('Comprobante de ejemplo añadido. La propuesta OCR es simulada y editable.');
    },
    removeItem(itemId) {
      if (!this.isEditable) return;
      this.record.items = this.record.items.filter((item) => item.id !== itemId);
      if (this.activeItemId === itemId) this.activeItemId = this.record.items[0]?.id || null;
      this.record.history.push(expenseEvent('Comprobante retirado', 'Cambio local del borrador.'));
      this.persist();
    },
    persist() {
      if (this.record && !this.record.base) saveExpenseDemo(this.record);
    },
    review() {
      if (!this.record.items.length) {
        this.error = 'Agrega al menos un comprobante de ejemplo para continuar.';
        return;
      }
      this.error = '';
      this.persist();
      this.step = 3;
    },
    validate() {
      if (!this.record?.items.length) return false;
      const numbers = this.record.items.flatMap((item) => [item.value, item.igv, item.nonTaxed]);
      numbers.push(this.record.undocumentedAmount);
      return (
        numbers.every((value) => Number.isFinite(Number(value)) && Number(value) >= 0) &&
        this.totals.total > 0
      );
    },
    send() {
      if (!this.isEditable || !this.validate()) {
        this.error =
          'Revisa los importes: deben ser números no negativos y el total mayor que cero.';
        return;
      }
      this.error = '';
      const wasObserved = this.record.status === 'Observada';
      this.record.status = 'En revisión';
      this.record.history.push(
        expenseEvent(
          wasObserved ? 'Corrección enviada' : 'Enviada a revisión',
          wasObserved
            ? 'Datos corregidos y reenviados en la demostración.'
            : 'Datos revisados y enviados en la demostración.'
        )
      );
      this.persist();
      this.step = 4;
      toast(
        wasObserved
          ? 'Corrección enviada para revisión simulada.'
          : 'Rendición enviada a revisión simulada.'
      );
    },
    observe() {
      if (this.record?.status !== 'En revisión' || this.record.base) return;
      const note = this.observationNote.trim().slice(0, 240);
      if (!note) {
        this.error = 'Escribe el motivo de la observación.';
        return;
      }
      this.record.status = 'Observada';
      this.record.history.push(expenseEvent('Observada', note));
      this.persist();
      this.observationOpen = false;
      this.observationNote = '';
      this.error = '';
      toast('Observación registrada en esta demostración.');
    },
    correct() {
      if (this.record?.status !== 'Observada' || this.record.base) return;
      this.step = 3;
      this.activeItemId = this.record.items[0]?.id || null;
    },
    approve() {
      if (this.record?.status !== 'En revisión' || this.record.base) return;
      this.record.status = 'Aprobada';
      this.record.history.push(
        expenseEvent('Aprobada', 'Aprobación visual; el costo compartido no cambia.')
      );
      this.persist();
      this.error = '';
      toast('Aprobación simulada. La relación demostrativa con Costos está disponible.');
    },
  };
}
