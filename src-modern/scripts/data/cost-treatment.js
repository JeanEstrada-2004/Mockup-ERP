// Costos y Control Contable (R3, J&Y Demo: variant.rules.costTreatment).
// Every executed cost is split into lines that keep their source, category,
// responsible, period and document, so the same sol can be read as:
//   J&Y Real          the economic cost that actually happened (all lines);
//   tratamiento formal how it was recorded: V.V., IGV, No gravado,
//                      No documentado, or without a tax breakdown (payroll,
//                      adjustments). No tax rule is derived from it.
// Shared by every build: no company data here.
import { EVIDENCE_TYPES, itemAmounts } from './expense-reports.js';
import { getCostEntries, getProject } from './mock-data.js';

export const TREATMENT_COLUMNS = [
  { id: 'vv', label: 'V.V.', color: '--s1' },
  { id: 'igv', label: 'IGV', color: '--s2' },
  { id: 'nonTaxed', label: 'No gravado', color: '--s4' },
  { id: 'undocumented', label: 'No documentado', color: '--s3' },
  { id: 'noBreakdown', label: 'Sin desglose tributario', color: '--s-other' },
];

export const GROUPINGS = [
  { id: 'source', label: 'Fuente' },
  { id: 'category', label: 'Categoría' },
  { id: 'period', label: 'Periodo' },
  { id: 'responsible', label: 'Responsable' },
  { id: 'project', label: 'Proyecto' },
];

const SOURCE_LABELS = {
  purchases: 'Compras',
  expenses: 'Rendiciones',
  personnel: 'Personal',
  materials: 'Materiales',
  other: 'Otros',
};
const DEFAULT_CATEGORY = {
  purchases: 'Suministro',
  personnel: 'Planilla',
  materials: 'Suministro',
  other: 'Otros',
};
const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];
const round = (value) => Math.round((Number(value) || 0) * 100) / 100;
const zero = () => ({ vv: 0, igv: 0, nonTaxed: 0, undocumented: 0, noBreakdown: 0 });

export function periodLabel(period) {
  const [year, month] = period.split('-').map(Number);
  return `${MONTHS[month - 1]} ${year}`;
}

// Purchases are recorded with IGV included (same assumption as the OC detail).
function purchaseTreatment(amount) {
  const vv = round(amount / 1.18);
  return { ...zero(), vv, igv: round(amount - vv) };
}

function workerName(data, id) {
  return data.workers.find((item) => item.id === id)?.name || 'Sin responsable';
}

export function costLines(data, projectId = null) {
  const projects = projectId ? [projectId] : data.projects.map((item) => item.id);
  const lines = [];
  for (const id of projects) {
    for (const entry of getCostEntries(data, id)) {
      const operation = data.operations.find((item) => item.id === entry.operationId);
      const base = {
        projectId: id,
        source: entry.source,
        sourceLabel: SOURCE_LABELS[entry.source] || entry.source,
        operationId: operation.id,
        operationLabel: operation.label || operation.id,
        documentId: entry.documentId,
      };
      const report =
        operation.type === 'expense' &&
        data.expenseReports?.find((item) => item.id === operation.id);
      if (report) {
        report.items.forEach((item, index) => {
          const amounts = itemAmounts(item);
          lines.push({
            ...base,
            id: `${operation.id}#${item.id}`,
            itemId: item.id,
            itemIndex: index + 1,
            date: item.date,
            category: item.category,
            description: item.description,
            counterpart: item.vendor || item.payee || 'Sin documento',
            documentLabel: `${EVIDENCE_TYPES[item.docType]?.short || ''}${item.series ? ` ${item.series}-${item.number}` : ''}`,
            responsibleId: report.workerId,
            responsible: workerName(data, report.workerId),
            total: amounts.total,
            treatment: { ...zero(), ...amounts, total: undefined },
          });
        });
        continue;
      }
      const supplier = data.suppliers.find((item) => item.id === operation.supplierId);
      const responsibleId = operation.workerId || getProject(data, id)?.managerId || null;
      lines.push({
        ...base,
        id: operation.id,
        itemId: null,
        date: operation.date,
        category: operation.category || DEFAULT_CATEGORY[entry.source] || 'Otros',
        description:
          operation.description ||
          {
            purchases: 'Orden de compra',
            personnel: 'Personal del proyecto',
            other: 'Ajuste de costo',
          }[entry.source] ||
          operation.id,
        counterpart:
          supplier?.name ||
          (operation.type === 'payroll'
            ? 'Planilla de J&Y'
            : operation.type === 'rxh'
              ? data.rxh?.find((item) => item.id === operation.id)?.person || 'Recibo por honorarios'
              : workerName(data, operation.workerId)),
        documentLabel: entry.documentId || '—',
        responsibleId,
        responsible: workerName(data, responsibleId),
        total: round(entry.amount),
        treatment:
          entry.source === 'purchases'
            ? purchaseTreatment(entry.amount)
            : { ...zero(), noBreakdown: round(entry.amount) },
      });
    }
  }
  for (const line of lines) delete line.treatment.total;
  return lines.sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
}

export function treatmentTotals(lines) {
  const totals = zero();
  let total = 0;
  for (const line of lines) {
    total = round(total + line.total);
    for (const key of Object.keys(totals)) totals[key] = round(totals[key] + line.treatment[key]);
  }
  return { ...totals, total, count: lines.length };
}

function groupKey(data, line, grouping) {
  if (grouping === 'source') return [line.source, line.sourceLabel];
  if (grouping === 'category') return [line.category, line.category];
  if (grouping === 'period') return [line.date.slice(0, 7), periodLabel(line.date.slice(0, 7))];
  if (grouping === 'responsible') return [line.responsibleId || '—', line.responsible];
  const project = getProject(data, line.projectId);
  return [line.projectId, `${line.projectId} · ${project?.name || ''}`];
}

export function groupLines(data, lines, grouping) {
  const groups = new Map();
  for (const line of lines) {
    const [key, label] = groupKey(data, line, grouping);
    if (!groups.has(key)) groups.set(key, { key, label, lines: [] });
    groups.get(key).lines.push(line);
  }
  return [...groups.values()]
    .map((group) => ({ ...group, ...treatmentTotals(group.lines) }))
    .sort((a, b) =>
      grouping === 'period'
        ? b.key.localeCompare(a.key)
        : b.total - a.total || a.label.localeCompare(b.label)
    );
}
