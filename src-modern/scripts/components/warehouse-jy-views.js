import { activeVariant } from '../config/variants.js';
import { moduleHref } from '../config/modules.js';
import { formatAmount } from '../data/commercial-data.js';
import { getDataForVariant } from '../data/mock-data.js';
import { movementNames, warehouseMovements, warehouseStock } from '../data/warehouse-data.js';
import { formatDate } from './project-views.js';

export function warehouseJyWorkspace() {
  const data = getDataForVariant(activeVariant);
  const params = new URLSearchParams(location.search);
  const movements = warehouseMovements(data);
  const tabs = ['inventario', 'movimientos', 'kardex'];
  return {
    warehouse: data.warehouses[0],
    warehouseCount: data.warehouses.length,
    materials: data.materials,
    movements,
    movementNames,
    formatAmount,
    formatDate,
    tab: tabs.includes(params.get('tab')) ? params.get('tab') : 'inventario',
    query: '',
    selected: movements.find((item) => item.id === params.get('record')) || null,
    stock: (id) => warehouseStock(data, id),
    opening: (id) => data.materials.find((item) => item.id === id)?.openingStock ?? 0,
    materialName: (id) => data.materials.find((item) => item.id === id)?.name || id,
    projectName: (id) => data.projects.find((item) => item.id === id)?.name || '—',
    workerName: (id) =>
      data.workers.find((item) => item.id === id)?.name || 'Responsable por validar',
    href: moduleHref,
    get filteredMaterials() {
      const query = this.query.trim().toLocaleLowerCase('es');
      return this.materials.filter((item) =>
        `${item.id} ${item.name} ${item.category}`.toLocaleLowerCase('es').includes(query)
      );
    },
    get filteredMovements() {
      const query = this.query.trim().toLocaleLowerCase('es');
      return this.movements.filter((item) =>
        `${item.id} ${item.materialId} ${this.materialName(item.materialId)} ${item.reason}`
          .toLocaleLowerCase('es')
          .includes(query)
      );
    },
    setTab(tab) {
      this.tab = tab;
      this.query = '';
      const url = new URL(location.href);
      url.searchParams.set('tab', tab);
      history.replaceState(null, '', url);
    },
    select(item) {
      this.selected = item;
      this.tab = 'movimientos';
      const url = new URL(location.href);
      url.searchParams.set('tab', 'movimientos');
      url.searchParams.set('record', item.id);
      history.replaceState(null, '', url);
    },
    init() {
      if (this.selected) this.tab = 'movimientos';
    },
  };
}
