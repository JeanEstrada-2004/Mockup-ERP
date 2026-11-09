import { Modal } from 'bootstrap';
import { activeVariant, isModuleEnabled } from '../config/variants.js';
import { moduleHref } from '../config/modules.js';
import { formatAmount } from '../data/commercial-data.js';
import { getDataForVariant } from '../data/mock-data.js';
import {
  movementNames,
  warehouseMovements,
  warehouseOpening,
  warehouseStock,
} from '../data/warehouse-data.js';
import { formatDate } from './project-views.js';
import { writeProjectId } from './shell.js';

const data = getDataForVariant(activeVariant);
const allowed = isModuleEnabled('warehouse');
const tabs = [
  ['inventario', 'Inventario'],
  ['movimientos', 'Movimientos'],
  ['entradas', 'Entradas'],
  ['salidas', 'Salidas'],
  ['devoluciones', 'Devoluciones'],
  ['kardex', 'Kardex'],
];
const tabTypes = { entradas: 'entry', salidas: 'issue', devoluciones: 'return' };

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}
function materialName(id) {
  return data.materials.find((item) => item.id === id)?.name || '—';
}
function projectName(id) {
  return data.projects.find((item) => item.id === id)?.name || '—';
}
function supplierName(id) {
  return data.suppliers.find((item) => item.id === id)?.name || '—';
}
function workerName(id) {
  return data.workers.find((item) => item.id === id)?.name || '—';
}
function stockClass(material) {
  return material.stock < material.minimum ? 'text-bg-warning' : 'text-bg-success';
}
function movementClass(type) {
  return { entry: 'text-bg-success', issue: 'text-bg-primary', return: 'text-bg-info' }[type];
}
function movementHref(movementId) {
  return moduleHref('warehouse', movementId);
}

export function warehouseWorkspace() {
  const params = new URLSearchParams(location.search);
  const movements = allowed ? warehouseMovements(data) : [];
  const record = movements.find((item) => item.id === params.get('record')) || null;
  return {
    allowed,
    materials: allowed ? data.materials : [],
    movements,
    projects: data.projects,
    tabs,
    movementNames,
    tab: tabs.some(([id]) => id === params.get('tab')) ? params.get('tab') : 'inventario',
    search: (params.get('search') || '').slice(0, 100),
    materialFilter: data.materials.some((item) => item.id === params.get('material'))
      ? params.get('material')
      : '',
    projectFilter: data.projects.some((item) => item.id === params.get('project'))
      ? params.get('project')
      : '',
    lowOnly: params.get('low') === '1',
    spotlight: record,
    selectedMovement: null,
    formatDate,
    formatAmount,
    materialName,
    projectName,
    supplierName,
    workerName,
    stockClass,
    movementClass,
    movementHref,
    materialHref: (id) => moduleHref('warehouse', id),
    purchaseHref: (id) => moduleHref('purchases', id),
    projectHref: (id) => moduleHref('projects', id),
    documentHref: (id) => moduleHref('documents', id),
    costHref: (id) => moduleHref('costs', `COST-${id}`),
    opening: warehouseOpening,
    init() {
      if (record) {
        this.materialFilter = record.materialId;
        this.tab = params.has('tab') ? this.tab : 'movimientos';
        writeProjectId(record.projectId);
      }
      if (this.tab === 'kardex' && !this.materialFilter)
        this.materialFilter = this.materials[0]?.id || '';
    },
    get lowCount() {
      return this.materials.filter((item) => item.stock < item.minimum).length;
    },
    get entryCount() {
      return this.movements.filter((item) => item.type === 'entry').length;
    },
    get issueCount() {
      return this.movements.filter((item) => item.type === 'issue').length;
    },
    get filteredMaterials() {
      const term = normalize(this.search.trim());
      return this.materials.filter(
        (item) =>
          (!term || normalize(`${item.id} ${item.name} ${item.category}`).includes(term)) &&
          (!this.materialFilter || item.id === this.materialFilter) &&
          (!this.lowOnly || item.stock < item.minimum)
      );
    },
    get visibleMovements() {
      const term = normalize(this.search.trim());
      return this.movements
        .filter(
          (item) =>
            (!tabTypes[this.tab] || item.type === tabTypes[this.tab]) &&
            (!term ||
              normalize(
                `${item.id} ${item.purchaseId} ${item.documentId} ${materialName(item.materialId)} ${projectName(item.projectId)}`
              ).includes(term)) &&
            (!this.materialFilter || item.materialId === this.materialFilter) &&
            (!this.projectFilter || item.projectId === this.projectFilter)
        )
        .sort((a, b) =>
          this.tab === 'kardex'
            ? a.date.localeCompare(b.date) || a.id.localeCompare(b.id)
            : b.date.localeCompare(a.date) || b.id.localeCompare(a.id)
        );
    },
    get selectedMaterial() {
      return this.materials.find((item) => item.id === this.materialFilter) || null;
    },
    setTab(id) {
      this.tab = id;
      this.spotlight = null;
      if (id === 'kardex' && !this.materialFilter)
        this.materialFilter = this.materials[0]?.id || '';
      this.updateUrl();
    },
    updateUrl() {
      const next = new URL(location.href);
      for (const key of ['tab', 'search', 'material', 'project', 'low', 'record'])
        next.searchParams.delete(key);
      if (this.tab !== 'inventario') next.searchParams.set('tab', this.tab);
      if (this.search.trim()) next.searchParams.set('search', this.search.trim());
      if (this.materialFilter) next.searchParams.set('material', this.materialFilter);
      if (this.projectFilter) next.searchParams.set('project', this.projectFilter);
      if (this.lowOnly) next.searchParams.set('low', '1');
      history.replaceState(null, '', next);
    },
    clearFilters() {
      this.search = '';
      this.materialFilter = this.tab === 'kardex' ? this.materials[0]?.id || '' : '';
      this.projectFilter = '';
      this.lowOnly = false;
      this.updateUrl();
    },
    openMovement(item) {
      this.selectedMovement = item;
      Modal.getOrCreateInstance(document.getElementById('warehouse-movement-modal')).show();
    },
  };
}

export function materialDetail() {
  const params = new URLSearchParams(location.search);
  const material = allowed ? data.materials.find((item) => item.id === params.get('id')) : null;
  const movements = material
    ? warehouseMovements(data).filter((item) => item.materialId === material.id)
    : [];
  return {
    allowed,
    material,
    movements,
    openingStock: material ? warehouseOpening(material.id) : 0,
    latestEntry: movements.filter((item) => item.type === 'entry').at(-1) || null,
    formatDate,
    formatAmount,
    projectName,
    supplierName,
    movementNames,
    movementClass,
    movementHref,
    purchaseHref: (id) => moduleHref('purchases', id),
    projectHref: (id) => moduleHref('projects', id),
    documentHref: (id) => moduleHref('documents', id),
    costHref: (id) => moduleHref('costs', `COST-${id}`),
    get lowStock() {
      return material && material.stock < material.minimum;
    },
    get calculatedStock() {
      return material ? warehouseStock(data, material.id) : 0;
    },
    init() {
      if (material)
        document.title = `${material.id} · Material · ${activeVariant.company.shortName}`;
    },
  };
}
