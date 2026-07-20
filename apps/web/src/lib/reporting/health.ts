import type { ReportHealth } from "./contracts";
import type { ReportingSnapshot } from "./read-sources";

export function buildReportHealth(snapshot: ReportingSnapshot): ReportHealth {
  const transactionsIncluded = snapshot.periodPayments.length > 0 || snapshot.payments.length > 0;
  const expensesIncluded = snapshot.periodExpenses.length > 0 || snapshot.expenses.length > 0;
  const rentIncluded = snapshot.periodCharges.length > 0 || snapshot.charges.length > 0;
  const unreconciled = snapshot.awaitingReconciliationCount > 0;

  return {
    status: unreconciled ? "incomplete" : "healthy",
    transactionsIncluded,
    expensesIncluded,
    rentIncluded,
    reconciliationStatus: unreconciled ? "unreconciled" : "reconciled",
    warning: unreconciled ? "Report generated with unreconciled transactions." : null
  };
}
