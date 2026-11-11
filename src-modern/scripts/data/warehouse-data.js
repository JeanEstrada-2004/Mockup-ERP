// Fixed, fictitious SurTec stock movements live here; J&Y Demo supplies its
// own movements through its data set. Inventory purchases are not posted as
// executed cost; linked issue operations are.
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

export const movementNames = {
  entry: 'Entrada',
  issue: 'Salida',
  return: 'Devolución',
  adjustment: 'Ajuste',
};

export function warehouseOpening(materialId, data) {
  if (data?.id === 'jy-demo')
    return data.materials.find((item) => item.id === materialId)?.openingStock ?? 0;
  return openingStock[materialId] ?? 0;
}

export function warehouseMovements(data) {
  if (data.id !== 'surtec' && data.id !== 'jy-demo') return [];
  const balance =
    data.id === 'surtec'
      ? { ...openingStock }
      : Object.fromEntries(data.materials.map((item) => [item.id, item.openingStock ?? 0]));
  const source = data.id === 'surtec' ? fixtures : data.warehouseMovements;
  return source
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
      const after = before + (movement.type === 'issue' ? -movement.quantity : movement.quantity);
      balance[movement.materialId] = after;
      return { ...movement, balanceBefore: before, balance: after };
    });
}

export function warehouseStock(data, materialId) {
  return (
    warehouseMovements(data)
      .filter((item) => item.materialId === materialId)
      .at(-1)?.balance ?? warehouseOpening(materialId, data)
  );
}

export function warehouseMovement(data, movementId) {
  return warehouseMovements(data).find((item) => item.id === movementId) || null;
}

// Almacenes (punto 57). Only "Principal" holds stock in the mock data; the
// project site store is the usual transfer destination. This module ships in
// every build: no record ids or client names of one company here.
export const WAREHOUSES = [
  {
    id: 'ALM-01',
    name: 'Principal',
    location: 'Sede central · Arequipa',
    responsibleId: 'PER-004',
  },
  {
    id: 'ALM-02',
    name: 'Almacén de obra',
    location: 'Campamento del proyecto en ejecución',
    responsibleId: 'PER-001',
  },
];

export const MOVEMENT_TYPES = [
  { id: 'entry', label: 'Entrada' },
  { id: 'issue', label: 'Salida' },
  { id: 'return', label: 'Devolución' },
  { id: 'transfer', label: 'Transferencia' },
];
