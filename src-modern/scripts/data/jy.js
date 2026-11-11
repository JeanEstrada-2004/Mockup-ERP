// Fictitious J&Y presentation data shared by the PMI and company-demo builds.
// These are not real J&Y clients, workers, contracts, or financial figures.
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

export const jyData = {
  id: 'jy',
  fictitious: true,
  // Reference "today" of the scenario and the date used by sample receipts.
  today: '2027-07-01',
  exampleDate: '2027-04-03',
  clients: [
    {
      id: 'CLI-JY-001', name: 'Consorcio Valle Sur S.A.C.', tradeName: 'Consorcio Valle Sur', ruc: '20600222101',
      sector: 'Infraestructura', address: 'Av. Independencia 940, Cercado, Arequipa', phone: '(054) 395 101',
      email: 'obras@consorciovallesur.pe', status: 'Activo', since: '2026-11-09',
      contacts: [contact('Alberto Núñez', 'Gerente de proyecto', '989 300 101', 'anunez@consorciovallesur.pe', true)],
      history: [
        event('2026-11-09', 'María Salazar', 'Registró el cliente'),
        event('2027-01-20', 'María Salazar', 'Asoció el proyecto PR-JY-001'),
      ],
    },
    {
      id: 'CLI-JY-002', name: 'Constructora Horizonte S.A.C.', tradeName: 'Constructora Horizonte', ruc: '20600222102',
      sector: 'Construcción', address: 'Urb. Los Pinos Mz. D Lt. 3, Paucarpata, Arequipa', phone: '(054) 395 202',
      email: 'proyectos@constructorahorizonte.pe', status: 'Activo', since: '2027-01-11',
      contacts: [contact('Teresa Gallegos', 'Coordinadora técnica', '989 300 201', 'tgallegos@constructorahorizonte.pe', true)],
      history: [
        event('2027-01-11', 'José Vargas', 'Registró el cliente'),
        event('2027-03-18', 'José Vargas', 'Asoció el proyecto PR-JY-002'),
      ],
    },
  ],
  suppliers: [
    {
      id: 'PROV-JY-001', name: 'Suministros Andinos S.A.C.', tradeName: 'Suministros Andinos', ruc: '20600222201',
      specialty: 'Materiales eléctricos y de obra', brands: ['Indeco', 'Schneider Electric'],
      categories: ['Conductores', 'Tableros'], address: 'Av. Parra 205, Cercado, Arequipa',
      phone: '(054) 396 101', email: 'ventas@suministrosandinos.pe', status: 'Activo', since: '2026-10-05',
      contacts: [contact('Edwin Flores', 'Ventas', '989 400 101', 'eflores@suministrosandinos.pe', true)],
      offerings: [
        { name: 'Cable NH-80 4 mm²', kind: 'Producto', brand: 'Indeco', category: 'Conductores', unit: 'rollo' },
        { name: 'Tablero de distribución', kind: 'Producto', brand: 'Schneider Electric', category: 'Tableros', unit: 'und' },
      ],
      history: [event('2026-10-05', 'María Salazar', 'Registró el proveedor')],
    },
    {
      id: 'PROV-JY-002', name: 'Equipos del Sur S.A.C.', tradeName: 'Equipos del Sur', ruc: '20600222202',
      specialty: 'Alquiler de equipos', brands: ['Leica', 'Bosch'],
      categories: ['Alquiler de equipos'], address: 'Av. Aviación 1320, Cerro Colorado, Arequipa',
      phone: '(054) 396 202', email: 'alquileres@equiposdelsur.pe', status: 'Activo', since: '2026-12-01',
      contacts: [contact('Gabriela Tapia', 'Atención a empresas', '989 400 201', 'gtapia@equiposdelsur.pe', true)],
      offerings: [
        { name: 'Alquiler de estación total', kind: 'Servicio', brand: 'Leica', category: 'Alquiler de equipos', unit: 'día' },
      ],
      history: [event('2026-12-01', 'José Vargas', 'Registró el proveedor')],
    },
  ],
  workers: [
    {
      id: 'PER-JY-001',
      name: 'María Salazar',
      dni: '00000011',
      role: 'Jefa de proyecto',
      area: 'Proyectos',
      status: 'Activo',
    },
    {
      id: 'PER-JY-002',
      name: 'José Vargas',
      dni: '00000012',
      role: 'Ingeniero de campo',
      area: 'Operaciones',
      status: 'Activo',
    },
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
