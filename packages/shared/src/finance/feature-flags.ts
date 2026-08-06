/**
 * FIN-OPS-001 feature flags — slice gates for operational finance.
 * Entitlements still fail-closed at the product boundary; flags gate unfinished slices.
 */

export const FINANCE_FEATURE_FLAGS = {
  /** S0 Command Center and foundation surfaces. */
  "finance.foundation": true,
  /** S1 charges & resident ledger. */
  "finance.charges": false,
  /** S2 checkout & payment webhooks. */
  "finance.payments": false,
  /** S3 late fees. */
  "finance.late_fees": false,
  /** S4 vendor invoice approval. */
  "finance.vendor_invoices": false,
  /** S5 vendor payment release / Stripe payout execution. */
  "finance.vendor_payments": false,
  /** S6 property/owner summaries & reports. */
  "finance.reports": false,
  /** Stripe payment execution (Checkout / PaymentIntent). Always off until S2 auth. */
  "finance.stripe_payment_execution": false,
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
