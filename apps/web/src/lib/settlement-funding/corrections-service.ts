/**
 * PAY-001 Slice 2 — settlement correction apply paths.
 * Payments-rail authority only. No createTransfer / FIN-003 Phase C.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@mpa/supabase";
import { createServiceRoleServerClient } from "../auth/server";
import { retrieveConnectAvailableBalanceCents } from "../integrations/payments/stripe-provider";
import {
  assertDestinationRefundBalance,
  computeFeeReversalCents,
  deriveSafeCorpusExclusion,
  isFullRefund,
  refundKindFromCumulative,
  type SettlementCorrectionKind
} from "./corrections";
import { getOrgSettlementFundingSettings, writeFundingAudit } from "./service";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FundingClient = any;

async function adminClient(): Promise<FundingClient> {
  return createServiceRoleServerClient() as FundingClient;
}

export type SettlementMappingSnapshot = {
  id: string;
  organizationId: string;
  paymentAttemptId: string;
  fundingMode: "destination" | "legacy_platform";
  settlementExternalAccountId: string;
  applicationFeeAmountCents: number;
  chargeAmountCents: number;
  externalPaymentIntentId: string | null;
  propertyId: string | null;
  metadata: Record<string, unknown>;
};

export async function loadSettlementMappingForAttempt(
  organizationId: string,
  paymentAttemptId: string,
  client?: FundingClient
): Promise<SettlementMappingSnapshot | null> {
  const db = client ?? (await adminClient());
  const { data } = await db
    .from("payment_settlement_mappings")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("payment_attempt_id", paymentAttemptId)
    .maybeSingle();
  if (!data) return null;
  const row = data as Record<string, unknown>;
  return {
    id: String(row["id"]),
    organizationId: String(row["organization_id"]),
    paymentAttemptId: String(row["payment_attempt_id"]),
    fundingMode: row["funding_mode"] === "legacy_platform" ? "legacy_platform" : "destination",
    settlementExternalAccountId: String(row["settlement_external_account_id"]),
    applicationFeeAmountCents: Number(row["application_fee_amount_cents"] ?? 0),
    chargeAmountCents: Number(row["charge_amount_cents"] ?? 0),
    externalPaymentIntentId: (row["external_payment_intent_id"] as string | null) ?? null,
    propertyId: (row["property_id"] as string | null) ?? null,
    metadata:
      row["metadata"] && typeof row["metadata"] === "object"
        ? (row["metadata"] as Record<string, unknown>)
        : {}
  };
}

/** Preflight destination refund against Stripe Connect available balance (A17). */
export async function preflightDestinationRefund(input: {
  organizationId: string;
  paymentAttemptId: string;
  refundAmountCents: number;
  fundingModeHint?: "destination" | "legacy_platform";
}): Promise<{
  mapping: SettlementMappingSnapshot | null;
  fundingMode: "destination" | "legacy_platform";
  availableCents: number | null;
}> {
  const mapping = await loadSettlementMappingForAttempt(
    input.organizationId,
    input.paymentAttemptId
  );

  // C6 — do not silently assume legacy when enrolled org lacks mapping/mode (A17 bypass).
  let fundingMode: "destination" | "legacy_platform";
  if (mapping?.fundingMode) {
    fundingMode = mapping.fundingMode;
  } else if (input.fundingModeHint) {
    fundingMode = input.fundingModeHint;
  } else {
    const settings = await getOrgSettlementFundingSettings(input.organizationId);
    if (settings.destinationEnrolled) {
      throw new Error(
        "Cannot refund: destination-enrolled organization is missing settlement mapping and fundingMode. Refund blocked (fail closed; A17)."
      );
    }
    fundingMode = "legacy_platform";
  }

  let availableCents: number | null = null;
  if (fundingMode === "destination") {
    const acct = mapping?.settlementExternalAccountId;
    if (!acct?.startsWith("acct_")) {
      assertDestinationRefundBalance({
        fundingMode: "destination",
        refundAmountCents: input.refundAmountCents,
        availableCents: null
      });
    } else if (!process.env["STRIPE_SECRET_KEY"]?.trim()) {
      assertDestinationRefundBalance({
        fundingMode: "destination",
        refundAmountCents: input.refundAmountCents,
        availableCents: null
      });
    } else {
      const bal = await retrieveConnectAvailableBalanceCents(acct);
      availableCents = bal.availableCents;
      assertDestinationRefundBalance({
        fundingMode: "destination",
        refundAmountCents: input.refundAmountCents,
        availableCents
      });
    }
  }

  return { mapping, fundingMode, availableCents };
}

