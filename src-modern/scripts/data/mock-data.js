/* global __ACTIVE_VARIANT__ */
import { activeVariant, getVariantConfig, variantRule } from '../config/variants.js';
import { surtecData } from './surtec.js';
import { jyData } from './jy.js';
import { jyDemoData } from './jy-demo.js';
import { EVIDENCE_TYPES } from './expense-reports.js';

// During a variant build, Vite replaces MODE and removes the other data set
// from the generated bundle. Node validation keeps both sets available.
const buildMode = typeof __ACTIVE_VARIANT__ === 'undefined' ? undefined : __ACTIVE_VARIANT__;
const dataSets =
  buildMode === 'surtec-peti'
    ? { surtec: surtecData }
    : buildMode === 'jy-pmi'
      ? { jy: jyData }
      : buildMode === 'jy-demo'
        ? { 'jy-demo': jyDemoData }
        : { surtec: surtecData, jy: jyData, 'jy-demo': jyDemoData };

export function getDataForVariant(variant = activeVariant) {
  const config = typeof variant === 'string' ? getVariantConfig(variant) : variant;
  return dataSets[config.dataSet];
}

// Page interactions may mutate this copy without changing another presentation.
export function createDemoState(variant = activeVariant) {
  return structuredClone(getDataForVariant(variant));
}

export function getProject(data, projectId) {
  return data.projects.find((project) => project.id === projectId) || null;
}

export function getProjectOperations(data, projectId) {
  return data.operations.filter((operation) => operation.projectId === projectId);
}

export function getCostEntries(data, projectId) {
  return getProjectOperations(data, projectId)
    .filter((operation) => Boolean(operation.costSource))
    .map((operation) => ({
      id: `COST-${operation.id}`,
      projectId,
      source: operation.costSource,
      operationId: operation.id,
      documentId: operation.documentId,
      amount: operation.amount,
    }));
}

export function getProjectFinancials(data, projectId) {
  const project = getProject(data, projectId);
  if (!project) return null;

  const operations = getProjectOperations(data, projectId);
  const executedCost = getCostEntries(data, projectId).reduce(
    (total, entry) => total + entry.amount,
    0
  );
  const outstandingCommitments = operations.reduce(
    (total, operation) => total + (operation.commitmentOpen || 0),
    0
  );
  const committedCost = executedCost + outstandingCommitments;

  return {
    projectId,
    budgetAmount: project.budgetAmount,
    executedCost,
    outstandingCommitments,
    committedCost,
    availableAgainstExecuted: project.budgetAmount - executedCost,
    availableToCommit: project.budgetAmount - committedCost,
    executionPercent: project.budgetAmount
      ? Math.round((executedCost / project.budgetAmount) * 1000) / 10
      : 0,
  };
}

export function getCostBySource(data, projectId) {
  return getCostEntries(data, projectId).reduce((totals, entry) => {
    totals[entry.source] = (totals[entry.source] || 0) + entry.amount;
    return totals;
  }, {});
}

export function getPortfolioFinancials(data) {
  const activeProjects = data.projects.filter(
    (project) => project.status === 'Activo' || project.status === 'En riesgo'
  );
  const financials = activeProjects.map((project) => getProjectFinancials(data, project.id));

  return {
    activeProjectCount: activeProjects.length,
    budgetAmount: financials.reduce((total, item) => total + item.budgetAmount, 0),
    executedCost: financials.reduce((total, item) => total + item.executedCost, 0),
  };
}

// Executed costs only, grouped by the date of their source operation. Keeping
// this query here lets the Panel and the visual reference use the same series.
export function getMonthlyExecutedCost(data) {
  const inExecution = new Set(
    data.projects
      .filter((project) => ['Activo', 'En riesgo'].includes(project.status))
      .map((project) => project.id)
  );
  const totals = new Map();
  for (const operation of data.operations) {
    if (!operation.costSource || !operation.date || !inExecution.has(operation.projectId)) continue;
    const month = operation.date.slice(0, 7);
    totals.set(month, (totals.get(month) || 0) + operation.amount);
  }
  const shortMonths = [
    'Ene',
    'Feb',
    'Mar',
    'Abr',
    'May',
    'Jun',
    'Jul',
    'Ago',
    'Set',
    'Oct',
    'Nov',
    'Dic',
  ];
  const monthNames = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Setiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];
  return [...totals]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => {
      const [year, month] = key.split('-').map(Number);
      return { label: shortMonths[month - 1], title: `${monthNames[month - 1]} ${year}`, value };
    });
}

