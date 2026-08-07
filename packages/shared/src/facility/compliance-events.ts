export const FACILITY_COMPLIANCE_EVENT_TYPES = [
  "facility.compliance.obligation_created",
  "facility.compliance.obligation_due",
  "facility.compliance.obligation_overdue",
  "facility.compliance.satisfied",
  "facility.compliance.waived"
] as const;

export type FacilityComplianceEventType = (typeof FACILITY_COMPLIANCE_EVENT_TYPES)[number];
