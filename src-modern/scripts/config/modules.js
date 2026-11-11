// This order is shared by every presentation. Subfeatures stay inside their
// parent module and do not add 19 separate sidebar entries.
export const NAV_GROUPS = [
  { label: 'GENERAL', modules: ['dashboard', 'projects', 'approvals'] },
  {
    label: 'GESTIÓN',
    modules: ['crm', 'budgets', 'purchases', 'expenses', 'personnel', 'warehouse'],
  },
  { label: 'CONTROL', modules: ['costs', 'documents', 'reports'] },
  { label: 'SISTEMA', modules: ['integrations', 'security', 'administration'] },
];

export const MODULES = {
  dashboard: {
    label: 'Inicio',
    icon: 'bi-house',
    description: 'Visión consolidada de proyectos y operación.',
  },
  approvals: {
    label: 'Aprobaciones',
    icon: 'bi-check2-square',
    description: 'Presupuestos, compras y rendiciones que esperan revisión.',
  },
  projects: {
    label: 'Proyectos',
    icon: 'bi-grid',
    description: 'Gestión integral de los proyectos de la empresa.',
  },
  crm: {
    label: 'CRM',
    icon: 'bi-people',
    description: 'Oportunidades comerciales relacionadas con presupuestos y proyectos.',
  },
  budgets: {
    label: 'Presupuestos',
    icon: 'bi-file-earmark-spreadsheet',
    description: 'Cotizaciones, partidas, versiones y aprobaciones.',
  },
  purchases: {
    label: 'Compras',
    icon: 'bi-bag-check',
    description: 'Órdenes de compra, proveedores y recepción.',
  },
  expenses: {
    label: 'Rendiciones',
    icon: 'bi-file-text',
    description: 'Gastos, comprobantes y revisión de rendiciones.',
  },
  personnel: {
    label: 'Personal y Tareo',
    icon: 'bi-person',
    description: 'Asignaciones, asistencia y horas asociadas al proyecto.',
  },
  warehouse: {
    label: 'Almacén',
    icon: 'bi-box',
    description: 'Inventario, movimientos, materiales y Kardex.',
  },
  costs: {
    label: 'Costos',
    icon: 'bi-graph-up',
    description: 'Costos consolidados por proyecto y por fuente.',
  },
  documents: {
    label: 'Documentos',
    icon: 'bi-folder2-open',
    description: 'Evidencia vinculada a las operaciones y sus proyectos.',
  },
  reports: {
    label: 'Reportes',
    icon: 'bi-file-earmark-text',
    description: 'Reportes operativos e indicadores para seguimiento.',
  },
  integrations: {
    label: 'Integraciones',
    icon: 'bi-arrow-repeat',
    description: 'Estado visual de las conexiones previstas.',
  },
  security: {
    label: 'Seguridad',
    icon: 'bi-shield-check',
    description: 'Usuarios, roles, auditoría y controles representados.',
  },
  administration: {
    label: 'Administración',
    icon: 'bi-gear',
    description: 'Datos de empresa, catálogos y preferencias.',
  },
};

export function moduleLabel(id, variant) {
  if (id === 'reports' && variant.enabledModules.includes('bi')) return 'Reportes y BI';
  return MODULES[id]?.label || id;
}

export function moduleHref(id, recordId) {
  if (id === 'dashboard') return './index.html';
  if (id === 'approvals') {
    return recordId ? `./approvals.html?tab=${encodeURIComponent(recordId)}` : './approvals.html';
  }
  if (id === 'projects') {
    return recordId ? `./project.html?id=${encodeURIComponent(recordId)}` : './projects.html';
  }
  if (id === 'budgets') {
    return recordId ? `./budget.html?id=${encodeURIComponent(recordId)}` : './budgets.html';
  }
  if (id === 'purchases') {
    return recordId ? `./purchase.html?id=${encodeURIComponent(recordId)}` : './purchases.html';
  }
  if (id === 'expenses') {
    return recordId ? `./expense.html?id=${encodeURIComponent(recordId)}` : './expenses.html';
  }
  if (id === 'personnel') {
    if (recordId?.startsWith('PER-')) return `./worker.html?id=${encodeURIComponent(recordId)}`;
    if (recordId?.startsWith('TAR-'))
      return `./personnel.html?tab=tareo&record=${encodeURIComponent(recordId)}`;
    return './personnel.html';
  }
  if (id === 'warehouse') {
    if (recordId?.startsWith('MAT-')) return `./material.html?id=${encodeURIComponent(recordId)}`;
    if (recordId) return `./warehouse.html?tab=movimientos&record=${encodeURIComponent(recordId)}`;
    return './warehouse.html';
  }
  if (id === 'costs') {
    if (recordId?.startsWith('COST-DEMO-'))
      return `./module-preview.html?module=costs&record=${encodeURIComponent(recordId)}`;
    if (recordId?.startsWith('COST-')) return `./costs.html?record=${encodeURIComponent(recordId)}`;
    if (recordId?.startsWith('PR-')) return `./costs.html?project=${encodeURIComponent(recordId)}`;
    return './costs.html';
  }
  if (id === 'documents') {
    return recordId ? `./document.html?id=${encodeURIComponent(recordId)}` : './documents.html';
  }
  if (id === 'reports') return './reports.html';
  if (id === 'crm') {
    return recordId ? `./crm.html?id=${encodeURIComponent(recordId)}` : './crm.html';
  }
  if (id === 'integrations') return './integrations.html';
  if (id === 'security') return './security.html';
  if (id === 'administration') return './settings.html';
  const params = new URLSearchParams({ module: id });
  if (recordId) params.set('record', recordId);
  return `./module-preview.html?${params.toString()}`;
}
