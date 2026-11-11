import { budgetTotals } from './budget-calc.js';

// J&Y Demo data set (R1, docs/realineamiento-jy-demo.md). Fictitious records
// for the proposal shown to J&Y Ingenieros Consultores: they are not real J&Y
// clients, suppliers, workers, contracts or amounts. Dates use 2026, matching
// the company's budget code (PR2606-0022-V2-GM: PR = presupuesto, 26 = 2026).
// Project codes use PY-AA-NNN so they never collide with the "PR" budget code.
/* @__NO_SIDE_EFFECTS__ */
const operation = (id, projectId, type, amount, costSource, details = {}) => ({
  id,
  projectId,
  type,
  amount,
  costSource,
  documentId: `DOC-${id}`,
  ...details,
});

/* @__NO_SIDE_EFFECTS__ */
const event = (date, user, action, note = '') => ({ date, user, action, note });

// Rendiciones (R2). Amounts of every expense are what Administración registered
// from the evidence; `suggested`/`confidence` keep what OCR proposed.
/* @__NO_SIDE_EFFECTS__ */
const taxed = (total) => {
  const vv = Math.round((total / 1.18) * 100) / 100;
  return { vv, igv: Math.round((total - vv) * 100) / 100, total };
};
/* @__NO_SIDE_EFFECTS__ */
const gasto = (id, date, docType, doc, description, category, amounts, extra = {}) => ({
  id,
  date,
  docType,
  series: doc.series || '',
  number: doc.number || '',
  ruc: doc.ruc || '',
  vendor: doc.vendor || '',
  description,
  category,
  suggestedCategory: extra.suggestedCategory || category,
  vv: amounts.vv || 0,
  igv: amounts.igv || 0,
  nonTaxed: amounts.nonTaxed || 0,
  total: amounts.total,
  review: 'Conforme',
  reviewNote: '',
  justification: '',
  ...extra,
});
/* @__NO_SIDE_EFFECTS__ */
const step = (at, user, action, note = '') => ({ at, user, action, note });
/* @__NO_SIDE_EFFECTS__ */
const rendicion = (id, workerId, number, projectId, date, people, status, items, extra = {}) => ({
  id,
  workerId,
  number,
  year: 2026,
  projectId,
  date,
  preparedBy: people.preparedBy,
  reviewerId: people.reviewerId,
  status,
  authorization: '',
  notes: '',
  items,
  history: [],
  ...extra,
});

const V = {
  hospedaje: { ruc: '20610000301', vendor: 'Hospedaje Los Volcanes E.I.R.L.' },
  fogon: { ruc: '20610000302', vendor: 'Restaurante El Fogón del Sur E.I.R.L.' },
  grifo: { ruc: '20610000303', vendor: 'Grifo Santa Rosa S.A.C.' },
  ferreteria: { ruc: '20610000304', vendor: 'Ferretería Industrial Yura S.A.C.' },
  bodega: { ruc: '10406100305', vendor: 'Bodega Doña Carmen' },
  courier: { ruc: '20610000306', vendor: 'Courier Express del Sur S.A.C.' },
  taxi: { ruc: '20610000307', vendor: 'Taxi Seguro Arequipa S.A.C.' },
  grafica: { ruc: '20610000308', vendor: 'Gráfica Misti S.A.C.' },
  clinica: { ruc: '20610000309', vendor: 'Clínica Ocupacional del Sur S.A.C.' },
  libreria: { ruc: '20610000310', vendor: 'Librería y Papelería Central E.I.R.L.' },
  hostal: { ruc: '20610000311', vendor: 'Hostal Misti Andino E.I.R.L.' },
  cordillera: { ruc: '20610000205', vendor: 'Transportes Cordillera E.I.R.L.' },
};
const doc = (vendor, series, number) => ({ ...V[vendor], series, number });

