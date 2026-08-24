import {
  FOUNDING_PARTNER_COMMISSION_BPS,
  FOUNDING_PARTNER_QUALIFYING_MONTHS,
  type PartnerCommissionStatus
} from "./config";

export function percentToBps(percent: number): number {
  return Math.round(percent * 100);
}

export function bpsToPercent(bps: number): number {
  return bps / 100;
}

export function calculateCommissionCents(input: {
  eligibleRevenueCents: number;
  commissionBps: number;
}): number {
  if (!Number.isFinite(input.eligibleRevenueCents) || input.eligibleRevenueCents <= 0) {
    return 0;
  }
  if (!Number.isFinite(input.commissionBps) || input.commissionBps <= 0) {
    return 0;
  }
  return Math.floor((input.eligibleRevenueCents * input.commissionBps) / 10_000);
}

export function isWithinQualifyingMonths(
  existingQualifyingCount: number,
  cap = FOUNDING_PARTNER_QUALIFYING_MONTHS
): boolean {
  return existingQualifyingCount < cap;
}

export function nextQualifyingMonthIndex(existingQualifyingCount: number): number {
  return existingQualifyingCount + 1;
}

export function shouldCreateCommission(input: {
  partnerActive: boolean;
  paymentCollected: boolean;
  paymentFailed: boolean;
  refunded: boolean;
  complimentaryOnly: boolean;
  existingQualifyingCount: number;
}): boolean {
  if (!input.partnerActive) return false;
  if (!input.paymentCollected) return false;
  if (input.paymentFailed || input.refunded) return false;
  if (input.complimentaryOnly) return false;
  return isWithinQualifyingMonths(input.existingQualifyingCount);
}

export function commissionStatusForNewEntry(flagged: boolean): PartnerCommissionStatus {
  return flagged ? "pending" : "earned";
}

export function voidOrOffsetStatus(current: PartnerCommissionStatus): {
  next: PartnerCommissionStatus;
  offsetRequired: boolean;
} {
  if (current === "paid") {
    return { next: "void", offsetRequired: true };
  }
  return { next: "void", offsetRequired: false };
}

export const DEFAULT_COMMISSION_BPS = FOUNDING_PARTNER_COMMISSION_BPS;

/** Collected Stripe amount minus separable tax. Failed/zero payments stay 0. */
export function eligibleRevenueCentsFromInvoice(input: {
  amountPaidCents: number;
  taxCents?: number | null;
}): number {
  const paid = Number.isFinite(input.amountPaidCents) ? Math.floor(input.amountPaidCents) : 0;
  if (paid <= 0) return 0;
  const tax =
    typeof input.taxCents === "number" && Number.isFinite(input.taxCents) && input.taxCents > 0
      ? Math.floor(input.taxCents)
      : 0;
  return Math.max(0, paid - tax);
}
