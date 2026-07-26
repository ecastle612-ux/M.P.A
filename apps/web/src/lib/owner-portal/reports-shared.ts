/** Client-safe Owner report types and helpers (no server imports). */

import type { OwnerFinancialStatementRow } from "./financial-shared";

export type { OwnerFinancialStatementRow };

export type OwnerReportListItem = {
  id: string;
  title: string;
  reportType: string;
  reportTypeLabel: string;
  propertyId: string;
  propertyName: string;
  periodLabel: string;
  periodKey: string;
  generatedAt: string;
  generatedAtLabel: string;
  statusLabel: string;
  pdfAvailable: boolean;
  downloadHref: string | null;
};

export const OWNER_SAFE_REPORT_TYPE_LABELS: Record<string, string> = {
  owner_statement: "Owner Statement",
  monthly_profit_and_loss: "Monthly Profit & Loss",
  cash_flow_summary: "Cash Flow Summary",
  expense_report: "Expense Report"
};

export function ownerReportTypeLabel(reportType: string): string {
  return OWNER_SAFE_REPORT_TYPE_LABELS[reportType] ?? reportType;
}

export function formatOwnerReportPeriod(year: number, month: number): { label: string; key: string } {
  const key = `${year}-${String(month).padStart(2, "0")}`;
  const label = new Date(Date.UTC(year, month - 1, 1)).toLocaleString(undefined, {
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  });
  return { label, key };
}
