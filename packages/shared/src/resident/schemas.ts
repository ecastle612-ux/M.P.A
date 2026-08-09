import { z } from "zod";

/**
 * Person lifecycle statuses — one pm_residents record; status changes only.
 * Phase 5 Sprint 1 extends J3 statuses with applicant / screening / approved / archived.
 */
export const RESIDENT_STATUSES = [
  "prospect",
  "applicant",
  "screening_pending",
  "approved",
  "pending_lease",
  "pending_move_in",
  "active",
  "former",
  "archived"
] as const;
export type ResidentStatus = (typeof RESIDENT_STATUSES)[number];

export const RESIDENT_STATUS_LABELS: Record<ResidentStatus, string> = {
  prospect: "Prospect",
  applicant: "Applicant",
  screening_pending: "Screening Pending",
  approved: "Approved",
  pending_lease: "Lease Pending",
  pending_move_in: "Pending Move-In",
  active: "Resident",
  former: "Former Resident",
  archived: "Archived"
};

/** Canonical leasing person path (status-only progression). */
export const PERSON_LIFECYCLE_PATH: readonly ResidentStatus[] = [
  "prospect",
  "applicant",
  "screening_pending",
  "approved",
  "pending_lease",
  "pending_move_in",
  "active",
  "former",
  "archived"
];

/** Portal provisioning before a signed lease stays Pending Activation. */
export const RESIDENT_PORTAL_STATUSES = ["pending_activation", "active", "disabled"] as const;
export type ResidentPortalStatus = (typeof RESIDENT_PORTAL_STATUSES)[number];

export const RESIDENT_PORTAL_STATUS_LABELS: Record<ResidentPortalStatus, string> = {
  pending_activation: "Pending Activation",
  active: "Active",
  disabled: "Disabled"
};

/** Launch-critical create — identity + property + unit only. */
export const createResidentInputSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(254),
  propertyId: z.string().uuid(),
  unitId: z.string().uuid()
});

export type CreateResidentInput = z.infer<typeof createResidentInputSchema>;

export function residentDisplayName(firstName: string, lastName: string): string {
  return `${firstName.trim()} ${lastName.trim()}`.replace(/\s+/g, " ").trim();
}
