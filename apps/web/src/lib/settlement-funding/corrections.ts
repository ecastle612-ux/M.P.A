/**
 * PAY-001 Slice 2 — pure correction helpers (refunds / disputes / ACH / safe corpus).
 * Hardening: C1–C4 helpers. No Stripe SDK; no FIN-003 transfers.
 */

export type SettlementCorrectionKind =
  | "refund"
  | "partial_refund"
  | "dispute_opened"
  | "dispute_won"
  | "dispute_lost"
  | "ach_return"
  | "reconcile_apply";

export type SafeCorpusExclusionReason =
  | "refunded"
  | "partially_refunded"
  | "dispute_open"
  | "dispute_lost"
  | "ach_returned"
  | "legacy_platform"
  | null;

/** Proportional application-fee cents to reverse for a refund. */
export function computeFeeReversalCents(input: {
  chargeAmountCents: number;
  applicationFeeAmountCents: number;
  refundAmountCents: number;
}): number {
  const charge = Math.max(0, Math.trunc(input.chargeAmountCents));
  const fee = Math.max(0, Math.trunc(input.applicationFeeAmountCents));
  const refund = Math.max(0, Math.trunc(input.refundAmountCents));
  if (charge <= 0 || fee <= 0 || refund <= 0) return 0;
  const portion = Math.min(1, refund / charge);
  return Math.min(fee, Math.round(fee * portion));
}

/**
 * A17 — destination refunds fail closed when Express available balance is insufficient.
 * `availableCents === null` means balance could not be retrieved — fail closed for destination.
 */
export function assertDestinationRefundBalance(input: {
  fundingMode: "destination" | "legacy_platform";
  refundAmountCents: number;
  availableCents: number | null;
}): void {
  if (input.fundingMode !== "destination") return;
  const refund = Math.max(0, Math.trunc(input.refundAmountCents));
  if (refund <= 0) return;
  if (input.availableCents === null) {
    throw new Error(
      "Cannot verify org settlement Express available balance for destination refund. Refund blocked (fail closed; no platform float cover)."
    );
  }
  if (input.availableCents < refund) {
    throw new Error(
      `Insufficient org settlement Express available balance for refund (available=${input.availableCents}¢, requested=${refund}¢). Refund blocked (fail closed; no platform float cover).`
    );
  }
}

/** Whether books treat this attempt as safe collected corpus for future FIN-003 inputs. */
export function deriveSafeCorpusExclusion(input: {
  fundingMode: "destination" | "legacy_platform" | null | undefined;
  attemptStatus: string;
  disputeStatus?: "opened" | "won" | "lost" | null;
  achReturned?: boolean;
}): { excluded: boolean; reason: SafeCorpusExclusionReason } {
  if (input.fundingMode === "legacy_platform") {
    return { excluded: true, reason: "legacy_platform" };
  }
  if (input.achReturned) return { excluded: true, reason: "ach_returned" };
  if (input.disputeStatus === "opened") return { excluded: true, reason: "dispute_open" };
  if (input.disputeStatus === "lost") return { excluded: true, reason: "dispute_lost" };
  if (input.attemptStatus === "refunded") return { excluded: true, reason: "refunded" };
  if (input.attemptStatus === "partially_refunded") {
    return { excluded: true, reason: "partially_refunded" };
  }
  return { excluded: false, reason: null };
}

export function isFullRefund(chargeAmountCents: number, refundAmountCents: number): boolean {
  return Math.trunc(refundAmountCents) >= Math.trunc(chargeAmountCents);
}

/** C4 — cumulative refunded after applying this refund delta. */
export function nextCumulativeRefundedCents(input: {
  priorCumulativeCents: number;
  refundDeltaCents: number;
  chargeAmountCents: number;
}): number {
  const prior = Math.max(0, Math.trunc(input.priorCumulativeCents));
  const delta = Math.max(0, Math.trunc(input.refundDeltaCents));
  const charge = Math.max(0, Math.trunc(input.chargeAmountCents));
  return Math.min(charge, prior + delta);
}

/** C4 — attempt status from cumulative refunded vs charge. */
export function refundStatusFromCumulative(
  chargeAmountCents: number,
  cumulativeRefundedCents: number
): "refunded" | "partially_refunded" {
  return isFullRefund(chargeAmountCents, cumulativeRefundedCents) ? "refunded" : "partially_refunded";
}

export function refundKindFromCumulative(
  chargeAmountCents: number,
  cumulativeRefundedCents: number
): "refund" | "partial_refund" {
  return isFullRefund(chargeAmountCents, cumulativeRefundedCents) ? "refund" : "partial_refund";
}

/** C1 — ACH return principal reversal only after money was collected. */
export function isAchReturnPrincipalEligible(attemptStatus: string): boolean {
  return (
    attemptStatus === "succeeded" ||
    attemptStatus === "partially_refunded" ||
    attemptStatus === "refunded"
  );
}

/** C3 — stable key for logical correction dedupe. */
export function correctionApplyKey(
  kind: SettlementCorrectionKind | string,
  externalCorrectionId: string | null | undefined,
  fallbackId: string
): string {
  const ext = (externalCorrectionId ?? "").trim();
  return ext ? `${kind}:${ext}` : `${kind}:${fallbackId}`;
}

export function hasAppliedCorrectionKey(
  appliedKeys: unknown,
  key: string
): boolean {
  return Array.isArray(appliedKeys) && appliedKeys.includes(key);
}

export function readSettlementCorrectionMeta(
  metadata: Record<string, unknown> | null | undefined
): Record<string, unknown> {
  const raw = metadata?.["settlementCorrection"];
  if (raw && typeof raw === "object") return raw as Record<string, unknown>;
  return {};
}

export function readCumulativeRefundedCents(correctionMeta: Record<string, unknown>): number {
  const n = correctionMeta["cumulativeRefundedCents"];
  return typeof n === "number" && Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : 0;
}
