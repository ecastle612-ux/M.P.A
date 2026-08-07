export const FACILITY_SITE_AUDIT_ACTIONS = [
  "facility.site.created",
  "facility.site.activated",
  "facility.site.archived",
  "facility.site.updated"
] as const;

export type FacilitySiteAuditAction = (typeof FACILITY_SITE_AUDIT_ACTIONS)[number];

export const FACILITY_ASSET_AUDIT_ACTIONS = [
  "facility.asset.created",
  "facility.asset.activated",
  "facility.asset.in_repair",
  "facility.asset.returned_active",
  "facility.asset.decommissioned",
  "facility.asset.updated"
] as const;

export type FacilityAssetAuditAction = (typeof FACILITY_ASSET_AUDIT_ACTIONS)[number];

export const FACILITY_SYSTEM_AUDIT_ACTIONS = [
  "facility.system.created",
  "facility.system.status_changed",
  "facility.system.decommissioned",
  "facility.system.updated"
] as const;

export type FacilitySystemAuditAction = (typeof FACILITY_SYSTEM_AUDIT_ACTIONS)[number];
