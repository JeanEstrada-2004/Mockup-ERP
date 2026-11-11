// Clients and suppliers (MAESTROS, R1). Shared by every build, so no company
// record lives here: base records come from the variant data set; records and
// edits made in the demonstration are kept per variant in localStorage and
// never change projects, purchases or costs.
import { activeVariant, isModuleEnabled, variantStorageKey } from '../config/variants.js';
import { getDocuments, getProjectFinancials } from './mock-data.js';

export const MASTER_KINDS = {
  clients: {
    storage: 'demo-clients',
    prefix: 'CLI-DEMO-',
    singular: 'cliente',
    created: 'Registró el cliente',
  },
  suppliers: {
    storage: 'demo-suppliers',
    prefix: 'PROV-DEMO-',
    singular: 'proveedor',
    created: 'Registró el proveedor',
  },
};

export const MASTER_STATUSES = ['Activo', 'Inactivo'];

const clean = (value, max = 160) =>
  String(value ?? '')
    .trim()
    .slice(0, max);
const list = (value) =>
  (Array.isArray(value) ? value : String(value ?? '').split(','))
    .map((item) => clean(item, 60))
    .filter(Boolean)
    .slice(0, 12);

function readStore(kind) {
  try {
    const parsed = JSON.parse(localStorage.getItem(variantStorageKey(MASTER_KINDS[kind].storage)));
    return {
      created: Array.isArray(parsed?.created) ? parsed.created.filter(validStored) : [],
      edits: parsed?.edits && typeof parsed.edits === 'object' ? parsed.edits : {},
    };
  } catch {
    return { created: [], edits: {} };
  }
}

function validStored(item) {
  return item && typeof item.id === 'string' && typeof item.name === 'string';
}

function writeStore(kind, store) {
  try {
    localStorage.setItem(variantStorageKey(MASTER_KINDS[kind].storage), JSON.stringify(store));
    return true;
  } catch {
    return false;
  }
}

// RUC: 11 digits starting with 10, 15, 17 or 20 (persona natural o jurídica).
export function validRuc(value) {
  return /^(10|15|17|20)\d{9}$/.test(String(value || '').trim());
}

export function validEmail(value) {
  return !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
}

const EDITABLE = {
  clients: ['tradeName', 'sector', 'address', 'phone', 'email', 'status'],
  suppliers: [
    'tradeName',
    'specialty',
    'categories',
    'brands',
    'address',
    'phone',
    'email',
    'status',
  ],
};
const FIELD_LABELS = {
  name: 'Razón social',
  ruc: 'RUC',
  tradeName: 'Nombre comercial',
  sector: 'Sector',
  specialty: 'Especialidad',
  categories: 'Categorías',
  brands: 'Marcas',
  address: 'Dirección',
  phone: 'Teléfono',
  email: 'Correo',
  status: 'Estado',
  contact: 'Contacto principal',
};

function withDefaults(record) {
  return {
    tradeName: '',
    ruc: '',
    sector: '',
    specialty: '',
    categories: [],
    brands: [],
    address: '',
    phone: '',
    email: '',
    status: 'Activo',
    contacts: [],
    offerings: [],
    history: [],
    ...record,
  };
}

// Base records with local edits applied, followed by records created locally.
export function masterRecords(data, kind) {
  const store = readStore(kind);
  const base = data[kind].map((record) => {
    const edit = store.edits[record.id];
    if (!edit) return withDefaults(record);
    return withDefaults({
      ...record,
      ...edit.fields,
      contacts: edit.contacts || record.contacts || [],
      history: [...(record.history || []), ...(edit.history || [])],
      edited: true,
    });
  });
  return [...base, ...store.created.map((record) => withDefaults({ ...record, demo: true }))];
}

export function masterRecord(data, kind, id) {
  return masterRecords(data, kind).find((record) => record.id === id) || null;
}

export function emptyMasterForm(kind) {
  return {
    id: '',
    name: '',
    ruc: '',
    tradeName: '',
    sector: '',
    specialty: '',
    categories: '',
    brands: '',
    address: '',
    phone: '',
    email: '',
    status: 'Activo',
    contactName: '',
    contactRole: '',
    contactPhone: '',
    contactEmail: '',
    // Base records keep RUC and razón social read-only.
    base: false,
    kind,
  };
}

export function masterForm(record, kind) {
  const contact = record.contacts.find((item) => item.primary) || record.contacts[0] || {};
  return {
    ...emptyMasterForm(kind),
    id: record.id,
    name: record.name,
    ruc: record.ruc,
    tradeName: record.tradeName,
    sector: record.sector,
    specialty: record.specialty,
    categories: record.categories.join(', '),
    brands: record.brands.join(', '),
    address: record.address,
    phone: record.phone,
    email: record.email,
    status: record.status,
    contactName: contact.name || '',
    contactRole: contact.role || '',
    contactPhone: contact.phone || '',
    contactEmail: contact.email || '',
    base: !record.demo,
  };
}

