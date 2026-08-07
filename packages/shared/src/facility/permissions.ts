import { evaluateCapability, type PermissionCapability } from "../auth/permissions";

export const FACILITY_SITE_CAPABILITIES = ["facility.sites:read", "facility.sites:write"] as const;
export type FacilitySiteCapability = (typeof FACILITY_SITE_CAPABILITIES)[number];

export const FACILITY_SITE_CAPABILITY_DESCRIPTIONS: Record<FacilitySiteCapability, string> = {
  "facility.sites:read": "Read Facility Sites, Overview, and Facility Mission Control",
  "facility.sites:write": "Create, update, activate, and archive Facility Sites"
};

export function hasFacilitySiteCapability(
  grantedCapabilities: readonly string[],
  required: FacilitySiteCapability
): boolean {
  return evaluateCapability(grantedCapabilities, required as PermissionCapability);
}
