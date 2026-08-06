export const RESIDENT_EVENT_TYPES = [
  "resident.created",
  "resident.property_assigned",
  "resident.unit_assigned",
  "resident.portal_provisioned"
] as const;
export type ResidentEventType = (typeof RESIDENT_EVENT_TYPES)[number];

export type ResidentEventDefinition = {
  type: ResidentEventType;
  aggregateType: string;
  description: string;
  auditAction: string;
};

export const RESIDENT_EVENT_CATALOG: readonly ResidentEventDefinition[] = [
  {
    type: "resident.created",
    aggregateType: "pm_residents",
    description: "Resident operational record created",
    auditAction: "resident.created"
  },
  {
    type: "resident.property_assigned",
    aggregateType: "pm_residents",
    description: "Resident assigned to a property",
    auditAction: "resident.property_assigned"
  },
  {
    type: "resident.unit_assigned",
    aggregateType: "pm_residents",
    description: "Resident assigned to a unit",
    auditAction: "resident.unit_assigned"
  },
  {
    type: "resident.portal_provisioned",
    aggregateType: "pm_residents",
    description: "Resident portal record provisioned (may be Pending Activation)",
    auditAction: "resident.portal_provisioned"
  }
];

export function isResidentEventType(value: string): value is ResidentEventType {
  return (RESIDENT_EVENT_TYPES as readonly string[]).includes(value);
}
