import { activeVariant, getVariantConfig } from '../config/variants.js';
import { surtecData } from './surtec.js';
import { jyData } from './jy.js';

const dataSets = { surtec: surtecData, jy: jyData };

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
  const budgetDocuments = data.budgets.map((budget) => ({
    id: budget.documentId,
    projectId: budget.projectId,
    module: 'budgets',
    operationId: budget.id,
    fileName: `${budget.id}.pdf`,
    version: budget.version,
    simulated: true,
  }));
  const operationDocuments = data.operations
    .filter((operation) => operation.documentId)
    .map((operation) => ({
      id: operation.documentId,
      projectId: operation.projectId,
      module: operation.type,
      operationId: operation.id,
      fileName: `${operation.id}.pdf`,
      version: 1,
      simulated: true,
    }));

  return [...budgetDocuments, ...operationDocuments];
}

export function getDocument(data, documentId) {
  return getDocuments(data).find((document) => document.id === documentId) || null;
}
