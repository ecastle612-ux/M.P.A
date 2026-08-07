export const FACILITY_NOTIFICATION_KEYS = ["facility.site.activated"] as const;
export type FacilityNotificationKey = (typeof FACILITY_NOTIFICATION_KEYS)[number];
