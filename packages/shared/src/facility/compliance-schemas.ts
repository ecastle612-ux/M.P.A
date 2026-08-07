import { z } from "zod";

export const COMPLIANCE_OBLIGATION_STATUSES = [
  "upcoming",
  "due",
  "overdue",
  "satisfied",
  "waived"
] as const;
export type ComplianceObligationStatus = (typeof COMPLIANCE_OBLIGATION_STATUSES)[number];

export function deriveComplianceStatus(
  dueOn: string,
  today: string,
  terminal?: "satisfied" | "waived" | null
): ComplianceObligationStatus {
  if (terminal === "satisfied") return "satisfied";
  if (terminal === "waived") return "waived";
  if (dueOn < today) return "overdue";
  if (dueOn === today) return "due";
  return "upcoming";
}

export const createComplianceObligationInputSchema = z.object({
  siteId: z.string().uuid(),
  title: z.string().trim().min(3).max(200),
  authority: z.string().trim().min(2).max(160).default("internal"),
  requirement: z.string().trim().max(4000).nullable().optional(),
  dueOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});
export type CreateComplianceObligationInput = z.infer<typeof createComplianceObligationInputSchema>;

export const satisfyComplianceObligationInputSchema = z.object({
  obligationId: z.string().uuid(),
  evidenceDocumentIds: z.array(z.string().uuid()).min(1)
});
export type SatisfyComplianceObligationInput = z.infer<
  typeof satisfyComplianceObligationInputSchema
>;

export const waiveComplianceObligationInputSchema = z.object({
  obligationId: z.string().uuid(),
  waiverReason: z.string().trim().min(3).max(2000)
});
export type WaiveComplianceObligationInput = z.infer<typeof waiveComplianceObligationInputSchema>;
