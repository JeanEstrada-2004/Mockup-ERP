// One application, three fixed presentation builds. Vite replaces MODE at build time.
// There is deliberately no runtime course/company selector in the UI.
export const VARIANT_IDS = ['surtec-peti', 'jy-pmi', 'jy-demo'];

const surtecModules = [
  'dashboard',
  'projects',
  'crm',
  'budgets',
  'purchases',
  'expenses',
  'personnel',
  'timeTracking',
  'biometrics',
  'warehouse',
  'costs',
  'documents',
  'reports',
  'bi',
  'integrations',
  'security',
  'administration',
];

const jyPmiModules = [
  'dashboard',
  'projects',
  'budgets',
  'purchases',
  'expenses',
  'personnel',
  'timeTracking',
  'costs',
  'documents',
  'reports',
  'security',
  'administration',
];

const jyDemoModules = [
  'dashboard',
  'projects',
  'purchases',
  'expenses',
  'personnel',
  'timeTracking',
  'costs',
  'documents',
];

export const VARIANTS = {
  'surtec-peti': {
    id: 'surtec-peti',
    dataSet: 'surtec',
    company: {
      name: 'SurTec Ingeniería y Tecnología S.A.C.',
      shortName: 'SurTec',
      logoLight: 'assets/brands/surtec/logo-transparente.png',
      logoDark: 'assets/brands/surtec/logo-blanco-fondo-negro.png',
      logoCompact: 'assets/brands/surtec/logo-circular.png',
    },
    theme: {
      primary: '#1A365D',
      accent: '#0066CC',
      neutral: '#4A5568',
      surface: '#F7FAFC',
    },
    enabledModules: surtecModules,
  },
  'jy-pmi': {
    id: 'jy-pmi',
    dataSet: 'jy',
    company: {
      name: 'J&Y Ingenieros Consultores S.A.C.',
      shortName: 'J&Y',
      logoLight: 'assets/brands/jy/logo-claro-compacto.png',
      logoDark: 'assets/brands/jy/logo-oscuro-compacto.png',
      logoCompact: 'assets/brands/jy/isotipo-claro.png',
    },
    // Neutral UI colors until a formal J&Y digital palette is supplied.
    theme: { primary: '#334155', accent: '#2563EB', neutral: '#475569', surface: '#F8FAFC' },
    enabledModules: jyPmiModules,
  },
  'jy-demo': {
    id: 'jy-demo',
    dataSet: 'jy',
    company: {
      name: 'J&Y Ingenieros Consultores S.A.C.',
      shortName: 'J&Y',
      logoLight: 'assets/brands/jy/logo-claro-compacto.png',
      logoDark: 'assets/brands/jy/logo-oscuro-compacto.png',
      logoCompact: 'assets/brands/jy/isotipo-claro.png',
    },
    theme: { primary: '#334155', accent: '#2563EB', neutral: '#475569', surface: '#F8FAFC' },
    enabledModules: jyDemoModules,
  },
};

export function getVariantConfig(id) {
  if (!VARIANT_IDS.includes(id)) throw new Error(`Variante desconocida: ${id}`);
  return VARIANTS[id];
}

// `development` and `production` select the default presentation for existing
// npm scripts. Explicit `--mode` builds select the other presentations.
const viteMode = import.meta.env?.MODE;
export const activeVariantId = VARIANT_IDS.includes(viteMode) ? viteMode : 'surtec-peti';
export const activeVariant = getVariantConfig(activeVariantId);

export function isModuleEnabled(moduleId, variant = activeVariant) {
  return variant.enabledModules.includes(moduleId);
}

export function brandAssetUrl(assetPath) {
  const base = import.meta.env?.BASE_URL || './';
  return `${base}${assetPath.replace(/^\/+/, '')}`;
}

export function variantStorageKey(key, variant = activeVariant) {
  return `mockup-erp:${variant.id}:${key}`;
}
