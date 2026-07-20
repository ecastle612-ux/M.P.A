/**
 * FIN-002 presentation helpers.
 * Pure view transforms over ReportModel — never recalculate accounting truth.
 */
import { formatReportMoney, type ReportModel, type ReportType } from "./contracts";

export type PresentationKpi = {
  id: string;
  label: string;
  value: string;
  tone: "default" | "positive" | "negative" | "neutral";
};

export type PresentationChartSeries = {
  id: string;
  label: string;
  value: number;
};

export type PresentationChart = {
  id: string;
  title: string;
  series: PresentationChartSeries[];
  kind: "bars" | "comparison";
};

export function reportHasActivity(model: ReportModel): boolean {
  return model.sections.some((section) => section.lines.length > 0);
}

export function buildExecutiveKpis(model: ReportModel): PresentationKpi[] {
  const byLabel = (label: string) => model.totals.find((row) => row.label.toLowerCase() === label.toLowerCase());
  const money = (amount: number | undefined) => formatReportMoney(amount ?? 0);
  const toneFor = (amount: number): PresentationKpi["tone"] =>
    amount > 0 ? "positive" : amount < 0 ? "negative" : "neutral";

  switch (model.reportType) {
    case "monthly_profit_and_loss":
    case "owner_statement": {
      const income = byLabel("Gross income")?.amount ?? byLabel("Total income")?.amount ?? 0;
      const expenses = byLabel("Total expenses")?.amount ?? 0;
      const net =
        byLabel("Net operating income")?.amount ?? byLabel("Net to owner")?.amount ?? income - expenses;
      return [
        { id: "income", label: "Income", value: money(income), tone: toneFor(income) },
        { id: "expenses", label: "Expenses", value: money(expenses), tone: "neutral" },
        { id: "net", label: "Net Income", value: money(net), tone: toneFor(net) }
      ];
    }
    case "rent_roll": {
      const units = byLabel("Unit count")?.amount ?? 0;
      const occupied = byLabel("Occupied units")?.amount ?? 0;
      const vacant = byLabel("Vacant units")?.amount ?? Math.max(units - occupied, 0);
      const rent = byLabel("Total contractual rent")?.amount ?? 0;
      const occupancy = units > 0 ? Math.round((occupied / units) * 100) : 0;
      return [
        { id: "units", label: "Units", value: String(Math.round(units)), tone: "default" },
        { id: "occupancy", label: "Occupancy", value: `${occupancy}%`, tone: "default" },
        { id: "vacant", label: "Vacant", value: String(Math.round(vacant)), tone: "neutral" },
        { id: "rent", label: "Contractual Rent", value: money(rent), tone: toneFor(rent) }
      ];
    }
    case "cash_flow_summary": {
      const inflows = byLabel("Total inflows")?.amount ?? 0;
      const outflows = byLabel("Total outflows")?.amount ?? 0;
      const net = byLabel("Net cash flow")?.amount ?? inflows - outflows;
      return [
        { id: "inflows", label: "Cash In", value: money(inflows), tone: toneFor(inflows) },
        { id: "outflows", label: "Cash Out", value: money(outflows), tone: "neutral" },
        { id: "position", label: "Cash Position", value: money(net), tone: toneFor(net) }
      ];
    }
    case "expense_report": {
      const total = byLabel("Grand total expenses")?.amount ?? model.sections.reduce((s, sec) => s + sec.subtotal, 0);
      return [
        { id: "expenses", label: "Total Expenses", value: money(total), tone: "neutral" },
        {
          id: "categories",
          label: "Categories",
          value: String(model.sections.filter((section) => section.lines.length > 0).length),
          tone: "default"
        },
        {
          id: "line_items",
          label: "Line Items",
          value: String(model.sections.reduce((sum, section) => sum + section.lines.length, 0)),
          tone: "default"
        }
      ];
    }
    case "delinquency_report": {
      const count = byLabel("Delinquent units/charges")?.amount ?? 0;
      const balance = byLabel("Total delinquent balance")?.amount ?? 0;
      return [
        { id: "count", label: "Delinquent Items", value: String(Math.round(count)), tone: "default" },
        { id: "balance", label: "Delinquency", value: money(balance), tone: balance > 0 ? "negative" : "positive" },
        {
          id: "buckets",
          label: "Aging Buckets",
          value: String(model.sections.filter((section) => section.lines.length > 0).length),
          tone: "default"
        }
      ];
    }
    case "maintenance_summary": {
      const total = byLabel("Work orders in period")?.amount ?? 0;
      const open = byLabel("Open work orders")?.amount ?? 0;
      const completed = byLabel("Completed work orders")?.amount ?? 0;
      const high = byLabel("High / emergency priority")?.amount ?? 0;
      return [
        { id: "total", label: "In Period", value: String(Math.round(total)), tone: "default" },
        { id: "open", label: "Open", value: String(Math.round(open)), tone: open > 0 ? "negative" : "positive" },
        { id: "completed", label: "Completed", value: String(Math.round(completed)), tone: "positive" },
        { id: "high", label: "High / Emergency", value: String(Math.round(high)), tone: high > 0 ? "negative" : "neutral" }
      ];
    }
    default: {
      const _exhaustive: never = model.reportType;
      return _exhaustive;
    }
  }
}

