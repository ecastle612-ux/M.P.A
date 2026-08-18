import { z } from "zod";
import { remainingBalance, roundMoney, type ChargeStatus, type ChargeType } from "./billing";

export const FEE_CATEGORIES = [
  "rent",
  "parking",
  "pet",
  "utilities",
  "deposit",
  "damage",
  "late_fee",
  "other"
] as const;
export type FeeCategory = (typeof FEE_CATEGORIES)[number];

export const AUTOPAY_ENROLLMENT_STATUSES = ["active", "revoked", "paused"] as const;
export type AutopayEnrollmentStatus = (typeof AUTOPAY_ENROLLMENT_STATUSES)[number];

export const CONNECT_ACCOUNT_STATUSES = [
  "not_started",
  "pending",
  "restricted",
  "ready",
  "disabled"
] as const;
export type ConnectAccountStatus = (typeof CONNECT_ACCOUNT_STATUSES)[number];

export const ONE_TIME_FEE_CATEGORIES = [
  "parking",
  "pet",
  "utilities",
  "deposit",
  "damage",
  "late_fee",
  "other"
] as const;

export const RECURRING_FEE_CATEGORIES = ["rent", "parking", "pet", "utilities", "other"] as const;

export const AUTOPAY_CONSENT_VERSION = "docs-188-v1";

export const AUTOPAY_CONSENT_TEXT =
  "I authorize M.P.A. to automatically charge the payment method I save for posted recurring rent and any recurring fees my property marked AutoPay-eligible. One-time charges such as deposits, damage, and ad-hoc fees are not included unless I later consent to those categories. I can turn AutoPay off at any time. Setting rent on my lease does not enroll me.";

export function defaultFeeCategoryForChargeType(chargeType: ChargeType): FeeCategory {
  if (chargeType === "rent") {
    return "rent";
  }
  if (chargeType === "late_fee") {
    return "late_fee";
  }
  return "other";
}

export function defaultAutopayEligible(input: {
  chargeType: ChargeType;
  feeCategory?: FeeCategory | null;
  autopayEligible?: boolean | null;
}): boolean {
  if (input.autopayEligible === true) {
    return input.chargeType === "rent" || input.chargeType === "recurring_fee";
  }
  if (input.autopayEligible === false) {
    return false;
  }
  return input.chargeType === "rent";
}

export function chargeIsAutopayEligible(charge: {
  charge_type: ChargeType | string;
  autopay_eligible?: boolean | null;
  fee_category?: string | null;
  schedule_id?: string | null;
}): boolean {
  if (charge.autopay_eligible !== true) {
    return false;
  }
  if (charge.charge_type === "rent") {
    return true;
  }
  if (charge.charge_type === "recurring_fee") {
    const category = charge.fee_category ?? "other";
    return category !== "deposit" && category !== "damage" && category !== "late_fee";
  }
  return false;
}

export function chargeIsImmutableAmount(status: ChargeStatus | string): boolean {
  return status === "paid" || status === "partially_paid" || status === "void" || status === "written_off";
}

export function connectAccountReady(account: {
  stripe_account_id?: string | null;
  status?: string | null;
  charges_enabled?: boolean | null;
} | null | undefined): boolean {
  return Boolean(
    account?.stripe_account_id &&
      account.charges_enabled === true &&
      account.status === "ready"
  );
}

export function tenantOnlinePayAvailable(input: {
  stripePaymentExecutionEnabled: boolean;
  occupancyAccess: string;
  connectReady: boolean;
}): boolean {
  return (
    input.stripePaymentExecutionEnabled === true &&
    input.occupancyAccess === "active" &&
    input.connectReady === true
  );
}

export function resolveCheckoutAmount(input: {
  remaining: number;
  requestedAmount?: number | null;
}): { ok: true; amount: number } | { ok: false; error: string } {
  const remaining = roundMoney(input.remaining);
  if (remaining <= 0) {
    return { ok: false, error: "Nothing to pay" };
  }
  if (input.requestedAmount == null) {
    return { ok: true, amount: remaining };
  }
  const requested = roundMoney(input.requestedAmount);
  if (requested <= 0) {
    return { ok: false, error: "Nothing to pay" };
  }
  if (requested - remaining > 0.009) {
    return { ok: false, error: "amount_exceeds_remaining" };
  }
  return { ok: true, amount: requested };
}

