export const FACILITY_NOTIFICATION_KEYS = [
  "facility.site.activated",
  "facility.asset.decommissioned",
  "facility.system.down"
] as const;
export type FacilityNotificationKey = (typeof FACILITY_NOTIFICATION_KEYS)[number];
