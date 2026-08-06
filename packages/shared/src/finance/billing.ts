import { z } from "zod";

export const CHARGE_TYPES = ["rent", "recurring_fee", "one_time", "late_fee", "credit", "adjustment"] as const;
export type ChargeType = (typeof CHARGE_TYPES)[number];

export const CHARGE_STATUSES = ["draft", "open", "partially_paid", "paid", "void", "written_off"] as const;
export type ChargeStatus = (typeof CHARGE_STATUSES)[number];

export const PAYMENT_METHODS = [
  "online_stripe",
  "manual_cash",
  "manual_check",
  "manual_other",
  "credit_applied"
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = ["pending", "succeeded", "failed", "refunded", "partially_refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const RESIDENT_FINANCIAL_STATUSES = ["current", "delinquent", "prepaid", "closed"] as const;
export type ResidentFinancialStatus = (typeof RESIDENT_FINANCIAL_STATUSES)[number];

/** Charge type priority for payment allocation (lower index = higher priority). */
export const CHARGE_ALLOCATION_PRIORITY: readonly ChargeType[] = [
  "rent",
  "recurring_fee",
  "late_fee",
  "one_time",
  "adjustment",
  "credit"
];

export type AllocatableCharge = {
  id: string;
  due_at: string;
  charge_type: ChargeType;
  amount: number;
  amount_paid: number;
  status: ChargeStatus;
};

export type PaymentAllocationPlan = {
  chargeId: string;
  amount: number;
};

export function remainingBalance(charge: Pick<AllocatableCharge, "amount" | "amount_paid">): number {
  return Math.max(0, roundMoney(charge.amount - charge.amount_paid));
}

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function sortChargesForAllocation(charges: AllocatableCharge[]): AllocatableCharge[] {
  return [...charges].sort((a, b) => {
    const dueCompare = a.due_at.localeCompare(b.due_at);
    if (dueCompare !== 0) {
      return dueCompare;
    }
    return CHARGE_ALLOCATION_PRIORITY.indexOf(a.charge_type) - CHARGE_ALLOCATION_PRIORITY.indexOf(b.charge_type);
  });
}

/**
 * Deterministic allocation: oldest due date, then type priority.
 * Returns plan and any unapplied remainder (open credit).
 */
export function planPaymentAllocations(
  charges: AllocatableCharge[],
  paymentAmount: number
): { allocations: PaymentAllocationPlan[]; unapplied: number } {
  let remaining = roundMoney(paymentAmount);
  const allocations: PaymentAllocationPlan[] = [];

  for (const charge of sortChargesForAllocation(charges)) {
    if (remaining <= 0) {
      break;
    }
    if (charge.status === "void" || charge.status === "paid" || charge.status === "written_off") {
      continue;
    }
    const due = remainingBalance(charge);
    if (due <= 0) {
      continue;
    }
    const applied = roundMoney(Math.min(due, remaining));
    allocations.push({ chargeId: charge.id, amount: applied });
    remaining = roundMoney(remaining - applied);
  }

  return { allocations, unapplied: remaining };
}

export function nextChargeStatus(amount: number, amountPaid: number): ChargeStatus {
  const paid = roundMoney(amountPaid);
  const total = roundMoney(amount);
  if (paid <= 0) {
    return "open";
  }
  if (paid >= total) {
    return "paid";
  }
  return "partially_paid";
}

export function deriveResidentFinancialStatus(params: {
  openBalance: number;
  hasPastDue: boolean;
}): ResidentFinancialStatus {
  if (params.openBalance < 0) {
    return "prepaid";
  }
  if (params.hasPastDue || params.openBalance > 0) {
    return params.hasPastDue ? "delinquent" : "current";
  }
  return "current";
}

export function formatMoney(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

export const createPropertyInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  addressLine1: z.string().trim().max(200).optional(),
  city: z.string().trim().max(100).optional(),
  unitLabel: z.string().trim().min(1).max(40).default("1")
});

export const createLeaseResidentInputSchema = z.object({
  propertyId: z.string().uuid(),
  unitId: z.string().uuid().optional().nullable(),
  displayName: z.string().trim().min(1).max(120),
  email: z.string().email().optional().nullable(),
  userId: z.string().uuid().optional().nullable(),
  rentAmount: z.number().positive(),
  currency: z.string().length(3).default("USD"),
  startDate: z.string().date().optional()
});

export const createRecurringScheduleInputSchema = z.object({
  leaseId: z.string().uuid(),
  chargeType: z.enum(["rent", "recurring_fee"]),
  label: z.string().trim().min(1).max(120),
  amount: z.number().positive(),
  currency: z.string().length(3).default("USD"),
  dayOfMonth: z.number().int().min(1).max(28).default(1),
  generateCurrentPeriod: z.boolean().default(true)
});

export const createOneTimeChargeInputSchema = z.object({
  leaseId: z.string().uuid(),
  label: z.string().trim().min(1).max(120),
  amount: z.number().positive(),
  currency: z.string().length(3).default("USD"),
  dueAt: z.string().date(),
  memo: z.string().trim().max(500).optional(),
  chargeType: z.enum(["one_time", "adjustment", "credit"]).default("one_time")
});

export const adjustChargeInputSchema = z.object({
  chargeId: z.string().uuid(),
  action: z.enum(["void", "adjust_amount"]),
  amount: z.number().positive().optional(),
  reason: z.string().trim().min(1).max(300)
});

export const recordManualPaymentInputSchema = z.object({
  leaseId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().length(3).default("USD"),
  method: z.enum(["manual_cash", "manual_check", "manual_other"]),
  paidAt: z.string().datetime().optional(),
  memo: z.string().trim().max(300).optional()
});

export const createCheckoutInputSchema = z.object({
  leaseId: z.string().uuid(),
  chargeIds: z.array(z.string().uuid()).min(1).optional(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional()
});

export type CreatePropertyInput = z.infer<typeof createPropertyInputSchema>;
export type CreateLeaseResidentInput = z.infer<typeof createLeaseResidentInputSchema>;
export type CreateRecurringScheduleInput = z.infer<typeof createRecurringScheduleInputSchema>;
export type CreateOneTimeChargeInput = z.infer<typeof createOneTimeChargeInputSchema>;
export type AdjustChargeInput = z.infer<typeof adjustChargeInputSchema>;
export type RecordManualPaymentInput = z.infer<typeof recordManualPaymentInputSchema>;
export type CreateCheckoutInput = z.infer<typeof createCheckoutInputSchema>;

export function periodBoundsForDate(reference: Date, dayOfMonth: number): {
  periodStart: string;
  periodEnd: string;
  dueAt: string;
  nextRunOn: string;
} {
  const year = reference.getUTCFullYear();
  const month = reference.getUTCMonth();
  const due = new Date(Date.UTC(year, month, Math.min(dayOfMonth, 28)));
  const periodStart = new Date(Date.UTC(year, month, 1));
  const periodEnd = new Date(Date.UTC(year, month + 1, 0));
  const nextMonth = month + 1;
  const nextRun = new Date(Date.UTC(year + Math.floor(nextMonth / 12), nextMonth % 12, Math.min(dayOfMonth, 28)));
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return {
    periodStart: iso(periodStart),
    periodEnd: iso(periodEnd),
    dueAt: iso(due),
    nextRunOn: iso(nextRun)
  };
}
