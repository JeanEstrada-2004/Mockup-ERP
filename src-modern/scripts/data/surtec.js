// Fictitious presentation data. Amounts are soles and dates are ISO internally;
// the UI will format them as S/ and DD/MM/AAAA.
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

// Master-record helpers: contact and history entries of clients and suppliers.
/* @__NO_SIDE_EFFECTS__ */
const contact = (name, role, phone, email, primary = false) => ({ name, role, phone, email, primary });
/* @__NO_SIDE_EFFECTS__ */
const event = (date, user, action, note = '') => ({ date, user, action, note });

// Portfolio projects that complete the dashboard totals of the specification:
// 12 active projects (Activo + En riesgo) with S/ 1 245 000 budget and
// S/ 768 400 executed cost, plus one planned, one suspended and one closed.
// PR-2027-001/002/003 keep their detailed records below; these projects carry
// one operation per cost source so every sol still traces to a document.
const portfolio = [
  // id, name, client, manager, start, end, budget, executed, progress, status
  ['PR-2027-004', 'Cableado Estructurado Sede Arequipa', 'CLI-001', 'PER-004', '2027-01-18', '2027-05-31', 72000, 51300, 71, 'Activo'],
  ['PR-2027-005', 'Videovigilancia Planta Moquegua', 'CLI-002', 'PER-005', '2027-02-03', '2027-07-15', 118000, 79400, 64, 'Activo'],
  ['PR-2027-006', 'Data Center Modular', 'CLI-001', 'PER-004', '2027-01-25', '2027-08-29', 156000, 112600, 58, 'En riesgo'],
  ['PR-2027-007', 'Red Inalámbrica Hospitalaria', 'CLI-003', 'PER-002', '2027-02-14', '2027-06-30', 64000, 38900, 57, 'Activo'],
  ['PR-2027-008', 'Control de Accesos Corporativo', 'CLI-002', 'PER-001', '2027-02-20', '2027-06-15', 58000, 49950, 74, 'En riesgo'],
  ['PR-2027-009', 'Telecomunicaciones Campamento Minero', 'CLI-001', 'PER-005', '2027-03-01', '2027-09-30', 134000, 82100, 55, 'Activo'],
  ['PR-2027-010', 'Sistema de Detección de Incendios', 'CLI-003', 'PER-003', '2027-03-08', '2027-08-15', 87000, 41300, 46, 'Activo'],
  ['PR-2027-011', 'Migración de Servidores', 'CLI-004', 'PER-002', '2027-03-15', '2027-07-31', 66000, 31200, 44, 'Activo'],
  ['PR-2027-012', 'Automatización de Subestación', 'CLI-005', 'PER-005', '2027-03-22', '2027-09-15', 64000, 38500, 52, 'Activo'],
  ['PR-2027-013', 'Ampliación de Red de Fibra Óptica', 'CLI-004', 'PER-004', '2027-06-01', '2027-11-30', 92000, 0, 0, 'Planificado'],
  ['PR-2027-014', 'Sistema de Gestión Energética', 'CLI-005', 'PER-001', '2027-02-10', '2027-07-31', 48000, 9800, 20, 'Suspendido'],
  ['PR-2026-021', 'Renovación de Centro de Cómputo', 'CLI-003', 'PER-003', '2026-06-01', '2026-12-18', 120000, 116400, 100, 'Cerrado'],
];
const portfolioSuppliers = ['PROV-001', 'PROV-002', 'PROV-003'];