export async function recordSettlementCorrectionAudit(input: {
  organizationId: string;
  paymentAttemptId: string;
  kind: SettlementCorrectionKind;
  amountCents: number;
  actorUserId: string | null;
  fundingMode: "destination" | "legacy_platform" | null;
  externalId?: string | null;
  payload?: Record<string, unknown>;
  client?: FundingClient;
}): Promise<void> {
  const eventType =
    input.kind === "refund" || input.kind === "partial_refund"
      ? "funding.refund.applied"
      : input.kind === "ach_return"
        ? "funding.ach_return.applied"
        : input.kind === "dispute_opened"
          ? "funding.dispute.opened"
          : input.kind === "dispute_won"
            ? "funding.dispute.won"
            : input.kind === "dispute_lost"
              ? "funding.dispute.lost"
              : "funding.reconcile.apply";

  const exclusion = deriveSafeCorpusExclusion({
    fundingMode: input.fundingMode,
    attemptStatus:
      input.kind === "refund"
        ? "refunded"
        : input.kind === "partial_refund"
          ? "partially_refunded"
          : input.kind === "ach_return"
            ? "failed"
            : "succeeded",
    disputeStatus:
      input.kind === "dispute_opened"
        ? "opened"
        : input.kind === "dispute_won"
          ? "won"
          : input.kind === "dispute_lost"
            ? "lost"
            : null,
    achReturned: input.kind === "ach_return"
  });

  await writeFundingAudit({
    organizationId: input.organizationId,
    entityType: "payment_attempt",
    entityId: input.paymentAttemptId,
    eventType,
    summary: `Settlement correction ${input.kind} (${input.amountCents}¢)`,
    actorUserId: input.actorUserId,
    payload: {
      kind: input.kind,
      amountCents: input.amountCents,
      fundingMode: input.fundingMode,
      externalId: input.externalId ?? null,
      excludesFromSafeCorpus: exclusion.excluded,
      exclusionReason: exclusion.reason,
      ...(input.payload ?? {})
    },
    ...(input.client ? { client: input.client } : {})
  });

  if (
    input.kind === "refund" ||
    input.kind === "partial_refund" ||
    input.kind === "ach_return" ||
    input.kind === "dispute_lost"
  ) {
    await writeFundingAudit({
      organizationId: input.organizationId,
      entityType: "payment_attempt",
      entityId: input.paymentAttemptId,
      eventType: "funding.reversal.detected",
      summary: `Reversal detected (${input.kind}) — FIN-003 handoff signal only`,
      actorUserId: input.actorUserId,
      payload: {
        kind: input.kind,
        amountCents: input.amountCents,
        fundingMode: input.fundingMode,
        handoffOnly: true,
        noTransferCancel: true
      },
      ...(input.client ? { client: input.client } : {})
    });
  }
}

export function feeReversalForRefund(mapping: SettlementMappingSnapshot | null, refundAmountCents: number): number {
  if (!mapping || mapping.fundingMode !== "destination") return 0;
  return computeFeeReversalCents({
    chargeAmountCents: mapping.chargeAmountCents,
    applicationFeeAmountCents: mapping.applicationFeeAmountCents,
    refundAmountCents
  });
}

export function refundKindForAmounts(chargeAmountCents: number, refundAmountCents: number): SettlementCorrectionKind {
  return isFullRefund(chargeAmountCents, refundAmountCents) ? "refund" : "partial_refund";
}

/** C4 — kind from cumulative refunded total (not a single delta alone). */
export function refundKindForCumulative(
  chargeAmountCents: number,
  cumulativeRefundedCents: number
): SettlementCorrectionKind {
  return refundKindFromCumulative(chargeAmountCents, cumulativeRefundedCents);
}

export type MoneyInReconcileReport = {
  organizationId: string;
  paymentAttemptId: string;
  mapping: SettlementMappingSnapshot | null;
  fundingMode: "destination" | "legacy_platform" | null;
  stripeAvailableCents: number | null;
  stripePendingCents: number | null;
  notes: string[];
  inventCashForbidden: true;
};

/**
 * On-demand money-in reconcile read (never invents Stripe cash).
 */
