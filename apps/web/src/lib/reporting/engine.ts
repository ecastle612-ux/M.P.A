import { createHash } from "node:crypto";
import {
  buildPeriod,
  formatReportMoney,
  reportTypeTitle,
  roundMoney,
  type RecognitionBasis,
  type ReportModel,
  type ReportPeriod,
  type ReportSection,
  type ReportType
} from "./contracts";
import { buildReportHealth } from "./health";
import { formatPropertyAddress, maxUpdatedAt, type ReportingSnapshot } from "./read-sources";
import { MPA_BRAND_NAME } from "../branding";

export function buildReportModel(
  reportType: ReportType,
  snapshot: ReportingSnapshot,
  period: ReportPeriod
): ReportModel {
  const identity = {
    organizationName: snapshot.organizationName,
    logoLabel: MPA_BRAND_NAME,
    propertyName: snapshot.property.name,
    propertyAddress: formatPropertyAddress(snapshot.property),
    managerName: snapshot.managerName,
    reportTitle: reportTypeTitle(reportType),
    periodLabel: period.label,
    recognitionBasis: snapshot.recognitionBasis,
    generatedAt: new Date().toISOString()
  };

  const health = buildReportHealth(snapshot);
  const built = buildSections(reportType, snapshot, period);
  const notes = [
    reportType === "maintenance_summary"
      ? "Operational maintenance summary for the selected period (counts, not accounting totals)."
      : snapshot.recognitionBasis === "cash"
        ? "Income recognition basis: Cash (collections in period)."
        : "Income recognition basis: Accrual (posted charges in period).",
    "This is an operational management report, not a certified financial statement."
  ];
  if (health.warning) notes.push(health.warning);

  const sourceFingerprint = createHash("sha256")
    .update(
      [
        reportType,
        snapshot.property.id,
        period.startDate,
        period.endDate,
        snapshot.recognitionBasis,
        // Presentation revision — invalidates cached PDFs when layout upgrades (FIN-002+).
        // Does not alter accounting totals or report math.
        "presentation:fin002-v1",
        maxUpdatedAt([
          ...snapshot.charges.map((row) => row.updatedAt),
          ...snapshot.payments.map((row) => row.updatedAt),
          ...snapshot.expenses.map((row) => row.updatedAt),
          ...snapshot.units.map((row) => row.updatedAt),
          ...snapshot.leases.map((row) => row.updatedAt),
          ...snapshot.workOrders.map((row) => row.updatedAt)
        ]),
        String(snapshot.awaitingReconciliationCount)
      ].join("|")
    )
    .digest("hex")
    .slice(0, 32);

  return {
    reportType,
    identity,
    health,
    sections: built.sections,
    totals: built.totals,
    notes,
    sourceFingerprint
  };
}

function buildSections(
  reportType: ReportType,
  snapshot: ReportingSnapshot,
  period: ReportPeriod
): { sections: ReportSection[]; totals: ReportModel["totals"] } {
  switch (reportType) {
    case "monthly_profit_and_loss":
      return buildProfitAndLoss(snapshot);
    case "owner_statement":
      return buildOwnerStatement(snapshot);
    case "rent_roll":
      return buildRentRoll(snapshot);
    case "cash_flow_summary":
      return buildCashFlow(snapshot);
    case "expense_report":
      return buildExpenseReport(snapshot);
    case "delinquency_report":
      return buildDelinquency(snapshot, period);
    case "maintenance_summary":
      return buildMaintenanceSummary(snapshot);
    default: {
      const _exhaustive: never = reportType;
      return _exhaustive;
    }
  }
}

function incomeTotal(snapshot: ReportingSnapshot, basis: RecognitionBasis): number {
  if (basis === "accrual") {
    return roundMoney(
      snapshot.periodCharges
        .filter((charge) => charge.status !== "cancelled" && charge.status !== "waived")
        .reduce((sum, charge) => sum + Number(charge.amount), 0)
    );
  }
  return roundMoney(
    snapshot.periodPayments
      .filter((payment) => payment.status === "completed" || payment.status === "awaiting_reconciliation")
      .reduce((sum, payment) => sum + Number(payment.amount), 0)
  );
}

function expenseTotal(snapshot: ReportingSnapshot): number {
  return roundMoney(snapshot.periodExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0));
}

