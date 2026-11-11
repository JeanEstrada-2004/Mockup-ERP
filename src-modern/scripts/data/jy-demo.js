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
  return {
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
    budgets: [
      {
        id: 'PR2602-0008',
        projectId: 'PY-26-001',
        clientId: 'CLI-JY-001',
        version: 2,
        amount: 168000,
        status: 'Aprobado',
        documentId: 'DOC-PR2602-0008',
      },
      {
        id: 'PR2603-0014',
        projectId: 'PY-26-002',
        clientId: 'CLI-JY-002',
        version: 1,
        amount: 96000,
        status: 'Aprobado',
        documentId: 'DOC-PR2603-0014',
      },
      {
        id: 'PR2604-0019',
        projectId: 'PY-26-003',
        clientId: 'CLI-JY-003',
        version: 1,
        amount: 54000,
        status: 'Aprobado',
        documentId: 'DOC-PR2604-0019',
      },
      {
        id: 'PR2606-0022',
        projectId: 'PY-26-004',
        clientId: 'CLI-JY-004',
        version: 2,
        amount: 72000,
        status: 'En revisión',
        documentId: 'DOC-PR2606-0022',
      },
    ],
    // The warehouse module is enabled for the Demo in R6.
    materials: [],
    expenseReports: EXPENSE_REPORTS,
    expenseSamples: EXPENSE_SAMPLES,
    operations: [
      operation('OC-26-001', 'PY-26-001', 'purchase', 38400, 'purchases', {
      category: 'Suministro',
      description: 'Conductores y tableros para obra',
        supplierId: 'PROV-JY-001',
        status: 'Atendida',
        date: '2026-04-14',
      }),
      operation('TAR-26-001', 'PY-26-001', 'timesheet', 26800, 'personnel', {
      category: 'Planilla',
      description: 'Tareo de supervisión de campo',
        workerId: 'PER-JY-002',
        status: 'Aprobado',
        date: '2026-05-29',
      }),
      operation('AJ-26-001', 'PY-26-001', 'other', 1800, 'other', {
      category: 'Otros',
      description: 'Ajuste de costo registrado por Contabilidad',
        status: 'Registrado',
        date: '2026-05-31',
      }),
      operation('OC-26-004', 'PY-26-001', 'purchase', 6200, null, {
      category: 'Servicio',
      description: 'Alquiler de estación total',
        supplierId: 'PROV-JY-002',
        status: 'Pendiente',
        date: '2026-07-06',
        documentId: null,
      }),

      operation('OC-26-002', 'PY-26-002', 'purchase', 21500, 'purchases', {
      category: 'Suministro',
      description: 'Tablero autosoportado e instalación',
        supplierId: 'PROV-JY-003',
        status: 'Atendida',
        date: '2026-05-08',
      }),
      operation('TAR-26-002', 'PY-26-002', 'timesheet', 14200, 'personnel', {
      category: 'Planilla',
      description: 'Tareo de instalaciones eléctricas',
        workerId: 'PER-JY-004',
        status: 'Aprobado',
        date: '2026-06-30',
      }),

      operation('OC-26-003', 'PY-26-003', 'purchase', 16900, 'purchases', {
      category: 'Suministro',
      description: 'Equipos de cómputo y pantallas',
        supplierId: 'PROV-JY-004',
        status: 'Atendida',
        date: '2026-05-27',
      }),
      operation('TAR-26-003', 'PY-26-003', 'timesheet', 5400, 'personnel', {
      category: 'Planilla',
      description: 'Tareo de equipamiento de aulas',
        workerId: 'PER-JY-001',
        status: 'Aprobado',
        date: '2026-06-30',
      }),
      ...EXPENSE_REPORTS.map(expenseOperation),
    ],
  };
}

// Built lazily so the other presentations drop this data set entirely.
export const jyDemoData = /* @__PURE__ */ buildJyDemoData();
