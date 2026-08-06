import { z } from "zod";

/** Certified leasing lifecycle statuses (LAUNCH-001 J4). */
export const LEASE_STATUSES = [
  "draft",
  "pending_signature",
  "signed",
  "active",
  "ended"
] as const;
export type LeaseStatus = (typeof LEASE_STATUSES)[number];

export const LEASE_STATUS_LABELS: Record<LeaseStatus, string> = {
  draft: "Draft",
  pending_signature: "Pending Signature",
  signed: "Signed",
  active: "Active",
  ended: "Ended"
};

export const LEASE_SIGNING_CHANNELS = ["signwell", "offline"] as const;
export type LeaseSigningChannel = (typeof LEASE_SIGNING_CHANNELS)[number];

/** Launch-critical lease create — resident + rent terms. */
export const createLeaseInputSchema = z.object({
  residentId: z.string().uuid(),
  rentAmount: z.number().positive().max(1_000_000),
  currency: z.string().length(3).default("USD"),
  startDate: z.string().date().optional(),
  dayOfMonth: z.number().int().min(1).max(28).default(1),
  requireManagerSignature: z.boolean().default(true),
  managerName: z.string().trim().min(1).max(120).optional(),
  managerEmail: z.string().trim().email().max(254).optional()
});

export type CreateLeaseInput = z.infer<typeof createLeaseInputSchema>;

export const sendLeaseForSignatureInputSchema = z.object({
  leaseId: z.string().uuid()
});

export type SendLeaseForSignatureInput = z.infer<typeof sendLeaseForSignatureInputSchema>;

export const completeLeaseOfflineInputSchema = z.object({
  leaseId: z.string().uuid(),
  note: z.string().trim().max(300).optional()
});

export type CompleteLeaseOfflineInput = z.infer<typeof completeLeaseOfflineInputSchema>;
