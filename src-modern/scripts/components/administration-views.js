import { activeVariant, brandAssetUrl, isModuleEnabled } from '../config/variants.js';
import { getDataForVariant, getDocuments } from '../data/mock-data.js';
import { COST_SOURCES } from '../data/cost-data.js';
import { TAX_RATE } from '../data/commercial-data.js';

const data = getDataForVariant(activeVariant);
const allowed = isModuleEnabled('administration');
const tabs = [
  ['empresa', 'Empresa'],
  ['catalogos', 'Catálogos'],
  ['parametros', 'Parámetros'],
  ['notificaciones', 'Notificaciones'],
  ['apariencia', 'Apariencia'],
  ['general', 'Configuración general'],
];
// Punto 106: notification categories and their channels (local demo state).
const NOTIFICATION_RULES = [
  { id: 'info', label: 'Información', example: 'Proyecto actualizado', app: true, mail: false },
  { id: 'warning', label: 'Advertencia', example: 'Proyecto supera 80 % del presupuesto', app: true, mail: true },
  { id: 'error', label: 'Error', example: 'Error de sincronización biométrica', app: true, mail: true },
  { id: 'approval', label: 'Aprobación', example: 'Rendición pendiente de revisión', app: true, mail: true },
  { id: 'system', label: 'Sistema', example: 'Backup completado', app: true, mail: false },
];
const GENERAL_SETTINGS = [
  ['Idioma', 'Español (Perú)'],
  ['Formato de fecha', 'DD/MM/AAAA'],
  ['Moneda', 'Soles (S/)'],
  ['Zona horaria', 'America/Lima (UTC−5)'],
  ['IGV', '18 %'],
  ['Cierre de sesión por inactividad', '30 minutos'],
  ['MFA para aprobaciones', 'Obligatorio'],
];
const catalogs = [
  {
    id: 'projects',
    label: 'Proyectos',
    entries: data.projects.map((item) => ({ id: item.id, label: item.name })),
  },
  {
    id: 'clients',
    label: 'Clientes',
    entries: data.clients.map((item) => ({ id: item.id, label: item.name })),
  },
  {
    id: 'suppliers',
    label: 'Proveedores',
    entries: data.suppliers.map((item) => ({ id: item.id, label: item.name })),
  },
  {
    id: 'workers',
    label: 'Trabajadores',
    entries: data.workers.map((item) => ({ id: item.id, label: item.name })),
  },
  {
    id: 'documents',
    label: 'Tipos de documento',
    entries: [...new Set(getDocuments(data).map((item) => item.type))].map((item, index) => ({
      id: `TIP-${index + 1}`,
      label: item,
    })),
  },
  {
    id: 'costs',
    label: 'Fuentes de costo',
    entries: COST_SOURCES.map((item) => ({ id: item.id, label: item.label })),
  },
  ...(isModuleEnabled('warehouse')
    ? [
        {
          id: 'materials',
          label: 'Materiales',
          entries: data.materials.map((item) => ({ id: item.id, label: item.name })),
        },
      ]
    : []),
  ...(isModuleEnabled('crm')
    ? [
        {
          id: 'opportunities',
          label: 'Oportunidades',
          entries: data.opportunities.map((item) => ({ id: item.id, label: item.name })),
        },
      ]
    : []),
];
function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function administrationWorkspace() {
  const params = new URLSearchParams(location.search);
  return {
    allowed,
    tabs,
    notificationRules: NOTIFICATION_RULES.map((item) => ({ ...item })),
    generalSettings: GENERAL_SETTINGS,
    presentationCode: activeVariant.presentation.code,
    get legal() {
      return activeVariant.company.legal || null;
    },
    saveNotifications() {
      window.AdminApp?.notificationManager?.success('Preferencias de notificación guardadas.');
    },
    setTheme(theme) {
      if (document.documentElement.dataset.bsTheme !== theme) {
        document.querySelector('[title="Cambiar tema"]')?.click();
      }
    },
    company: activeVariant.company,
    logo: brandAssetUrl(activeVariant.company.logoLight),
    logoDark: brandAssetUrl(activeVariant.company.logoDark),
    catalogs: allowed ? catalogs : [],
    tab: tabs.some(([id]) => id === params.get('tab')) ? params.get('tab') : 'empresa',
    selectedCatalogId: catalogs.some((item) => item.id === params.get('catalog'))
      ? params.get('catalog')
      : catalogs[0].id,
    search: (params.get('search') || '').slice(0, 120),
    parameters: [
      { label: 'Moneda de los importes mock', value: 'Sol peruano (PEN)' },
      { label: 'IGV + IPM del desglose visual', value: `${Math.round(TAX_RATE * 100)} %` },
      { label: 'Idioma de interfaz', value: 'Español' },
      { label: 'Calendario de datos ficticios', value: 'Escenario 2027' },
      { label: 'Alerta de ejecución de presupuesto', value: 'Desde 80 %' },
      {
        label: 'Módulo de almacén',
        value: isModuleEnabled('warehouse')
          ? 'Incluido en esta presentación'
          : 'Fuera del alcance de esta presentación',
      },
      {
        label: 'BI gerencial',
        value: isModuleEnabled('bi')
          ? 'Incluido en esta presentación'
          : 'Fuera del alcance de esta presentación',
      },
    ],
    get selectedCatalog() {
      return this.catalogs.find((item) => item.id === this.selectedCatalogId) || null;
    },
    get filteredEntries() {
      const term = normalize(this.search.trim());
      return (this.selectedCatalog?.entries || []).filter(
        (item) => !term || normalize(`${item.id} ${item.label}`).includes(term)
      );
    },
    setTab(id) {
      this.tab = id;
      this.updateUrl();
    },
    setCatalog(id) {
      this.selectedCatalogId = id;
      this.search = '';
      this.updateUrl();
    },
    updateUrl() {
      const query = new URLSearchParams();
      if (this.tab !== 'empresa') query.set('tab', this.tab);
      if (this.tab === 'catalogos' && this.selectedCatalogId !== catalogs[0].id)
        query.set('catalog', this.selectedCatalogId);
      if (this.tab === 'catalogos' && this.search.trim()) query.set('search', this.search.trim());
      history.replaceState(null, '', `./settings.html${query.size ? `?${query}` : ''}`);
    },
    clearSearch() {
      this.search = '';
      this.updateUrl();
    },
    init() {
      if (allowed) document.title = `Administración · ${activeVariant.company.shortName}`;
    },
  };
}