export function connectStatusFromStripe(account: {
  charges_enabled?: boolean | null;
  payouts_enabled?: boolean | null;
  details_submitted?: boolean | null;
}): ConnectAccountStatus {
  if (account.charges_enabled) {
    return "ready";
  }
  if (account.details_submitted) {
    return "pending";
  }
  return "restricted";
}

export function autopayCoverageCopy(): string {
  return "AutoPay covers posted recurring rent and recurring fees your property marked AutoPay-eligible. It does not pay deposits, damage charges, late fees, or other one-time charges.";
}

export function nextSchedulePeriod(nextRunOn: string, dayOfMonth: number): {
  periodStart: string;
  periodEnd: string;
  dueAt: string;
  followingRunOn: string;
} {
  const [year, month] = nextRunOn.split("-").map(Number);
  const safeYear = year ?? 1970;
  const safeMonth = (month ?? 1) - 1;
  const due = new Date(Date.UTC(safeYear, safeMonth, Math.min(dayOfMonth, 28)));
  const periodStart = new Date(Date.UTC(safeYear, safeMonth, 1));
  const periodEnd = new Date(Date.UTC(safeYear, safeMonth + 1, 0));
  const following = new Date(Date.UTC(safeYear, safeMonth + 1, Math.min(dayOfMonth, 28)));
  const iso = (value: Date) => value.toISOString().slice(0, 10);
  return {
    periodStart: iso(periodStart),
    periodEnd: iso(periodEnd),
    dueAt: iso(due),
    followingRunOn: iso(following)
  };
}

export function refundReopenPaid(charge: { amount: number; amount_paid: number }, refunded: number): {
  amount_paid: number;
  status: ChargeStatus;
} {
  const nextPaid = roundMoney(Math.max(0, Number(charge.amount_paid) - refunded));
  const total = roundMoney(Number(charge.amount));
  if (nextPaid <= 0) {
    return { amount_paid: 0, status: "open" };
  }
  if (nextPaid >= total) {
    return { amount_paid: total, status: "paid" };
  }
  return { amount_paid: nextPaid, status: "partially_paid" };
}

export function remainingOfCharges(
  charges: Array<{ amount: number; amount_paid: number }>
): number {
  return roundMoney(
    charges.reduce((sum, charge) => sum + remainingBalance(charge), 0)
  );
}

export const updateChargeScheduleInputSchema = z.object({
  scheduleId: z.string().uuid(),
  amount: z.number().positive().optional(),
  dayOfMonth: z.number().int().min(1).max(28).optional(),
  autopayEligible: z.boolean().optional(),
  active: z.boolean().optional(),
  label: z.string().trim().min(1).max(120).optional()
});

export const createCheckoutInputSchemaV2 = z.object({
  leaseId: z.string().uuid(),
  chargeIds: z.array(z.string().uuid()).min(1).optional(),
  amount: z.number().positive().optional(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
  paymentMethodType: z.enum(["card", "us_bank_account"])
});

export const autopayStartInputSchema = z.object({
  action: z.literal("start"),
  leaseId: z.string().uuid(),
  consentText: z.string().trim().min(20),
  paymentMethodType: z.enum(["card", "us_bank_account"])
});

export const autopayConfirmInputSchema = z
  .object({
    action: z.literal("confirm"),
    leaseId: z.string().uuid(),
    setupIntentId: z.string().min(3).optional(),
    checkoutSessionId: z.string().min(3).optional(),
    consentText: z.string().trim().min(20),
    paymentMethodType: z.enum(["card", "us_bank_account"])
  })
  .refine((value) => Boolean(value.setupIntentId || value.checkoutSessionId), {
    message: "setupIntentId or checkoutSessionId required"
  });

export const autopayRevokeInputSchema = z.object({
  action: z.literal("revoke"),
  leaseId: z.string().uuid()
});

export const autopayRunInputSchema = z.object({
  leaseId: z.string().uuid().optional(),
  asOfDate: z.string().date().optional()
});

export const runSchedulesInputSchema = z.object({
  asOfDate: z.string().date().optional(),
  leaseId: z.string().uuid().optional()
});

export type UpdateChargeScheduleInput = z.infer<typeof updateChargeScheduleInputSchema>;
export type AutopayStartInput = z.infer<typeof autopayStartInputSchema>;
export type AutopayConfirmInput = z.infer<typeof autopayConfirmInputSchema>;
export type AutopayRevokeInput = z.infer<typeof autopayRevokeInputSchema>;