const EXPENSE_REPORTS = [
  rendicion(
    'R-26-001',
    'PER-JY-002',
    7,
    'PY-26-001',
    '2026-05-18',
    { preparedBy: 'PER-JY-003', reviewerId: 'PER-JY-003' },
    'Entregada a Contabilidad',
    [
      gasto(
        'R-26-001-01',
        '2026-05-05',
        'factura',
        doc('hospedaje', 'F001', '00004521'),
        'Hospedaje 5 noches, personal de supervisión',
        'Hospedaje',
        taxed(500)
      ),
      gasto(
        'R-26-001-02',
        '2026-05-06',
        'boleta',
        doc('fogon', 'B002', '00018893'),
        'Almuerzos de cuadrilla (6)',
        'Alimentación',
        taxed(186)
      ),
      gasto(
        'R-26-001-03',
        '2026-05-08',
        'factura',
        doc('grifo', 'F003', '00102255'),
        'Combustible de camioneta',
        'Transporte',
        taxed(240),
        {
          suggested: { total: 249 },
          confidence: { total: 'baja' },
        }
      ),
      gasto(
        'R-26-001-04',
        '2026-05-09',
        'yape',
        {},
        'Mototaxi de obra a Yura centro',
        'Movilidad',
        { total: 35 },
        {
          payee: 'Juan C. Ccama',
          operationCode: '04512873',
        }
      ),
      gasto(
        'R-26-001-05',
        '2026-05-10',
        'factura',
        doc('ferreteria', 'F001', '00007788'),
        'Estacas, cordel y pintura de señalización',
        'Suministro',
        taxed(413)
      ),
      gasto(
        'R-26-001-06',
        '2026-05-12',
        'sin-documento',
        {},
        'Pasaje en combi Arequipa–Yura (ida y vuelta)',
        'Movilidad',
        { total: 12 },
        {
          justification: 'Transporte informal; no emite comprobante.',
        }
      ),
      gasto(
        'R-26-001-07',
        '2026-05-14',
        'boleta-foto',
        doc('bodega', 'B001', '0002315'),
        'Agua y refrigerios para la cuadrilla',
        'Alimentación',
        { nonTaxed: 48, total: 48 },
        {
          suggested: { ruc: '10406100306' },
          confidence: { ruc: 'baja' },
        }
      ),
      gasto(
        'R-26-001-08',
        '2026-05-16',
        'factura',
        doc('courier', 'E001', '00000532'),
        'Envío de muestras al laboratorio',
        'Envíos/traslado de materiales',
        taxed(60),
        {
          suggestedCategory: 'Servicio',
        }
      ),
    ],
    {
      authorization: 'Coordinado por WhatsApp con el ingeniero a cargo (04/05/2026).',
      notes: 'Gastos de la primera quincena de mayo en obra.',
      history: [
        step(
          '2026-05-17T18:40',
          'Rosa Huamán',
          'Creada',
          'Preparada con las fotos enviadas por José Vargas.'
        ),
        step('2026-05-18T09:15', 'Rosa Huamán', 'Presentada'),
        step(
          '2026-05-19T11:02',
          'Rosa Huamán',
          'Corrigió el total del ítem 3',
          'OCR leyó S/ 249.00; la factura dice S/ 240.00.'
        ),
        step('2026-05-19T11:20', 'Rosa Huamán', 'Aceptada'),
        step(
          '2026-05-20T16:05',
          'Rosa Huamán',
          'Entregada a Contabilidad',
          'Enviada por correo con las evidencias.'
        ),
      ],
    }
  ),
  rendicion(
    'R-26-002',
    'PER-JY-001',
    4,
    'PY-26-002',
    '2026-06-12',
    { preparedBy: 'PER-JY-001', reviewerId: 'PER-JY-003' },
    'Aceptada',
    [
      gasto(
        'R-26-002-01',
        '2026-06-02',
        'factura',
        doc('taxi', 'E001', '00002231'),
        'Taxi a reunión con el cliente',
        'Movilidad',
        taxed(45)
      ),
      gasto(
        'R-26-002-02',
        '2026-06-04',
        'factura',
        doc('grafica', 'F001', '00000982'),
        'Impresión de planos A1 (12 láminas)',
        'Útiles/impresiones',
        taxed(236)
      ),
      gasto(
        'R-26-002-03',
        '2026-06-08',
        'boleta',
        doc('fogon', 'B001', '00000451'),
        'Almuerzo de coordinación en obra',
        'Alimentación',
        taxed(74)
      ),
      gasto(
        'R-26-002-04',
        '2026-06-10',
        'plin',
        {},
        'Flete de cables al local comercial',
        'Envíos/traslado de materiales',
        { total: 80 },
        {
          payee: 'Fletes Ríos',
          operationCode: '88210457',
          suggestedCategory: 'Transporte',
        }
      ),
      gasto(
        'R-26-002-05',
        '2026-06-11',
        'factura',
        doc('clinica', 'F002', '00001288'),
        'Examen médico ocupacional de ingreso',
        'EMO/SCTR',
        taxed(177)
      ),
    ],
    {
      authorization: 'Autorización verbal del ingeniero a cargo.',
      history: [
        step('2026-06-12T10:30', 'María Salazar', 'Creada'),
        step('2026-06-12T10:52', 'María Salazar', 'Presentada'),
        step(
          '2026-06-13T09:40',
          'Rosa Huamán',
          'Aceptada',
          'Clasificación del ítem 4 corregida a Envíos/traslado de materiales.'
        ),
      ],
    }
  ),
  rendicion(
    'R-26-003',
    'PER-JY-004',
    2,
    'PY-26-001',
    '2026-07-03',
    { preparedBy: 'PER-JY-003', reviewerId: 'PER-JY-003' },
    'Presentada',
    [
      gasto(
        'R-26-003-01',
        '2026-06-29',
        'boleta-foto',
        doc('fogon', 'B001', '0003102'),
        'Almuerzos de cuadrilla (3)',
        'Alimentación',
        taxed(54),
        { review: 'Pendiente' }
      ),
      gasto(
        'R-26-003-02',
        '2026-06-30',
        'factura',
        doc('ferreteria', 'F001', '00008014'),
        'Cinta aislante y terminales',
        'Suministro',
        taxed(129.8),
        {
          review: 'Pendiente',
          suggested: { total: 129, vv: 109.32, igv: 19.68 },
          confidence: { total: 'baja', vv: 'baja', igv: 'baja' },
        }
      ),
      gasto(
        'R-26-003-03',
        '2026-07-01',
        'yape',
        {},
        'Mototaxi de la cuadrilla',
        'Movilidad',
        { total: 15 },
        {
          review: 'Pendiente',
          payee: 'Mototaxi Ayala',
          operationCode: '05530981',
        }
      ),
      gasto(
        'R-26-003-04',
        '2026-07-02',
        'factura',
        doc('hostal', 'F001', '00000377'),
        'Hospedaje 2 noches',
        'Hospedaje',
        taxed(120),
        {
          review: 'Pendiente',
          suggested: { ruc: '20610000317' },
          confidence: { ruc: 'baja', vendor: 'media' },
        }
      ),
      gasto(
        'R-26-003-05',
        '2026-07-02',
        'sin-documento',
        {},
        'Almuerzo en zona rural',
        'Alimentación',
        { total: 21.2 },
        {
          review: 'Pendiente',
          justification: 'Comedor rural sin comprobante.',
        }
      ),
    ],
    {
      authorization: 'Coordinado por WhatsApp con el ingeniero a cargo.',
      notes: 'Fotos recibidas por WhatsApp desde obra.',
      history: [
        step(
          '2026-07-03T08:50',
          'Rosa Huamán',
          'Creada',
          'Preparada con las fotos enviadas por Luis Condori.'
        ),
        step('2026-07-03T09:25', 'Rosa Huamán', 'Presentada'),
      ],
    }
  ),
  rendicion(
    'R-26-004',
    'PER-JY-003',
    3,
    'PY-26-003',
    '2026-06-05',
    { preparedBy: 'PER-JY-003', reviewerId: 'PER-JY-005' },
    'Entregada a Contabilidad',
    [
      gasto(
        'R-26-004-01',
        '2026-06-01',
        'factura',
        doc('libreria', 'F001', '00003321'),
        'Útiles de oficina para el proyecto',
        'Útiles/impresiones',
        taxed(118)
      ),
      gasto(
        'R-26-004-02',
        '2026-06-03',
        'factura',
        doc('cordillera', 'E001', '00000877'),
        'Traslado de equipos a las aulas',
        'Envíos/traslado de materiales',
        taxed(354)
      ),
      gasto(
        'R-26-004-03',
        '2026-06-04',
        'sin-documento',
        {},
        'Pago a estibadores eventuales',
        'Servicio',
        { total: 40 },
        {
          justification: 'Estibadores eventuales; no emiten comprobante.',
        }
      ),
    ],
    {
      history: [
        step('2026-06-05T12:10', 'Rosa Huamán', 'Creada'),
        step('2026-06-05T12:30', 'Rosa Huamán', 'Presentada'),
        step('2026-06-06T10:00', 'Carmen Ríos', 'Aceptada'),
        step('2026-06-06T10:05', 'Carmen Ríos', 'Entregada a Contabilidad'),
      ],
    }
  ),
  rendicion(
    'R-26-005',
    'PER-JY-002',
    8,
    'PY-26-001',
    '2026-06-20',
    { preparedBy: 'PER-JY-003', reviewerId: 'PER-JY-003' },
    'Observada',
    [
      gasto(
        'R-26-005-01',
        '2026-06-15',
        'factura',
        doc('hospedaje', 'F001', '00004702'),
        'Hospedaje 3 noches',
        'Hospedaje',
        taxed(300)
      ),
      gasto(
        'R-26-005-02',
        '2026-06-16',
        'factura',
        doc('grifo', 'F003', '00104410'),
        'Combustible de camioneta',
        'Transporte',
        taxed(150),
        {
          review: 'Observado',
          reviewNote:
            'La factura está a nombre de una persona natural, no de J&Y. Adjuntar la factura correcta.',
          buyer: 'Persona natural',
        }
      ),
      gasto(
        'R-26-005-03',
        '2026-06-17',
        'boleta',
        doc('fogon', 'B002', '00019410'),
        'Almuerzos de cuadrilla',
        'Alimentación',
        taxed(66)
      ),
    ],
    {
      history: [
        step(
          '2026-06-20T17:30',
          'Rosa Huamán',
          'Creada',
          'Preparada con las fotos enviadas por José Vargas.'
        ),
        step('2026-06-20T17:45', 'Rosa Huamán', 'Presentada'),
        step(
          '2026-06-22T09:10',
          'Rosa Huamán',
          'Observada',
          'Ítem 2: la factura no está a nombre de J&Y.'
        ),
      ],
    }
  ),
  rendicion(
    'R-26-006',
    'PER-JY-006',
    1,
    'PY-26-001',
    '2026-07-08',
    { preparedBy: 'PER-JY-003', reviewerId: 'PER-JY-003' },
    'Corregida',
    [
      gasto(
        'R-26-006-01',
        '2026-07-06',
        'factura',
        doc('ferreteria', 'F001', '00008201'),
        'Herramientas menores para la cuadrilla',
        'Suministro',
        taxed(95),
        { review: 'Pendiente' }
      ),
      gasto(
        'R-26-006-02',
        '2026-07-07',
        'sin-documento',
        {},
        'Agua para la cuadrilla',
        'Alimentación',
        { total: 18 },
        {
          review: 'Corregido',
          justification: 'Bodega rural sin comprobante; compra de emergencia en obra.',
          reviewNote: 'Faltaba el motivo del gasto sin documento.',
        }
      ),
      gasto(
        'R-26-006-03',
        '2026-07-07',
        'plin',
        {},
        'Flete de herramientas a obra',
        'Envíos/traslado de materiales',
        { total: 45 },
        {
          review: 'Pendiente',
          payee: 'Fletes Ríos',
          operationCode: '88215530',
        }
      ),
    ],
    {
      notes: 'Personal temporal: Administración prepara la rendición.',
      history: [
        step('2026-07-08T15:00', 'Rosa Huamán', 'Creada'),
        step('2026-07-08T15:20', 'Rosa Huamán', 'Presentada'),
        step(
          '2026-07-09T10:05',
          'Rosa Huamán',
          'Observada',
          'Ítem 2: indicar el motivo del gasto sin documento.'
        ),
        step('2026-07-10T08:40', 'Rosa Huamán', 'Corregida', 'Motivo agregado al ítem 2.'),
      ],
    }
  ),
];

