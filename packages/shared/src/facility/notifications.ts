export const FACILITY_NOTIFICATION_KEYS = [
  "facility.site.activated",
  "facility.asset.decommissioned",
  "facility.system.down",
  "facility.work_order.created",
  "facility.work_order.emergency",
  "facility.work_order.closed",
  "facility.pm_schedule.due",
  "facility.pm_schedule.overdue",
  "facility.pm_schedule.generated_work"
] as const;
export type FacilityNotificationKey = (typeof FACILITY_NOTIFICATION_KEYS)[number];
