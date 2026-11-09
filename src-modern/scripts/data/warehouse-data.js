// Fixed, fictitious stock movements for the SurTec presentation. Inventory
// purchases are not posted as executed cost; the linked SAL operations are.
const openingStock = { 'MAT-001': 1230, 'MAT-002': 80 };

const fixtures = [
  {
    id: 'ENT-035',
    type: 'entry',
    materialId: 'MAT-001',
    quantity: 320,
    date: '2027-03-19',
    operationId: 'OC-035',
    receiptId: 'REC-035',
    responsibleId: 'PER-003',
    reason: 'Recepción conforme de OC',
  },
  {
    id: 'SAL-015',
    type: 'issue',
    materialId: 'MAT-001',
    quantity: 320,
    date: '2027-03-22',
    operationId: 'SAL-015',
    purchaseId: 'OC-035',
    responsibleId: 'PER-003',
    reason: 'Instalación en proyecto',
  },
  {
    id: 'DEV-015',
    type: 'return',
    materialId: 'MAT-001',
    quantity: 20,
    date: '2027-03-24',
    operationId: 'DEV-015',
    purchaseId: 'OC-035',
    relatedIssueId: 'SAL-015',
    responsibleId: 'PER-003',
    reason: 'Sobrante utilizable',
  },
  {
    id: 'ENT-202',
    type: 'entry',
    materialId: 'MAT-002',
    quantity: 100,
    date: '2027-04-17',
    operationId: 'OC-202',
    receiptId: 'REC-202',
    responsibleId: 'PER-003',
    reason: 'Recepción conforme de OC',
  },
  {
    id: 'SAL-201',
    type: 'issue',
    materialId: 'MAT-002',
    quantity: 100,
    date: '2027-04-20',
    operationId: 'SAL-201',
    purchaseId: 'OC-202',
    responsibleId: 'PER-003',
    reason: 'Instalación en proyecto',
  },
  {
    id: 'ENT-302',
    type: 'entry',
    materialId: 'MAT-001',
    quantity: 100,
    date: '2027-05-17',
    operationId: 'OC-302',
    receiptId: 'REC-302',
    responsibleId: 'PER-003',
    reason: 'Recepción conforme de OC',
  },
  {
    id: 'SAL-301',
    type: 'issue',
    materialId: 'MAT-001',
    quantity: 100,
    date: '2027-05-20',
    operationId: 'SAL-301',
    purchaseId: 'OC-302',
    responsibleId: 'PER-003',
    reason: 'Instalación en proyecto',
  },
];

export const movementNames = { entry: 'Entrada', issue: 'Salida', return: 'Devolución' };

export function warehouseOpening(materialId) {
  return openingStock[materialId] ?? 0;
}

export function warehouseMovements(data) {
  if (data.id !== 'surtec') return [];
  const balance = { ...openingStock };
  return fixtures
    .map((fixture) => {
      const operation = data.operations.find((item) => item.id === fixture.operationId);
      const purchase =
        fixture.type === 'entry'
          ? operation
          : data.operations.find((item) => item.id === fixture.purchaseId);
      const unitCost = purchase?.inventoryLine?.unitCost || 0;
      return {
        ...fixture,
        projectId: operation?.projectId || null,
        purchaseId: purchase?.id || null,
        supplierId: purchase?.supplierId || null,
        documentId: operation?.documentId || null,
        purchaseDocumentId: purchase?.documentId || null,
        unitCost,
        referenceValue: Math.round(fixture.quantity * unitCost * 100) / 100,
        executedCost: fixture.type === 'issue' ? operation?.amount || 0 : 0,
        simulated: true,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
    .map((movement) => {
      const before = balance[movement.materialId];
      const after = before + (movement.type === 'issue' ? -1 : 1) * movement.quantity;
      balance[movement.materialId] = after;
      return { ...movement, balanceBefore: before, balance: after };
    });
}

export function warehouseStock(data, materialId) {
  return (
    warehouseMovements(data)
      .filter((item) => item.materialId === materialId)
      .at(-1)?.balance ?? warehouseOpening(materialId)
  );
}

export function warehouseMovement(data, movementId) {
  return warehouseMovements(data).find((item) => item.id === movementId) || null;
}
