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
import {
  commercialBreakdown,
  inventoryPurchaseBreakdown,
} from '../src-modern/scripts/data/commercial-data.js';
import {
  warehouseMovements,
  warehouseOpening,
  warehouseStock,
} from '../src-modern/scripts/data/warehouse-data.js';
import { projectCostModel } from '../src-modern/scripts/data/cost-data.js';
import {
  personnelAssignments,
  baseAttendance,
  baseTimesheets,
  incidentRows,
  laborCostRows,
  hoursBetween,
} from '../src-modern/scripts/data/personnel-data.js';

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
  uniqueIds(data.opportunities, `${variantId}.opportunities`);
  const documents = getDocuments(data);
  uniqueIds(documents, `${variantId}.documents`);

  const clients = new Set(data.clients.map((item) => item.id));
  const workers = new Set(data.workers.map((item) => item.id));
  const suppliers = new Set(data.suppliers.map((item) => item.id));
  const materials = new Set(data.materials.map((item) => item.id));
  const projects = new Set(data.projects.map((item) => item.id));
  const documentIds = new Set(documents.map((item) => item.id));
  const budgets = new Map(data.budgets.map((item) => [item.id, item]));
  for (const opportunity of data.opportunities) {
    assert.ok(clients.has(opportunity.clientId));
    assert.ok(workers.has(opportunity.ownerId));
    assert.ok(projects.has(opportunity.projectId));
    assert.equal(budgets.get(opportunity.budgetId)?.projectId, opportunity.projectId);
    assert.equal(budgets.get(opportunity.budgetId)?.clientId, opportunity.clientId);
    assert.equal(budgets.get(opportunity.budgetId)?.amount, opportunity.estimatedAmount);
  }

  const stockMovements = warehouseMovements(data);
  if (config.enabledModules.includes('warehouse')) {
    uniqueIds(stockMovements, `${variantId}.warehouse`);
    for (const material of data.materials) {
      assert.equal(
        warehouseStock(data, material.id),
        material.stock,
        `${material.id}: stock inconsistente`
      );
      assert.ok(warehouseOpening(material.id) >= 0);
    }
    for (const movement of stockMovements) {
      const operation = data.operations.find((item) => item.id === movement.operationId);
      const purchase = data.operations.find((item) => item.id === movement.purchaseId);
      assert.ok(operation && purchase && purchase.inventoryLine);
      assert.ok(materials.has(movement.materialId) && projects.has(movement.projectId));
      assert.ok(
        documentIds.has(movement.documentId) && documentIds.has(movement.purchaseDocumentId)
      );
      assert.ok(movement.quantity > 0 && movement.balance >= 0);
      assert.equal(purchase.inventoryLine.materialId, movement.materialId);
      assert.equal(
        movement.balance,
        movement.balanceBefore + (movement.type === 'issue' ? -1 : 1) * movement.quantity
      );
      if (movement.type === 'entry') {
        assert.equal(operation.id, purchase.id);
        assert.equal(movement.quantity, purchase.inventoryLine.quantity);
        assert.equal(
          purchase.costSource,
          null,
          `${purchase.id}: no sumar compra de inventario al costo`
        );
      }
      if (movement.type === 'issue') {
        assert.equal(operation.type, 'material_issue');
        assert.equal(operation.costSource, 'materials');
        assert.equal(movement.executedCost, operation.amount);
      }
      if (movement.type === 'return') {
        assert.equal(operation.type, 'material_return');
        assert.equal(operation.amount, 0);
        assert.ok(
          stockMovements.some(
            (item) => item.id === movement.relatedIssueId && item.type === 'issue'
          )
        );
      }
    }
    for (const project of data.projects) {
      assert.equal(
        stockMovements
          .filter((item) => item.type === 'issue' && item.projectId === project.id)
          .reduce((sum, item) => sum + item.executedCost, 0),
        getCostBySource(data, project.id).materials || 0
      );
    }
  } else {
    assert.equal(stockMovements.length, 0);
  }

  assert.equal(new Set(data.workers.map((item) => item.dni)).size, data.workers.length);
  for (const worker of data.workers) {
    assert.match(worker.dni, /^0000\d{4}$/, `${worker.id}: DNI ficticio inválido`);
    assert.ok(worker.role && worker.area && worker.status === 'Activo');
  }
  const assignments = personnelAssignments(data);
  uniqueIds(assignments, `${variantId}.assignments`);
  for (const assignment of assignments) {
    assert.ok(workers.has(assignment.workerId));
    assert.ok(projects.has(assignment.projectId));
    assert.ok(assignment.percent > 0 && assignment.percent <= 100);
  }
  for (const worker of data.workers) {
    assert.equal(
      assignments
        .filter((item) => item.workerId === worker.id)
        .reduce((sum, item) => sum + item.percent, 0),
      100,
      `${worker.id}: asignación referencial inconsistente`
    );
  }
  const attendance = baseAttendance(data, config.enabledModules.includes('biometrics'));
  const timesheets = baseTimesheets(data);
  uniqueIds(attendance, `${variantId}.attendance`);
  uniqueIds(timesheets, `${variantId}.timesheets`);
  for (const timesheet of timesheets) {
    const source = data.operations.find((item) => item.id === timesheet.operationId);
    const presence = attendance.find((item) => item.id === timesheet.attendanceId);
    assert.equal(source?.type, 'timesheet');
    assert.equal(source.workerId, timesheet.workerId);
    assert.equal(source.projectId, timesheet.projectId);
    assert.equal(presence?.workerId, timesheet.workerId);
    assert.equal(presence?.projectId, timesheet.projectId);
    assert.equal(presence?.date, timesheet.date);
    assert.equal(hoursBetween(timesheet.start, timesheet.end), timesheet.hours);
  }
  assert.equal(
    incidentRows(data, config.enabledModules.includes('biometrics')).length,
    config.enabledModules.includes('biometrics') ? 1 : 0
  );
  assert.equal(
    laborCostRows(data).length,
    data.operations.filter((item) => item.type === 'timesheet').length
  );
  for (const project of data.projects) {
    const costModel = projectCostModel(data, project.id);
    assert.equal(
      costModel.sources.reduce((sum, source) => sum + source.amount, 0),
      costModel.financials.executedCost
    );
    assert.equal(
      costModel.entries.reduce((sum, entry) => sum + entry.amount, 0),
      costModel.financials.executedCost
    );
    assert.equal(
      costModel.commitments.reduce((sum, item) => sum + item.amount, 0),
      costModel.financials.outstandingCommitments
    );
    assert.equal(
      costModel.parts.reduce((sum, item) => sum + item.budget, 0),
      project.budgetAmount
    );
    for (const entry of costModel.entries) assert.ok(documentIds.has(entry.documentId));
    assert.equal(
      laborCostRows(data)
        .filter((item) => item.projectId === project.id)
        .reduce((sum, item) => sum + item.amount, 0),
      getCostBySource(data, project.id).personnel || 0
    );
  }

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
    if (item.type === 'purchase') {
      const breakdown = item.inventoryLine
        ? inventoryPurchaseBreakdown(
            item,
            data.materials.find((material) => material.id === item.inventoryLine.materialId)
          )
        : commercialBreakdown(item.amount, 'purchase');
      assert.equal(breakdown.total, item.amount);
      assert.equal(
        Math.round((breakdown.subtotal + breakdown.tax) * 100),
        Math.round(item.amount * 100)
      );
      assert.equal(
        Math.round(breakdown.items.reduce((sum, line) => sum + line.subtotal, 0) * 100),
        Math.round(breakdown.subtotal * 100)
      );
      assert.ok(documents.some((document) => document.operationId === item.id));
    }
  }

  for (const budget of data.budgets) {
    const breakdown = commercialBreakdown(budget.amount, 'budget');
    assert.equal(breakdown.total, budget.amount);
    assert.equal(
      Math.round((breakdown.subtotal + breakdown.tax) * 100),
      Math.round(budget.amount * 100)
    );
    assert.equal(
      Math.round(breakdown.items.reduce((sum, line) => sum + line.subtotal, 0) * 100),
      Math.round(breakdown.subtotal * 100)
    );
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
// Dashboard totals required by the functional specification (punto 6).
assert.deepEqual(getPortfolioFinancials(surtec), {
  activeProjectCount: 12,
  budgetAmount: 1245000,
  executedCost: 768400,
});
assert.equal(surtec.projects.length, 15);
for (const status of ['Planificado', 'Activo', 'En riesgo', 'Suspendido', 'Cerrado']) {
  assert.ok(
    surtec.projects.some((project) => project.status === status),
    `Falta un proyecto en estado ${status}`
  );
}
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
