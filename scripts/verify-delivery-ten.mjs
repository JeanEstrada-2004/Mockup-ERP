import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const suites = [
  ['Auditoría final y escenario 1', 'final-audit.mjs'],
  ['Navegación gerencial', 'shell-interaction-test.mjs'],
  ['Presupuestos y compras', 'commercial-interaction-test.mjs'],
  ['Escenario 2: rendición móvil', 'expense-interaction-test.mjs'],
  ['Escenario 3: compra y Kardex', 'warehouse-interaction-test.mjs'],
  ['Escenario 4: asistencia y tareo', 'personnel-interaction-test.mjs'],
  ['Costos consolidados', 'cost-interaction-test.mjs'],
  ['Escenario 5: oportunidad y proyecto; módulos finales', 'delivery-nine-interaction-test.mjs'],
  ['Maestros y J&Y Demo (R1)', 'masters-interaction-test.mjs'],
  ['Rendiciones de J&Y Demo (R2)', 'expense-review-interaction-test.mjs'],
  ['Control de J&Y Demo (R3)', 'jy-control-interaction-test.mjs'],
  ['Presupuestos de J&Y Demo (R4)', 'jy-budgets-interaction-test.mjs'],
  ['Personal de J&Y Demo (R5)', 'jy-personnel-interaction-test.mjs'],
];

for (const [label, script] of suites) {
  console.log(`\n${label}`);
  const result = spawnSync(process.execPath, [path.join(scriptsDir, script)], {
    stdio: 'inherit',
    env: process.env,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}

console.log('\nEntrega 10: cinco escenarios y tres builds verificados.');