// Presupuestos técnicos (R4). Catalogue of resources and products; reference
// prices are internal (labour per hour-man, materials per unit). Quotes are
// what suppliers offered, with their attachment.
/* @__NO_SIDE_EFFECTS__ */
const product = (id, code, name, kind, category, unit, refPrice, extra = {}) => ({
  id,
  code,
  name,
  kind,
  category,
  unit,
  refPrice,
  ...extra,
});
const PRODUCTS = [
  product('MO-01', '470101', 'Operario electricista', 'Mano de obra', 'Mano de obra', 'hh', 26.5),
  product('MO-02', '470102', 'Oficial electricista', 'Mano de obra', 'Mano de obra', 'hh', 21),
  product('MO-03', '470104', 'Peón', 'Mano de obra', 'Mano de obra', 'hh', 18.5),
  product('MO-04', '470201', 'Ingeniero supervisor', 'Mano de obra', 'Mano de obra', 'hh', 75),
  product('MO-05', '470202', 'Asistente de supervisión', 'Mano de obra', 'Mano de obra', 'hh', 38),
  product('MO-06', '470203', 'Ingeniero proyectista', 'Mano de obra', 'Mano de obra', 'hh', 70),
  product('MO-07', '470204', 'Dibujante CAD', 'Mano de obra', 'Mano de obra', 'hh', 32),
  product('MAT-01', '301201', 'Cable NH-80 2,5 mm²', 'Material', 'Conductores', 'm', 2.2, {
    brand: 'Indeco',
  }),
  product('MAT-02', '301202', 'Cable NH-80 4 mm²', 'Material', 'Conductores', 'm', 3.3, {
    brand: 'Indeco',
  }),
  product('MAT-03', '301209', 'Cable NH-80 16 mm²', 'Material', 'Conductores', 'm', 14.8, {
    brand: 'Indeco',
  }),
  product('MAT-04', '301301', 'Tubo PVC-SAP 3/4"', 'Material', 'Tuberías', 'und', 6.5),
  product(
    'MAT-05',
    '301401',
    'Caja octogonal de fierro galvanizado',
    'Material',
    'Accesorios eléctricos',
    'und',
    3.8
  ),
  product(
    'MAT-06',
    '301402',
    'Tomacorriente doble con línea a tierra',
    'Material',
    'Accesorios eléctricos',
    'und',
    19.5,
    { brand: 'Bticino' }
  ),
  product(
    'MAT-07',
    '301501',
    'Interruptor termomagnético 2×32 A',
    'Material',
    'Tableros',
    'und',
    60,
    { brand: 'Schneider Electric' }
  ),
  product(
    'MAT-08',
    '301502',
    'Tablero de distribución 12 polos',
    'Material',
    'Tableros',
    'und',
    410
  ),
  product('MAT-09', '301601', 'Luminaria LED panel 60×60', 'Material', 'Iluminación', 'und', 98),
  product('MAT-10', '301701', 'Cinta aislante', 'Material', 'Accesorios eléctricos', 'rollo', 4.5),
  product('EQ-01', '370101', 'Herramientas manuales', 'Equipo', 'Herramientas', '%MO', 0),
  product(
    'EQ-02',
    '490301',
    'Estación total (alquiler)',
    'Equipo',
    'Alquiler de equipos',
    'día',
    185
  ),
  product(
    'EQ-03',
    '490401',
    'Camioneta 4×4 (alquiler)',
    'Equipo',
    'Alquiler de equipos',
    'día',
    340
  ),
  product(
    'EQ-04',
    '490501',
    'Equipo de cómputo y software',
    'Equipo',
    'Equipos de oficina',
    'hm',
    6
  ),
  product(
    'PRD-01',
    'TI-0101',
    'Computadora de escritorio',
    'Producto',
    'Computadoras',
    'und',
    2950,
    {
      spec: 'Core i5, 16 GB RAM, SSD 512 GB, monitor 24"',
    }
  ),
  product('PRD-02', 'TI-0201', 'Televisor LED 55"', 'Producto', 'Pantallas', 'und', 2100, {
    spec: '4K, HDMI ×3, soporte de pared',
  }),
  product(
    'PRD-03',
    'TI-0301',
    'Switch administrable 24 puertos',
    'Producto',
    'Redes',
    'und',
    1290,
    {
      spec: '24 puertos Gigabit, 2 SFP',
    }
  ),
  product('PRD-04', 'TI-0401', 'Proyector multimedia', 'Producto', 'Pantallas', 'und', 1820, {
    spec: '4 000 lúmenes, WXGA',
  }),
  product(
    'PRD-05',
    'TI-0901',
    'Instalación y configuración de equipos',
    'Servicio',
    'Servicios',
    'glb',
    3600
  ),
];

/* @__NO_SIDE_EFFECTS__ */
const offer = (productId, price, extra = {}) => ({
  productId,
  price,
  leadDays: 5,
  availability: 'En stock',
  ...extra,
});
/* @__NO_SIDE_EFFECTS__ */
const cotizacion = (id, supplierId, date, validUntil, items, extra = {}) => ({
  id,
  supplierId,
  date,
  validUntil,
  currency: 'PEN',
  items,
  conditions: 'Precios sin IGV. Pago a 30 días.',
  attachment: { fileName: `${id}.pdf`, type: 'PDF' },
  notes: '',
  budgetId: null,
  ...extra,
});
const QUOTES = [
  cotizacion(
    'COT-26-001',
    'PROV-JY-002',
    '2026-02-10',
    '2026-03-12',
    [
      offer('EQ-02', 180, { availability: 'Disponible por día' }),
      offer('EQ-03', 350, { availability: 'Disponible por día' }),
    ],
    { budgetId: 'PR2602-0008', conditions: 'Alquiler por día; incluye operador para la camioneta.' }
  ),
  cotizacion(
    'COT-26-002',
    'PROV-JY-001',
    '2026-03-20',
    '2026-04-19',
    [
      offer('MAT-01', 2.1, { brand: 'Indeco' }),
      offer('MAT-02', 3.2, { brand: 'Indeco' }),
      offer('MAT-03', 14.5, { brand: 'Indeco' }),
      offer('MAT-06', 18.9, { brand: 'Bticino' }),
      offer('MAT-07', 58, { brand: 'Schneider Electric' }),
      offer('MAT-08', 420, { leadDays: 10, availability: 'A pedido' }),
      offer('MAT-10', 4.5, { brand: '3M' }),
    ],
    {
      budgetId: 'PR2603-0014',
      attachment: { fileName: 'COT-26-002 Electricos Andinos.pdf', type: 'PDF' },
    }
  ),
  cotizacion(
    'COT-26-003',
    'PROV-JY-003',
    '2026-03-22',
    '2026-04-21',
    [
      offer('MAT-07', 61.5, { brand: 'ABB' }),
      offer('MAT-08', 395, { brand: 'ABB', leadDays: 7, availability: 'Fabricación 7 días' }),
    ],
    { budgetId: 'PR2603-0014', conditions: 'Incluye armado del tablero. Pago 50 % adelanto.' }
  ),
  cotizacion(
    'COT-26-004',
    'PROV-JY-004',
    '2026-04-15',
    '2026-05-15',
    [
      offer('PRD-01', 2890, {
        brand: 'Lenovo',
        spec: 'Core i5-13400, 16 GB, SSD 512 GB, monitor 24"',
      }),
      offer('PRD-02', 2150, { brand: 'Samsung', spec: '55" 4K, 3 HDMI' }),
      offer('PRD-03', 1240, { brand: 'Cisco', spec: '24 × 1 Gb, 2 SFP' }),
      offer('PRD-04', 1890, {
        brand: 'Epson',
        spec: '4 100 lúmenes, WXGA',
        leadDays: 12,
        availability: 'Importación',
      }),
      offer('PRD-05', 3500, { availability: 'Según cronograma' }),
    ],
    {
      budgetId: 'PR2604-0019',
      attachment: { fileName: 'Cotizacion Computo Chachani.pdf', type: 'PDF' },
    }
  ),
  cotizacion(
    'COT-26-005',
    'PROV-JY-007',
    '2026-04-16',
    '2026-05-16',
    [
      offer('PRD-01', 3050, {
        brand: 'HP',
        spec: 'Core i5-1340P, 16 GB, SSD 512 GB, monitor 23,8"',
        leadDays: 3,
      }),
      offer('PRD-02', 1990, { brand: 'LG', spec: '55" 4K, 2 HDMI', leadDays: 3 }),
      offer('PRD-03', 1320, { brand: 'TP-Link', spec: '24 × 1 Gb, 4 SFP', leadDays: 3 }),
      offer('PRD-04', 1750, { brand: 'Epson', spec: '4 000 lúmenes, WXGA', leadDays: 3 }),
    ],
    {
      budgetId: 'PR2604-0019',
      attachment: { fileName: 'COT-TED-0416.jpg', type: 'Imagen' },
      conditions: 'Precios sin IGV. Garantía de 3 años.',
    }
  ),
  cotizacion(
    'COT-26-006',
    'PROV-JY-001',
    '2026-06-10',
    '2026-07-10',
    [
      offer('MAT-01', 2.25, { brand: 'Indeco' }),
      offer('MAT-03', 15.1, { brand: 'Indeco' }),
      offer('MAT-07', 59.5, { brand: 'Schneider Electric' }),
    ],
    { notes: 'Actualización de precios de conductores.' }
  ),
];

// Partida helpers: titles have no APU; leaf partidas carry metrado and APU.
/* @__NO_SIDE_EFFECTS__ */
const titulo = (code, description) => ({ code, description, unit: '', quantity: null, apu: null });
/* @__NO_SIDE_EFFECTS__ */
const partida = (code, description, unit, quantity, apuYield, resources) => ({
  code,
  description,
  unit,
  quantity,
  apu: { yield: apuYield, resources },
});
/* @__NO_SIDE_EFFECTS__ */
const crew = (productId, value) => ({ product: productId, crew: value });
/* @__NO_SIDE_EFFECTS__ */
const qty = (productId, value) => ({ product: productId, qty: value });
const TOOLS = { product: 'EQ-01', percentOfLabour: 3 };
/* @__NO_SIDE_EFFECTS__ */
const version = (number, date, responsibleId, status, comment, amount = null) => ({
  version: number,
  date,
  responsibleId,
  status,
  comment,
  amount,
});

