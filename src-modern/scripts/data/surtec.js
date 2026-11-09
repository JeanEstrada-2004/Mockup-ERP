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

export const surtecData = {
  id: 'surtec',
  fictitious: true,
  clients: [
    { id: 'CLI-001', name: 'Minera del Sur S.A.', ruc: '20512345678', sector: 'Minería' },
    { id: 'CLI-002', name: 'Industrias Andinas S.A.C.', sector: 'Industria' },
    { id: 'CLI-003', name: 'Clínica Regional del Sur', sector: 'Salud' },
  ],
  suppliers: [
    { id: 'PROV-001', name: 'TechSupply Perú S.A.C.' },
    { id: 'PROV-002', name: 'Redes Industriales del Sur S.A.C.' },
    { id: 'PROV-003', name: 'ElectroData S.A.C.' },
  ],
  workers: [
    { id: 'PER-001', name: 'Carlos Mendoza', role: 'Jefe de proyecto' },
    { id: 'PER-002', name: 'Ana Torres', role: 'Especialista de redes' },
    { id: 'PER-003', name: 'Luis Quispe', role: 'Técnico de campo' },
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
  ],
  materials: [
    { id: 'MAT-001', name: 'Cable UTP Cat6', unit: 'm', stock: 1250, minimum: 300 },
    { id: 'MAT-002', name: 'Conector RJ45', unit: 'und', stock: 80, minimum: 100 },
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
  ],
};