function buildProfitAndLoss(snapshot: ReportingSnapshot) {
  const income = incomeTotal(snapshot, snapshot.recognitionBasis);
  const expenses = expenseTotal(snapshot);
  const incomeLines =
    snapshot.recognitionBasis === "cash"
      ? snapshot.periodPayments.map((payment) => ({
          id: payment.id,
          label: `Payment ${payment.paymentNumber}`,
          amount: Number(payment.amount),
          meta: payment.paymentDate
        }))
      : snapshot.periodCharges
          .filter((charge) => charge.status !== "cancelled" && charge.status !== "waived")
          .map((charge) => ({
            id: charge.id,
            label: charge.description || charge.chargeNumber,
            amount: Number(charge.amount),
            meta: charge.dueDate
          }));

  const expenseByCategory = new Map<string, number>();
  for (const expense of snapshot.periodExpenses) {
    const key = expense.customCategory || expense.category;
    expenseByCategory.set(key, roundMoney((expenseByCategory.get(key) ?? 0) + Number(expense.amount)));
  }

  const sections: ReportSection[] = [
    {
      id: "income",
      title: snapshot.recognitionBasis === "cash" ? "Income (Cash collections)" : "Income (Posted charges)",
      lines: incomeLines,
      subtotal: income
    },
    {
      id: "expenses",
      title: "Operating expenses",
      lines: [...expenseByCategory.entries()].map(([label, amount]) => ({
        id: label,
        label,
        amount
      })),
      subtotal: expenses
    }
  ];

  return {
    sections,
    totals: [
      { label: "Gross income", amount: income },
      { label: "Total expenses", amount: expenses },
      { label: "Net operating income", amount: roundMoney(income - expenses), emphasis: true }
    ]
  };
}

function buildOwnerStatement(snapshot: ReportingSnapshot) {
  const pnl = buildProfitAndLoss(snapshot);
  const income = pnl.totals[0]?.amount ?? 0;
  const expenses = pnl.totals[1]?.amount ?? 0;
  const net = roundMoney(income - expenses);
  return {
    sections: [
      ...pnl.sections,
      {
        id: "summary",
        title: "Owner summary",
        lines: [
          { id: "collected", label: "Period collections / income", amount: income },
          { id: "expenses", label: "Period expenses", amount: expenses },
          { id: "net", label: "Net to owner (operational)", amount: net }
        ],
        subtotal: net
      }
    ],
    totals: [
      { label: "Total income", amount: income },
      { label: "Total expenses", amount: expenses },
      { label: "Net to owner", amount: net, emphasis: true }
    ]
  };
}

function buildRentRoll(snapshot: ReportingSnapshot) {
  const activeLeases = snapshot.leases.filter((lease) => lease.status === "active" || lease.status === "signed");
  const leaseByUnit = new Map(activeLeases.map((lease) => [lease.unitId, lease]));
  const lines = snapshot.units.map((unit) => {
    const lease = leaseByUnit.get(unit.id);
    const rent = Number(lease?.rentAmount ?? unit.rentAmount ?? 0);
    return {
      id: unit.id,
      label: `Unit ${unit.unitNumber}${lease?.tenantName ? ` · ${lease.tenantName}` : " · Vacant"}`,
      amount: rent,
      meta: lease
        ? `${lease.status} · ${lease.startDate ?? "—"} → ${lease.endDate ?? "—"}`
        : unit.occupancyStatus
    };
  });
  const occupied = snapshot.units.filter((unit) => unit.occupancyStatus === "occupied").length;
  const totalRent = roundMoney(lines.reduce((sum, line) => sum + line.amount, 0));
  return {
    sections: [
      {
        id: "rent_roll",
        title: "Units",
        lines,
        subtotal: totalRent
      }
    ],
    totals: [
      { label: "Unit count", amount: snapshot.units.length },
      { label: "Occupied units", amount: occupied },
      { label: "Vacant units", amount: Math.max(snapshot.units.length - occupied, 0) },
      { label: "Total contractual rent", amount: totalRent, emphasis: true }
    ]
  };
}

function buildCashFlow(snapshot: ReportingSnapshot) {
  const inflows = roundMoney(
    snapshot.periodPayments
      .filter((payment) => payment.status === "completed" || payment.status === "awaiting_reconciliation")
      .reduce((sum, payment) => sum + Number(payment.amount), 0)
  );
  const outflows = expenseTotal(snapshot);
  return {
    sections: [
      {
        id: "inflows",
        title: "Cash inflows",
        lines: snapshot.periodPayments.map((payment) => ({
          id: payment.id,
          label: `Payment ${payment.paymentNumber}`,
          amount: Number(payment.amount),
          meta: `${payment.paymentMethod} · ${payment.paymentDate}`
        })),
        subtotal: inflows
      },
      {
        id: "outflows",
        title: "Cash outflows",
        lines: snapshot.periodExpenses.map((expense) => ({
          id: expense.id,
          label: expense.description || expense.expenseNumber,
          amount: Number(expense.amount),
          meta: expense.expenseDate
        })),
        subtotal: outflows
      }
    ],
    totals: [
      { label: "Total inflows", amount: inflows },
      { label: "Total outflows", amount: outflows },
      { label: "Net cash flow", amount: roundMoney(inflows - outflows), emphasis: true }
    ]
  };
}

