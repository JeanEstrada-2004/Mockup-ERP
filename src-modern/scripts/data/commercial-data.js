// Referential itemization for the visual mockup. The source records contain
// gross totals only; these two lines split that total without changing it.
export const TAX_RATE = 0.18;

export function commercialBreakdown(grossAmount, kind) {
  const grossCents = Math.round(grossAmount * 100);
  const subtotalCents = Math.round(grossCents / (1 + TAX_RATE));
  const firstCents = Math.round(subtotalCents * 0.7);
  const labels =
    kind === 'budget'
      ? ['Alcance técnico del proyecto', 'Coordinación, pruebas y entrega']
      : ['Suministro o servicio principal', 'Logística y entrega'];
  const items = [firstCents, subtotalCents - firstCents].map((cents, index) => ({
    code: `${index + 1}`.padStart(2, '0'),
    description: labels[index],
    unit: 'servicio',
    quantity: 1,
    unitPrice: cents / 100,
    subtotal: cents / 100,
  }));
  return {
    items,
    subtotal: subtotalCents / 100,
    tax: (grossCents - subtotalCents) / 100,
    total: grossCents / 100,
    rate: TAX_RATE,
  };
}

export function inventoryPurchaseBreakdown(purchase, material) {
  const { quantity, unitCost } = purchase.inventoryLine;
  const subtotal = Math.round(quantity * unitCost * 100) / 100;
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  return {
    items: [
      {
        code: material.id,
        description: material.name,
        unit: material.unit,
        quantity,
        unitPrice: unitCost,
        subtotal,
      },
    ],
    subtotal,
    tax,
    total: subtotal + tax,
    rate: TAX_RATE,
  };
}

export function formatAmount(amount) {
  return `S/ ${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(amount)
    .replaceAll(',', ' ')}`;
}