export function buildPresentationCharts(model: ReportModel): PresentationChart[] {
  switch (model.reportType) {
    case "monthly_profit_and_loss":
    case "owner_statement": {
      const income =
        model.totals.find((row) => /income/i.test(row.label) && !/net/i.test(row.label))?.amount ?? 0;
      const expenses = model.totals.find((row) => /expense/i.test(row.label))?.amount ?? 0;
      return [
        {
          id: "income_vs_expenses",
          title: "Income vs Expenses",
          kind: "comparison",
          series: [
            { id: "income", label: "Income", value: Math.max(income, 0) },
            { id: "expenses", label: "Expenses", value: Math.max(expenses, 0) }
          ]
        }
      ];
    }
    case "cash_flow_summary": {
      const inflows = model.totals.find((row) => /inflow/i.test(row.label))?.amount ?? 0;
      const outflows = model.totals.find((row) => /outflow/i.test(row.label))?.amount ?? 0;
      return [
        {
          id: "cash_flow",
          title: "Cash Flow",
          kind: "comparison",
          series: [
            { id: "in", label: "Inflows", value: Math.max(inflows, 0) },
            { id: "out", label: "Outflows", value: Math.max(outflows, 0) }
          ]
        }
      ];
    }
    case "expense_report": {
      const series = model.sections
        .filter((section) => section.subtotal > 0)
        .map((section) => ({
          id: section.id,
          label: section.title,
          value: section.subtotal
        }));
      if (series.length === 0) return [];
      return [{ id: "expense_categories", title: "Expense Categories", kind: "bars", series }];
    }
    case "delinquency_report": {
      const series = model.sections.map((section) => ({
        id: section.id,
        label: section.title,
        value: section.subtotal
      }));
      if (series.every((item) => item.value === 0)) return [];
      return [{ id: "delinquency", title: "Delinquency by Aging", kind: "bars", series }];
    }
    case "rent_roll":
    case "maintenance_summary":
      return [];
    default: {
      const _exhaustive: never = model.reportType;
      return _exhaustive;
    }
  }
}

export function chartBarPercents(series: PresentationChartSeries[]): Array<PresentationChartSeries & { percent: number }> {
  const max = Math.max(...series.map((item) => item.value), 1);
  return series.map((item) => ({ ...item, percent: Math.round((item.value / max) * 100) }));
}

export function recognitionLabel(model: ReportModel): string {
  return model.identity.recognitionBasis === "cash" ? "Cash" : "Accrual";
}

