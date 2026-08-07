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

/** Shared WO audit actions used with facility product_context payloads. */
export const FACILITY_OPERATIONS_AUDIT_ACTIONS = [
  "work_order.created",
  "work_order.triaged",
  "work_order.assigned",
  "work_order.started",
  "work_order.progressed",
  "work_order.completed",
  "work_order.closed",
  "work_order.cancelled"
] as const;

export type FacilityOperationsAuditAction = (typeof FACILITY_OPERATIONS_AUDIT_ACTIONS)[number];