const BUDGETS = [
  {
    id: 'PR2602-0008',
    type: 'A',
    title: 'Supervisión de obra vial Tramo Sur',
    projectId: 'PY-26-001',
    clientId: 'CLI-JY-001',
    initials: 'GM',
    responsibleId: 'PER-JY-001',
    date: '2026-02-12',
    version: 2,
    status: 'Aceptado',
    overheadPct: 10,
    profitPct: 8,
    selections: { 'EQ-02': 'COT-26-001', 'EQ-03': 'COT-26-001' },
    documentId: 'DOC-PR2602-0008',
    versions: [
      version(
        1,
        '2026-02-05',
        'PER-JY-001',
        'Reemplazado',
        'Primera propuesta con 10 meses de supervisión.',
        253410
      ),
      version(
        2,
        '2026-02-12',
        'PER-JY-001',
        'Aceptado',
        'Plazo ajustado a 8 meses según bases del cliente.'
      ),
    ],
    partidas: [
      titulo('01', 'SUPERVISIÓN DE OBRA'),
      partida('01.01', 'Ingeniero supervisor', 'mes', 8, null, [qty('MO-04', 104)]),
      partida('01.02', 'Asistente de supervisión', 'mes', 8, null, [qty('MO-05', 120)]),
      partida('01.03', 'Movilidad: camioneta 4×4', 'mes', 8, null, [qty('EQ-03', 12)]),
      partida('01.04', 'Topografía de control', 'día', 16, null, [
        qty('EQ-02', 1),
        qty('MO-03', 8),
      ]),
      titulo('02', 'INFORMES'),
      partida('02.01', 'Informe mensual de supervisión', 'und', 8, null, [
        qty('MO-04', 12),
        qty('EQ-04', 16),
      ]),
    ],
  },
  {
    id: 'PR2603-0014',
    type: 'A',
    title: 'Instalaciones eléctricas de local comercial',
    projectId: 'PY-26-002',
    clientId: 'CLI-JY-002',
    initials: 'GM',
    responsibleId: 'PER-JY-002',
    date: '2026-03-25',
    version: 1,
    status: 'Aceptado',
    overheadPct: 10,
    profitPct: 8,
    selections: {
      'MAT-01': 'COT-26-002',
      'MAT-02': 'COT-26-002',
      'MAT-03': 'COT-26-002',
      'MAT-06': 'COT-26-002',
      'MAT-07': 'COT-26-002',
      'MAT-08': 'COT-26-003',
      'MAT-10': 'COT-26-002',
    },
    documentId: 'DOC-PR2603-0014',
    versions: [
      version(1, '2026-03-25', 'PER-JY-002', 'Aceptado', 'Presupuesto según planos del cliente.'),
    ],
    partidas: [
      titulo('01', 'OBRAS PRELIMINARES'),
      partida('01.01', 'Trazo y replanteo de recorridos', 'm', 420, 120, [
        crew('MO-01', 1),
        crew('MO-03', 1),
        TOOLS,
      ]),
      titulo('02', 'INSTALACIONES ELÉCTRICAS'),
      titulo('02.01', 'SALIDAS'),
      partida('02.01.01', 'Salida para tomacorriente doble', 'pto', 180, 8, [
        crew('MO-01', 1),
        crew('MO-02', 1),
        qty('MAT-02', 12),
        qty('MAT-04', 2),
        qty('MAT-05', 1),
        qty('MAT-06', 1),
        qty('MAT-10', 0.1),
        TOOLS,
      ]),
      partida('02.01.02', 'Salida para alumbrado', 'pto', 220, 10, [
        crew('MO-01', 1),
        crew('MO-02', 1),
        qty('MAT-01', 10),
        qty('MAT-04', 2),
        qty('MAT-05', 1),
        qty('MAT-10', 0.1),
        TOOLS,
      ]),
      titulo('02.02', 'ALIMENTADORES Y TABLEROS'),
      partida('02.02.01', 'Alimentador 3-1×16 mm²', 'm', 450, 60, [
        crew('MO-01', 1),
        crew('MO-03', 1),
        qty('MAT-03', 3.15),
        TOOLS,
      ]),
      partida('02.02.02', 'Tablero de distribución TD', 'und', 6, 1, [
        crew('MO-01', 1),
        crew('MO-02', 1),
        qty('MAT-08', 1),
        qty('MAT-07', 8),
        TOOLS,
      ]),
      titulo('02.03', 'ILUMINACIÓN'),
      partida('02.03.01', 'Montaje de luminaria LED 60×60', 'und', 120, 12, [
        crew('MO-01', 1),
        crew('MO-03', 1),
        qty('MAT-09', 1),
        TOOLS,
      ]),
      titulo('03', 'PRUEBAS Y PUESTA EN SERVICIO'),
      partida('03.01', 'Pruebas de aislamiento y continuidad', 'glb', 1, 1, [
        crew('MO-01', 2),
        crew('MO-04', 0.5),
        TOOLS,
      ]),
    ],
  },
  {
    id: 'PR2604-0019',
    type: 'B',
    title: 'Equipamiento tecnológico de aulas',
    projectId: 'PY-26-003',
    clientId: 'CLI-JY-003',
    initials: 'GM',
    responsibleId: 'PER-JY-003',
    date: '2026-04-20',
    version: 1,
    status: 'Aceptado',
    overheadPct: 8,
    profitPct: 10,
    selections: {
      'PRD-01': 'COT-26-004',
      'PRD-02': 'COT-26-005',
      'PRD-03': 'COT-26-004',
      'PRD-04': 'COT-26-005',
      'PRD-05': 'COT-26-004',
    },
    documentId: 'DOC-PR2604-0019',
    versions: [
      version(
        1,
        '2026-04-20',
        'PER-JY-003',
        'Aceptado',
        'Equipamiento de 6 aulas según requerimiento del colegio.'
      ),
    ],
    products: [
      {
        id: 'B-01',
        productId: 'PRD-01',
        request: 'Computadora para sala de cómputo',
        quantity: 12,
      },
      { id: 'B-02', productId: 'PRD-02', request: 'Pantalla para aula', quantity: 6 },
      { id: 'B-03', productId: 'PRD-03', request: 'Switch para red de aulas', quantity: 2 },
      {
        id: 'B-04',
        productId: 'PRD-04',
        request: 'Proyector para auditorio y laboratorios',
        quantity: 4,
      },
      {
        id: 'B-05',
        productId: 'PRD-05',
        request: 'Instalación, cableado y configuración',
        quantity: 1,
      },
    ],
  },
  {
    id: 'PR2606-0022',
    type: 'A',
    title: 'Expediente técnico de redes eléctricas',
    projectId: 'PY-26-004',
    clientId: 'CLI-JY-004',
    initials: 'GM',
    responsibleId: 'PER-JY-001',
    date: '2026-06-24',
    version: 2,
    status: 'En revisión',
    overheadPct: 12,
    profitPct: 10,
    selections: { 'EQ-02': 'COT-26-001' },
    documentId: 'DOC-PR2606-0022',
    versions: [
      version(
        1,
        '2026-06-10',
        'PER-JY-001',
        'Reemplazado',
        'Primera propuesta: 18 láminas.',
        68120
      ),
      version(
        2,
        '2026-06-24',
        'PER-JY-001',
        'En revisión',
        'Planos ampliados a 24 láminas y GG de 12 %.'
      ),
    ],
    partidas: [
      titulo('01', 'ESTUDIOS PRELIMINARES'),
      partida('01.01', 'Levantamiento topográfico de redes', 'km', 6, null, [
        qty('EQ-02', 1.5),
        qty('MO-03', 12),
        qty('MO-06', 6),
      ]),
      titulo('02', 'DISEÑO'),
      partida('02.01', 'Memoria de cálculo eléctrico', 'glb', 1, null, [
        qty('MO-06', 160),
        qty('EQ-04', 160),
      ]),
      partida('02.02', 'Planos de redes de media y baja tensión', 'lám', 24, null, [
        qty('MO-07', 16),
        qty('MO-06', 4),
        qty('EQ-04', 16),
      ]),
      titulo('03', 'EXPEDIENTE TÉCNICO'),
      partida('03.01', 'Especificaciones técnicas y metrados', 'glb', 1, null, [
        qty('MO-06', 90),
        qty('MO-07', 60),
        qty('EQ-04', 120),
      ]),
      partida('03.02', 'Presupuesto y análisis de precios unitarios', 'glb', 1, null, [
        qty('MO-06', 70),
        qty('EQ-04', 70),
      ]),
    ],
  },
];

