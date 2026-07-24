/**
 * PAY-001 Slice 3 — production / ops readiness helpers (pure).
 * Does not call Stripe, create transfers, or invent settlement cash.
 */

export type Pay001ProductionReadinessCheckId =
  | "PR1_payment_provider_stripe"
  | "PR2_stripe_secret_present"
  | "PR3_env_funding_enabled"
  | "PR4_webhook_secret_present"
  | "PR5_q3b_fee_attestation"
  | "PR6_q4_dispute_fee_attestation";

export type Pay001ProductionReadinessCheck = {
  id: Pay001ProductionReadinessCheckId;
  ok: boolean;
  summary: string;
  requiredForProductionDestination: boolean;
};

export type Pay001ProductionReadinessResult = {
  readyForProductionDestination: boolean;
  checks: Pay001ProductionReadinessCheck[];
  failedIds: Pay001ProductionReadinessCheckId[];
};

/** Truthy env helpers aligned with Slice 1 funding flag parsing. */
function envTruthy(value: string | undefined): boolean {
  if (!value) return false;
  const v = value.trim().toLowerCase();
  return v === "1" || v === "true" || v === "on" || v === "yes";
}

/**
 * Evaluate production destination-enable readiness from env + attestation flags.
 * Attestation flags are ops-supplied (documented in Slice 3 runbooks) — not auto-claimed.
 */
export function evaluatePay001ProductionReadiness(input?: {
  paymentProvider?: string | undefined;
  stripeSecretKey?: string | undefined;
  pay001DestinationFundingEnabled?: string | undefined;
  stripeWebhookSecret?: string | undefined;
  /** Ops attestation: commercial fee rates recorded (Q3b) */
  q3bFeeRatesAttested?: boolean;
  /** Ops attestation: dispute-fee liability confirmed (Q4) */
  q4DisputeFeeAttested?: boolean;
}): Pay001ProductionReadinessResult {
  const paymentProvider = (input?.paymentProvider ?? process.env["PAYMENT_PROVIDER"] ?? "").trim();
  const stripeSecret =
    input?.stripeSecretKey ?? process.env["STRIPE_SECRET_KEY"] ?? "";
  const fundingEnv =
    input?.pay001DestinationFundingEnabled ??
    process.env["PAY001_DESTINATION_FUNDING_ENABLED"];
  const webhookSecret =
    input?.stripeWebhookSecret ?? process.env["STRIPE_WEBHOOK_SECRET"] ?? "";
  const q3b = Boolean(input?.q3bFeeRatesAttested);
  const q4 = Boolean(input?.q4DisputeFeeAttested);

  const checks: Pay001ProductionReadinessCheck[] = [
    {
      id: "PR1_payment_provider_stripe",
      ok: paymentProvider.toLowerCase() === "stripe",
      summary: "PAYMENT_PROVIDER=stripe for live destination charges",
      requiredForProductionDestination: true
    },
    {
      id: "PR2_stripe_secret_present",
      ok: Boolean(stripeSecret.trim()),
      summary: "STRIPE_SECRET_KEY present (server-only)",
      requiredForProductionDestination: true
    },
    {
      id: "PR3_env_funding_enabled",
      ok: envTruthy(fundingEnv),
      summary: "PAY001_DESTINATION_FUNDING_ENABLED on for destination routing",
      requiredForProductionDestination: true
    },
    {
      id: "PR4_webhook_secret_present",
      ok: Boolean(webhookSecret.trim()),
      summary: "STRIPE_WEBHOOK_SECRET present for payments-rail verification",
      requiredForProductionDestination: true
    },
    {
      id: "PR5_q3b_fee_attestation",
      ok: q3b,
      summary: "Q3b commercial fee rates attested (ops/finance record)",
      requiredForProductionDestination: true
    },
    {
      id: "PR6_q4_dispute_fee_attestation",
      ok: q4,
      summary: "Q4 dispute-fee liability attested against Stripe docs",
      requiredForProductionDestination: true
    }
  ];

  const failedIds = checks
    .filter((c) => c.requiredForProductionDestination && !c.ok)
    .map((c) => c.id);

  return {
    readyForProductionDestination: failedIds.length === 0,
    checks,
    failedIds
  };
}

/** A12 procedure ids published in Slice 3 ops runbooks. */
export const PAY001_OPS_RUNBOOK_IDS = [
  "reconcile_money_in",
  "refund_destination",
  "underfunded_refund",
  "dispute_lifecycle",
  "ach_return",
  "freeze_funding"
] as const;

export type Pay001OpsRunbookId = (typeof PAY001_OPS_RUNBOOK_IDS)[number];

export function isPay001OpsRunbookId(value: string): value is Pay001OpsRunbookId {
  return (PAY001_OPS_RUNBOOK_IDS as readonly string[]).includes(value);
}

/**
 * Money-in reconcile workflow steps (ops checklist) — maps to BillingService helpers.
 * Does not invent Stripe cash; apply path remains audit + separate ledger adjustments.
 */
export function moneyInReconcileWorkflowSteps(): ReadonlyArray<{
  step: number;
  action: string;
  system: string;
}> {
  return [
    {
      step: 1,
      action: "Identify payment_attempt_id and organization_id",
      system: "Billing ops / payment_attempts"
    },
    {
      step: 2,
      action: "GET billing reconcile=1&settlementAttemptId=… (financial:read)",
      system: "BillingService.getMoneyInSettlementReconcile"
    },
    {
      step: 3,
      action: "Compare Stripe available/pending notes vs ledger facts — pending ≠ transferable",
      system: "retrieveConnectAvailableBalanceCents + billing_ledger_entries"
    },
    {
      step: 4,
      action: "If books need correction: use billing adjustment APIs; then audit via settlement_reconcile_apply",
      system: "applyBillingAdjustment + applyMoneyInSettlementReconcile"
    },
    {
      step: 5,
      action: "Never invent Express cash; never call createTransfer",
      system: "PAY-001 custody invariant"
    }
  ];
}