function buildExpenseReport(snapshot: ReportingSnapshot) {
  const byCategory = new Map<string, typeof snapshot.periodExpenses>();
  for (const expense of snapshot.periodExpenses) {
    const key = expense.customCategory || expense.category;
    const list = byCategory.get(key) ?? [];
    list.push(expense);
    byCategory.set(key, list);
  }
  const sections: ReportSection[] = [...byCategory.entries()].map(([category, rows]) => ({
    id: category,
    title: category,
    lines: rows.map((expense) => ({
      id: expense.id,
      label: expense.description || expense.expenseNumber,
      amount: Number(expense.amount),
      meta: expense.expenseDate
    })),
    subtotal: roundMoney(rows.reduce((sum, expense) => sum + Number(expense.amount), 0))
  }));
  if (sections.length === 0) {
    sections.push({ id: "expenses", title: "Expenses", lines: [], subtotal: 0 });
  }
  const total = expenseTotal(snapshot);
  return {
    sections,
    totals: [{ label: "Grand total expenses", amount: total, emphasis: true }]
  };
}

function buildDelinquency(snapshot: ReportingSnapshot, period: ReportPeriod) {
  const open = snapshot.charges.filter(
    (charge) =>
      charge.outstandingBalance > 0 &&
      charge.status !== "cancelled" &&
      charge.status !== "waived" &&
      charge.status !== "paid"
  );
  const buckets = [
    { id: "0_30", title: "0–30 days", min: 0, max: 30 },
    { id: "31_60", title: "31–60 days", min: 31, max: 60 },
    { id: "61_90", title: "61–90 days", min: 61, max: 90 },
    { id: "90_plus", title: "90+ days", min: 91, max: Number.POSITIVE_INFINITY }
  ] as const;

  const asOf = new Date(`${period.endDate}T00:00:00.000Z`);
  const sections: ReportSection[] = buckets.map((bucket) => {
    const lines = open
      .filter((charge) => {
        const due = new Date(`${charge.dueDate}T00:00:00.000Z`);
        const days = Math.floor((asOf.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
        return days >= bucket.min && days <= bucket.max;
      })
      .map((charge) => ({
        id: charge.id,
        label: `${charge.chargeNumber} · ${charge.description}`,
        amount: Number(charge.outstandingBalance),
        meta: `Due ${charge.dueDate}`
      }));
    return {
      id: bucket.id,
      title: bucket.title,
      lines,
      subtotal: roundMoney(lines.reduce((sum, line) => sum + line.amount, 0))
    };
  });

  const total = roundMoney(open.reduce((sum, charge) => sum + Number(charge.outstandingBalance), 0));
  return {
    sections,
    totals: [
      { label: "Delinquent units/charges", amount: open.length },
      { label: "Total delinquent balance", amount: total, emphasis: true }
    ]
  };
}

function buildMaintenanceSummary(snapshot: ReportingSnapshot) {
  const openStatuses = new Set(["submitted", "triaged", "assigned", "in_progress", "on_hold"]);
  const periodOrders = snapshot.periodWorkOrders;
  const open = periodOrders.filter((row) => openStatuses.has(row.status));
  const completed = periodOrders.filter((row) => row.status === "completed");
  const highPriority = periodOrders.filter(
    (row) => row.priority === "high" || row.priority === "emergency"
  );

  const toLines = (rows: typeof periodOrders) =>
    rows.map((row) => ({
      id: row.id,
      label: `${row.workOrderNumber} · ${row.title}`,
      amount: 1,
      meta: [
        row.status,
        row.priority,
        row.category,
        row.unitNumber ? `Unit ${row.unitNumber}` : null,
        row.completedAt ? `Completed ${row.completedAt.slice(0, 10)}` : null
      ]
        .filter(Boolean)
        .join(" · ")
    }));

  const byCategory = new Map<string, typeof periodOrders>();
  for (const row of periodOrders) {
    const key = row.category || "general";
    const list = byCategory.get(key) ?? [];
    list.push(row);
    byCategory.set(key, list);
  }

  const categorySections: ReportSection[] = [...byCategory.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, rows]) => ({
      id: `category_${category}`,
      title: `Category · ${category}`,
      lines: toLines(rows),
      subtotal: rows.length
    }));

  const sections: ReportSection[] = [
    {
      id: "open",
      title: "Open work orders",
      lines: toLines(open),
      subtotal: open.length
    },
    {
      id: "completed",
      title: "Completed in period",
      lines: toLines(completed),
      subtotal: completed.length
    },
    ...categorySections
  ];

  if (periodOrders.length === 0) {
    sections.splice(0, sections.length, {
      id: "work_orders",
      title: "Work orders",
      lines: [],
      subtotal: 0
    });
  }

  return {
    sections,
    totals: [
      { label: "Work orders in period", amount: periodOrders.length },
      { label: "Open work orders", amount: open.length },
      { label: "Completed work orders", amount: completed.length },
      { label: "High / emergency priority", amount: highPriority.length, emphasis: true }
    ]
  };
}

export function summarizeReportModel(model: ReportModel): string {
  const totalLine = model.totals.find((row) => row.emphasis) ?? model.totals[model.totals.length - 1];
  if (!totalLine) return `${model.identity.reportTitle} · ${model.identity.periodLabel} · No totals`;
  const value =
    model.reportType === "maintenance_summary"
      ? String(Math.round(totalLine.amount))
      : formatReportMoney(totalLine.amount);
  return `${model.identity.reportTitle} · ${model.identity.periodLabel} · ${totalLine.label} ${value}`;
}

export { buildPeriod };