// Budget figures come from their partidas or products: the project budget is
// the total of its accepted (or current) budget, so every view agrees.
/* @__NO_SIDE_EFFECTS__ */
function withBudgetFigures(data) {
  const ctx = { products: data.products, quotes: data.quotes };
  for (const budget of data.budgets) {
    budget.amount = budgetTotals(ctx, budget).total;
    for (const entry of budget.versions) if (entry.amount === null) entry.amount = budget.amount;
    const project = data.projects.find((item) => item.budgetId === budget.id);
    if (project) project.budgetAmount = budget.amount;
  }
  return data;
}

// Personal (R5). How J&Y really books personnel cost:
// - office and field staff on payroll: Contabilidad imputes an estimated % of
//   each person's monthly cost to projects (it is not computed from hours);
// - temporary staff and external specialists: recibos por honorarios (RxH).
// Attendance comes from the ZKTeco SF100 (today exported to Excel) and the
// field tareo is a signed list per project; neither produces cost by itself.
/* @__NO_SIDE_EFFECTS__ */
const planilla = (month, workerId, cost, imputations) => ({
  month,
  workerId,
  cost,
  imputations: imputations.map(([projectId, percent]) => ({ projectId, percent })),
});
// Built inside a pure call so the other presentations drop it.
const PAYROLL = /* @__PURE__ */ (() => [
  planilla('2026-04', 'PER-JY-001', 6800, [
    ['PY-26-001', 40],
    ['PY-26-002', 20],
  ]),
  planilla('2026-04', 'PER-JY-002', 5600, [['PY-26-001', 100]]),
  planilla('2026-04', 'PER-JY-003', 4200, [['PY-26-001', 5]]),
  planilla('2026-04', 'PER-JY-004', 3400, [
    ['PY-26-001', 50],
    ['PY-26-002', 50],
  ]),
  planilla('2026-04', 'PER-JY-005', 5200, [
    ['PY-26-001', 5],
    ['PY-26-002', 5],
  ]),
  ...['2026-05', '2026-06'].flatMap((month) => [
    planilla(month, 'PER-JY-001', 6800, [
      ['PY-26-001', 30],
      ['PY-26-002', 20],
      ['PY-26-003', 10],
    ]),
    planilla(month, 'PER-JY-002', 5600, [['PY-26-001', 100]]),
    planilla(month, 'PER-JY-003', 4200, [
      ['PY-26-001', 5],
      ['PY-26-003', 10],
    ]),
    planilla(month, 'PER-JY-004', 3400, [
      ['PY-26-001', 40],
      ['PY-26-002', 60],
    ]),
    planilla(month, 'PER-JY-005', 5200, [
      ['PY-26-001', 5],
      ['PY-26-002', 5],
      ['PY-26-003', 5],
    ]),
  ]),
])();

/* @__NO_SIDE_EFFECTS__ */
const honorarios = (id, number, person, docId, workerId, projectId, concept, date, amount) => ({
  id,
  number,
  person,
  docId,
  workerId,
  projectId,
  concept,
  date,
  amount,
});
const RXH = [
  honorarios(
    'RXH-26-001',
    'E001-15',
    'Pedro Mamani',
    '10000000261',
    'PER-JY-006',
    'PY-26-001',
    'Maestro de obra · mayo 2026',
    '2026-05-31',
    3500
  ),
  honorarios(
    'RXH-26-002',
    'E001-16',
    'Pedro Mamani',
    '10000000261',
    'PER-JY-006',
    'PY-26-001',
    'Maestro de obra · junio 2026',
    '2026-06-30',
    3800
  ),
  honorarios(
    'RXH-26-003',
    'E001-4',
    'Marco Ticona',
    '10456123781',
    null,
    'PY-26-002',
    'Diseño de tablero especial TD-02',
    '2026-06-15',
    2200
  ),
];

const WORKDAYS = [
  '2026-07-06',
  '2026-07-07',
  '2026-07-08',
  '2026-07-09',
  '2026-07-10',
  '2026-07-13',
  '2026-07-14',
];
// Office attendance from the SF100 export (entry, exit; '' = no mark).
/* @__NO_SIDE_EFFECTS__ */
const marca = (workerId, date, start, end) => ({
  id: `ASI-${workerId.slice(-3)}-${date.slice(5).replace('-', '')}`,
  workerId,
  date,
  start,
  end,
  source: 'SF100 · exportado a Excel',
});
// Built inside a pure call so the other presentations drop it.
const ATTENDANCE = /* @__PURE__ */ (() => [
  ...WORKDAYS.map((date, index) =>
    marca('PER-JY-001', date, index === 4 ? '' : `07:5${index}`, index === 4 ? '' : '17:40')
  ),
  ...WORKDAYS.map((date, index) =>
    marca('PER-JY-003', date, `08:0${index % 3}`, index === 3 ? '' : '17:35')
  ),
  ...WORKDAYS.map((date, index) => marca('PER-JY-005', date, `08:1${index % 4}`, '17:30')),
])();

// Field tareo by project: one row per worker and day, signed or not.
/* @__NO_SIDE_EFFECTS__ */
const tareo = (workerId, projectId, date, shift, signed, recordedBy, note = '') => ({
  id: `TAR-${projectId.slice(-3)}-${workerId.slice(-3)}-${date.slice(5).replace('-', '')}`,
  workerId,
  projectId,
  date,
  shift,
  signed,
  recordedBy,
  note,
});
// Built inside a pure call so the other presentations drop it.
const TAREO = /* @__PURE__ */ (() => [
  ...WORKDAYS.map((date) => tareo('PER-JY-002', 'PY-26-001', date, 'Completa', true, 'PER-JY-002')),
  ...WORKDAYS.map((date, index) =>
    tareo(
      'PER-JY-006',
      'PY-26-001',
      date,
      index === 4 ? 'Media' : 'Completa',
      index !== 2,
      'PER-JY-002',
      index === 4 ? 'Retiro a mediodía por lluvia.' : ''
    )
  ),
  ...WORKDAYS.slice(0, 3).map((date) =>
    tareo('PER-JY-004', 'PY-26-001', date, 'Completa', true, 'PER-JY-002')
  ),
  ...WORKDAYS.slice(3).map((date, index) =>
    tareo(
      'PER-JY-004',
      'PY-26-002',
      date,
      'Completa',
      index !== 2,
      'PER-JY-001',
      index === 0 ? 'Montaje de tableros.' : ''
    )
  ),
])();

const SF100 = {
  model: 'ZKTeco SF100',
  location: 'Oficina principal',
  status: 'No integrado',
  today: 'Los registros se descargan del equipo y se exportan a Excel.',
  lastExport: '2026-07-14',
  workers: 3,
};

const MONTH_LABELS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'setiembre',
  'octubre',
  'noviembre',
  'diciembre',
];
const monthEnd = (month) => {
  const [year, number] = month.split('-').map(Number);
  return new Date(Date.UTC(year, number, 0)).toISOString().slice(0, 10);
};
// Personnel cost operations: imputed payroll per project and month, and RxH.
/* @__NO_SIDE_EFFECTS__ */
function personnelOperations() {
  const totals = new Map();
  for (const entry of PAYROLL) {
    for (const item of entry.imputations) {
      const key = `${entry.month}|${item.projectId}`;
      totals.set(
        key,
        Math.round(((totals.get(key) || 0) + (entry.cost * item.percent) / 100) * 100) / 100
      );
    }
  }
  const payroll = [...totals].map(([key, amount]) => {
    const [month, projectId] = key.split('|');
    const [year, number] = month.split('-');
    const id = `PLA-${year.slice(2)}${number}-${projectId.slice(-3)}`;
    return operation(id, projectId, 'payroll', amount, 'personnel', {
      status: 'Imputada',
      date: monthEnd(month),
      category: 'Planilla',
      description: `Planilla imputada · ${MONTH_LABELS[Number(number) - 1]} ${year}`,
      label: `Planilla ${MONTH_LABELS[Number(number) - 1].slice(0, 3)}. ${year}`,
    });
  });
  const rxh = RXH.map((item) =>
    operation(item.id, item.projectId, 'rxh', item.amount, 'personnel', {
      workerId: item.workerId,
      status: 'Registrado',
      date: item.date,
      category: 'Servicio',
      description: item.concept,
      label: `RxH ${item.number}`,
    })
  );
  return [...payroll, ...rxh];
}

