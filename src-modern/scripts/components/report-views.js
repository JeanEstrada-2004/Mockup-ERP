import { activeVariant, isModuleEnabled, variantRule } from '../config/variants.js';
import { moduleHref } from '../config/modules.js';
import {
  getCostBySource,
  getDataForVariant,
  getDocuments,
  getProjectFinancials,
  EXPENSE_PENDING_STATUSES,
} from '../data/mock-data.js';
import { COST_SOURCES } from '../data/cost-data.js';
import { formatAmount } from '../data/commercial-data.js';
import { costLines, groupLines } from '../data/cost-treatment.js';
import { loadReports } from '../data/expense-reports.js';
import { payrollMonths, payrollRows, tareoRows } from '../data/personnel-jy.js';
import { movementNames, warehouseMovements } from '../data/warehouse-data.js';
import { COST_SOURCE_TOKENS, formatDate } from './project-views.js';
import { formatMoney, writeProjectId } from './shell.js';

const data = getDataForVariant(activeVariant);
const REPORT_STATUSES = ['Planificado', 'Activo', 'En riesgo', 'Suspendido', 'Cerrado'];
const IN_EXECUTION = ['Activo', 'En riesgo'];
const allowed = isModuleEnabled('reports');
const hasBI = isModuleEnabled('bi');
const operational = variantRule('reportsCatalog') === 'operational';
const reportDefs = operational
  ? [
      { id: 'cost-project', label: 'Costos por proyecto', description: 'Ejecución por proyecto.' },
      {
        id: 'cost-source',
        label: 'Costos por fuente',
        description: 'Compras, rendiciones, personal y materiales.',
      },
      {
        id: 'cost-category',
        label: 'Costos por categoría',
        description: 'Clasificación económica registrada.',
      },
      { id: 'expenses', label: 'Rendiciones', description: 'Gastos presentados y aceptados.' },
      { id: 'undocumented', label: 'Gastos sin documento', description: 'Importe no documentado.' },
      { id: 'purchases', label: 'Compras', description: 'OC y recepción.' },
      {
        id: 'suppliers',
        label: 'Proveedores',
        description: 'Proveedores relacionados con compras.',
      },
      { id: 'personnel', label: 'Personal', description: 'Trabajadores del proyecto.' },
      { id: 'payroll', label: 'Planilla imputada', description: 'Costo laboral distribuido.' },
      { id: 'timesheets', label: 'Tareo', description: 'Horas y firmas de campo.' },
      { id: 'materials', label: 'Materiales', description: 'Inventario del almacén principal.' },
      {
        id: 'movements',
        label: 'Movimientos de almacén',
        description: 'Entradas, salidas, devoluciones y ajustes.',
      },
      {
        id: 'budget-cost',
        label: 'Presupuesto vs. costo',
        description: 'Comparación de presupuesto y ejecución.',
      },
    ]
  : [
      { id: 'projects', label: 'Proyectos', description: 'Avance, presupuesto y ejecución.' },
      { id: 'budgets', label: 'Presupuestos', description: 'Cotizaciones vinculadas a proyectos.' },
      { id: 'purchases', label: 'Compras', description: 'Órdenes y compromisos abiertos.' },
      { id: 'expenses', label: 'Rendiciones', description: 'Gastos y estados de revisión.' },
      { id: 'personnel', label: 'Tareo', description: 'Operaciones laborales de ejemplo.' },
      { id: 'costs', label: 'Costos', description: 'Operaciones ejecutadas por fuente.' },
      ...(isModuleEnabled('warehouse')
        ? [{ id: 'warehouse', label: 'Almacén', description: 'Salidas de material a proyectos.' }]
        : []),
      {
        id: 'documents',
        label: 'Documentos',
        description: 'Referencias y versiones documentales.',
      },
    ];
