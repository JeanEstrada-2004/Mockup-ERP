// One application, three fixed presentation builds. Vite replaces MODE at build time.
// There is deliberately no runtime course/company selector in the UI.
export const VARIANT_IDS = ['surtec-peti', 'jy-pmi', 'jy-demo'];

const surtecModules = [
  'dashboard',
  'projects',
  'approvals',
  'clients',
  'suppliers',
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
  'approvals',
  'clients',
  'suppliers',
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

// J&Y Demo grows phase by phase (docs/realineamiento-jy-demo.md, R1–R6).
const jyDemoModules = [
  'dashboard',
  'projects',
  'approvals',
  'clients',
  'suppliers',
  'purchases',
  'expenses',
  'personnel',
  'timeTracking',
  'costs',
  'documents',
];

// The supplied logo files carry wide empty margins. The header shows each file
// unaltered but clipped to its drawn area: [x, y, width, height, imageWidth,
// imageHeight] in source pixels, measured from the files in public-assets.
const LOGO_BOXES = {
  surtecLight: [84, 104, 390, 351, 559, 559],
  surtecDark: [83, 103, 392, 353, 559, 559],
  jyLight: [389, 38, 1390, 616, 2172, 724],
  jyDark: [400, 35, 1411, 632, 2172, 724],
};


// Process rules that differ between presentations. Defaults reproduce the
// SurTec/PMI behaviour; a variant only declares what it changes.
export const DEFAULT_RULES = {
  // Demo only: badges that tell a confirmed process (AS-IS) from a proposal
  // (TO-BE) and from what is still to be validated with the company.
  maturityTags: false,
  // 'approval': SurTec/PMI flow (Borrador → En revisión → Observada → Aprobada).
  // 'review': J&Y Demo (R2) — numbered per worker and year, three people,
  // evidence per expense and administrative review instead of approval.
  expenseFlow: 'approval',
  // R3 — J&Y Demo works with a list of pending tasks, not formal approvals,
  // and only shows rules confirmed with the company.
  approvalsMode: 'approval', // 'worklist' → "Pendientes"
  physicalProgress: true, // progress vs. execution comparisons
  budgetAlertPercent: 80, // automatic budget alert; null = none
  controlAllocation: true, // referential budget split by source (40/25/15/15/5)
  costTreatment: false, // J&Y Real vs. formal treatment, categories, consolidation
  documentViewer: false, // visual preview of documents and evidence
};

// Fictitious signed-in user shown in the header (punto 3).
const DEMO_USER = { name: 'Jean Estrada', role: 'Administrador', initials: 'JE' };

export const VARIANTS = {
  'surtec-peti': {
    id: 'surtec-peti',
    dataSet: 'surtec',
    user: DEMO_USER,
    company: {
      name: 'SurTec Ingeniería y Tecnología S.A.C.',
      shortName: 'SurTec',
      logoLight: 'assets/brands/surtec/logo-transparente.png',
      logoDark: 'assets/brands/surtec/logo-blanco-fondo-negro.png',
      logoCompact: 'assets/brands/surtec/logo-circular.png',
      logoCompactSize: '588x588',
      logoLightBox: LOGO_BOXES.surtecLight,
      logoDarkBox: LOGO_BOXES.surtecDark,
      // White, background-free copy of the official logo for the dark rail.
      logoRail: 'assets/brands/surtec/web/logo-rail.png',
      logoRailBox: LOGO_BOXES.surtecDark,
      // Fictitious company of the PETI course.
      legal: {
        ruc: '20605123478',
        address: 'Av. Ejército 1020, Yanahuara, Arequipa',
        phone: '(054) 412 380',
        email: 'contacto@surtec.pe',
      },
    },
    // Which presentation this build is, shown under the logo in the rail.
    presentation: { code: 'PETI', label: 'TO-BE 2027–2030' },
    theme: {
      primary: '#1A365D',
      accent: '#0066CC',
      neutral: '#4A5568',
      surface: '#F7FAFC',
      // Deep corporate blue rail (DESIGN.md › Marca).
      rail: '#10264A',
      railDark: '#050C18',
      // Series 1 on the dark panel, re-stepped so it stays ≥ 15 ΔE from the
      // teal series 2 (dataviz validate_palette.js, dark mode: PASS).
      series1Dark: '#3D85E6',
    },
    enabledModules: surtecModules,
  },
  'jy-pmi': {
    id: 'jy-pmi',
    dataSet: 'jy',
    user: DEMO_USER,
    company: {
      name: 'J&Y Ingenieros Consultores S.A.C.',
      shortName: 'J&Y',
      logoLight: 'assets/brands/jy/web/logo-claro-compacto.png',
      logoDark: 'assets/brands/jy/web/logo-oscuro-compacto.png',
      logoCompact: 'assets/brands/jy/web/isotipo-claro.png',
      logoCompactSize: '1254x1254',
      logoLightBox: LOGO_BOXES.jyLight,
      logoDarkBox: LOGO_BOXES.jyDark,
      logoRail: 'assets/brands/jy/web/logo-rail.png',
      logoRailBox: LOGO_BOXES.jyDark,
    },
    presentation: { code: 'PMI', label: 'ERP contractual' },
    // Neutral UI colors until a formal J&Y digital palette is supplied:
    // deep slate rail, blue accent.
    theme: {
      primary: '#334155',
      accent: '#2563EB',
      neutral: '#475569',
      surface: '#F8FAFC',
      rail: '#1C2533',
      railDark: '#0A0E15',
    },
    enabledModules: jyPmiModules,
  },
  'jy-demo': {
    id: 'jy-demo',
    // Own data set since R1: J&Y Demo no longer mirrors the PMI records.
    dataSet: 'jy-demo',
    user: DEMO_USER,
    company: {
      name: 'J&Y Ingenieros Consultores S.A.C.',
      shortName: 'J&Y',
      logoLight: 'assets/brands/jy/web/logo-claro-compacto.png',
      logoDark: 'assets/brands/jy/web/logo-oscuro-compacto.png',
      logoCompact: 'assets/brands/jy/web/isotipo-claro.png',
      logoCompactSize: '1254x1254',
      logoLightBox: LOGO_BOXES.jyLight,
      logoDarkBox: LOGO_BOXES.jyDark,
      logoRail: 'assets/brands/jy/web/logo-rail.png',
      logoRailBox: LOGO_BOXES.jyDark,
    },
    presentation: { code: 'Demo', label: 'Propuesta para J&Y' },
    rules: {
      maturityTags: true,
      expenseFlow: 'review',
      approvalsMode: 'worklist',
      physicalProgress: false,
      budgetAlertPercent: null,
      controlAllocation: false,
      costTreatment: true,
      documentViewer: true,
    },
    labels: {
      approvals: 'Pendientes',
      purchases: 'Compras / OC',
      costs: 'Costos y Control Contable',
    },
    theme: {
      primary: '#334155',
      accent: '#2563EB',
      neutral: '#475569',
      surface: '#F8FAFC',
      rail: '#1C2533',
      railDark: '#0A0E15',
    },
    enabledModules: jyDemoModules,
  },
};

// Development ports, one per presentation (`npm run dev:all` starts all three).
export const DEV_PORTS = { 'surtec-peti': 3000, 'jy-pmi': 3001, 'jy-demo': 3002 };

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

export function variantRule(key, variant = activeVariant) {
  return { ...DEFAULT_RULES, ...variant.rules }[key];
}

export function brandAssetUrl(assetPath) {
  const base = import.meta.env?.BASE_URL || './';
  return `${base}${assetPath.replace(/^\/+/, '')}`;
}

export function variantStorageKey(key, variant = activeVariant) {
  return `mockup-erp:${variant.id}:${key}`;
}
