// One application, three fixed presentation builds. Vite replaces MODE at build time.
// There is deliberately no runtime course/company selector in the UI.
export const VARIANT_IDS = ['surtec-peti', 'jy-pmi', 'jy-demo'];

const surtecModules = [
  'dashboard',
  'projects',
  'approvals',
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
  'approvals',
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

// Background of each supplied logo file. The rail shows the logo on a plate
// of exactly this colour, so the file is displayed unaltered and its edges
// never show as a box.
const LOGO_PLATES = {
  surtec: { light: '#ffffff', dark: '#000000' },
  jy: { light: '#fefefe', dark: '#020a1c' },
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
      logoPlate: LOGO_PLATES.surtec,
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
      logoLight: 'assets/brands/jy/logo-claro-compacto.png',
      logoDark: 'assets/brands/jy/logo-oscuro-compacto.png',
      logoCompact: 'assets/brands/jy/isotipo-claro.png',
      logoCompactSize: '1254x1254',
      logoLightBox: LOGO_BOXES.jyLight,
      logoDarkBox: LOGO_BOXES.jyDark,
      logoPlate: LOGO_PLATES.jy,
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
    dataSet: 'jy',
    user: DEMO_USER,
    company: {
      name: 'J&Y Ingenieros Consultores S.A.C.',
      shortName: 'J&Y',
      logoLight: 'assets/brands/jy/logo-claro-compacto.png',
      logoDark: 'assets/brands/jy/logo-oscuro-compacto.png',
      logoCompact: 'assets/brands/jy/isotipo-claro.png',
      logoCompactSize: '1254x1254',
      logoLightBox: LOGO_BOXES.jyLight,
      logoDarkBox: LOGO_BOXES.jyDark,
      logoPlate: LOGO_PLATES.jy,
    },
    presentation: { code: 'Demo', label: 'Propuesta para J&Y' },
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

export function brandAssetUrl(assetPath) {
  const base = import.meta.env?.BASE_URL || './';
  return `${base}${assetPath.replace(/^\/+/, '')}`;
}

export function variantStorageKey(key, variant = activeVariant) {
  return `mockup-erp:${variant.id}:${key}`;
}
