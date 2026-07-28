/**
 * ACQ-001 Slice C — production certification scenario matrix (code-evidence helpers).
 * Live Stripe operator evidence is recorded in docs; these helpers keep the matrix testable.
 */

export const ACQ_PRODUCTION_SCENARIOS = [
  {
    id: "S-HAPPY-TRIAL",
    path: "Landing → Pricing → Trial Checkout → Webhook → Provision → Email → First login → Setup → Active → Dashboard",
    expected: "trialing entitlements; no auto-login"
  },
  {
    id: "S-HAPPY-PRO",
    path: "Landing → Pricing → Professional Checkout → paid → Provision → Setup → Dashboard",
    expected: "professional entitlements bound"
  },
  {
    id: "S-HAPPY-BUSINESS",
    path: "Landing → Pricing → Business Checkout → paid → Provision → Setup → Dashboard",
    expected: "business entitlements bound"
  },
  {
    id: "S-CANCEL",
    path: "Checkout cancel → /acquire/canceled → resume",
    expected: "no org; no charge"
  },
  {
    id: "S-PAYMENT-FAIL",
    path: "Stripe declines payment",
    expected: "no org; recovery via pricing"
  },
  {
    id: "S-WEBHOOK-DUP",
    path: "Duplicate checkout.session.completed",
    expected: "saas_webhook_events duplicate ignore; activation idempotent"
  },
  {
    id: "S-ENTERPRISE-REJECT",
    path: "POST /api/acquire/checkout plan=enterprise",
    expected: "403 INVALID_PLAN"
  },
  {
    id: "S-FOUNDER-REJECT",
    path: "POST /api/acquire/checkout plan=founder",
    expected: "403 INVALID_PLAN"
  },
  {
    id: "S-DUP-SUB",
    path: "Checkout with email that has open SaaS subscription",
    expected: "409 SUBSCRIPTION_EXISTS"
  },
  {
    id: "S-CONTACT-SALES",
    path: "Contact Sales form → COM opportunity",
    expected: "create or reuse lead; no Checkout"
  },
  {
    id: "S-WEBHOOK-DELAY",
    path: "Success page before webhook",
    expected: "poll pending → ready; delayed messaging after retries"
  }
] as const;

export type AcqProductionScenarioId = (typeof ACQ_PRODUCTION_SCENARIOS)[number]["id"];

/** Maps scenario → primary code evidence module (for cert report). */
export const ACQ_SCENARIO_EVIDENCE: Record<AcqProductionScenarioId, string[]> = {
  "S-HAPPY-TRIAL": [
    "lib/saas/public-checkout.ts",
    "lib/saas/server.ts#applySaasProviderWebhook",
    "lib/commercial/activation.ts"
  ],
  "S-HAPPY-PRO": ["lib/saas/public-checkout.ts", "lib/commercial/activation.ts"],
  "S-HAPPY-BUSINESS": ["lib/saas/public-checkout.ts", "lib/commercial/activation.ts"],
  "S-CANCEL": ["app/(marketing)/acquire/canceled/page.tsx", "components/acquire/resume-checkout-links.tsx"],
  "S-PAYMENT-FAIL": ["app/(marketing)/acquire/error/page.tsx", "docs/115-acq-001/.../09-error-handling.md"],
  "S-WEBHOOK-DUP": ["lib/saas/server.ts (saas_webhook_events duplicate)", "commercial_activation_requests idempotency"],
  "S-ENTERPRISE-REJECT": ["lib/saas/public-checkout.ts", "lib/saas/public-checkout.test.ts"],
  "S-FOUNDER-REJECT": ["lib/saas/public-checkout.ts", "lib/saas/public-checkout.test.ts"],
  "S-DUP-SUB": ["lib/saas/public-checkout.ts#findOpenSubscriptionForEmail"],
  "S-CONTACT-SALES": ["lib/commercial/public-lead.ts", "lib/commercial/public-lead.test.ts"],
  "S-WEBHOOK-DELAY": ["components/acquire/acquire-success-panel.tsx", "GET /api/acquire/status"]
};
