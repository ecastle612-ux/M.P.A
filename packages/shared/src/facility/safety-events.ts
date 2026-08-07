export const FACILITY_SAFETY_EVENT_TYPES = [
  "facility.safety.incident_reported",
  "facility.safety.incident_triaged",
  "facility.safety.actions_open",
  "facility.safety.incident_closed"
] as const;

export type FacilitySafetyEventType = (typeof FACILITY_SAFETY_EVENT_TYPES)[number];
