export const RESIDENT_AUDIT_ACTIONS = [
  "resident.created",
  "resident.property_assigned",
  "resident.unit_assigned",
  "resident.portal_provisioned"
] as const;
export type ResidentAuditAction = (typeof RESIDENT_AUDIT_ACTIONS)[number];

export type ResidentAuditDefinition = {
  action: ResidentAuditAction;
  entityType: string;
  description: string;
};

export const RESIDENT_AUDIT_CATALOG: readonly ResidentAuditDefinition[] = [
  {
    action: "resident.created",
    entityType: "pm_residents",
    description: "Resident created via Residents path (J3)"
  },
  {
    action: "resident.property_assigned",
    entityType: "pm_residents",
    description: "Resident assigned to property"
  },
  {
    action: "resident.unit_assigned",
    entityType: "pm_residents",
    description: "Resident assigned to unit"
  },
  {
    action: "resident.portal_provisioned",
    entityType: "pm_residents",
    description: "Resident portal provisioned with activation status"
  }
];

export function isResidentAuditAction(value: string): value is ResidentAuditAction {
  return (RESIDENT_AUDIT_ACTIONS as readonly string[]).includes(value);
}
