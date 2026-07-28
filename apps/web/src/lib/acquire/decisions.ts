/**
 * ACQ-001 — locked V1.0 acquisition decisions (OQ-01–OQ-12).
 * SoT: docs/115-acq-001-self-service-customer-acquisition/18-open-questions.md
 */
export const ACQ_TRIAL_ENABLED = true as const;
export const ACQ_TRIAL_REQUIRES_PAYMENT_METHOD = true as const;
export const ACQ_DEFAULT_BILLING_INTERVAL = "month" as const;
export const ACQ_PRE_CHECKOUT_FIELDS = ["companyName", "workEmail"] as const;
export const ACQ_FOUNDER_PUBLIC = false as const;
export const ACQ_ABANDONED_CHECKOUT_EMAIL = false as const;
export const ACQ_POST_SUCCESS_AUTO_LOGIN = false as const;
export const ACQ_SUCCESS_IMPLEMENTATION_UPSELL = false as const;
export const ACQ_PUBLIC_SELF_SERVE_PLANS = ["trial", "professional", "business"] as const;
export const ACQ_SALES_ASSISTED_PLANS = ["enterprise"] as const;

export type AcqSelfServePlan = (typeof ACQ_PUBLIC_SELF_SERVE_PLANS)[number];
export type AcqSalesPlan = (typeof ACQ_SALES_ASSISTED_PLANS)[number];

export function isPublicSelfServePlan(plan: string): plan is AcqSelfServePlan {
  return (ACQ_PUBLIC_SELF_SERVE_PLANS as readonly string[]).includes(plan);
}

export function isSalesAssistedPlan(plan: string): plan is AcqSalesPlan {
  return (ACQ_SALES_ASSISTED_PLANS as readonly string[]).includes(plan);
}
