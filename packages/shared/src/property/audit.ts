export const PROPERTY_AUDIT_ACTIONS = ["property.created", "property.activated"] as const;
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
  }
];

export function isPropertyAuditAction(value: string): value is PropertyAuditAction {
  return (PROPERTY_AUDIT_ACTIONS as readonly string[]).includes(value);
}
