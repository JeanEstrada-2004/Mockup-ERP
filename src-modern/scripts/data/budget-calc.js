// Presupuestos técnicos (R4, J&Y Demo). Pure calculations, no imports, so the
// data set can derive its figures from them and the views recompute them live.
//
// Tipo A — partidas / APU: each leaf partida has a metrado and an APU. An APU
// resource is either labour/equipment with a crew and the partida's daily
// yield (cantidad = cuadrilla × 8 h ÷ rendimiento), a fixed quantity per unit,
// or a percentage of labour (herramientas manuales). Costo unitario = Σ
// parciales; parcial de la partida = metrado × costo unitario.
// Tipo B — productos: each line is a requested product with supplier options;
// its cost is quantity × the selected option's price.
// Precio cliente = costo directo + gastos generales + utilidad; IGV aparte.

export const round2 = (value) => Math.round((Number(value) || 0) * 100) / 100;
export const IGV_RATE = 0.18;
export const HOURS_PER_DAY = 8;
export const RESOURCE_GROUPS = [
  { id: 'Mano de obra', label: 'Mano de obra' },
  { id: 'Material', label: 'Materiales' },
  { id: 'Equipo', label: 'Equipos y herramientas' },
];

const productOf = (ctx, id) => ctx.products.find((item) => item.id === id);

// Price offered for a product in a quote (null when the quote does not offer it).
export function quotePrice(ctx, quoteId, productId) {
  const quote = ctx.quotes.find((item) => item.id === quoteId);
  return quote?.items.find((item) => item.productId === productId)?.price ?? null;
}

// Price used by a budget: the supplier quote selected for that product, or the
// internal reference price of the catalogue.
export function priceFor(ctx, selections, productId) {
  const quoteId = selections?.[productId];
  const quoted = quoteId ? quotePrice(ctx, quoteId, productId) : null;
  return quoted ?? productOf(ctx, productId)?.refPrice ?? 0;
}

export function apuLines(ctx, apu, selections) {
  const lines = [];
  for (const resource of apu.resources) {
    if (resource.percentOfLabour) continue;
    const product = productOf(ctx, resource.product);
    const qty =
      resource.crew !== undefined
        ? round2((resource.crew * HOURS_PER_DAY) / apu.yield)
        : round2(resource.qty);
    const price = priceFor(ctx, selections, resource.product);
    lines.push({
      productId: resource.product,
      code: product?.code || resource.product,
      name: product?.name || resource.product,
      unit: product?.unit || '',
      group: product?.kind || 'Material',
      crew: resource.crew ?? null,
      qty,
      price,
      partial: round2(qty * price),
    });
  }
  const labour = round2(
    lines
      .filter((line) => line.group === 'Mano de obra')
      .reduce((sum, line) => sum + line.partial, 0)
  );
  for (const resource of apu.resources.filter((item) => item.percentOfLabour)) {
    const product = productOf(ctx, resource.product);
    lines.push({
      productId: resource.product,
      code: product?.code || resource.product,
      name: product?.name || resource.product,
      unit: '%MO',
      group: 'Equipo',
      crew: null,
      qty: resource.percentOfLabour,
      price: labour,
      partial: round2((labour * resource.percentOfLabour) / 100),
    });
  }
  return lines;
}

export function apuUnitCost(ctx, apu, selections) {
  return round2(apuLines(ctx, apu, selections).reduce((sum, line) => sum + line.partial, 0));
}

// Partidas with their unit cost and partial; titles carry the sum of children.
export function partidaRows(ctx, budget, overrides = {}) {
  const selections = { ...budget.selections, ...overrides.selections };
  const leaves = budget.partidas
    .filter((item) => item.apu)
    .map((item) => {
      const quantity = overrides.quantities?.[item.code] ?? item.quantity;
      const unitCost = apuUnitCost(ctx, item.apu, selections);
      return { ...item, quantity, unitCost, partial: round2(quantity * unitCost) };
    });
  return budget.partidas.map((item) => {
    if (item.apu) return leaves.find((leaf) => leaf.code === item.code);
    const children = leaves.filter((leaf) => leaf.code.startsWith(`${item.code}.`));
    return {
      ...item,
      title: true,
      level: item.code.split('.').length,
      partial: round2(children.reduce((sum, leaf) => sum + leaf.partial, 0)),
    };
  });
}

// Consolidated list of resources of every partida (lista de insumos).
export function insumos(ctx, budget, overrides = {}) {
  const selections = { ...budget.selections, ...overrides.selections };
  const totals = new Map();
  for (const row of partidaRows(ctx, budget, overrides).filter((item) => item.apu)) {
    for (const line of apuLines(ctx, row.apu, selections)) {
      if (line.unit === '%MO') continue;
      const current = totals.get(line.productId) || { ...line, quantity: 0, partial: 0 };
      current.quantity = round2(current.quantity + line.qty * row.quantity);
      current.partial = round2(current.quantity * line.price);
      totals.set(line.productId, current);
    }
  }
  return [...totals.values()].map((item) => ({
    ...item,
    quoteId: selections[item.productId] || null,
    refPrice: productOf(ctx, item.productId)?.refPrice ?? 0,
  }));
}

export function productLines(ctx, budget, overrides = {}) {
  const selections = { ...budget.selections, ...overrides.selections };
  return budget.products.map((line) => {
    const quantity = overrides.quantities?.[line.id] ?? line.quantity;
    const quoteId = selections[line.productId] || null;
    const price = priceFor(ctx, selections, line.productId);
    const options = ctx.quotes
      .filter((quote) => quote.items.some((item) => item.productId === line.productId))
      .map((quote) => {
        const offer = quote.items.find((item) => item.productId === line.productId);
        return { quoteId: quote.id, supplierId: quote.supplierId, ...offer };
      })
      .sort((a, b) => a.price - b.price);
    return { ...line, quantity, quoteId, price, partial: round2(quantity * price), options };
  });
}

export function budgetTotals(ctx, budget, overrides = {}) {
  const overheadPct = overrides.overheadPct ?? budget.overheadPct;
  const profitPct = overrides.profitPct ?? budget.profitPct;
  const directCost =
    budget.type === 'A'
      ? round2(
          partidaRows(ctx, budget, overrides)
            .filter((item) => item.apu)
            .reduce((sum, item) => sum + item.partial, 0)
        )
      : round2(productLines(ctx, budget, overrides).reduce((sum, item) => sum + item.partial, 0));
  const overhead = round2((directCost * overheadPct) / 100);
  const profit = round2((directCost * profitPct) / 100);
  const subtotal = round2(directCost + overhead + profit);
  const igv = round2(subtotal * IGV_RATE);
  return {
    directCost,
    overheadPct,
    overhead,
    profitPct,
    profit,
    subtotal,
    igv,
    total: round2(subtotal + igv),
    // Client price ÷ direct cost: how a direct-cost partial becomes a client price.
    factor: directCost ? subtotal / directCost : 1,
  };
}

// Observed code: PR2606-0022-V2-GM (PR = presupuesto, 26 = año, 06 = mes,
// 0022 = correlativo, V2 = versión, GM = iniciales; their meaning is pending).
export function budgetCode(budget, version = budget.version) {
  return `${budget.id}-V${version}${budget.initials ? `-${budget.initials}` : ''}`;
}