export async function reconcileMoneyInSettlement(input: {
  organizationId: string;
  paymentAttemptId: string;
  client?: SupabaseClient<Database>;
}): Promise<MoneyInReconcileReport> {
  void input.client;
  const mapping = await loadSettlementMappingForAttempt(
    input.organizationId,
    input.paymentAttemptId
  );
  const notes: string[] = [];
  let stripeAvailableCents: number | null = null;
  let stripePendingCents: number | null = null;

  if (!mapping) {
    notes.push("No payment_settlement_mappings row — cannot treat as destination corpus");
  } else if (mapping.fundingMode === "legacy_platform") {
    notes.push("legacy_platform — never FIN-003 transferable; no Express sub-balance");
  } else if (!process.env["STRIPE_SECRET_KEY"]?.trim()) {
    notes.push("STRIPE_SECRET_KEY missing — balance retrieve skipped (fail closed for cash SoT)");
  } else {
    try {
      const bal = await retrieveConnectAvailableBalanceCents(mapping.settlementExternalAccountId, {
        includePending: true
      });
      stripeAvailableCents = bal.availableCents;
      stripePendingCents = bal.pendingCents;
      notes.push(
        "Stripe Connect balance retrieved — available is cash SoT; pending ≠ transferable; property books are ledger-side only (pooled Express)"
      );
    } catch (err) {
      notes.push(
        `Balance retrieve failed: ${err instanceof Error ? err.message : "unknown"} — do not invent settlement credit`
      );
    }
  }

  return {
    organizationId: input.organizationId,
    paymentAttemptId: input.paymentAttemptId,
    mapping,
    fundingMode: mapping?.fundingMode ?? null,
    stripeAvailableCents,
    stripePendingCents,
    notes,
    inventCashForbidden: true
  };
}

/**
 * Apply a ledger-only reconcile correction with mandatory audit.
 * Never credits Express cash without Stripe evidence (caller must not invent amounts).
 */
export async function applyMoneyInReconcileCorrection(input: {
  organizationId: string;
  paymentAttemptId: string;
  actorUserId: string;
  summary: string;
  /** Opaque correction note — must not claim Stripe cash invented */
  ledgerNote: string;
  amountCents: number;
  client?: FundingClient;
}): Promise<void> {
  if (input.amountCents === 0) {
    throw new Error("Reconcile correction amount must be non-zero");
  }

  // C5 — refuse cross-org attempt ids (audit pollution).
  const db = input.client ?? (await adminClient());
  const { data: attemptRow } = await db
    .from("payment_attempts")
    .select("id, organization_id")
    .eq("id", input.paymentAttemptId)
    .maybeSingle();
  if (!attemptRow) {
    throw new Error("Payment attempt not found for reconcile correction");
  }
  if (String(attemptRow["organization_id"]) !== input.organizationId) {
    throw new Error("Payment attempt does not belong to active organization");
  }

  await recordSettlementCorrectionAudit({
    organizationId: input.organizationId,
    paymentAttemptId: input.paymentAttemptId,
    kind: "reconcile_apply",
    amountCents: input.amountCents,
    actorUserId: input.actorUserId,
    fundingMode: null,
    payload: {
      summary: input.summary,
      ledgerNote: input.ledgerNote,
      inventCashForbidden: true,
      stripeCashNotInvented: true
    },
    client: db
  });
}

export async function mergeAttemptSettlementCorrectionMetadata(
  organizationId: string,
  paymentAttemptId: string,
  patch: Record<string, unknown>,
  client?: FundingClient
): Promise<void> {
  const db = client ?? (await adminClient());
  const { data: row } = await db
    .from("payment_attempts")
    .select("metadata")
    .eq("organization_id", organizationId)
    .eq("id", paymentAttemptId)
    .maybeSingle();
  const prev =
    row?.metadata && typeof row.metadata === "object"
      ? (row.metadata as Record<string, unknown>)
      : {};
  const prevCorrection =
    prev["settlementCorrection"] && typeof prev["settlementCorrection"] === "object"
      ? (prev["settlementCorrection"] as Record<string, unknown>)
      : {};
  await db
    .from("payment_attempts")
    .update({
      metadata: {
        ...prev,
        settlementCorrection: {
          ...prevCorrection,
          ...patch,
          updatedAt: new Date().toISOString()
        }
      } as Json,
      updated_at: new Date().toISOString()
    })
    .eq("id", paymentAttemptId)
    .eq("organization_id", organizationId);
}
