/**
 * FIN-OPS-001 feature flags — slice gates for operational finance.
 * Entitlements still fail-closed at the product boundary; flags gate unfinished slices.
 *
 * S1 authorization includes resident online payments + webhooks (expanded beyond original S1 design).
 */

export const FINANCE_FEATURE_FLAGS = {
  /** S0 Command Center and foundation surfaces. */
  "finance.foundation": true,
  /** S1 charges, ledger, manual payments, receipts. */
  "finance.charges": true,
  /** S1 resident online payments + webhooks (authorized with S1). */
  "finance.payments": true,
  /** S3 late fees. */
  "finance.late_fees": false,
  /** S4 vendor invoice approval. */
  "finance.vendor_invoices": false,
  /** S5 vendor payment release / Stripe payout execution. */
  "finance.vendor_payments": false,
  /** S6 property/owner summaries & reports (snapshot in S1 is basic). */
  "finance.reports": false,
  /** Resident Stripe Checkout execution — enabled with S1 authorization. */
  "finance.stripe_payment_execution": true,
  /** ERP / GL workflows — permanently off under FIN-OPS-001 Launch. */
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
