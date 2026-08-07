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

export const FACILITY_PM_AUDIT_ACTIONS = [
  "facility.pm_schedule.created",
  "facility.pm_schedule.activated",
  "facility.pm_schedule.paused",
  "facility.pm_schedule.resumed",
  "facility.pm_schedule.retired",
  "facility.pm_schedule.generated_work",
  "facility.pm_schedule.acknowledged"
] as const;

export type FacilityPmAuditAction = (typeof FACILITY_PM_AUDIT_ACTIONS)[number];

export const FACILITY_INVENTORY_AUDIT_ACTIONS = [
  "facility.part.created",
  "facility.part.received",
  "facility.part.issued",
  "facility.part.returned",
  "facility.inventory.location_created",
  "facility.inventory.adjusted",
  "facility.inventory.thresholds_updated",
  "facility.inventory.stockout",
  "facility.inventory.low_stock"
] as const;

export type FacilityInventoryAuditAction = (typeof FACILITY_INVENTORY_AUDIT_ACTIONS)[number];

export const FACILITY_INSPECTION_AUDIT_ACTIONS = [
  "facility.inspection.program_created",
  "facility.inspection.program_activated",
  "facility.inspection.started",
  "facility.inspection.completed",
  "facility.inspection.failed",
  "facility.inspection.cancelled"
] as const;

export type FacilityInspectionAuditAction = (typeof FACILITY_INSPECTION_AUDIT_ACTIONS)[number];

export const FACILITY_SAFETY_AUDIT_ACTIONS = [
  "facility.safety.incident_reported",
  "facility.safety.incident_triaged",
  "facility.safety.actions_open",
  "facility.safety.incident_closed"
] as const;

export type FacilitySafetyAuditAction = (typeof FACILITY_SAFETY_AUDIT_ACTIONS)[number];

export const FACILITY_COMPLIANCE_AUDIT_ACTIONS = [
  "facility.compliance.obligation_created",
  "facility.compliance.obligation_due",
  "facility.compliance.obligation_overdue",
  "facility.compliance.satisfied",
  "facility.compliance.waived"
] as const;

export type FacilityComplianceAuditAction = (typeof FACILITY_COMPLIANCE_AUDIT_ACTIONS)[number];
