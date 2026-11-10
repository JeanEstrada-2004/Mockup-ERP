// Fictitious presentation data. Amounts are soles and dates are ISO internally;
// the UI will format them as S/ and DD/MM/AAAA.
const operation = (id, projectId, type, amount, costSource, details = {}) => ({
  id,
  projectId,
  type,
  amount,
  costSource,
  documentId: `DOC-${id}`,
  ...details,
});

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
  clients: [
    { id: 'CLI-001', name: 'Minera del Sur S.A.', ruc: '20512345678', sector: 'Minería' },
    { id: 'CLI-002', name: 'Industrias Andinas S.A.C.', sector: 'Industria' },
    { id: 'CLI-003', name: 'Clínica Regional del Sur', sector: 'Salud' },
    { id: 'CLI-004', name: 'Corporación Logística Austral S.A.C.', sector: 'Logística' },
    { id: 'CLI-005', name: 'Agroindustrial Valle Sur S.A.C.', sector: 'Agroindustria' },
  ],
  suppliers: [
    { id: 'PROV-001', name: 'TechSupply Perú S.A.C.' },
    { id: 'PROV-002', name: 'Redes Industriales del Sur S.A.C.' },
    { id: 'PROV-003', name: 'ElectroData S.A.C.' },
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
      description: 'Oportunidad ficticia convertida en presupuesto aprobado y proyecto activo.',
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
