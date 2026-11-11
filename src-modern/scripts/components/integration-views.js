import { activeVariant, isModuleEnabled } from '../config/variants.js';
import { BIOMETRIC_DEVICE } from '../data/personnel-data.js';
import { BACKUP } from '../data/security-data.js';

// Credible simulated states (punto 90, decision 3). Biometría and Backup reuse
// the same records shown in Personal and Seguridad so the screens agree.
const lastSync = (iso) =>
  `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)} ${iso.slice(11, 16)}`;
const STATES = {
  biometria: {
    status: BIOMETRIC_DEVICE.status,
    tone: 'success',
    last: lastSync(BIOMETRIC_DEVICE.lastSync),
    records: BIOMETRIC_DEVICE.records,
    result: 'Con observaciones',
  },
  contabilidad: {
    status: 'Sincronización pendiente',
    tone: 'warning',
    last: '08/11/2026 17:00',
    records: 27,
    result: 'Correcto',
  },
  correo: {
    status: 'Activo',
    tone: 'success',
    last: '08/11/2026 17:42',
    records: 64,
    result: 'Correcto',
  },
  almacenamiento: {
    status: 'Activo',
    tone: 'success',
    last: '08/11/2026 16:30',
    records: 112,
    result: 'Correcto',
  },
  backup: {
    status: BACKUP.status,
    tone: 'success',
    last: lastSync(BACKUP.last),
    records: 1,
    result: 'Correcto',
  },
};

const catalog = [
  {
    id: 'biometria',
    name: 'Biometría',
    icon: 'bi-fingerprint',
    category: 'Operaciones',
    scope: 'Marcaciones de asistencia asociadas a trabajador y proyecto.',
    device: BIOMETRIC_DEVICE.name,
    input: 'Marcaciones del equipo ZKTeco',
    output: 'Asistencia, tareo e incidencias',
    next: './personnel.html?tab=incidencias',
  },
  {
    id: 'contabilidad',
    name: 'Software contable',
    icon: 'bi-calculator',
    category: 'Finanzas',
    scope: 'Resumen de operaciones aprobadas para una eventual conciliación.',
    input: 'Compras, rendiciones y costos aprobados',
    output: 'Asientos para conciliación contable',
    next: './costs.html',
  },
  {
    id: 'correo',
    name: 'Correo',
    icon: 'bi-envelope',
    category: 'Comunicación',
    scope: 'Avisos de aprobación, observación y vencimiento.',
    input: 'Eventos de aprobación y vencimiento',
    output: 'Notificaciones a responsables',
    next: './documents.html',
  },
  {
    id: 'almacenamiento',
    name: 'Almacenamiento',
    icon: 'bi-folder2-open',
    category: 'Documentos',
    scope: 'Resguardo de los archivos asociados a cada ficha documental.',
    input: 'Documentos cargados y generados',
    output: 'Archivo versionado por proyecto',
    next: './documents.html',
  },
  {
    id: 'backup',
    name: 'Backup',
    icon: 'bi-hdd',
    category: 'Sistema',
    scope: 'Copia diaria del sistema y verificación de restauración.',
    input: 'Base de datos y archivos',
    output: 'Copia automática 02:00',
    next: './security.html?tab=backups',
  },
];

export function integrationsWorkspace() {
  const params = new URLSearchParams(location.search);
  const allowed = isModuleEnabled('integrations');
  return {
    allowed,
    catalog: allowed ? catalog.map((item) => ({ ...item, ...STATES[item.id] })) : [],
    get history() {
      return this.catalog.map((item) => ({
        id: item.id,
        name: item.name,
        last: item.last,
        records: item.records,
        result: item.result,
      }));
    },
    categoryFilter: ['Operaciones', 'Finanzas', 'Comunicación', 'Documentos', 'Sistema'].includes(
      params.get('category')
    )
      ? params.get('category')
      : '',
    selectedId: catalog.some((item) => item.id === params.get('id'))
      ? params.get('id')
      : catalog[0].id,
    get filtered() {
      return this.catalog.filter(
        (item) => !this.categoryFilter || item.category === this.categoryFilter
      );
    },
    get selected() {
      return this.filtered.find((item) => item.id === this.selectedId) || this.filtered[0] || null;
    },
    select(id) {
      this.selectedId = id;
      this.updateUrl();
    },
    updateUrl() {
      const query = new URLSearchParams();
      if (this.categoryFilter) query.set('category', this.categoryFilter);
      if (this.selectedId !== catalog[0].id) query.set('id', this.selectedId);
      history.replaceState(null, '', `./integrations.html${query.size ? `?${query}` : ''}`);
    },
    clearFilter() {
      this.categoryFilter = '';
      this.updateUrl();
    },
    init() {
      if (allowed) document.title = `Integraciones · ${activeVariant.company.shortName}`;
    },
  };
}
