// Fictitious J&Y presentation data shared by the PMI and company-demo builds.
// These are not real J&Y clients, workers, contracts, or financial figures.
const operation = (id, projectId, type, amount, costSource, details = {}) => ({
  id,
  projectId,
  type,
  amount,
  costSource,
  documentId: `DOC-${id}`,
  ...details,
});

export const jyData = {
  id: 'jy',
  fictitious: true,
  clients: [
    { id: 'CLI-JY-001', name: 'Consorcio Valle Sur S.A.C.', sector: 'Infraestructura' },
    { id: 'CLI-JY-002', name: 'Constructora Horizonte S.A.C.', sector: 'Construcción' },
  ],
  suppliers: [
    { id: 'PROV-JY-001', name: 'Suministros Andinos S.A.C.' },
    { id: 'PROV-JY-002', name: 'Equipos del Sur S.A.C.' },
  ],
  workers: [
    { id: 'PER-JY-001', name: 'María Salazar', role: 'Jefa de proyecto' },
    { id: 'PER-JY-002', name: 'José Vargas', role: 'Ingeniero de campo' },
  ],
  projects: [
    {
      id: 'PR-JY-001',
      name: 'Supervisión de infraestructura vial',
      clientId: 'CLI-JY-001',
      managerId: 'PER-JY-001',
      budgetId: 'PRE-JY-001',
      startDate: '2027-02-01',
      endDate: '2027-09-30',
      budgetAmount: 160000,
      progressPercent: 54,
      status: 'Activo',
    },
    {
      id: 'PR-JY-002',
      name: 'Diseño de instalación eléctrica',
      clientId: 'CLI-JY-002',
      managerId: 'PER-JY-002',
      budgetId: 'PRE-JY-002',
      startDate: '2027-04-01',
      endDate: '2027-11-30',
      budgetAmount: 90000,
      progressPercent: 40,
      status: 'Activo',
    },
  ],
  opportunities: [],
  budgets: [
    {
      id: 'PRE-JY-001',
      projectId: 'PR-JY-001',
      clientId: 'CLI-JY-001',
      version: 1,
      amount: 160000,
      status: 'Aprobado',
      documentId: 'DOC-PRE-JY-001',
    },
    {
      id: 'PRE-JY-002',
      projectId: 'PR-JY-002',
      clientId: 'CLI-JY-002',
      version: 1,
      amount: 90000,
      status: 'Aprobado',
      documentId: 'DOC-PRE-JY-002',
    },
  ],
  // PMI and J&Y Demo do not show an operational warehouse module.
  materials: [],
  operations: [
    operation('OC-JY-001', 'PR-JY-001', 'purchase', 42000, 'purchases', {
      supplierId: 'PROV-JY-001',
      status: 'Atendida',
      date: '2027-04-10',
    }),
    operation('TAR-JY-001', 'PR-JY-001', 'timesheet', 24500, 'personnel', {
      workerId: 'PER-JY-002',
      status: 'Aprobado',
      date: '2027-04-30',
    }),
    operation('R-JY-001', 'PR-JY-001', 'expense', 10000, 'expenses', {
      workerId: 'PER-JY-002',
      status: 'Aprobada',
      date: '2027-04-20',
    }),
    operation('AJ-JY-001', 'PR-JY-001', 'other', 2000, 'other', {
      status: 'Registrado',
      date: '2027-04-30',
    }),
    operation('OC-JY-003', 'PR-JY-001', 'purchase', 5000, null, {
      supplierId: 'PROV-JY-002',
      status: 'Pendiente',
      date: '2027-05-01',
      documentId: null,
    }),

    operation('OC-JY-002', 'PR-JY-002', 'purchase', 17000, 'purchases', {
      supplierId: 'PROV-JY-002',
      status: 'Atendida',
      date: '2027-06-10',
    }),
    operation('TAR-JY-002', 'PR-JY-002', 'timesheet', 12000, 'personnel', {
      workerId: 'PER-JY-001',
      status: 'Aprobado',
      date: '2027-06-30',
    }),
    operation('R-JY-002', 'PR-JY-002', 'expense', 6000, 'expenses', {
      workerId: 'PER-JY-001',
      status: 'Aprobada',
      date: '2027-06-15',
    }),
  ],
};
