export const FACILITY_PM_EVENT_TYPES = [
  "facility.pm_schedule.created",
  "facility.pm_schedule.activated",
  "facility.pm_schedule.paused",
  "facility.pm_schedule.resumed",
  "facility.pm_schedule.retired",
  "facility.pm_schedule.due",
  "facility.pm_schedule.generated_work",
  "facility.pm_schedule.acknowledged"
] as const;

export type FacilityPmEventType = (typeof FACILITY_PM_EVENT_TYPES)[number];
