import { z } from "zod";

/** Launch lifecycle statuses — driven by workflow, not free-form labels. */
export const RESIDENT_STATUSES = [
  "prospect",
  "pending_lease",
  "pending_move_in",
  "active",
  "former"
] as const;
export type ResidentStatus = (typeof RESIDENT_STATUSES)[number];

export const RESIDENT_STATUS_LABELS: Record<ResidentStatus, string> = {
  prospect: "Prospect",
  pending_lease: "Pending Lease",
  pending_move_in: "Pending Move-In",
  active: "Active Resident",
  former: "Former Resident"
};

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
