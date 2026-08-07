import { evaluateCapability, type PermissionCapability } from "../auth/permissions";

export const FACILITY_SITE_CAPABILITIES = ["facility.sites:read", "facility.sites:write"] as const;
export type FacilitySiteCapability = (typeof FACILITY_SITE_CAPABILITIES)[number];

export const FACILITY_ASSET_CAPABILITIES = ["facility.assets:read", "facility.assets:write"] as const;
export type FacilityAssetCapability = (typeof FACILITY_ASSET_CAPABILITIES)[number];

export const FACILITY_SYSTEM_CAPABILITIES = ["facility.systems:read", "facility.systems:write"] as const;
export type FacilitySystemCapability = (typeof FACILITY_SYSTEM_CAPABILITIES)[number];

export const FACILITY_CAPABILITIES = [
  ...FACILITY_SITE_CAPABILITIES,
  ...FACILITY_ASSET_CAPABILITIES,
  ...FACILITY_SYSTEM_CAPABILITIES
] as const;
export type FacilityCapability = (typeof FACILITY_CAPABILITIES)[number];

export const FACILITY_SITE_CAPABILITY_DESCRIPTIONS: Record<FacilitySiteCapability, string> = {
  "facility.sites:read": "Read Facility Sites, Overview, and Facility Mission Control",
  "facility.sites:write": "Create, update, activate, and archive Facility Sites"
};

export const FACILITY_ASSET_CAPABILITY_DESCRIPTIONS: Record<FacilityAssetCapability, string> = {
  "facility.assets:read": "Read facility assets, categories, and asset command centers",
  "facility.assets:write": "Create and manage facility assets and categories"
};

export const FACILITY_SYSTEM_CAPABILITY_DESCRIPTIONS: Record<FacilitySystemCapability, string> = {
  "facility.systems:read": "Read building systems and system command centers",
  "facility.systems:write": "Create and manage building systems and asset links"
};

export function hasFacilityCapability(
  grantedCapabilities: readonly string[],
  required: FacilityCapability
): boolean {
  return evaluateCapability(grantedCapabilities, required as PermissionCapability);
}

/** @deprecated Prefer hasFacilityCapability */
export function hasFacilitySiteCapability(
  grantedCapabilities: readonly string[],
  required: FacilitySiteCapability
): boolean {
  return hasFacilityCapability(grantedCapabilities, required);
}
