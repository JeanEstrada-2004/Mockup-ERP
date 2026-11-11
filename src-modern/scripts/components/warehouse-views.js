import { Modal } from 'bootstrap';
import { activeVariant, isModuleEnabled } from '../config/variants.js';
import { moduleHref } from '../config/modules.js';
import { formatAmount } from '../data/commercial-data.js';
import { getDataForVariant } from '../data/mock-data.js';
import {
  MOVEMENT_TYPES,
  WAREHOUSES,
  movementNames,
  warehouseMovements,
  warehouseOpening,
  warehouseStock,
} from '../data/warehouse-data.js';
import { formatDate } from './project-views.js';
import { writeProjectId } from './shell.js';
import { variantStorageKey } from '../config/variants.js';

const data = getDataForVariant(activeVariant);
const allowed = isModuleEnabled('warehouse');
const tabs = [
  ['inventario', 'Inventario'],
  ['movimientos', 'Movimientos'],
  ['entradas', 'Entradas'],
  ['salidas', 'Salidas'],
  ['devoluciones', 'Devoluciones'],
  ['kardex', 'Kardex'],
  ['almacenes', 'Almacenes'],
];
const demoMovementKey = variantStorageKey('demo-movements');

function loadDemoMovements() {
  try {
    const parsed = JSON.parse(localStorage.getItem(demoMovementKey) || '[]');
    return Array.isArray(parsed) ? parsed.filter((item) => item?.id && item?.materialId) : [];
  } catch {
    return [];
  }
}

function emptyMovement(type = 'entry') {
  return {
    type,
    date: new Date().toISOString().slice(0, 10),
    materialId: '',
    quantity: 1,
    unitCost: 0,
    supplierId: '',
    purchaseId: '',
    projectId: '',
    reason: '',
    condition: 'Buen estado',
    fromWarehouse: 'ALM-01',
    toWarehouse: 'ALM-02',
    document: '',
    responsibleId: '',
  };
}
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
    warehouses: WAREHOUSES,
    movementTypes: MOVEMENT_TYPES,
    suppliers: data.suppliers,
    workers: data.workers,
    demoMovements: allowed ? loadDemoMovements() : [],
    movementForm: emptyMovement(),
    movementError: '',
    get inventoryPurchases() {
      return data.operations.filter((item) => item.type === 'purchase' && item.inventoryLine);
    },
    warehouseName(id) {
      return WAREHOUSES.find((item) => item.id === id)?.name || '—';
    },
    warehouseMaterials(warehouse) {
      return this.materials.filter((item) => item.warehouse === warehouse.name);
    },
    movementTypeLabel(type) {
      return MOVEMENT_TYPES.find((item) => item.id === type)?.label || type;
    },
    openRegister(type = 'entry') {
      this.movementForm = emptyMovement(type);
      this.movementError = '';
      Modal.getOrCreateInstance(document.getElementById('warehouse-register-modal')).show();
    },
    saveMovement() {
      const element = document.getElementById('warehouse-register-form');
      if (!element?.reportValidity()) return;
      const form = this.movementForm;
      const material = this.materials.find((item) => item.id === form.materialId);
      if (['issue', 'transfer'].includes(form.type) && material && form.quantity > material.stock) {
        this.movementError = `La cantidad supera el stock disponible de ${material.name} (${material.stock} ${material.unit}).`;
        return;
      }
      const prefix = { entry: 'ENT', issue: 'SAL', return: 'DEV', transfer: 'TRF' }[form.type];
      const entry = {
        ...JSON.parse(JSON.stringify(form)),
        id: `${prefix}-DEMO-${String(this.demoMovements.length + 1).padStart(3, '0')}`,
        demo: true,
      };
      this.demoMovements = [...this.demoMovements, entry];
      try {
        localStorage.setItem(demoMovementKey, JSON.stringify(this.demoMovements));
      } catch {
        /* optional */
      }
      Modal.getOrCreateInstance(document.getElementById('warehouse-register-modal')).hide();
      window.AdminApp?.notificationManager?.success(
        `${this.movementTypeLabel(form.type)} ${entry.id} registrada (demostración: no cambia stock ni costos).`
      );
    },
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
