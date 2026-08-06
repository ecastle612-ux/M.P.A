/**
 * FIN-OPS-001 feature flags — slice gates for operational finance.
 */

export const FINANCE_FEATURE_FLAGS = {
  "finance.foundation": true,
  "finance.charges": true,
  "finance.payments": true,
  /** S2 delinquency + late fee assessment. */
  "finance.late_fees": true,
  /** S2 vendor invoice approval. */
  "finance.vendor_invoices": true,
  /** S2 vendor payment schedule / mark paid (manual rails). */
  "finance.vendor_payments": true,
  /** S3 property / owner operational reporting (not ERP). */
  "finance.reports": true,
  "finance.stripe_payment_execution": true,
  "finance.erp_accounting": false
} as const;

export type FinanceFeatureFlag = keyof typeof FINANCE_FEATURE_FLAGS;

export function isFinanceFeatureEnabled(flag: FinanceFeatureFlag): boolean {
  return FINANCE_FEATURE_FLAGS[flag];
}

export function assertFinanceFeatureEnabled(flag: FinanceFeatureFlag): void {
  if (!FINANCE_FEATURE_FLAGS[flag]) {
    throw new Error(`Financial Operations feature "${flag}" is not authorized for the current slice.`);
  }
}