export function validateMasterForm(form, records) {
  if (!clean(form.name)) return 'Ingresa la razón social.';
  if (!validRuc(form.ruc)) return 'El RUC debe tener 11 dígitos y empezar con 10, 15, 17 o 20.';
  const duplicate = records.find((item) => item.ruc === clean(form.ruc) && item.id !== form.id);
  if (duplicate) return `El RUC ya está registrado para ${duplicate.name}.`;
  if (!validEmail(form.email) || !validEmail(form.contactEmail))
    return 'Revisa el formato del correo.';
  if (!MASTER_STATUSES.includes(form.status)) return 'Selecciona un estado válido.';
  return '';
}

function formFields(form, kind) {
  const fields = {
    tradeName: clean(form.tradeName),
    address: clean(form.address),
    phone: clean(form.phone, 40),
    email: clean(form.email, 120),
    status: form.status,
  };
  if (kind === 'clients') fields.sector = clean(form.sector, 80);
  else {
    fields.specialty = clean(form.specialty, 80);
    fields.categories = list(form.categories);
    fields.brands = list(form.brands);
  }
  return fields;
}

function formContact(form) {
  if (!clean(form.contactName)) return null;
  return {
    name: clean(form.contactName, 80),
    role: clean(form.contactRole, 80),
    phone: clean(form.contactPhone, 40),
    email: clean(form.contactEmail, 120),
    primary: true,
  };
}

function localEvent(data, action, note = '') {
  return { date: data.today, user: activeVariant.user.name, action, note, local: true };
}

// Saves a new record or the editable fields of an existing one. Returns the id.
export function saveMasterForm(data, kind, form) {
  const store = readStore(kind);
  const config = MASTER_KINDS[kind];
  const contact = formContact(form);
  if (!form.id) {
    const next =
      store.created.reduce((max, item) => {
        const number = Number(String(item.id).replace(config.prefix, ''));
        return Number.isSafeInteger(number) ? Math.max(max, number) : max;
      }, 0) + 1;
    const id = `${config.prefix}${String(next).padStart(3, '0')}`;
    store.created.push({
      id,
      name: clean(form.name),
      ruc: clean(form.ruc, 11),
      ...formFields(form, kind),
      contacts: contact ? [contact] : [],
      offerings: [],
      since: data.today,
      history: [localEvent(data, config.created, 'Registro de esta demostración.')],
    });
    writeStore(kind, store);
    return id;
  }

  const current = masterRecord(data, kind, form.id);
  const fields = formFields(form, kind);
  const changed = EDITABLE[kind].filter(
    (key) => JSON.stringify(current[key] ?? '') !== JSON.stringify(fields[key] ?? '')
  );
  const currentContact = current.contacts.find((item) => item.primary) || current.contacts[0];
  const contactChanged = JSON.stringify(currentContact || null) !== JSON.stringify(contact);
  if (!changed.length && !contactChanged) return form.id;
  const contacts = contactChanged
    ? [...(contact ? [contact] : []), ...current.contacts.filter((item) => item !== currentContact)]
    : current.contacts;
  const note = [...changed, ...(contactChanged ? ['contact'] : [])]
    .map((key) => FIELD_LABELS[key])
    .join(', ');

  const created = store.created.find((item) => item.id === form.id);
  if (created) {
    Object.assign(created, fields, { contacts });
    created.history = [...(created.history || []), localEvent(data, 'Modificó la ficha', note)];
  } else {
    const edit = store.edits[form.id] || { fields: {}, history: [] };
    edit.fields = { ...edit.fields, ...fields };
    edit.contacts = contacts;
    edit.history = [...(edit.history || []), localEvent(data, 'Modificó la ficha', note)];
    store.edits[form.id] = edit;
  }
  writeStore(kind, store);
  return form.id;
}

const enabledDocuments = (data) =>
  getDocuments(data).filter((document) => isModuleEnabled(document.module));

export function clientRelations(data, clientId) {
  const projects = data.projects
    .filter((project) => project.clientId === clientId)
    .map((project) => ({ ...project, financials: getProjectFinancials(data, project.id) }));
  const projectIds = new Set(projects.map((project) => project.id));
  const budgets = data.budgets.filter((budget) => budget.clientId === clientId);
  const documents = enabledDocuments(data).filter((document) => projectIds.has(document.projectId));
  const inExecution = projects.filter((project) =>
    ['Activo', 'En riesgo'].includes(project.status)
  );
  return {
    projects,
    budgets,
    documents,
    inExecution: inExecution.length,
    budgetAmount: projects.reduce((total, project) => total + project.budgetAmount, 0),
    executedCost: projects.reduce((total, project) => total + project.financials.executedCost, 0),
  };
}

export function supplierRelations(data, supplierId) {
  const purchases = data.operations
    .filter((item) => item.type === 'purchase' && item.supplierId === supplierId)
    .sort((a, b) => b.date.localeCompare(a.date));
  const projectIds = [...new Set(purchases.map((item) => item.projectId))];
  const projects = data.projects.filter((project) => projectIds.includes(project.id));
  const purchaseIds = new Set(purchases.map((item) => item.id));
  const documents = enabledDocuments(data).filter((document) =>
    purchaseIds.has(document.operationId)
  );
  return {
    purchases,
    projects,
    documents,
    // Executed purchases only: the ones that already count as project cost.
    purchasedAmount: purchases
      .filter((item) => item.costSource)
      .reduce((total, item) => total + item.amount, 0),
    openCount: purchases.filter((item) => !item.costSource).length,
  };
}
