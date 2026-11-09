import { activeVariant, isModuleEnabled } from '../config/variants.js';

const catalog = [
  {
    id: 'biometria',
    name: 'Biometría',
    icon: 'bi-fingerprint',
    category: 'Operaciones',
    scope: 'Marcaciones de asistencia asociadas a trabajador y proyecto.',
    input: 'Identificador de trabajador y hora de ejemplo',
    output: 'Asistencia e incidencia de demostración',
    next: './personnel.html?tab=incidencias',
  },
  {
    id: 'contabilidad',
    name: 'Software contable',
    icon: 'bi-calculator',
    category: 'Finanzas',
    scope: 'Resumen de operaciones aprobadas para una eventual conciliación.',
    input: 'Compras, rendiciones y costos aprobados',
    output: 'Asiento propuesto para revisión, sin envío',
    next: './costs.html',
  },
  {
    id: 'correo',
    name: 'Correo',
    icon: 'bi-envelope',
    category: 'Comunicación',
    scope: 'Avisos de aprobación, observación y vencimiento.',
    input: 'Evento y destinatario de ejemplo',
    output: 'Notificación propuesta, sin mensaje enviado',
    next: './documents.html',
  },
  {
    id: 'almacenamiento',
    name: 'Almacenamiento',
    icon: 'bi-folder2-open',
    category: 'Documentos',
    scope: 'Resguardo futuro de archivos asociados a sus metadatos.',
    input: 'Referencia documental ficticia',
    output: 'Ficha documental sin archivo cargado',
    next: './documents.html',
  },
  {
    id: 'backup',
    name: 'Respaldo',
    icon: 'bi-hdd',
    category: 'Sistema',
    scope: 'Copia prevista del sistema y verificación de restauración.',
    input: 'Configuración futura de respaldo',
    output: 'Plan visual; no existe copia creada',
    next: './security.html?tab=backups',
  },
];

export function integrationsWorkspace() {
  const params = new URLSearchParams(location.search);
  const allowed = isModuleEnabled('integrations');
  return {
    allowed,
    catalog: allowed ? catalog : [],
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
      if (allowed) document.title = `Integraciones previstas · ${activeVariant.company.shortName}`;
    },
  };
}
