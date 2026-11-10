// ==========================================================================
// Sistema visual (Entrega 2) — every shared component and every D3 pattern,
// fed with the variant's real mock data. Reference page for Entregas 3–7.
// ==========================================================================

import { activeVariant } from '../config/variants.js';
import { moduleHref } from '../config/modules.js';
import {
  getCostBySource,
  getDataForVariant,
  getPendingApprovals,
  getPortfolioFinancials,
  getProject,
  getProjectFinancials,
  projectShortName,
} from '../data/mock-data.js';
import { COST_SOURCE_TOKENS } from './project-views.js';
import { formatMoney } from './shell.js';

const data = getDataForVariant(activeVariant);
const SOURCE_NAMES = {
  purchases: 'Compras',
  personnel: 'Personal',
  expenses: 'Rendiciones',
  materials: 'Materiales',
  other: 'Otros',
};
const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];
const MONTH_NAMES = [
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

const inExecution = (project) => project.status === 'Activo' || project.status === 'En riesgo';

/** Executed cost per month across the projects in execution (operation dates). */
function monthlyCost() {
  const ids = new Set(data.projects.filter(inExecution).map((project) => project.id));
  const totals = new Map();
  data.operations
    .filter((operation) => operation.costSource && ids.has(operation.projectId) && operation.date)
    .forEach((operation) => {
      const key = operation.date.slice(0, 7);
      totals.set(key, (totals.get(key) || 0) + operation.amount);
    });
  return [...totals.keys()].sort().map((key) => {
    const [year, month] = key.split('-').map(Number);
    return {
      label: MONTHS[month - 1],
      title: `${MONTH_NAMES[month - 1]} ${year}`,
      value: totals.get(key),
    };
  });
}

export function designSystemView() {
  const portfolio = getPortfolioFinancials(data);
  const projects = data.projects.filter(inExecution);
  const riskCount = projects.filter((project) => project.status === 'En riesgo').length;
  const approvals = getPendingApprovals(data, activeVariant);
  const months = monthlyCost();
  let cumulative = 0;
  const cumulativeMonths = months.map((month) => (cumulative += month.value));

  return {
    portfolio,
    riskCount,
    activeCount: projects.length - riskCount,
    approvals,
    months,
    focusProjectId: data.projects[0]?.id,
    tab: 'resumen',
    charts: [],
    formatMoney,
    get focusProject() {
      return getProject(data, this.focusProjectId);
    },
    get focusFinancials() {
      return getProjectFinancials(data, this.focusProjectId);
    },
    get executedPercent() {
      return portfolio.budgetAmount ? (portfolio.executedCost / portfolio.budgetAmount) * 100 : 0;
    },
    get oldestApprovals() {
      return approvals.slice(0, 3).map((item) => ({
        ...item,
        href: moduleHref(item.moduleId, item.id),
        projectName: projectShortName(getProject(data, item.projectId)?.name || ''),
      }));
    },
    get sampleRows() {
      return projects.slice(0, 5).map((project) => ({
        ...project,
        cost: getProjectFinancials(data, project.id).executedCost,
      }));
    },
    init() {
      const saved = document.querySelector('#global-project-select')?.value;
      if (getProject(data, saved)) this.focusProjectId = saved;
      this.$nextTick(() => this.renderCharts(cumulativeMonths));
    },
    // The approvals inbox is the header menu until approvals.html (Entrega 4).
    openApprovals() {
      const toggle = document.querySelector('.shell-approval-menu')?.previousElementSibling;
      toggle?.click();
      toggle?.focus();
    },
    selectProject(id) {
      if (!getProject(data, id)) return;
      this.focusProjectId = id;
      const [flowChart, donutChart] = this.charts;
      flowChart?.update(this.flowData());
      donutChart?.update(this.sourceData(), {
        centerValue: formatMoney(this.focusFinancials.executedCost),
      });
    },
    flowData() {
      const financials = this.focusFinancials;
      const bySource = getCostBySource(data, this.focusProjectId);
      const operations = data.operations.filter(
        (operation) => operation.projectId === this.focusProjectId && operation.costSource
      );
      return {
        sources: Object.keys(SOURCE_NAMES)
          .filter((id) => bySource[id])
          .map((id) => ({
            label: SOURCE_NAMES[id],
            value: bySource[id],
            color: COST_SOURCE_TOKENS[id],
            detail: operations
              .filter((operation) => operation.costSource === id)
              .map((operation) => operation.id)
              .slice(0, 4)
              .join(', '),
          })),
        executed: financials.executedCost,
        budget: financials.budgetAmount,
        segments: [
          {
            label: 'Ejecutado',
            value: financials.executedCost,
            color: '--brand',
            note: `${financials.executionPercent.toString().replace('.', ',')} % del presupuesto`,
          },
          {
            label: 'Comprometido',
            value: financials.outstandingCommitments,
            color: '--s3',
            note: 'Órdenes aprobadas aún sin recepción',
          },
          {
            label: 'Disponible',
            value: Math.max(0, financials.availableToCommit),
            color: '--track',
            note: 'Para nuevos compromisos',
          },
        ],
      };
    },
    sourceData() {
      const bySource = getCostBySource(data, this.focusProjectId);
      return Object.keys(SOURCE_NAMES)
        .filter((id) => bySource[id])
        .map((id) => ({
          label: SOURCE_NAMES[id],
          value: bySource[id],
          color: COST_SOURCE_TOKENS[id],
          href: `./costs.html?project=${encodeURIComponent(this.focusProjectId)}&source=${id}`,
        }));
    },
    async renderCharts(cumulativeSeries) {
      const [flow, execution, area, sparkline, splitBar, donut, bars] = await Promise.all([
        import('../charts/flow.js'),
        import('../charts/execution-bars.js'),
        import('../charts/area.js'),
        import('../charts/sparkline.js'),
        import('../charts/split-bar.js'),
        import('../charts/donut.js'),
        import('../charts/bars.js'),
      ]);
      const el = (id) => document.getElementById(id);
      this.charts = [
        flow.render(el('ds-flow'), this.flowData(), {
          label: `Trazabilidad del costo de ${this.focusProjectId}: fuentes, ejecutado y presupuesto`,
        }),
        donut.render(el('ds-donut'), this.sourceData(), {
          centerLabel: 'Ejecutado',
          centerValue: formatMoney(this.focusFinancials.executedCost),
          label: 'Costo ejecutado por fuente',
        }),
        execution.render(
          el('ds-execution'),
          projects.map((project) => ({
            id: project.id,
            name: projectShortName(project.name),
            budget: project.budgetAmount,
            cost: getProjectFinancials(data, project.id).executedCost,
            progress: project.progressPercent,
            href: `./project.html?id=${encodeURIComponent(project.id)}`,
          })),
          { label: 'Ejecución del presupuesto frente al avance físico por proyecto' }
        ),
        area.render(el('ds-area'), months, {
          label: 'Costo ejecutado por mes del portafolio en ejecución',
          valueLabel: 'ejecutados',
        }),
        sparkline.render(el('ds-spark'), cumulativeSeries, { width: 72, height: 26 }),
        splitBar.render(el('ds-split'), [
          { label: 'Activos', value: this.activeCount, color: '--s1' },
          { label: 'En riesgo', value: riskCount, color: '--bad' },
        ]),
        bars.render(
          el('ds-bars'),
          {
            categories: projects.slice(0, 6).map((project) => project.id),
            series: [
              {
                label: 'Presupuesto',
                color: '--s1',
                values: projects.slice(0, 6).map((project) => project.budgetAmount),
              },
              {
                label: 'Costo ejecutado',
                color: '--s2',
                values: projects
                  .slice(0, 6)
                  .map((project) => getProjectFinancials(data, project.id).executedCost),
              },
            ],
          },
          { height: 240, label: 'Presupuesto y costo ejecutado por proyecto' }
        ),
      ].filter(Boolean);
    },
    destroy() {
      this.charts.forEach((chart) => chart?.destroy?.());
      this.charts = [];
    },
  };
}