// Integraciones (R5): what would connect to the platform, how it is done today
// and its honest state. None is operational.
const INTEGRATIONS = [
  {
    id: 'sf100',
    name: 'ZKTeco SF100',
    icon: 'bi-fingerprint',
    purpose: 'Asistencia de la oficina',
    status: 'No integrado',
    today: 'Los registros se descargan del equipo y se exportan a Excel.',
    proposal: 'Sincronizar las marcaciones con la plataforma y generar incidencias.',
    flow: ['SF100', 'Sincronización', 'Asistencia', 'Incidencias'],
    href: './personnel.html?tab=asistencia',
    link: 'Ver asistencia',
    priority: 'Alta',
  },
  {
    id: 'ocr',
    name: 'Lectura de comprobantes (OCR)',
    icon: 'bi-receipt',
    purpose: 'Rendiciones',
    status: 'Propuesta',
    today: 'Los datos del comprobante se digitan a mano desde la foto.',
    proposal: 'Leer RUC, fecha, serie, número e importes y proponerlos para revisión humana.',
    flow: ['Foto o PDF', 'OCR', 'Datos sugeridos', 'Revisión'],
    href: './expenses.html',
    link: 'Ver rendiciones',
    priority: 'Alta',
  },
  {
    id: 'ia',
    name: 'Clasificación asistida',
    icon: 'bi-stars',
    purpose: 'Rendiciones y costos',
    status: 'Propuesta',
    today: 'La clasificación del gasto se asigna manualmente.',
    proposal: 'Sugerir la categoría del gasto; la persona confirma o corrige y queda la traza.',
    flow: ['Gasto', 'Sugerencia', 'Confirmación', 'Costo'],
    href: './costs.html',
    link: 'Ver costos',
    priority: 'Media',
  },
  {
    id: 'files',
    name: 'Almacenamiento documental',
    icon: 'bi-folder2-open',
    purpose: 'Comprobantes, cotizaciones y documentos',
    status: 'Propuesta',
    today: 'Archivos en carpetas, correo y WhatsApp; parte en papel.',
    proposal: 'Guardar cada archivo vinculado a su proyecto y a su registro de origen.',
    flow: ['Archivo', 'Registro', 'Proyecto', 'Consulta'],
    href: './documents.html',
    link: 'Ver documentos',
    priority: 'Alta',
  },
  {
    id: 'accounting',
    name: 'Contabilidad',
    icon: 'bi-journal-text',
    purpose: 'Intercambio con Contabilidad',
    status: 'Por definir',
    today: 'Las rendiciones y la información se envían en archivos digitales.',
    proposal: 'Exportar rendiciones aceptadas y costos en el formato que use Contabilidad.',
    flow: ['Rendición aceptada', 'Exportación', 'Contabilidad'],
    href: './costs.html',
    link: 'Ver J&Y Real y tratamiento',
    priority: 'Media',
  },
  {
    id: 'mail',
    name: 'Correo y notificaciones',
    icon: 'bi-envelope',
    purpose: 'Avisos de pendientes',
    status: 'Opcional',
    today: 'Los avisos se dan por WhatsApp o en persona.',
    proposal: 'Avisar por correo de rendiciones observadas o presupuestos por revisar.',
    flow: ['Pendiente', 'Aviso', 'Responsable'],
    href: './approvals.html',
    link: 'Ver pendientes',
    priority: 'Baja',
  },
];

// Evidence the "Tomar foto / Subir archivo" buttons use in the demonstration.
const EXPENSE_SAMPLES = [
  gasto(
    'MUESTRA-1',
    '2026-07-13',
    'factura',
    doc('ferreteria', 'F001', '00008377'),
    'Cinta aislante y terminales',
    'Suministro',
    taxed(84.96),
    {
      confidence: { ruc: 'media' },
    }
  ),
  gasto(
    'MUESTRA-2',
    '2026-07-13',
    'boleta-foto',
    doc('fogon', 'B001', '0003187'),
    'Almuerzos de cuadrilla (2)',
    'Alimentación',
    taxed(38),
    {
      suggested: { total: 33, vv: 27.97, igv: 5.03 },
      confidence: { total: 'baja', vv: 'baja', igv: 'baja' },
    }
  ),
  gasto(
    'MUESTRA-3',
    '2026-07-14',
    'yape',
    {},
    'Mototaxi a obra',
    'Movilidad',
    { total: 12 },
    {
      payee: 'Mototaxi Ayala',
      operationCode: '05561204',
    }
  ),
  gasto(
    'MUESTRA-4',
    '2026-07-14',
    'transferencia',
    {},
    'Pago a soldador eventual',
    'Servicio',
    { total: 250 },
    {
      payee: 'Wilber Huanca',
      operationCode: '00731266',
      account: 'Cta. *** 2214',
      suggestedCategory: 'Planilla',
    }
  ),
  gasto(
    'MUESTRA-5',
    '2026-07-14',
    'factura',
    doc('hostal', 'F001', '00000412'),
    'Hospedaje 1 noche',
    'Hospedaje',
    taxed(90)
  ),
];

const COST_STATUSES = ['Aceptada', 'Entregada a Contabilidad'];
/* @__NO_SIDE_EFFECTS__ */
const expenseOperation = (report) =>
  operation(
    report.id,
    report.projectId,
    'expense',
    Math.round(report.items.reduce((sum, item) => sum + item.total, 0) * 100) / 100,
    COST_STATUSES.includes(report.status) ? 'expenses' : null,
    {
      workerId: report.workerId,
      status: report.status,
      date: report.date,
      label: `N.º ${report.number}-${report.year}`,
    }
  );