export function getDocuments(data) {
  const budgetDocuments = data.budgets.map((budget) => {
    const project = getProject(data, budget.projectId);
    return {
      id: budget.documentId,
      projectId: budget.projectId,
      module: 'budgets',
      operationId: budget.id,
      fileName: budget.initials
        ? `${budget.id}-V${budget.version}-${budget.initials}.pdf`
        : `${budget.id}.pdf`,
      type: 'Presupuesto',
      date: project.startDate,
      responsibleId: project.managerId,
      status: 'Referencia mock',
      description: `Metadatos de la cotización ${budget.id} vinculada al proyecto.`,
      version: budget.version,
      simulated: true,
    };
  });
  const operationDocuments = data.operations
    .filter((operation) => operation.documentId || operation.type === 'purchase')
    .map((operation) => {
      const project = getProject(data, operation.projectId);
      const module = {
        purchase: 'purchases',
        expense: 'expenses',
        timesheet: 'personnel',
        payroll: 'personnel',
        rxh: 'personnel',
        material_issue: 'warehouse',
        material_return: 'warehouse',
        other: 'costs',
      }[operation.type];
      const type = {
        purchase: 'Orden de compra',
        expense: 'Rendición',
        timesheet: 'Tareo',
        payroll: 'Planilla imputada',
        rxh: 'Recibo por honorarios',
        material_issue: 'Salida de material',
        material_return: 'Devolución',
        other: 'Ajuste de costo',
      }[operation.type];
      return {
        id: operation.documentId || `DOC-${operation.id}`,
        projectId: operation.projectId,
        module,
        operationId: operation.id,
        fileName: operation.label?.startsWith('N.º ')
          ? `rendicion-${operation.label.slice(4)}.pdf`
          : `${operation.id}.pdf`,
        type,
        date: operation.date,
        responsibleId: operation.workerId || project.managerId,
        status: operation.documentId ? 'Referencia mock' : 'Ficha de ejemplo',
        description: `Metadatos de ${type.toLowerCase()} ${operation.id}; no hay un archivo adjunto.`,
        version: 1,
        simulated: true,
      };
    });

  // R2/R3: each evidence of a rendición is a document of its own (expenses
  // without document have none: they are never given a receipt).
  const evidenceDocuments = (data.expenseReports || [])
    .filter((report) => report.status !== 'Borrador')
    .flatMap((report) =>
      report.items
        .filter((item) => item.docType !== 'sin-documento')
        .map((item, index) => ({
          id: `DOC-${item.id}`,
          projectId: report.projectId,
          module: 'expenses',
          operationId: report.id,
          evidenceItemId: item.id,
          fileName: item.series
            ? `${item.series}-${item.number}.${item.docType === 'boleta-foto' ? 'jpg' : 'pdf'}`
            : `${item.docType}-${item.operationCode}.${item.docType === 'transferencia' ? 'pdf' : 'jpg'}`,
          type: EVIDENCE_TYPES[item.docType].label,
          date: item.date,
          responsibleId: report.preparedBy,
          status: 'Registrado',
          description: `Evidencia del ítem ${index + 1} de la rendición N.º ${report.number}-${report.year}: ${item.description}.`,
          version: 1,
          simulated: true,
        }))
    );

  return [...budgetDocuments, ...operationDocuments, ...evidenceDocuments];
}

export function getDocument(data, documentId) {
  return getDocuments(data).find((document) => document.id === documentId) || null;
}

// Short label for compact places such as the header project selector:
// "Implementación de Infraestructura Tecnológica" → "Infraestructura Tecnológica".
export function projectShortName(name) {
  const short = String(name).replace(
    /^(Implementación|Sistema|Modernización|Renovación|Ampliación|Automatización|Migración|Supervisión|Elaboración) de (la |el |los |las )?/i,
    ''
  );
  return short.charAt(0).toUpperCase() + short.slice(1);
}

