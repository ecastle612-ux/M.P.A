import { formatMoney, roundMoney } from "./billing";

export type MonthBounds = {
  monthStart: string;
  monthEnd: string;
  monthStartIso: string;
  label: string;
};

export function currentMonthBounds(now = new Date()): MonthBounds {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const start = new Date(Date.UTC(year, month, 1));
  const end = new Date(Date.UTC(year, month + 1, 0));
  const monthStart = start.toISOString().slice(0, 10);
  const monthEnd = end.toISOString().slice(0, 10);
  const label = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(start);
  return {
    monthStart,
    monthEnd,
    monthStartIso: start.toISOString(),
    label
  };
}

export function netOperationalCash(collected: number, vendorPaid: number): number {
  return roundMoney(collected - vendorPaid);
}

export function occupancyRate(occupied: number, total: number): number {
  if (total <= 0) {
    return 0;
  }
  return roundMoney((occupied / total) * 100);
}

export type PropertyFinancialSnapshot = {
  propertyId: string;
  propertyName: string;
  expectedRentThisMonth: number;
  rentCollectedThisMonth: number;
  outstandingRent: number;
  outstandingBalance: number;
  delinquencyCount: number;
  totalDelinquency: number;
  vendorPayablesOpen: number;
  vendorPaidThisMonth: number;
  netOperationalCash: number;
  unitsTotal: number;
  unitsOccupied: number;
  occupancyRate: number;
  upcomingChargesCount: number;
  alerts: string[];
};

export type OwnerFinancialSummary = {
  monthLabel: string;
  currentMonthIncome: number;
  currentMonthExpenses: number;
  outstandingRent: number;
  vendorPayments: number;
  netOperationalCash: number;
  occupancy: {
    unitsTotal: number;
    unitsOccupied: number;
    occupancyRate: number;
  };
  properties: PropertyFinancialSnapshot[];
  alerts: string[];
};

export function buildPropertyAlerts(snapshot: Omit<PropertyFinancialSnapshot, "alerts">): string[] {
  const alerts: string[] = [];
  if (snapshot.delinquencyCount > 0) {
    alerts.push(`${snapshot.delinquencyCount} resident(s) past due · ${formatMoney(snapshot.totalDelinquency)}`);
  }
  if (snapshot.outstandingRent > 0) {
    alerts.push(`${formatMoney(snapshot.outstandingRent)} rent still outstanding`);
  }
  if (snapshot.vendorPayablesOpen > 0) {
    alerts.push(`${formatMoney(snapshot.vendorPayablesOpen)} in vendor bills awaiting payment`);
  }
  if (snapshot.expectedRentThisMonth > 0 && snapshot.rentCollectedThisMonth < snapshot.expectedRentThisMonth) {
    const gap = roundMoney(snapshot.expectedRentThisMonth - snapshot.rentCollectedThisMonth);
    alerts.push(`${formatMoney(gap)} left to collect vs expected rent this month`);
  }
  if (alerts.length === 0) {
    alerts.push("Property money looks healthy this month");
  }
  return alerts;
}

export function buildOwnerAssistantRecommendation(summary: OwnerFinancialSummary): string {
  if (summary.outstandingRent > 0) {
    return `Focus on ${formatMoney(summary.outstandingRent)} outstanding rent across the portfolio, then review vendor bills due.`;
  }
  if (summary.vendorPayments > 0 && summary.currentMonthExpenses > summary.currentMonthIncome) {
    return "Expenses are ahead of income this month. Confirm upcoming rent posts and review vendor payment timing.";
  }
  if (summary.occupancy.occupancyRate < 90 && summary.occupancy.unitsTotal > 0) {
    return `Occupancy is ${summary.occupancy.occupancyRate}%. Vacancy is the main drag on this month’s income.`;
  }
  return "Portfolio cash looks steady. Keep an eye on next month’s rent posts and any vendor bills waiting approval.";
}

export function buildCommandCenterAssistantRecommendation(input: {
  expectedRentThisMonth: number;
  rentCollectedThisMonth: number;
  outstandingRent: number;
  delinquencyCount: number;
  vendorInvoicesAwaitingApproval: number;
  vendorPaymentsDue: number;
}): string {
  if (input.vendorInvoicesAwaitingApproval > 0) {
    return `Approve or schedule ${input.vendorInvoicesAwaitingApproval} vendor invoice(s), then return to collections.`;
  }
  if (input.delinquencyCount > 0) {
    return `${input.delinquencyCount} resident(s) are past due. Send reminders or record a payment arrangement before assessing more late fees.`;
  }
  if (input.outstandingRent > 0) {
    return `${formatMoney(input.outstandingRent)} rent is still open. Confirm Pay now is available and follow up on the largest balances first.`;
  }
  if (input.expectedRentThisMonth > input.rentCollectedThisMonth) {
    return `Collected ${formatMoney(input.rentCollectedThisMonth)} of ${formatMoney(input.expectedRentThisMonth)} expected rent this month.`;
  }
  if (input.vendorPaymentsDue > 0) {
    return `${input.vendorPaymentsDue} vendor payment(s) are scheduled — mark paid when funds leave the account.`;
  }
  return "Money looks current. Generate next month’s rent early and keep vendor invoices moving through approval.";
}

export type CsvColumn = { key: string; label: string };

export function toCsv(rows: Array<Record<string, string | number>>, columns: CsvColumn[]): string {
  const escape = (value: string | number) => {
    const text = String(value);
    if (/[",\n]/.test(text)) {
      return `"${text.replaceAll('"', '""')}"`;
    }
    return text;
  };
  const header = columns.map((column) => escape(column.label)).join(",");
  const body = rows.map((row) => columns.map((column) => escape(row[column.key] ?? "")).join(",")).join("\n");
  return `${header}\n${body}\n`;
}

export function ownerSummaryToCsvRows(summary: OwnerFinancialSummary): Array<Record<string, string | number>> {
  return summary.properties.map((property) => ({
    property: property.propertyName,
    month: summary.monthLabel,
    expected_rent: property.expectedRentThisMonth,
    income_collected: property.rentCollectedThisMonth,
    outstanding_rent: property.outstandingRent,
    vendor_expenses_paid: property.vendorPaidThisMonth,
    vendor_payables_open: property.vendorPayablesOpen,
    net_operational_cash: property.netOperationalCash,
    occupied_units: property.unitsOccupied,
    total_units: property.unitsTotal,
    occupancy_rate: property.occupancyRate
  }));
}

export const OWNER_SUMMARY_CSV_COLUMNS: CsvColumn[] = [
  { key: "property", label: "Property" },
  { key: "month", label: "Month" },
  { key: "expected_rent", label: "Expected rent" },
  { key: "income_collected", label: "Income collected" },
  { key: "outstanding_rent", label: "Outstanding rent" },
  { key: "vendor_expenses_paid", label: "Vendor expenses paid" },
  { key: "vendor_payables_open", label: "Vendor payables open" },
  { key: "net_operational_cash", label: "Net operational cash" },
  { key: "occupied_units", label: "Occupied units" },
  { key: "total_units", label: "Total units" },
  { key: "occupancy_rate", label: "Occupancy %" }
];