function buildJyDemoData() {
  return withBudgetFigures({
    id: 'jy-demo',
    fictitious: true,
    // Reference "today" of the scenario and the date used by sample receipts.
    today: '2026-07-15',
    exampleDate: '2026-07-06',
    clients: [
      {
        id: 'CLI-JY-001',
        name: 'Consorcio Vial Altiplano S.A.C.',
        tradeName: 'Consorcio Vial Altiplano',
        ruc: '20610000101',
        sector: 'Infraestructura vial',
        address: 'Av. Los Incas 410, Cercado, Arequipa',
        phone: '(054) 600 101',
        email: 'proyectos@vialaltiplano.pe',
        status: 'Activo',
        since: '2025-11-03',
        contacts: [
          {
            name: 'Ricardo Paredes',
            role: 'Gerente de obra',
            phone: '987 000 101',
            email: 'rparedes@vialaltiplano.pe',
            primary: true,
          },
          {
            name: 'Lucía Valdivia',
            role: 'Administración',
            phone: '987 000 102',
            email: 'lvaldivia@vialaltiplano.pe',
            primary: false,
          },
        ],
        history: [
          event('2025-11-03', 'Rosa Huamán', 'Registró el cliente'),
          event('2026-02-20', 'María Salazar', 'Asoció el proyecto PY-26-001'),
          event('2026-05-12', 'Rosa Huamán', 'Actualizó el contacto de administración'),
        ],
      },
      {
        id: 'CLI-JY-002',
        name: 'Inversiones Comerciales Misti S.A.C.',
        tradeName: 'Centro Comercial Misti',
        ruc: '20610000102',
        sector: 'Comercio',
        address: 'Calle Mercaderes 225, Cercado, Arequipa',
        phone: '(054) 600 102',
        email: 'mantenimiento@comercialmisti.pe',
        status: 'Activo',
        since: '2026-01-14',
        contacts: [
          {
            name: 'Andrea Linares',
            role: 'Jefa de mantenimiento',
            phone: '987 000 201',
            email: 'alinares@comercialmisti.pe',
            primary: true,
          },
        ],
        history: [
          event('2026-01-14', 'Rosa Huamán', 'Registró el cliente'),
          event('2026-03-25', 'José Vargas', 'Asoció el proyecto PY-26-002'),
        ],
      },
      {
        id: 'CLI-JY-003',
        name: 'Asociación Educativa Los Andes',
        tradeName: 'Colegio Los Andes',
        ruc: '20610000103',
        sector: 'Educación',
        address: 'Av. Ejército 1180, Yanahuara, Arequipa',
        phone: '(054) 600 103',
        email: 'logistica@colegiolosandes.pe',
        status: 'Activo',
        since: '2026-03-02',
        contacts: [
          {
            name: 'Héctor Cárdenas',
            role: 'Coordinador de logística',
            phone: '987 000 301',
            email: 'hcardenas@colegiolosandes.pe',
            primary: true,
          },
          {
            name: 'Patricia Ugarte',
            role: 'Dirección administrativa',
            phone: '987 000 302',
            email: 'pugarte@colegiolosandes.pe',
            primary: false,
          },
        ],
        history: [
          event('2026-03-02', 'Rosa Huamán', 'Registró el cliente'),
          event('2026-04-22', 'Rosa Huamán', 'Asoció el proyecto PY-26-003'),
        ],
      },
      {
        id: 'CLI-JY-004',
        name: 'Constructora Horizonte Sur S.A.C.',
        tradeName: 'Horizonte Sur',
        ruc: '20610000104',
        sector: 'Construcción',
        address: 'Urb. La Campiña Mz. C Lt. 7, Paucarpata, Arequipa',
        phone: '(054) 600 104',
        email: 'licitaciones@horizontesur.pe',
        status: 'Activo',
        since: '2026-05-18',
        contacts: [
          {
            name: 'Gonzalo Pinto',
            role: 'Jefe de licitaciones',
            phone: '987 000 401',
            email: 'gpinto@horizontesur.pe',
            primary: true,
          },
        ],
        history: [
          event('2026-05-18', 'María Salazar', 'Registró el cliente'),
          event('2026-06-29', 'María Salazar', 'Asoció el proyecto PY-26-004'),
        ],
      },
      {
        id: 'CLI-JY-005',
        name: 'Agroexportadora Valle Verde S.A.C.',
        tradeName: 'Valle Verde',
        ruc: '20610000105',
        sector: 'Agroindustria',
        address: 'Carretera a Majes km 12, Uchumayo, Arequipa',
        phone: '(054) 600 105',
        email: 'operaciones@valleverde.pe',
        status: 'Inactivo',
        since: '2025-08-11',
        contacts: [
          {
            name: 'Silvia Mendoza',
            role: 'Jefa de operaciones',
            phone: '987 000 501',
            email: 'smendoza@valleverde.pe',
            primary: true,
          },
        ],
        history: [
          event('2025-08-11', 'Rosa Huamán', 'Registró el cliente'),
          event(
            '2026-01-30',
            'Rosa Huamán',
            'Marcó el cliente como inactivo',
            'Sin proyectos en curso.'
          ),
        ],
      },
    ],
    suppliers: [
      {
        id: 'PROV-JY-001',
        name: 'Suministros Eléctricos Andinos S.A.C.',
        tradeName: 'Eléctricos Andinos',
        ruc: '20610000201',
        specialty: 'Materiales eléctricos',
        brands: ['Indeco', 'Schneider Electric', 'Bticino'],
        categories: ['Conductores', 'Tableros', 'Accesorios eléctricos'],
        address: 'Av. Parra 318, Cercado, Arequipa',
        phone: '(054) 610 201',
        email: 'ventas@electricosandinos.pe',
        status: 'Activo',
        since: '2025-06-10',
        contacts: [
          {
            name: 'Marco Delgado',
            role: 'Ejecutivo de ventas',
            phone: '988 000 201',
            email: 'mdelgado@electricosandinos.pe',
            primary: true,
          },
        ],
        offerings: [
          {
            name: 'Cable NH-80 2,5 mm²',
            kind: 'Producto',
            brand: 'Indeco',
            category: 'Conductores',
            unit: 'rollo',
          },
          {
            name: 'Interruptor termomagnético 2×32 A',
            kind: 'Producto',
            brand: 'Schneider Electric',
            category: 'Tableros',
            unit: 'und',
          },
          {
            name: 'Tomacorriente doble con línea a tierra',
            kind: 'Producto',
            brand: 'Bticino',
            category: 'Accesorios eléctricos',
            unit: 'und',
          },
        ],
        history: [
          event('2025-06-10', 'Rosa Huamán', 'Registró el proveedor'),
          event('2026-04-14', 'José Vargas', 'Emitida OC-26-001'),
        ],
      },
      {
        id: 'PROV-JY-002',
        name: 'Equipos y Herramientas del Sur S.A.C.',
        tradeName: 'Equipos del Sur',
        ruc: '20610000202',
        specialty: 'Alquiler de equipos y herramientas',
        brands: ['Hilti', 'Bosch', 'Leica'],
        categories: ['Alquiler de equipos', 'Herramientas'],
        address: 'Av. Aviación 1450, Cerro Colorado, Arequipa',
        phone: '(054) 610 202',
        email: 'alquileres@equiposdelsur.pe',
        status: 'Activo',
        since: '2025-09-01',
        contacts: [
          {
            name: 'Diana Coaguila',
            role: 'Atención a empresas',
            phone: '988 000 202',
            email: 'dcoaguila@equiposdelsur.pe',
            primary: true,
          },
        ],
        offerings: [
          {
            name: 'Alquiler de estación total',
            kind: 'Servicio',
            brand: 'Leica',
            category: 'Alquiler de equipos',
            unit: 'día',
          },
          {
            name: 'Rotomartillo SDS Plus',
            kind: 'Producto',
            brand: 'Bosch',
            category: 'Herramientas',
            unit: 'und',
          },
        ],
        history: [
          event('2025-09-01', 'Rosa Huamán', 'Registró el proveedor'),
          event('2026-07-06', 'María Salazar', 'Solicitada OC-26-004'),
        ],
      },
      {
        id: 'PROV-JY-003',
        name: 'Tableros y Montajes Industriales E.I.R.L.',
        tradeName: 'Tableros y Montajes',
        ruc: '20610000203',
        specialty: 'Fabricación de tableros e instalación',
        brands: ['Schneider Electric', 'ABB'],
        categories: ['Tableros', 'Servicios de instalación'],
        address: 'Parque Industrial Mz. F Lt. 12, Cercado, Arequipa',
        phone: '(054) 610 203',
        email: 'proyectos@tablerosymontajes.pe',
        status: 'Activo',
        since: '2026-02-16',
        contacts: [
          {
            name: 'Óscar Benavente',
            role: 'Jefe de taller',
            phone: '988 000 203',
            email: 'obenavente@tablerosymontajes.pe',
            primary: true,
          },
        ],
        offerings: [
          {
            name: 'Tablero de distribución autosoportado',
            kind: 'Producto',
            brand: 'ABB',
            category: 'Tableros',
            unit: 'und',
          },
          {
            name: 'Montaje e instalación de tableros',
            kind: 'Servicio',
            brand: '—',
            category: 'Servicios de instalación',
            unit: 'servicio',
          },
        ],
        history: [
          event('2026-02-16', 'Rosa Huamán', 'Registró el proveedor'),
          event('2026-05-08', 'José Vargas', 'Emitida OC-26-002'),
        ],
      },
      {
        id: 'PROV-JY-004',
        name: 'Cómputo y Redes Chachani S.A.C.',
        tradeName: 'Cómputo Chachani',
        ruc: '20610000204',
        specialty: 'Equipos de cómputo y redes',
        brands: ['Lenovo', 'HP', 'Cisco', 'Samsung'],
        categories: ['Computadoras', 'Redes', 'Pantallas'],
        address: 'Av. Goyeneche 330, Cercado, Arequipa',
        phone: '(054) 610 204',
        email: 'corporativo@computochachani.pe',
        status: 'Activo',
        since: '2026-03-20',
        contacts: [
          {
            name: 'Fiorella Salas',
            role: 'Ventas corporativas',
            phone: '988 000 204',
            email: 'fsalas@computochachani.pe',
            primary: true,
          },
          {
            name: 'Iván Torres',
            role: 'Soporte técnico',
            phone: '988 000 205',
            email: 'itorres@computochachani.pe',
            primary: false,
          },
        ],
        offerings: [
          {
            name: 'Computadora de escritorio Core i5, 16 GB',
            kind: 'Producto',
            brand: 'Lenovo',
            category: 'Computadoras',
            unit: 'und',
          },
          {
            name: 'Switch administrable 24 puertos',
            kind: 'Producto',
            brand: 'Cisco',
            category: 'Redes',
            unit: 'und',
          },
          {
            name: 'Televisor LED 55"',
            kind: 'Producto',
            brand: 'Samsung',
            category: 'Pantallas',
            unit: 'und',
          },
        ],
        history: [
          event('2026-03-20', 'Rosa Huamán', 'Registró el proveedor'),
          event('2026-05-27', 'Rosa Huamán', 'Emitida OC-26-003'),
        ],
      },
      {
        id: 'PROV-JY-005',
        name: 'Transportes Cordillera E.I.R.L.',
        tradeName: 'Transportes Cordillera',
        ruc: '20610000205',
        specialty: 'Transporte de carga y materiales',
        brands: [],
        categories: ['Transporte', 'Envíos'],
        address: 'Av. Jesús 920, Paucarpata, Arequipa',
        phone: '(054) 610 205',
        email: 'despachos@transcordillera.pe',
        status: 'Activo',
        since: '2025-10-07',
        contacts: [
          {
            name: 'Julio Apaza',
            role: 'Despachos',
            phone: '988 000 206',
            email: 'japaza@transcordillera.pe',
            primary: true,
          },
        ],
        offerings: [
          {
            name: 'Traslado de materiales a obra',
            kind: 'Servicio',
            brand: '—',
            category: 'Transporte',
            unit: 'viaje',
          },
        ],
        history: [event('2025-10-07', 'Rosa Huamán', 'Registró el proveedor')],
      },
      {
        id: 'PROV-JY-006',
        name: 'Laboratorio de Suelos Geotest S.A.C.',
        tradeName: 'Geotest',
        ruc: '20610000206',
        specialty: 'Ensayos de suelos y materiales',
        brands: [],
        categories: ['Ensayos de laboratorio'],
        address: 'Calle Bolognesi 512, Yanahuara, Arequipa',
        phone: '(054) 610 206',
        email: 'laboratorio@geotest.pe',
        status: 'Inactivo',
        since: '2025-04-22',
        contacts: [
          {
            name: 'Elena Quispe',
            role: 'Jefa de laboratorio',
            phone: '988 000 207',
            email: 'equispe@geotest.pe',
            primary: true,
          },
        ],
        offerings: [
          {
            name: 'Ensayo de compactación Proctor',
            kind: 'Servicio',
            brand: '—',
            category: 'Ensayos de laboratorio',
            unit: 'ensayo',
          },
        ],
        history: [
          event('2025-04-22', 'Rosa Huamán', 'Registró el proveedor'),
          event(
            '2026-02-02',
            'Rosa Huamán',
            'Marcó el proveedor como inactivo',
            'Pendiente de actualizar su ficha RUC.'
          ),
        ],
      },
      {
        id: 'PROV-JY-007',
        name: 'Tecnología Educativa del Sur S.A.C.',
        tradeName: 'TecEdu Sur',
        ruc: '20610000207',
        specialty: 'Equipamiento tecnológico educativo',
        brands: ['HP', 'LG', 'Epson', 'TP-Link'],
        categories: ['Computadoras', 'Pantallas', 'Redes'],
        address: 'Av. Lambramani 220, José Luis Bustamante y Rivero, Arequipa',
        phone: '(054) 610 207',
        email: 'ventas@tecedusur.pe',
        status: 'Activo',
        since: '2026-04-16',
        contacts: [
          {
            name: 'Renzo Valdez',
            role: 'Asesor comercial',
            phone: '988 000 208',
            email: 'rvaldez@tecedusur.pe',
            primary: true,
          },
        ],
        offerings: [
          {
            name: 'Computadora de escritorio',
            kind: 'Producto',
            brand: 'HP',
            category: 'Computadoras',
            unit: 'und',
          },
          {
            name: 'Televisor LED 55"',
            kind: 'Producto',
            brand: 'LG',
            category: 'Pantallas',
            unit: 'und',
          },
          {
            name: 'Proyector multimedia',
            kind: 'Producto',
            brand: 'Epson',
            category: 'Pantallas',
            unit: 'und',
          },
        ],
        history: [
          event(
            '2026-04-16',
            'Rosa Huamán',
            'Registró el proveedor',
            'Cotización COT-26-005 para el equipamiento de aulas.'
          ),
        ],
      },
    ],
    workers: [
      {
        id: 'PER-JY-001',
        name: 'María Salazar',
        dni: '00000021',
        role: 'Jefa de proyecto',
        area: 'Proyectos',
        status: 'Activo',
        kind: 'Oficina',
        regime: 'Planilla',
      },
      {
        id: 'PER-JY-002',
        name: 'José Vargas',
        dni: '00000022',
        role: 'Ingeniero de campo',
        area: 'Operaciones',
        status: 'Activo',
        kind: 'Campo',
        regime: 'Planilla',
      },
      {
        id: 'PER-JY-003',
        name: 'Rosa Huamán',
        dni: '00000023',
        role: 'Administradora',
        area: 'Administración',
        status: 'Activo',
        kind: 'Oficina',
        regime: 'Planilla',
      },
      {
        id: 'PER-JY-004',
        name: 'Luis Condori',
        dni: '00000024',
        role: 'Técnico electricista',
        area: 'Operaciones',
        status: 'Activo',
        kind: 'Campo',
        regime: 'Planilla',
      },
      {
        id: 'PER-JY-005',
        name: 'Carmen Ríos',
        dni: '00000025',
        role: 'Contadora',
        area: 'Contabilidad',
        status: 'Activo',
        kind: 'Oficina',
        regime: 'Planilla',
      },
      {
        id: 'PER-JY-006',
        name: 'Pedro Mamani',
        dni: '00000026',
        role: 'Maestro de obra',
        area: 'Operaciones',
        status: 'Activo',
        kind: 'Temporal',
        regime: 'RxH',
      },
    ],
    projects: [
      {
        id: 'PY-26-001',
        name: 'Supervisión de obra vial Tramo Sur',
        clientId: 'CLI-JY-001',
        managerId: 'PER-JY-001',
        budgetId: 'PR2602-0008',
        location: 'Yura, Arequipa',
        startDate: '2026-03-02',
        endDate: '2026-10-30',
        budgetAmount: 168000,
        progressPercent: 55,
        status: 'Activo',
      },
      {
        id: 'PY-26-002',
        name: 'Instalaciones eléctricas de local comercial',
        clientId: 'CLI-JY-002',
        managerId: 'PER-JY-002',
        budgetId: 'PR2603-0014',
        location: 'Cercado, Arequipa',
        startDate: '2026-04-06',
        endDate: '2026-09-30',
        budgetAmount: 96000,
        progressPercent: 42,
        status: 'Activo',
      },
      {
        id: 'PY-26-003',
        name: 'Equipamiento tecnológico de aulas',
        clientId: 'CLI-JY-003',
        managerId: 'PER-JY-003',
        budgetId: 'PR2604-0019',
        location: 'Yanahuara, Arequipa',
        startDate: '2026-05-04',
        endDate: '2026-08-28',
        budgetAmount: 54000,
        progressPercent: 38,
        status: 'Activo',
      },
      {
        id: 'PY-26-004',
        name: 'Expediente técnico de redes eléctricas',
        clientId: 'CLI-JY-004',
        managerId: 'PER-JY-001',
        budgetId: 'PR2606-0022',
        location: 'Paucarpata, Arequipa',
        startDate: '2026-08-03',
        endDate: '2026-12-18',
        budgetAmount: 72000,
        progressPercent: 0,
        status: 'Planificado',
      },
    ],
    opportunities: [],
    // Budget ids follow the observed code PR + AAMM + correlative. The version
    // and the initials suffix (V2-GM) are shown apart; their rules are still to
    // be validated with J&Y (R4 rebuilds this module).
    budgets: BUDGETS,
    products: PRODUCTS,
    quotes: QUOTES,
    payroll: PAYROLL,
    rxh: RXH,
    attendance: ATTENDANCE,
    tareo: TAREO,
    sf100: SF100,
    integrations: INTEGRATIONS,
    // The warehouse module is enabled for the Demo in R6.
    materials: [],
    expenseReports: EXPENSE_REPORTS,
    expenseSamples: EXPENSE_SAMPLES,
    operations: [
      operation('OC-26-001', 'PY-26-001', 'purchase', 38400, 'purchases', {
        quoteId: 'COT-26-002',
        receptionKind: 'Material',
        category: 'Suministro',
        description: 'Conductores y tableros para obra',
        supplierId: 'PROV-JY-001',
        status: 'Atendida',
        date: '2026-04-14',
      }),
      operation('AJ-26-001', 'PY-26-001', 'other', 1800, 'other', {
        category: 'Otros',
        description: 'Ajuste de costo registrado por Contabilidad',
        status: 'Registrado',
        date: '2026-05-31',
      }),
      operation('OC-26-004', 'PY-26-001', 'purchase', 6200, null, {
        quoteId: 'COT-26-001',
        receptionKind: 'Servicio',
        category: 'Servicio',
        description: 'Alquiler de estación total',
        supplierId: 'PROV-JY-002',
        status: 'Pendiente',
        date: '2026-07-06',
        documentId: null,
      }),

      operation('OC-26-002', 'PY-26-002', 'purchase', 21500, 'purchases', {
        quoteId: 'COT-26-003',
        receptionKind: 'Material',
        category: 'Suministro',
        description: 'Tablero autosoportado e instalación',
        supplierId: 'PROV-JY-003',
        status: 'Atendida',
        date: '2026-05-08',
      }),

      operation('OC-26-003', 'PY-26-003', 'purchase', 16900, 'purchases', {
        quoteId: 'COT-26-004',
        receptionKind: 'Material',
        category: 'Suministro',
        description: 'Equipos de cómputo y pantallas',
        supplierId: 'PROV-JY-004',
        status: 'Atendida',
        date: '2026-05-27',
      }),
      ...EXPENSE_REPORTS.map(expenseOperation),
      ...personnelOperations(),
    ],
  });
}

// Built lazily so the other presentations drop this data set entirely.
export const jyDemoData = /* @__PURE__ */ buildJyDemoData();
