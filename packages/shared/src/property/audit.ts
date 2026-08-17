export const PROPERTY_AUDIT_ACTIONS = [
  "property.created",
  "property.activated",
  "unit.created",
  "unit.updated",
  "unit.archived"
] as const;
export type PropertyAuditAction = (typeof PROPERTY_AUDIT_ACTIONS)[number];

export type PropertyAuditDefinition = {
  action: PropertyAuditAction;
  entityType: string;
  description: string;
};

export const PROPERTY_AUDIT_CATALOG: readonly PropertyAuditDefinition[] = [
  {
    action: "property.created",
    entityType: "property_properties",
    description: "Property created via Properties portfolio path (J1)"
  },
  {
    action: "property.activated",
    entityType: "property_properties",
    description: "Property activated for immediate operations"
  },
  {
    action: "unit.created",
    entityType: "property_units",
    description: "Unit created on an existing property"
  },
  {
    action: "unit.updated",
    entityType: "property_units",
    description: "Unit label or status updated"
  },
  {
    action: "unit.archived",
    entityType: "property_units",
    description: "Unit archived to offline status"
  }
];

export function isPropertyAuditAction(value: string): value is PropertyAuditAction {
  return (PROPERTY_AUDIT_ACTIONS as readonly string[]).includes(value);
}
