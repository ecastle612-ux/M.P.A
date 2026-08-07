import { evaluateCapability, type PermissionCapability } from "../auth/permissions";

export const FACILITY_SITE_CAPABILITIES = ["facility.sites:read", "facility.sites:write"] as const;
export type FacilitySiteCapability = (typeof FACILITY_SITE_CAPABILITIES)[number];

export const FACILITY_ASSET_CAPABILITIES = ["facility.assets:read", "facility.assets:write"] as const;
export type FacilityAssetCapability = (typeof FACILITY_ASSET_CAPABILITIES)[number];

export const FACILITY_SYSTEM_CAPABILITIES = ["facility.systems:read", "facility.systems:write"] as const;
export type FacilitySystemCapability = (typeof FACILITY_SYSTEM_CAPABILITIES)[number];

export const FACILITY_OPERATIONS_CAPABILITIES = [
  "facility.operations:read",
  "facility.operations:write",
  "facility.operations:assign"
] as const;
export type FacilityOperationsCapability = (typeof FACILITY_OPERATIONS_CAPABILITIES)[number];

export const FACILITY_PREVENTIVE_CAPABILITIES = [
  "facility.preventive:read",
  "facility.preventive:write"
] as const;
export type FacilityPreventiveCapability = (typeof FACILITY_PREVENTIVE_CAPABILITIES)[number];

export const FACILITY_PARTS_CAPABILITIES = ["facility.parts:read", "facility.parts:write"] as const;
export type FacilityPartsCapability = (typeof FACILITY_PARTS_CAPABILITIES)[number];

export const FACILITY_INVENTORY_CAPABILITIES = [
  "facility.inventory:read",
  "facility.inventory:write"
] as const;
export type FacilityInventoryCapability = (typeof FACILITY_INVENTORY_CAPABILITIES)[number];

export const FACILITY_CAPABILITIES = [
  ...FACILITY_SITE_CAPABILITIES,
  ...FACILITY_ASSET_CAPABILITIES,
  ...FACILITY_SYSTEM_CAPABILITIES,
  ...FACILITY_OPERATIONS_CAPABILITIES,
  ...FACILITY_PREVENTIVE_CAPABILITIES,
  ...FACILITY_PARTS_CAPABILITIES,
  ...FACILITY_INVENTORY_CAPABILITIES
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

export const FACILITY_OPERATIONS_CAPABILITY_DESCRIPTIONS: Record<
  FacilityOperationsCapability,
  string
> = {
  "facility.operations:read": "Read Facility Operations corrective work queue",
  "facility.operations:write": "Create facility corrective work and record progress",
  "facility.operations:assign": "Prioritize and assign facility corrective work"
};

export const FACILITY_PREVENTIVE_CAPABILITY_DESCRIPTIONS: Record<
  FacilityPreventiveCapability,
  string
> = {
  "facility.preventive:read": "Read preventive maintenance programs and schedules",
  "facility.preventive:write": "Create and manage preventive maintenance programs"
};

export const FACILITY_PARTS_CAPABILITY_DESCRIPTIONS: Record<FacilityPartsCapability, string> = {
  "facility.parts:read": "Read parts catalog and compatibility",
  "facility.parts:write": "Create and manage parts catalog"
};

export const FACILITY_INVENTORY_CAPABILITY_DESCRIPTIONS: Record<
  FacilityInventoryCapability,
  string
> = {
  "facility.inventory:read": "Read inventory locations, stock, and movements",
  "facility.inventory:write": "Receive, issue, adjust, and return inventory"
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