export function generatedLabel(model: ReportModel): string {
  return new Date(model.identity.generatedAt).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

export function emptyStateMessage(reportType: ReportType): string {
  void reportType;
  return "No activity during this reporting period.";
}

/** Shared text outline used by PDF so preview and PDF follow the same narrative order. */
export function buildPresentationOutline(model: ReportModel): string[] {
  const lines: string[] = [];
  const id = model.identity;
  const kpis = buildExecutiveKpis(model);
  const charts = buildPresentationCharts(model);
  const hasActivity = reportHasActivity(model);

  lines.push("----------------------------------------");
  lines.push(id.logoLabel);
  lines.push(id.organizationName);
  lines.push(id.reportTitle.toUpperCase());
  lines.push("----------------------------------------");
  lines.push(`Property: ${id.propertyName}`);
  lines.push(`Address: ${id.propertyAddress}`);
  lines.push(`Prepared by: ${id.managerName}`);
  lines.push(`Reporting period: ${id.periodLabel}`);
  if (model.reportType === "maintenance_summary") {
    lines.push("Recognition method: N/A (operational counts)");
  } else {
    lines.push(`Recognition method: ${recognitionLabel(model)}`);
  }
  lines.push(`Generated: ${generatedLabel(model)}`);
  lines.push("");

  lines.push("EXECUTIVE SUMMARY");
  for (const kpi of kpis) {
    lines.push(`  ${kpi.label.padEnd(22, " ")} ${kpi.value}`);
  }
  lines.push("");

  if (charts.length > 0) {
    lines.push("VISUAL SUMMARY");
    for (const chart of charts) {
      lines.push(`  ${chart.title}`);
      const bars = chartBarPercents(chart.series);
      for (const bar of bars) {
        const blocks = Math.max(1, Math.round(bar.percent / 10));
        lines.push(
          `    ${bar.label.padEnd(16, " ")} [${"#".repeat(blocks)}${"-".repeat(10 - blocks)}]  ${formatReportMoney(bar.value)}`
        );
      }
    }
    lines.push("");
  }

  lines.push("REPORT HEALTH");
  lines.push(`  Status: ${model.health.status === "healthy" ? "Healthy" : "Incomplete"}`);
  lines.push(`  Transactions: ${model.health.transactionsIncluded ? "Included" : "None in period"}`);
  lines.push(`  Expenses: ${model.health.expensesIncluded ? "Included" : "None in period"}`);
  lines.push(`  Rent: ${model.health.rentIncluded ? "Included" : "None in period"}`);
  lines.push(`  Reconciliation: ${model.health.reconciliationStatus}`);
  if (model.health.warning) lines.push(`  Warning: ${model.health.warning}`);
  lines.push("");

  if (!hasActivity) {
    lines.push(emptyStateMessage(model.reportType));
    lines.push("");
  }

  const formatAmount = (amount: number) =>
    model.reportType === "maintenance_summary" ? String(Math.round(amount)) : formatReportMoney(amount);
  const amountHeader = model.reportType === "maintenance_summary" ? "Count" : "Amount";

  for (const section of model.sections) {
    lines.push(`> ${section.title}`);
    lines.push("  " + "Description".padEnd(48, " ") + amountHeader);
    lines.push("  " + "-".repeat(60));
    if (section.lines.length === 0) {
      lines.push(`  ${emptyStateMessage(model.reportType)}`);
    } else {
      for (const line of section.lines) {
        const label = truncate(`${line.label}${line.meta ? ` · ${line.meta}` : ""}`, 46);
        lines.push(`  ${label.padEnd(48, " ")}${formatAmount(line.amount)}`);
      }
    }
    lines.push(`  ${"Subtotal".padEnd(48, " ")}${formatAmount(section.subtotal)}`);
    lines.push("");
  }

  lines.push("TOTALS");
  for (const total of model.totals) {
    const prefix = total.emphasis ? "* " : "  ";
    lines.push(`${prefix}${total.label.padEnd(46, " ")}${formatAmount(total.amount)}`);
  }
  lines.push("");

  lines.push("NOTES");
  for (const note of model.notes) lines.push(`  - ${note}`);
  lines.push("");

  if (model.reportType === "maintenance_summary") {
    lines.push("OPERATIONAL NOTES");
    lines.push("  Counts reflect work orders created or completed in the selected period.");
  } else {
    lines.push("FINANCIAL INSIGHTS");
    lines.push("  AI financial summaries will become available during a future release.");
  }
  lines.push("");

  lines.push("______________________________     ______________");
  lines.push("Authorized signature                     Date");
  lines.push("Name / Title");
  lines.push("");
  lines.push(`Prepared by: ${id.managerName}`);
  lines.push(`Organization: ${id.organizationName}`);
  lines.push("Generated by M.P.A.");
  lines.push("Confidential - for authorized property stakeholders.");

  return lines;
}

function truncate(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}
