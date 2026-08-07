export const FACILITY_SITE_AUDIT_ACTIONS = [
  "facility.site.created",
  "facility.site.activated",
  "facility.site.archived",
  "facility.site.updated"
] as const;

export type FacilitySiteAuditAction = (typeof FACILITY_SITE_AUDIT_ACTIONS)[number];