function shiftIso(iso, days) {
  const date = new Date(`${iso}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function portfolioOperations([id, , , managerId, start, , , executed, , status], index) {
  if (!executed) return [];
  const suffix = id.slice(-3);
  const purchases = Math.round(executed * 0.45);
  const personnel = Math.round(executed * 0.3);
  const expenses = Math.round(executed * 0.12);
  const other = executed - purchases - personnel - expenses;
  const closed = status === 'Cerrado';
  return [
    operation(`OC-${suffix}1`, id, 'purchase', purchases, 'purchases', {
      supplierId: portfolioSuppliers[index % 3],
      status: closed ? 'Cerrada' : 'Atendida',
      date: shiftIso(start, 20),
    }),
    operation(`TAR-${suffix}1`, id, 'timesheet', personnel, 'personnel', {
      workerId: managerId,
      status: 'Aprobado',
      date: shiftIso(start, 45),
    }),
    operation(`R-${suffix}1`, id, 'expense', expenses, 'expenses', {
      workerId: managerId,
      status: 'Aprobada',
      date: shiftIso(start, 30),
    }),
    operation(`AJ-${suffix}1`, id, 'other', other, 'other', {
      status: 'Registrado',
      date: shiftIso(start, 50),
    }),
  ];
}

const portfolioProjects = portfolio.map(
  ([id, name, clientId, managerId, startDate, endDate, budgetAmount, , progressPercent, status], index) => ({
    id,
    name,
    clientId,
    managerId,
    budgetId: `PRE-${String(index + 4).padStart(3, '0')}`,
    startDate,
    endDate,
    budgetAmount,
    progressPercent,
    status,
  })
);

const portfolioBudgets = portfolioProjects.map((project) => ({
  id: project.budgetId,
  projectId: project.id,
  clientId: project.clientId,
  version: 1,
  amount: project.budgetAmount,
  status: project.status === 'Planificado' ? 'En revisión' : 'Aprobado',
  documentId: `DOC-${project.budgetId}`,
}));

export const surtecData = {
  id: 'surtec',
  fictitious: true,
  // Reference "today" of the scenario and the date used by sample receipts.
  today: '2027-07-01',
  exampleDate: '2027-04-03',
  clients: [
    {
      id: 'CLI-001', name: 'Minera del Sur S.A.', tradeName: 'Minera del Sur', ruc: '20512345678',
      sector: 'Minería', address: 'Av. Mariscal Castilla 812, Cayma, Arequipa', phone: '(054) 380 120',
      email: 'proyectos@mineradelsur.pe', status: 'Activo', since: '2025-10-06',
      contacts: [
        contact('Jorge Rivera', 'Superintendente de TI', '989 100 101', 'jrivera@mineradelsur.pe', true),
        contact('Milagros Ponce', 'Compras', '989 100 102', 'mponce@mineradelsur.pe'),
      ],
      history: [
        event('2025-10-06', 'Carlos Mendoza', 'Registró el cliente'),
        event('2026-12-14', 'Carlos Mendoza', 'Asoció el proyecto PR-2027-001'),
      ],
    },
    {
      id: 'CLI-002', name: 'Industrias Andinas S.A.C.', tradeName: 'Industrias Andinas', ruc: '20512345679',
      sector: 'Industria', address: 'Parque Industrial Río Seco Mz. B Lt. 4, Cerro Colorado, Arequipa',
      phone: '(054) 380 230', email: 'mantenimiento@industriasandinas.pe', status: 'Activo', since: '2026-01-19',
      contacts: [contact('Raúl Chávez', 'Jefe de mantenimiento', '989 100 201', 'rchavez@industriasandinas.pe', true)],
      history: [
        event('2026-01-19', 'Ana Torres', 'Registró el cliente'),
        event('2026-12-20', 'Ana Torres', 'Asoció el proyecto PR-2027-002'),
      ],
    },
    {
      id: 'CLI-003', name: 'Clínica Regional del Sur', tradeName: 'Clínica Regional del Sur', ruc: '20512345680',
      sector: 'Salud', address: 'Av. Goyeneche 1050, Cercado, Arequipa', phone: '(054) 380 340',
      email: 'sistemas@clinicaregionalsur.pe', status: 'Activo', since: '2026-03-02',
      contacts: [contact('Verónica Ortiz', 'Jefa de sistemas', '989 100 301', 'vortiz@clinicaregionalsur.pe', true)],
      history: [
        event('2026-03-02', 'Luis Quispe', 'Registró el cliente'),
        event('2027-01-28', 'Luis Quispe', 'Asoció el proyecto PR-2027-003'),
      ],
    },
    {
      id: 'CLI-004', name: 'Corporación Logística Austral S.A.C.', tradeName: 'Logística Austral', ruc: '20512345681',
      sector: 'Logística', address: 'Av. Aviación 2205, Cerro Colorado, Arequipa', phone: '(054) 380 450',
      email: 'ti@logisticaaustral.pe', status: 'Activo', since: '2026-07-21',
      contacts: [contact('Fernando Lazo', 'Gerente de operaciones', '989 100 401', 'flazo@logisticaaustral.pe', true)],
      history: [event('2026-07-21', 'Ana Torres', 'Registró el cliente')],
    },
    {
      id: 'CLI-005', name: 'Agroindustrial Valle Sur S.A.C.', tradeName: 'Valle Sur', ruc: '20512345682',
      sector: 'Agroindustria', address: 'Carretera Arequipa–Yura km 8, Cerro Colorado, Arequipa',
      phone: '(054) 380 560', email: 'planta@agrovallesur.pe', status: 'Activo', since: '2026-09-08',
      contacts: [contact('Sofía Medina', 'Jefa de planta', '989 100 501', 'smedina@agrovallesur.pe', true)],
      history: [event('2026-09-08', 'Carlos Mendoza', 'Registró el cliente')],
    },
  ],
  suppliers: [
    {
      id: 'PROV-001', name: 'TechSupply Perú S.A.C.', tradeName: 'TechSupply', ruc: '20600111201',
      specialty: 'Cableado estructurado y redes', brands: ['Panduit', 'Cisco', 'Furukawa'],
      categories: ['Cableado', 'Redes'], address: 'Av. Ejército 615, Yanahuara, Arequipa',
      phone: '(054) 390 101', email: 'ventas@techsupply.pe', status: 'Activo', since: '2025-08-04',
      contacts: [contact('Marcos Rojas', 'Ejecutivo corporativo', '989 200 101', 'mrojas@techsupply.pe', true)],
      offerings: [
        { name: 'Cable UTP Cat6', kind: 'Producto', brand: 'Furukawa', category: 'Cableado', unit: 'm' },
        { name: 'Conector RJ45 Cat6', kind: 'Producto', brand: 'Panduit', category: 'Cableado', unit: 'und' },
        { name: 'Switch administrable 48 puertos', kind: 'Producto', brand: 'Cisco', category: 'Redes', unit: 'und' },
      ],
      history: [event('2025-08-04', 'Ana Torres', 'Registró el proveedor')],
    },
    {
      id: 'PROV-002', name: 'Redes Industriales del Sur S.A.C.', tradeName: 'Redes Industriales', ruc: '20600111202',
      specialty: 'Equipos de seguridad electrónica', brands: ['Hikvision', 'Axis'],
      categories: ['Videovigilancia', 'Control de accesos'], address: 'Calle San Juan de Dios 410, Cercado, Arequipa',
      phone: '(054) 390 202', email: 'proyectos@redesindustriales.pe', status: 'Activo', since: '2025-11-17',
      contacts: [contact('Karina Vela', 'Jefa comercial', '989 200 201', 'kvela@redesindustriales.pe', true)],
      offerings: [
        { name: 'Cámara IP domo 4 MP', kind: 'Producto', brand: 'Hikvision', category: 'Videovigilancia', unit: 'und' },
        { name: 'Instalación y configuración de CCTV', kind: 'Servicio', brand: '—', category: 'Videovigilancia', unit: 'servicio' },
      ],
      history: [event('2025-11-17', 'Luis Quispe', 'Registró el proveedor')],
    },
    {
      id: 'PROV-003', name: 'ElectroData S.A.C.', tradeName: 'ElectroData', ruc: '20600111203',
      specialty: 'Servidores y energía', brands: ['Dell', 'APC', 'HPE'],
      categories: ['Servidores', 'Energía'], address: 'Av. Dolores 230, José Luis Bustamante y Rivero, Arequipa',
      phone: '(054) 390 303', email: 'empresas@electrodata.pe', status: 'Activo', since: '2026-02-09',
      contacts: [contact('Hugo Salinas', 'Ventas de infraestructura', '989 200 301', 'hsalinas@electrodata.pe', true)],
      offerings: [
        { name: 'Servidor en rack 2U', kind: 'Producto', brand: 'Dell', category: 'Servidores', unit: 'und' },
        { name: 'UPS en línea 6 kVA', kind: 'Producto', brand: 'APC', category: 'Energía', unit: 'und' },
      ],
      history: [event('2026-02-09', 'Carlos Mendoza', 'Registró el proveedor')],
    },
  ],
  workers: [
    {
      id: 'PER-001',
      name: 'Carlos Mendoza',
      dni: '00000001',
      role: 'Jefe de proyecto',
      area: 'Proyectos',
      status: 'Activo',
    },
    {
      id: 'PER-002',
      name: 'Ana Torres',
      dni: '00000002',
      role: 'Especialista de redes',
      area: 'Operaciones',
      status: 'Activo',
    },
    {
      id: 'PER-003',
      name: 'Luis Quispe',
      dni: '00000003',
      role: 'Técnico de campo',
      area: 'Operaciones',
      status: 'Activo',
    },
    {
      id: 'PER-004',
      name: 'María Salazar',
      dni: '00000004',
      role: 'Jefa de proyecto',
      area: 'Proyectos',
      status: 'Activo',
    },
    {
      id: 'PER-005',
      name: 'José Vargas',
      dni: '00000005',
      role: 'Jefe de proyecto',
      area: 'Proyectos',
      status: 'Activo',
    },
  ],
  projects: [
    {
      id: 'PR-2027-001',
      name: 'Implementación de Infraestructura Tecnológica',
      clientId: 'CLI-001',
      managerId: 'PER-001',
      budgetId: 'PRE-001',
      startDate: '2027-01-10',
      endDate: '2027-06-30',
      budgetAmount: 185000,
      progressPercent: 67,
      status: 'Activo',
    },
    {
      id: 'PR-2027-002',
      name: 'Sistema de Seguridad Electrónica',
      clientId: 'CLI-002',
      managerId: 'PER-002',
      budgetId: 'PRE-002',
      startDate: '2027-02-01',
      endDate: '2027-08-31',
      budgetAmount: 96000,
      progressPercent: 82,
      status: 'En riesgo',
    },
    {
      id: 'PR-2027-003',
      name: 'Modernización de Red Corporativa',
      clientId: 'CLI-003',
      managerId: 'PER-003',
      budgetId: 'PRE-003',
      startDate: '2027-03-01',
      endDate: '2027-10-31',
      budgetAmount: 145000,
      progressPercent: 38,
      status: 'Activo',
    },
    ...portfolioProjects,
  ],
  opportunities: [
    {
      id: 'OP-001',
      clientId: 'CLI-001',
      budgetId: 'PRE-001',
      projectId: 'PR-2027-001',
      name: 'Infraestructura tecnológica',
      status: 'Ganado',
      estimatedAmount: 185000,
      date: '2027-01-05',
      ownerId: 'PER-001',
      probability: 100,
      nextAction: 'Seguimiento de ejecución con el cliente',
      description: 'Oportunidad convertida en presupuesto aprobado y proyecto activo.',
    },
    {
      id: 'OP-002',
      clientId: 'CLI-004',
      name: 'Respaldo y continuidad de servidores',
      status: 'Negociación',
      estimatedAmount: 78000,
      date: '2027-05-12',
      ownerId: 'PER-002',
      probability: 70,
      nextAction: 'Reunión de cierre 28/05/2027',
      description: 'Ampliación del servicio de migración con respaldo en sitio alterno.',
    },
    {
      id: 'OP-003',
      clientId: 'CLI-003',
      name: 'Cableado de nuevo pabellón clínico',
      status: 'Propuesta',
      estimatedAmount: 54000,
      date: '2027-05-20',
      ownerId: 'PER-003',
      probability: 50,
      nextAction: 'Enviar propuesta técnica revisada',
      description: 'Red de datos y voz para el pabellón de consulta externa.',
    },
    {
      id: 'OP-004',
      clientId: 'CLI-005',
      name: 'Monitoreo remoto de subestaciones',
      status: 'Contactado',
      estimatedAmount: 96000,
      date: '2027-05-26',
      ownerId: 'PER-005',
      probability: 30,
      nextAction: 'Visita técnica 03/06/2027',
      description: 'Telemetría y alarmas para tres subestaciones del cliente.',
    },
    {
      id: 'OP-005',
      clientId: 'CLI-001',
      name: 'Radioenlaces de campamento',
      status: 'Prospecto',
      estimatedAmount: 120000,
      date: '2027-06-02',
      ownerId: 'PER-004',
      probability: 10,
      nextAction: 'Primera llamada con el área de operaciones',
      description: 'Conectividad entre campamento y tajo con enlaces punto a punto.',
    },
    {
      id: 'OP-006',
      clientId: 'CLI-004',
      name: 'Mesa de ayuda tercerizada',
      status: 'Perdido',
      estimatedAmount: 36000,
      date: '2027-04-08',
      ownerId: 'PER-002',
      probability: 0,
      nextAction: 'Registrar motivo: precio fuera de rango',
      description: 'El cliente eligió una propuesta de menor alcance.',
    },
  ],
  budgets: [
    {
      id: 'PRE-001',
      projectId: 'PR-2027-001',
      clientId: 'CLI-001',
      version: 2,
      amount: 185000,
      status: 'Aprobado',
      documentId: 'DOC-PRE-001',
    },
    {
      id: 'PRE-002',
      projectId: 'PR-2027-002',
      clientId: 'CLI-002',
      version: 1,
      amount: 96000,
      status: 'Aprobado',
      documentId: 'DOC-PRE-002',
    },
    {
      id: 'PRE-003',
      projectId: 'PR-2027-003',
      clientId: 'CLI-003',
      version: 1,
      amount: 145000,
      status: 'Aprobado',
      documentId: 'DOC-PRE-003',
    },
    ...portfolioBudgets,
  ],
  materials: [
    {
      id: 'MAT-001',
      name: 'Cable UTP Cat6',
      category: 'Cableado',
      unit: 'm',
      stock: 1250,
      minimum: 300,
      warehouse: 'Principal',
      location: 'A-01',
    },
    {
      id: 'MAT-002',
      name: 'Conector RJ45',
      category: 'Conectividad',
      unit: 'und',
      stock: 80,
      minimum: 100,
      warehouse: 'Principal',
      location: 'B-02',
    },
  ],
  operations: [
    operation('OC-025', 'PR-2027-001', 'purchase', 25000, 'purchases', {
      supplierId: 'PROV-001',
      status: 'Atendida',
      date: '2027-03-01',
    }),
    operation('OC-028', 'PR-2027-001', 'purchase', 12000, 'purchases', {
      supplierId: 'PROV-002',
      status: 'Atendida',
      date: '2027-03-10',
    }),
    operation('OC-032', 'PR-2027-001', 'purchase', 10230, 'purchases', {
      supplierId: 'PROV-003',
      status: 'Atendida',
      date: '2027-03-20',
    }),
    // Stock purchases are received into inventory. Their value becomes an
    // executed material cost only through the related SAL operation below.
    operation('OC-035', 'PR-2027-001', 'purchase', 16984.45, null, {
      supplierId: 'PROV-002',
      status: 'Atendida',
      date: '2027-03-18',
      inventoryLine: { materialId: 'MAT-001', quantity: 320, unitCost: 44.98 },
    }),
    operation('TAR-014', 'PR-2027-001', 'timesheet', 30362, 'personnel', {
      workerId: 'PER-002',
      status: 'Aprobado',
      date: '2027-03-31',
    }),
    operation('R-041', 'PR-2027-001', 'expense', 5000, 'expenses', {
      workerId: 'PER-003',
      status: 'Aprobada',
      date: '2027-03-05',
    }),
    operation('R-045', 'PR-2027-001', 'expense', 6243, 'expenses', {
      workerId: 'PER-003',
      status: 'Aprobada',
      date: '2027-03-15',
    }),
    operation('R-049', 'PR-2027-001', 'expense', 4500, 'expenses', {
      workerId: 'PER-002',
      status: 'Aprobada',
      date: '2027-03-25',
    }),
    operation('SAL-015', 'PR-2027-001', 'material_issue', 13494, 'materials', {
      materialId: 'MAT-001',
      status: 'Registrada',
      date: '2027-03-22',
    }),
    operation('DEV-015', 'PR-2027-001', 'material_return', 0, null, {
      materialId: 'MAT-001',
      status: 'Registrada',
      date: '2027-03-24',
    }),
    operation('AJ-001', 'PR-2027-001', 'other', 5621, 'other', {
      status: 'Registrado',
      date: '2027-03-31',
    }),
    // Approved but not executed. Included in committed cost, not executed cost.
    operation('OC-034', 'PR-2027-001', 'purchase', 16250, null, {
      supplierId: 'PROV-001',
      status: 'Aprobada',
      commitmentOpen: 16250,
      date: '2027-04-01',
      documentId: null,
    }),
    operation('OC-033', 'PR-2027-001', 'purchase', 6200, null, {
      supplierId: 'PROV-002',
      status: 'Pendiente',
      date: '2027-04-02',
      documentId: null,
    }),
    operation('R-050', 'PR-2027-001', 'expense', 1250, null, {
      workerId: 'PER-003',
      status: 'En revisión',
      date: '2027-04-03',
      documentId: null,
    }),

    operation('OC-201', 'PR-2027-002', 'purchase', 42000, 'purchases', {
      supplierId: 'PROV-003',
      status: 'Atendida',
      date: '2027-04-10',
    }),
    operation('OC-202', 'PR-2027-002', 'purchase', 11800, null, {
      supplierId: 'PROV-003',
      status: 'Atendida',
      date: '2027-04-16',
      inventoryLine: { materialId: 'MAT-002', quantity: 100, unitCost: 100 },
    }),
    operation('TAR-201', 'PR-2027-002', 'timesheet', 20000, 'personnel', {
      workerId: 'PER-001',
      status: 'Aprobado',
      date: '2027-04-30',
    }),
    operation('R-201', 'PR-2027-002', 'expense', 7000, 'expenses', {
      workerId: 'PER-002',
      status: 'Aprobada',
      date: '2027-04-15',
    }),
    operation('SAL-201', 'PR-2027-002', 'material_issue', 10000, 'materials', {
      materialId: 'MAT-002',
      status: 'Registrada',
      date: '2027-04-20',
    }),
    operation('AJ-201', 'PR-2027-002', 'other', 3500, 'other', {
      status: 'Registrado',
      date: '2027-04-30',
    }),

    operation('OC-301', 'PR-2027-003', 'purchase', 21000, 'purchases', {
      supplierId: 'PROV-001',
      status: 'Atendida',
      date: '2027-05-10',
    }),
    operation('OC-302', 'PR-2027-003', 'purchase', 5900, null, {
      supplierId: 'PROV-001',
      status: 'Atendida',
      date: '2027-05-16',
      inventoryLine: { materialId: 'MAT-001', quantity: 100, unitCost: 50 },
    }),
    operation('TAR-301', 'PR-2027-003', 'timesheet', 14500, 'personnel', {
      workerId: 'PER-003',
      status: 'Aprobado',
      date: '2027-05-31',
    }),
    operation('R-301', 'PR-2027-003', 'expense', 5700, 'expenses', {
      workerId: 'PER-003',
      status: 'Aprobada',
      date: '2027-05-15',
    }),
    operation('SAL-301', 'PR-2027-003', 'material_issue', 5000, 'materials', {
      materialId: 'MAT-001',
      status: 'Registrada',
      date: '2027-05-20',
    }),
    operation('AJ-301', 'PR-2027-003', 'other', 2000, 'other', {
      status: 'Registrado',
      date: '2027-05-31',
    }),

    ...portfolio.flatMap(portfolioOperations),
  ],
};
