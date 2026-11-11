import { activeVariant } from '../config/variants.js';
import { moduleHref } from '../config/modules.js';
import { getDataForVariant } from '../data/mock-data.js';
import { loadReports } from '../data/expense-reports.js';
import { loadBudgets, versionsOf } from '../data/budget-model.js';
import { masterRecords } from '../data/master-data.js';
import { incidentRows, payrollMonths, payrollRows, tareoRows } from '../data/personnel-jy.js';
import { formatDate } from './project-views.js';

const roles = [
  ['Gerencia / Ingeniero', 'Consulta y decisiones de proyecto'],
  ['Administración', 'Maestros, OC y revisión de rendiciones'],
  ['Contabilidad', 'Recepción y clasificación contable'],
  ['Trabajador de oficina', 'Consulta y registro propio'],
  ['Trabajador de campo', 'Asistencia y rendición propia'],
  ['Encargado de proyecto', 'Tareo y seguimiento asignado'],
  ['Administrador del sistema', 'Configuración y auditoría'],
];

export function securityJyWorkspace() {
  const data = getDataForVariant(activeVariant);
  const href = moduleHref;
  const audits = [];
  const add = (date, user, action, record, reason, url, source) => {
    if (date && action)
      audits.push({
        date,
        user: user || 'Por validar',
        action,
        record,
        reason: reason || 'Sin motivo registrado',
        href: url,
        source,
      });
  };
  for (const report of loadReports(data))
    for (const item of report.history || [])
      add(
        item.at || item.date,
        item.user,
        item.action,
        report.id,
        item.note,
        href('expenses', report.id),
        'Rendición'
      );
  for (const budget of loadBudgets(data))
    for (const version of versionsOf(data, budget))
      add(
        version.date,
        data.workers.find((worker) => worker.id === version.responsibleId)?.name || version.by,
        `Versión ${version.version}: ${version.status}`,
        budget.id,
        version.comment || version.action,
        href('budgets', budget.id),
        'Presupuesto'
      );
  for (const kind of ['clients', 'suppliers'])
    for (const record of masterRecords(data, kind))
      for (const item of record.history || [])
        add(
          item.date,
          item.user,
          item.action,
          record.id,
          item.note,
          href(kind, record.id),
          kind === 'clients' ? 'Cliente' : 'Proveedor'
        );
  for (const month of payrollMonths(data))
    for (const row of payrollRows(data, month))
      if (row.imputations.length)
        add(
          `${month}-01`,
          row.draft ? activeVariant.user.name : 'Registro base ficticio',
          row.draft ? 'Editó imputación local' : 'Imputación de planilla',
          `${month}-${row.workerId}`,
          `${row.imputedPct} % imputado; ${row.officeAmount} de oficina`,
          `./personnel.html?tab=planilla&month=${month}&worker=${row.workerId}`,
          'Planilla'
        );
  for (const row of tareoRows(data))
    if (row.signed)
      add(
        row.signedAt?.at || row.date,
        row.signedAt?.user || row.recordedByName,
        'Firma de tareo',
        row.id,
        row.reason || 'Conformidad de tareo',
        href('personnel', row.id),
        'Tareo'
      );
  for (const item of incidentRows(data))
    add(
      item.action?.at || item.date,
      item.action?.user || 'Registro base ficticio',
      item.action ? `Incidencia ${item.status}` : `Incidencia detectada: ${item.kind}`,
      item.id,
      item.reason || item.kind,
      href('personnel'),
      'Incidencia'
    );
  audits.sort((a, b) => b.date.localeCompare(a.date) || a.record.localeCompare(b.record));
  return {
    roles,
    audits,
    formatDate,
    tab: 'roles',
    source: '',
    get filteredAudits() {
      return this.audits.filter((item) => !this.source || item.source === this.source);
    },
    get sources() {
      return [...new Set(this.audits.map((item) => item.source))];
    },
  };
}
