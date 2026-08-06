import { z } from "zod";
import { roundMoney } from "./billing";

export const AGING_BUCKETS = ["current", "1_30", "31_60", "61_90", "90_plus"] as const;
export type AgingBucket = (typeof AGING_BUCKETS)[number];

export const DELINQUENCY_STATUSES = ["watch", "past_due", "in_collections", "resolved", "escalated"] as const;
export type DelinquencyStatus = (typeof DELINQUENCY_STATUSES)[number];

export const VENDOR_INVOICE_STATUSES = [
  "submitted",
  "in_review",
  "changes_requested",
  "approved",
  "rejected",
  "scheduled",
  "paid",
  "void"
] as const;
export type VendorInvoiceStatus = (typeof VENDOR_INVOICE_STATUSES)[number];

export function daysBetween(fromDate: string, toDate: string): number {
  const from = Date.parse(`${fromDate}T00:00:00.000Z`);
  const to = Date.parse(`${toDate}T00:00:00.000Z`);
  return Math.floor((to - from) / (1000 * 60 * 60 * 24));
}

export function agingBucketForDaysPastDue(daysPastDue: number): AgingBucket {
  if (daysPastDue <= 0) {
    return "current";
  }
  if (daysPastDue <= 30) {
    return "1_30";
  }
  if (daysPastDue <= 60) {
    return "31_60";
  }
  if (daysPastDue <= 90) {
    return "61_90";
  }
  return "90_plus";
}

export function delinquencyStatusForDays(daysPastDue: number, graceDays: number): DelinquencyStatus {
  if (daysPastDue <= 0) {
    return "watch";
  }
  if (daysPastDue <= graceDays) {
    return "watch";
  }
  if (daysPastDue <= graceDays + 14) {
    return "past_due";
  }
  if (daysPastDue <= graceDays + 45) {
    return "in_collections";
  }
  return "escalated";
}

export function computeLateFeeAmount(params: {
  chargeAmount: number;
  feeType: "flat" | "percent";
  feeAmount: number;
  feePercent: number;
  maxFeeAmount?: number | null;
}): number {
  const raw =
    params.feeType === "percent"
      ? roundMoney((params.chargeAmount * params.feePercent) / 100)
      : roundMoney(params.feeAmount);
  if (params.maxFeeAmount != null) {
    return Math.min(raw, roundMoney(params.maxFeeAmount));
  }
  return raw;
}

export function isPastGrace(dueAt: string, today: string, graceDays: number): boolean {
  return daysBetween(dueAt, today) > graceDays;
}

export const upsertLateFeePolicyInputSchema = z.object({
  propertyId: z.string().uuid().optional().nullable(),
  name: z.string().trim().min(1).max(120).default("Default late fee"),
  graceDays: z.number().int().min(0).max(60).default(5),
  feeType: z.enum(["flat", "percent"]).default("flat"),
  feeAmount: z.number().min(0).default(50),
  feePercent: z.number().min(0).max(100).default(0),
  maxFeeAmount: z.number().positive().optional().nullable(),
  active: z.boolean().default(true)
});

export const assessLateFeesInputSchema = z.object({
  propertyId: z.string().uuid().optional(),
  leaseId: z.string().uuid().optional(),
  asOfDate: z.string().date().optional()
});

export const createPaymentArrangementInputSchema = z.object({
  leaseId: z.string().uuid(),
  totalAmount: z.number().positive(),
  installmentAmount: z.number().positive(),
  installmentsTotal: z.number().int().min(1).max(36),
  nextDueOn: z.string().date(),
  notes: z.string().trim().max(500).optional()
});

export const sendReminderInputSchema = z.object({
  caseId: z.string().uuid()
});

export const createVendorInputSchema = z.object({
  name: z.string().trim().min(1).max(160),
  email: z.string().email().optional().nullable(),
  phone: z.string().trim().max(40).optional().nullable()
});

export const createVendorInvoiceInputSchema = z.object({
  vendorId: z.string().uuid(),
  propertyId: z.string().uuid().optional().nullable(),
  invoiceNumber: z.string().trim().min(1).max(80),
  description: z.string().trim().max(500).optional(),
  amount: z.number().positive(),
  currency: z.string().length(3).default("USD"),
  dueAt: z.string().date().optional(),
  workOrderId: z.string().uuid().optional().nullable()
});

export const reviewVendorInvoiceInputSchema = z.object({
  invoiceId: z.string().uuid(),
  action: z.enum(["approve", "reject", "request_changes", "schedule", "mark_paid"]),
  reason: z.string().trim().max(400).optional(),
  scheduledFor: z.string().date().optional(),
  paymentMethod: z.enum(["manual_check", "manual_ach", "manual_other"]).optional()
});

export type UpsertLateFeePolicyInput = z.infer<typeof upsertLateFeePolicyInputSchema>;
export type AssessLateFeesInput = z.infer<typeof assessLateFeesInputSchema>;
export type CreatePaymentArrangementInput = z.infer<typeof createPaymentArrangementInputSchema>;
export type CreateVendorInput = z.infer<typeof createVendorInputSchema>;
export type CreateVendorInvoiceInput = z.infer<typeof createVendorInvoiceInputSchema>;
export type ReviewVendorInvoiceInput = z.infer<typeof reviewVendorInvoiceInputSchema>;