// Expense statuses that wait for someone: SurTec/PMI review ("En revisión")
// and J&Y Demo administrative review ("Presentada", "Corregida").
export const EXPENSE_PENDING_STATUSES = ['En revisión', 'Presentada', 'Corregida'];

// Records waiting for someone's approval. Shared by the header and, from
// Entrega 3, by the approvals inbox.
export function getPendingApprovals(data, variant) {
  const items = [];
  for (const budget of data.budgets) {
    if (budget.status === 'En revisión') {
      items.push({
        id: budget.id,
        kind: 'Presupuesto',
        moduleId: 'budgets',
        projectId: budget.projectId,
        amount: budget.amount,
      });
    }
  }
  for (const operation of data.operations) {
    if (operation.type === 'purchase' && operation.status === 'Pendiente') {
      items.push({
        id: operation.id,
        kind: 'Orden de compra',
        moduleId: 'purchases',
        projectId: operation.projectId,
        amount: operation.amount,
      });
    }
    if (operation.type === 'expense' && EXPENSE_PENDING_STATUSES.includes(operation.status)) {
      items.push({
        id: operation.id,
        label: operation.label || operation.id,
        kind: 'Rendición',
        moduleId: 'expenses',
        projectId: operation.projectId,
        amount: operation.amount,
      });
    }
  }
  return items.filter((item) => variant.enabledModules.includes(item.moduleId));
}

// Notification categories follow punto 106: Aprobación, Advertencia, Error,
// Información y Sistema. `level` drives the colour, `category` the label.
export function getShellNotifications(data, variant) {
  const notifications = [];
  const worklist = variantRule('approvalsMode', variant) === 'worklist';
  const alertPercent = variantRule('budgetAlertPercent', variant);

  for (const operation of data.operations) {
    if (operation.type === 'purchase' && operation.status === 'Pendiente') {
      notifications.push({
        id: `notification-${operation.id}`,
        text: worklist
          ? `${operation.id} pendiente de revisión.`
          : `${operation.id} requiere aprobación.`,
        moduleId: 'purchases',
        recordId: operation.id,
        level: 'approval',
        category: worklist ? 'Pendiente' : 'Aprobación',
      });
    }
    if (operation.type === 'expense' && EXPENSE_PENDING_STATUSES.includes(operation.status)) {
      notifications.push({
        id: `notification-${operation.id}`,
        text: `Rendición ${operation.label || operation.id} pendiente de revisión.`,
        moduleId: 'expenses',
        recordId: operation.id,
        level: 'approval',
        category: worklist ? 'Pendiente' : 'Aprobación',
      });
    }
  }

  for (const project of data.projects) {
    const { executionPercent } = getProjectFinancials(data, project.id);
    if (
      alertPercent !== null &&
      project.status === 'En riesgo' &&
      executionPercent >= alertPercent
    ) {
      notifications.push({
        id: `notification-${project.id}`,
        text: `${project.id} supera el ${alertPercent} % del presupuesto (${String(executionPercent).replace('.', ',')} % ejecutado).`,
        moduleId: 'projects',
        recordId: project.id,
        level: 'warning',
        category: 'Advertencia',
      });
    }
  }

  if (variant.enabledModules.includes('warehouse')) {
    for (const material of data.materials) {
      if (material.stock < material.minimum) {
        notifications.push({
          id: `notification-${material.id}`,
          text: `Stock bajo: ${material.name} (${material.stock} de mínimo ${material.minimum}).`,
          moduleId: 'warehouse',
          recordId: material.id,
          level: 'warning',
          category: 'Advertencia',
        });
      }
    }
  }

  if (variant.enabledModules.includes('biometrics')) {
    notifications.push({
      id: 'notification-biometric-sync',
      text: 'Error de sincronización biométrica: 2 registros sin asociar.',
      moduleId: 'personnel',
      href: './personnel.html?tab=incidencias',
      level: 'error',
      category: 'Error',
    });
  }

  return notifications.filter((notification) =>
    variant.enabledModules.includes(notification.moduleId)
  );
}
