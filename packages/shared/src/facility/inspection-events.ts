export const FACILITY_INSPECTION_EVENT_TYPES = [
  "facility.inspection.program_created",
  "facility.inspection.program_activated",
  "facility.inspection.started",
  "facility.inspection.completed",
  "facility.inspection.failed",
  "facility.inspection.cancelled"
] as const;

export type FacilityInspectionEventType = (typeof FACILITY_INSPECTION_EVENT_TYPES)[number];
