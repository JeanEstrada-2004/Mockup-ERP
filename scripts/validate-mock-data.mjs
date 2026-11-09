import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  VARIANT_IDS,
  getVariantConfig,
  variantStorageKey,
} from '../src-modern/scripts/config/variants.js';
import {
  getCostBySource,
  getDataForVariant,
  getDocuments,
  getPortfolioFinancials,
  getProjectFinancials,
} from '../src-modern/scripts/data/mock-data.js';

function uniqueIds(items, label) {
  const ids = items.map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length, `IDs duplicados en ${label}`);
}

for (const variantId of VARIANT_IDS) {
  const config = getVariantConfig(variantId);
  const data = getDataForVariant(config);
  assert.equal(data.fictitious, true);
  assert.ok(config.enabledModules.includes('dashboard'));
  assert.ok(config.enabledModules.includes('projects'));
  assert.equal(new Set(config.enabledModules).size, config.enabledModules.length);

  for (const logo of Object.values({
    light: config.company.logoLight,
    dark: config.company.logoDark,
    compact: config.company.logoCompact,
  })) {
    assert.ok(existsSync(resolve('public-assets', logo)), `Logo faltante: ${logo}`);
  }

  for (const key of ['clients', 'suppliers', 'workers', 'projects', 'budgets', 'operations']) {
    uniqueIds(data[key], `${variantId}.${key}`);
  }
  const documents = getDocuments(data);
  uniqueIds(documents, `${variantId}.documents`);

  const clients = new Set(data.clients.map((item) => item.id));
  const workers = new Set(data.workers.map((item) => item.id));
  const suppliers = new Set(data.suppliers.map((item) => item.id));
  const materials = new Set(data.materials.map((item) => item.id));
  const projects = new Set(data.projects.map((item) => item.id));
  const documentIds = new Set(documents.map((item) => item.id));
  const budgets = new Map(data.budgets.map((item) => [item.id, item]));

  for (const project of data.projects) {
    assert.ok(clients.has(project.clientId), `${project.id}: cliente inexistente`);
    assert.ok(workers.has(project.managerId), `${project.id}: responsable inexistente`);
    const budget = budgets.get(project.budgetId);
    assert.ok(budget, `${project.id}: presupuesto inexistente`);
    assert.equal(budget.projectId, project.id);
    assert.equal(budget.amount, project.budgetAmount);
    assert.ok(documentIds.has(budget.documentId));
    assert.ok(getProjectFinancials(data, project.id).executedCost <= project.budgetAmount);
  }

  for (const item of data.operations) {
    assert.ok(projects.has(item.projectId), `${item.id}: proyecto inexistente`);
    if (item.supplierId) assert.ok(suppliers.has(item.supplierId));
    if (item.workerId) assert.ok(workers.has(item.workerId));
    if (item.materialId) assert.ok(materials.has(item.materialId));
    if (item.documentId) assert.ok(documentIds.has(item.documentId));
    if (item.costSource) assert.ok(item.documentId, `${item.id}: costo sin documento`);
    if (item.commitmentOpen) assert.equal(item.costSource, null);
  }

  for (const document of documents) {
    assert.ok(projects.has(document.projectId));
    assert.ok(
      data.operations.some((item) => item.id === document.operationId) ||
        budgets.has(document.operationId)
    );
  }
}

assert.notEqual(getDataForVariant('surtec-peti'), getDataForVariant('jy-pmi'));
assert.equal(getDataForVariant('jy-pmi'), getDataForVariant('jy-demo'));
assert.notEqual(
  variantStorageKey('current-project', getVariantConfig('jy-pmi')),
  variantStorageKey('current-project', getVariantConfig('jy-demo'))
);

const surtec = getDataForVariant('surtec-peti');
assert.deepEqual(getPortfolioFinancials(surtec), {
  activeProjectCount: 3,
  budgetAmount: 426000,
  executedCost: 243150,
});
assert.deepEqual(getProjectFinancials(surtec, 'PR-2027-001'), {
  projectId: 'PR-2027-001',
  budgetAmount: 185000,
  executedCost: 112450,
  outstandingCommitments: 16250,
  committedCost: 128700,
  availableAgainstExecuted: 72550,
  availableToCommit: 56300,
  executionPercent: 60.8,
});
assert.deepEqual(getCostBySource(surtec, 'PR-2027-001'), {
  purchases: 47230,
  personnel: 30362,
  expenses: 15743,
  materials: 13494,
  other: 5621,
});
assert.equal(getProjectFinancials(surtec, 'PR-2027-002').executedCost, 82500);
assert.equal(getProjectFinancials(surtec, 'PR-2027-003').executedCost, 48200);

const jy = getDataForVariant('jy-demo');
assert.deepEqual(getPortfolioFinancials(jy), {
  activeProjectCount: 2,
  budgetAmount: 250000,
  executedCost: 113500,
});

console.log('Configuraciones, logos, referencias y cifras mock: correctos.');
