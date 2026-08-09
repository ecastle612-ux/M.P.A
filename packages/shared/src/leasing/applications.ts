import { z } from "zod";

/** Application workflow statuses (bound to one pm_residents person). */
export const APPLICATION_STATUSES = [
  "draft",
  "submitted",
  "incomplete",
  "screening_pending",
  "approved",
  "denied",
  "withdrawn"
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  incomplete: "Incomplete",
  screening_pending: "Screening Pending",
  approved: "Approved",
  denied: "Denied",
  withdrawn: "Withdrawn"
};

/** Screening is a workflow placeholder — provider integration is Sprint 2+. */
export const APPLICATION_SCREENING_STATUSES = [
  "not_started",
  "planned",
  "pending",
  "clear",
  "review",
  "fail"
] as const;
export type ApplicationScreeningStatus = (typeof APPLICATION_SCREENING_STATUSES)[number];

export const APPLICATION_SCREENING_STATUS_LABELS: Record<ApplicationScreeningStatus, string> = {
  not_started: "Not started",
  planned: "Integration planned",
  pending: "Pending results",
  clear: "Clear",
  review: "Needs review",
  fail: "Failed"
};

export const createApplicationInputSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(254),
  propertyId: z.string().uuid(),
  unitId: z.string().uuid().optional(),
  desiredMoveIn: z.string().date().optional(),
  notes: z.string().trim().max(2000).optional()
});
export type CreateApplicationInput = z.infer<typeof createApplicationInputSchema>;

export const createProspectInputSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(254),
  propertyId: z.string().uuid(),
  unitId: z.string().uuid().optional(),
  notes: z.string().trim().max(2000).optional()
});
export type CreateProspectInput = z.infer<typeof createProspectInputSchema>;

export const markApplicationIncompleteInputSchema = z.object({
  reason: z.string().trim().min(1).max(500)
});
export type MarkApplicationIncompleteInput = z.infer<typeof markApplicationIncompleteInputSchema>;

export const decideApplicationInputSchema = z.object({
  reason: z.string().trim().max(1000).optional()
});
export type DecideApplicationInput = z.infer<typeof decideApplicationInputSchema>;

/** Pipeline sections in the Property Manager Leasing workspace. */
export const LEASING_PIPELINE_SECTIONS = [
  "prospects",
  "applications",
  "approvals",
  "lease_signing",
  "move_ins",
  "renewals",
  "move_outs"
] as const;
export type LeasingPipelineSection = (typeof LEASING_PIPELINE_SECTIONS)[number];

export const LEASING_PIPELINE_SECTION_LABELS: Record<LeasingPipelineSection, string> = {
  prospects: "Prospects",
  applications: "Applications",
  approvals: "Approvals",
  lease_signing: "Lease Signing",
  move_ins: "Move-ins",
  renewals: "Renewals",
  move_outs: "Move-outs"
};