const months = [
  ...new Set(data.operations.map((item) => item.date?.slice(0, 7)).filter(Boolean)),
].sort();
function projectName(id) {
  return data.projects.find((item) => item.id === id)?.name || '—';
}
function operationHref(item) {
  const module = {
    purchase: 'purchases',
    expense: 'expenses',
    timesheet: 'personnel',
    payroll: 'personnel',
    rxh: 'personnel',
    material_issue: 'warehouse',
    other: 'costs',
  }[item.type];
  return item.type === 'other'
    ? moduleHref('costs', `COST-${item.id}`)
    : moduleHref(module, item.id);
}

export function reportsWorkspace() {
  const params = new URLSearchParams(location.search);
  return {
    allowed,
    hasBI,
    projects: data.projects,
    clients: data.clients,
    reportDefs,
    months,
    // analytics.html (Inteligencia de Negocios) is the BI page; reports.html
    // keeps the operational catalogue (Entrega 6).
    biPage: document.body.dataset.page === 'analytics-workspace',
    tab: document.body.dataset.page === 'analytics-workspace' && hasBI ? 'bi' : 'reports',
    reportId: reportDefs.some((item) => item.id === params.get('report'))
      ? params.get('report')
      : operational
        ? 'cost-project'
        : 'projects',
    projectFilter: data.projects.some((item) => item.id === params.get('project'))
      ? params.get('project')
      : '',
    clientFilter: data.clients.some((item) => item.id === params.get('client'))
      ? params.get('client')
      : '',
    managerFilter: data.workers.some((item) => item.id === params.get('manager'))
      ? params.get('manager')
      : '',
    get managers() {
      const ids = [...new Set(data.projects.map((item) => item.managerId))];
      return data.workers.filter((item) => ids.includes(item.id));
    },
    // Default scope = projects in execution, the same set the Panel General sums.
    statusFilter: [...REPORT_STATUSES, 'todos'].includes(params.get('status'))
      ? params.get('status')
      : 'ejecucion',
    periodFilter: months.includes(params.get('period')) ? params.get('period') : '',
    selectedSource: '',
    budgetChart: null,
    sourceChart: null,
    formatMoney: operational ? formatAmount : formatMoney,
    formatDate,
    projectName,
    moduleHref,
    getProjectFinancials: (id) => getProjectFinancials(data, id),
    get scopedProjects() {
      return this.projects.filter(
        (item) =>
          (!this.projectFilter || item.id === this.projectFilter) &&
          (!this.clientFilter || item.clientId === this.clientFilter) &&
          (!this.managerFilter || item.managerId === this.managerFilter) &&
          (this.statusFilter === 'todos' ||
            (this.statusFilter === 'ejecucion'
              ? IN_EXECUTION.includes(item.status)
              : item.status === this.statusFilter))
      );
    },
    get projectIds() {
      return new Set(this.scopedProjects.map((item) => item.id));
    },
    get scopeFinancials() {
      const rows = this.scopedProjects.map((item) => getProjectFinancials(data, item.id));
      return {
        projects: rows.length,
        budget: rows.reduce((sum, item) => sum + item.budgetAmount, 0),
        executed: rows.reduce((sum, item) => sum + item.executedCost, 0),
        committed: rows.reduce((sum, item) => sum + item.committedCost, 0),
        risk: this.scopedProjects.filter((item) => item.status === 'En riesgo').length,
        pendingExpenses: data.operations.filter(
          (item) =>
            this.projectIds.has(item.projectId) &&
            item.type === 'expense' &&
            EXPENSE_PENDING_STATUSES.includes(item.status)
        ).length,
      };
    },
    get sourceRows() {
      return COST_SOURCES.map((source) => ({
        ...source,
        amount: this.scopedProjects.reduce(
          (sum, item) => sum + (getCostBySource(data, item.id)[source.id] || 0),
          0
        ),
      }));
    },
    get sourceProjects() {
      return this.scopedProjects
        .map((item) => ({
          projectId: item.id,
          name: item.name,
          amount: getCostBySource(data, item.id)[this.selectedSource] || 0,
        }))
        .filter((item) => item.amount > 0);
    },
    get reportTitle() {
      return reportDefs.find((item) => item.id === this.reportId)?.label || 'Proyectos';
    },
    get reportRows() {
      const projectIds = this.projectIds;
      const period = this.periodFilter;
      if (operational) {
        const lines = costLines(data).filter(
          (line) => projectIds.has(line.projectId) && (!period || line.date.startsWith(period))
        );
        const row = (id, label, projectId, date, detail, amount, href) => ({
          id,
          label,
          projectId,
          date,
          detail,
          amount,
          href,
        });
        if (['cost-project', 'budget-cost'].includes(this.reportId))
          return this.scopedProjects.map((project) => {
            const cost = getProjectFinancials(data, project.id);
            return row(
              project.id,
              project.name,
              project.id,
              project.startDate,
              this.reportId === 'budget-cost'
                ? `Presupuesto ${formatMoney(cost.budgetAmount)} · costo ejecutado ${formatMoney(cost.executedCost)}`
                : 'Costo ejecutado',
              cost.executedCost,
              moduleHref('costs', project.id)
            );
          });
        if (['cost-source', 'cost-category'].includes(this.reportId))
          return this.scopedProjects.flatMap((project) =>
            groupLines(
              data,
              lines.filter((line) => line.projectId === project.id),
              this.reportId === 'cost-source' ? 'source' : 'category'
            ).map((group) =>
              row(
                `${project.id}-${group.key}`,
                group.label,
                project.id,
                group.lines[0]?.date || project.startDate,
                `${group.lines.length} operaciones · ${project.name}`,
                group.total,
                moduleHref('costs', project.id)
              )
            )
          );
        if (this.reportId === 'undocumented')
          return lines
            .filter((line) => line.treatment.undocumented > 0)
            .map((line) =>
              row(
                line.id,
                line.description,
                line.projectId,
                line.date,
                line.documentLabel,
                line.treatment.undocumented,
                moduleHref('expenses', line.operationId)
              )
            );
        if (this.reportId === 'expenses')
          return loadReports(data)
            .filter(
              (report) =>
                projectIds.has(report.projectId) && (!period || report.date.startsWith(period))
            )
            .map((report) =>
              row(
                report.id,
                report.status,
                report.projectId,
                report.date,
                'Rendición de gastos',
                report.total || data.operations.find((op) => op.id === report.id)?.amount || 0,
                moduleHref('expenses', report.id)
              )
            );
        if (this.reportId === 'materials')
          return data.materials.flatMap((material) => {
            const movement = warehouseMovements(data).find(
              (item) => item.materialId === material.id && projectIds.has(item.projectId)
            );
            if (this.projectFilter && !movement) return [];
            return [
              row(
                material.id,
                material.name,
                movement?.projectId || null,
                data.today,
                `${material.category} · ${material.unit}`,
                null,
                moduleHref('warehouse', material.id)
              ),
            ];
          });
        if (this.reportId === 'movements')
          return warehouseMovements(data)
            .filter(
              (movement) =>
                projectIds.has(movement.projectId) && (!period || movement.date.startsWith(period))
            )
            .map((movement) =>
              row(
                movement.id,
                movementNames[movement.type],
                movement.projectId,
                movement.date,
                `${movement.materialId} · saldo ${movement.balance}`,
                movement.executedCost,
                moduleHref('warehouse', movement.id)
              )
            );
        if (this.reportId === 'payroll')
          return payrollMonths(data).filter((month) => !period || month === period).flatMap((month) =>
            payrollRows(data, month).flatMap((payroll) =>
              payroll.imputations
                .filter((item) => projectIds.has(item.projectId))
                .map((item) =>
                  row(
                    `PL-${month}-${payroll.workerId}-${item.projectId}`,
                    payroll.workerId,
                    item.projectId,
                    `${month}-01`,
                    `Imputación ${item.percent} %`,
                    item.amount,
                    `./personnel.html?tab=planilla&month=${month}&worker=${payroll.workerId}&project=${item.projectId}`
                  )
                )
            )
          );
        if (this.reportId === 'timesheets')
          return tareoRows(data)
            .filter(
              (item) => projectIds.has(item.projectId) && (!period || item.date.startsWith(period))
            )
            .map((item) =>
              row(
                item.id,
                item.workerId,
                item.projectId,
                item.date,
                item.signed ? 'Firmado' : 'Pendiente de firma',
                null,
                moduleHref('personnel', item.id)
              )
            );
        if (this.reportId === 'personnel')
          return data.workers.flatMap((worker) => {
            const managed = data.projects.find(
              (project) => projectIds.has(project.id) && project.managerId === worker.id
            );
            const payroll = payrollMonths(data)
              .flatMap((month) => payrollRows(data, month))
              .find(
                (item) =>
                  item.workerId === worker.id &&
                  item.imputations.some((entry) => projectIds.has(entry.projectId))
              );
            const tareo = tareoRows(data).find(
              (item) => item.workerId === worker.id && projectIds.has(item.projectId)
            );
            const projectId =
              managed?.id ||
              payroll?.imputations.find((item) => projectIds.has(item.projectId))?.projectId ||
              tareo?.projectId;
            if (!projectId) return [];
            return [
              row(
                worker.id,
                worker.name,
                projectId,
                data.today,
                worker.role || 'Personal',
                null,
                moduleHref('personnel', worker.id)
              ),
            ];
          });
        if (this.reportId === 'suppliers')
          return data.suppliers.flatMap((supplier) => {
            const purchase = data.operations.find(
              (item) =>
                item.type === 'purchase' &&
                item.supplierId === supplier.id &&
                projectIds.has(item.projectId) &&
                (!period || item.date.startsWith(period))
            );
            if ((this.projectFilter || period) && !purchase) return [];
            return [
              row(
                supplier.id,
                supplier.name,
                purchase?.projectId || null,
                purchase?.date || data.today,
                purchase ? `OC ${purchase.id}` : 'Sin OC en el filtro',
                null,
                moduleHref('suppliers', supplier.id)
              ),
            ];
          });
      }
      if (this.reportId === 'projects')
        return this.scopedProjects.map((item) => ({
          id: item.id,
          label: item.name,
          projectId: item.id,
          date: item.startDate,
          detail: `${item.progressPercent} % de avance · ${item.status}`,
          amount: getProjectFinancials(data, item.id).executedCost,
          href: moduleHref('projects', item.id),
        }));
      if (this.reportId === 'budgets')
        return data.budgets
          .filter((item) => projectIds.has(item.projectId))
          .map((item) => ({
            id: item.id,
            label: `Presupuesto V${item.version}`,
            projectId: item.projectId,
            date: data.projects.find((p) => p.id === item.projectId).startDate,
            detail: item.status,
            amount: item.amount,
            href: moduleHref('budgets', item.id),
          }));
      if (this.reportId === 'documents')
        return getDocuments(data)
          .filter(
            (item) => projectIds.has(item.projectId) && (!period || item.date.startsWith(period))
          )
          .map((item) => ({
            id: item.id,
            label: item.type,
            projectId: item.projectId,
            date: item.date,
            detail: `V${item.version} · ${item.operationId}`,
            amount: null,
            href: moduleHref('documents', item.id),
          }));
      const types = {
        purchases: (item) => item.type === 'purchase',
        expenses: (item) => item.type === 'expense',
        personnel: (item) => ['timesheet', 'payroll', 'rxh'].includes(item.type),
        costs: (item) => Boolean(item.costSource),
        warehouse: (item) => item.type === 'material_issue',
      };
      return data.operations
        .filter(
          (item) =>
            projectIds.has(item.projectId) &&
            (!period || item.date.startsWith(period)) &&
            types[this.reportId]?.(item)
        )
        .map((item) => ({
          id: item.id,
          label:
            item.type === 'purchase' && item.inventoryLine
              ? 'Compra para inventario · sin costo ejecutado'
              : item.status,
          projectId: item.projectId,
          date: item.date,
          detail: item.costSource || item.status,
          amount: item.amount,
          href: operationHref(item),
        }))
        .sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
    },
    get monthlyCosts() {
      return months
        .filter((month) => !this.periodFilter || month === this.periodFilter)
        .map((month) => ({
          month,
          amount: data.operations
            .filter(
              (item) =>
                this.projectIds.has(item.projectId) &&
                item.costSource &&
                item.date.startsWith(month)
            )
            .reduce((sum, item) => sum + item.amount, 0),
        }));
    },
    init() {
      if (!allowed) return;
      document.title = `${hasBI ? 'Reportes y BI' : 'Reportes'} · ${activeVariant.company.shortName}`;
      if (this.projectFilter) writeProjectId(this.projectFilter);
      if (this.tab === 'bi') this.$nextTick(() => this.renderCharts());
    },
    setTab(id) {
      if (id === 'bi' && !hasBI) return;
      this.tab = id;
      this.updateUrl();
      if (id === 'bi') this.$nextTick(() => this.renderCharts());
    },
    setReport(id) {
      this.reportId = id;
      if (!this.biPage) this.tab = 'reports';
      this.updateUrl();
    },
    exportReport() {
      window.AdminApp?.notificationManager?.success(
        `Reporte de ${this.reportTitle} exportado a Excel (simulado).`
      );
    },
    setSource(id) {
      this.selectedSource = id;
    },
    updateFilters() {
      if (this.projectFilter) writeProjectId(this.projectFilter);
      this.selectedSource = '';
      this.updateUrl();
      if (this.tab === 'bi') this.$nextTick(() => this.renderCharts());
    },
    clearFilters() {
      this.projectFilter = '';
      this.clientFilter = '';
      this.managerFilter = '';
      this.statusFilter = 'ejecucion';
      this.periodFilter = '';
      this.updateFilters();
    },
    updateUrl() {
      const query = this.filterQuery();
      if (!this.biPage && this.reportId !== (operational ? 'cost-project' : 'projects'))
        query.set('report', this.reportId);
      const page = this.biPage ? './analytics.html' : './reports.html';
      history.replaceState(null, '', `${page}${query.size ? `?${query}` : ''}`);
    },
    filterQuery() {
      const query = new URLSearchParams();
      for (const [key, value] of [
        ['project', this.projectFilter],
        ['client', this.clientFilter],
        ['manager', this.managerFilter],
        ['status', this.statusFilter === 'ejecucion' ? '' : this.statusFilter],
        ['period', this.periodFilter],
      ])
        if (value) query.set(key, value);
      return query;
    },
    // Link between the two pages keeps the same filters.
    get biHref() {
      const query = this.filterQuery();
      return `./analytics.html${query.size ? `?${query}` : ''}`;
    },
    get reportsHref() {
      const query = this.filterQuery();
      return `./reports.html${query.size ? `?${query}` : ''}`;
    },
    // ---- BI indicators (punto 85) -----------------------------------------
    // Estimated margin: budget minus the cost projected to completion
    // (executed ÷ physical progress). A projection, labelled as such.
    projectMargin(project) {
      const financials = getProjectFinancials(data, project.id);
      const progress = Math.max(project.progressPercent, 1) / 100;
      const projected = Math.min(financials.executedCost / progress, financials.budgetAmount * 2);
      return {
        projected,
        margin: financials.budgetAmount - projected,
        percent: financials.budgetAmount
          ? ((financials.budgetAmount - projected) / financials.budgetAmount) * 100
          : 0,
      };
    },
    // Deviation: executed % of budget minus physical progress %.
    projectDeviation(project) {
      const financials = getProjectFinancials(data, project.id);
      return Math.round((financials.executionPercent - project.progressPercent) * 10) / 10;
    },
    get biIndicators() {
      const rows = this.scopedProjects;
      const budget = rows.reduce((sum, item) => sum + item.budgetAmount, 0);
      const margin = rows.reduce((sum, item) => sum + this.projectMargin(item).margin, 0);
      const deviation = rows.length
        ? rows.reduce((sum, item) => sum + this.projectDeviation(item), 0) / rows.length
        : 0;
      return {
        marginPercent: budget ? (margin / budget) * 100 : 0,
        deviation: Math.round(deviation * 10) / 10,
      };
    },
    pct(value) {
      return `${(Math.round(value * 10) / 10).toFixed(1).replace('.', ',')} %`;
    },
    async renderCharts() {
      if (!hasBI || this.tab !== 'bi') return;
      const budgetElement = document.getElementById('reports-budget-chart');
      const sourceElement = document.getElementById('reports-source-chart');
      if (!budgetElement || !sourceElement) return;
      const [{ render: renderBars }, { render: renderDonut }] = await Promise.all([
        import('../charts/bars.js'),
        import('../charts/donut.js'),
      ]);
      const budgetData = {
        categories: this.scopedProjects.map((item) => item.id),
        series: [
          {
            label: 'Presupuesto',
            color: '--s1',
            values: this.scopedProjects.map((item) => item.budgetAmount),
          },
          {
            label: 'Ejecutado',
            color: '--s2',
            values: this.scopedProjects.map(
              (item) => getProjectFinancials(data, item.id).executedCost
            ),
          },
        ],
      };
      const sourceData = this.sourceRows
        .filter((item) => item.amount > 0)
        .map((item) => ({
          label: item.label,
          value: item.amount,
          color: COST_SOURCE_TOKENS[item.id] || '--s-other',
        }));
      if (this.budgetChart?.update) this.budgetChart.update(budgetData);
      else {
        budgetElement.replaceChildren();
        this.budgetChart = renderBars(budgetElement, budgetData, {
          height: 260,
          label: 'Presupuesto y costo ejecutado por proyecto, en soles',
          table: false,
        });
      }
      const marginData = {
        categories: this.scopedProjects.map((item) => item.id),
        series: [
          {
            label: 'Margen estimado',
            color: '--s2',
            values: this.scopedProjects.map((item) => Math.round(this.projectMargin(item).margin)),
          },
        ],
      };
      const monthlyData = this.monthlyTrend;
      const marginElement = document.getElementById('analytics-margin-chart');
      const monthlyElement = document.getElementById('analytics-monthly-chart');
      const [{ render: renderArea }] = await Promise.all([import('../charts/area.js')]);
      if (marginElement) {
        if (this.marginChart?.update) this.marginChart.update(marginData);
        else {
          marginElement.replaceChildren();
          this.marginChart = renderBars(marginElement, marginData, {
            orientation: 'horizontal',
            labelWidth: 110,
            label: 'Margen estimado por proyecto en soles',
            table: false,
          });
        }
      }
      if (monthlyElement && monthlyData.length) {
        if (this.monthlyChart?.update) this.monthlyChart.update(monthlyData);
        else {
          monthlyElement.replaceChildren();
          this.monthlyChart = renderArea(monthlyElement, monthlyData, {
            label: 'Costo ejecutado por mes del alcance seleccionado',
            valueLabel: 'ejecutados',
            table: false,
          });
        }
      }
      if (this.sourceChart?.update) this.sourceChart.update(sourceData);
      else {
        sourceElement.replaceChildren();
        this.sourceChart = renderDonut(sourceElement, sourceData, {
          size: 220,
          legend: false,
          table: false,
          centerLabel: 'Ejecutado',
          label: 'Distribución del costo ejecutado por fuente',
        });
      }
    },
    get monthlyTrend() {
      const names = [
        'Ene',
        'Feb',
        'Mar',
        'Abr',
        'May',
        'Jun',
        'Jul',
        'Ago',
        'Set',
        'Oct',
        'Nov',
        'Dic',
      ];
      const totals = new Map();
      data.operations
        .filter((item) => item.costSource && item.date && this.projectIds.has(item.projectId))
        .forEach((item) => {
          const key = item.date.slice(0, 7);
          totals.set(key, (totals.get(key) || 0) + item.amount);
        });
      return [...totals.keys()].sort().map((key) => ({
        label: names[Number(key.slice(5, 7)) - 1],
        title: key,
        value: totals.get(key),
      }));
    },
    destroy() {
      this.budgetChart?.destroy?.();
      this.sourceChart?.destroy?.();
      this.marginChart?.destroy?.();
      this.monthlyChart?.destroy?.();
    },
  };
}
