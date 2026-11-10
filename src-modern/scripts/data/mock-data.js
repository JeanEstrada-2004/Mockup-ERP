/* global __ACTIVE_VARIANT__ */
import { activeVariant, getVariantConfig } from '../config/variants.js';
import { surtecData } from './surtec.js';
import { jyData } from './jy.js';

// During a variant build, Vite replaces MODE and removes the other data set
// from the generated bundle. Node validation keeps both sets available.
const buildMode = typeof __ACTIVE_VARIANT__ === 'undefined' ? undefined : __ACTIVE_VARIANT__;
const dataSets =
  buildMode === 'surtec-peti'
    ? { surtec: surtecData }
    : buildMode === 'jy-pmi' || buildMode === 'jy-demo'
      ? { jy: jyData }
      : { surtec: surtecData, jy: jyData };

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

export function getDocuments(data) {
  const budgetDocuments = data.budgets.map((budget) => {
    const project = getProject(data, budget.projectId);
    return {
      id: budget.documentId,
      projectId: budget.projectId,
      module: 'budgets',
      operationId: budget.id,
      fileName: `${budget.id}.pdf`,
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
        material_issue: 'warehouse',
        material_return: 'warehouse',
        other: 'costs',
      }[operation.type];
      const type = {
        purchase: 'Orden de compra',
        expense: 'Rendición',
        timesheet: 'Tareo',
        material_issue: 'Salida de material',
        material_return: 'Devolución',
        other: 'Ajuste de costo',
      }[operation.type];
      return {
        id: operation.documentId || `DOC-${operation.id}`,
        projectId: operation.projectId,
        module,
        operationId: operation.id,
        fileName: `${operation.id}.pdf`,
        type,
        date: operation.date,
        responsibleId: operation.workerId || project.managerId,
        status: operation.documentId ? 'Referencia mock' : 'Ficha de ejemplo',
        description: `Metadatos de ${type.toLowerCase()} ${operation.id}; no hay un archivo adjunto.`,
        version: 1,
        simulated: true,
      };
    });

  return [...budgetDocuments, ...operationDocuments];
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
    if (operation.type === 'expense' && operation.status === 'En revisión') {
      items.push({
        id: operation.id,
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

  for (const operation of data.operations) {
    if (operation.type === 'purchase' && operation.status === 'Pendiente') {
      notifications.push({
        id: `notification-${operation.id}`,
        text: `${operation.id} requiere aprobación.`,
        moduleId: 'purchases',
        recordId: operation.id,
        level: 'approval',
        category: 'Aprobación',
      });
    }
    if (operation.type === 'expense' && operation.status === 'En revisión') {
      notifications.push({
        id: `notification-${operation.id}`,
        text: `Rendición ${operation.id} pendiente de revisión.`,
        moduleId: 'expenses',
        recordId: operation.id,
        level: 'approval',
        category: 'Aprobación',
      });
    }
  }

  for (const project of data.projects) {
    const { executionPercent } = getProjectFinancials(data, project.id);
    if (project.status === 'En riesgo' && executionPercent >= 80) {
      notifications.push({
        id: `notification-${project.id}`,
        text: `${project.id} supera el 80 % del presupuesto (${String(executionPercent).replace('.', ',')} % ejecutado).`,
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
