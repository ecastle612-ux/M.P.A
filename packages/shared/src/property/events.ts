export const PROPERTY_EVENT_TYPES = [
  "property.created",
  "property.activated",
  "unit.created",
  "unit.updated",
  "unit.archived"
] as const;
export type PropertyEventType = (typeof PROPERTY_EVENT_TYPES)[number];

export type PropertyEventDefinition = {
  type: PropertyEventType;
  aggregateType: string;
  description: string;
  auditAction: string;
};

export const PROPERTY_EVENT_CATALOG: readonly PropertyEventDefinition[] = [
  {
    type: "property.created",
    aggregateType: "property_properties",
    description: "Portfolio property created and activated for the organization",
    auditAction: "property.created"
  },
  {
    type: "property.activated",
    aggregateType: "property_properties",
    description: "Property marked active for operations",
    auditAction: "property.activated"
  },
  {
    type: "unit.created",
    aggregateType: "property_properties",
    description: "Unit added to an existing portfolio property",
    auditAction: "unit.created"
  },
  {
    type: "unit.updated",
    aggregateType: "property_properties",
    description: "Unit label or operational status updated",
    auditAction: "unit.updated"
  },
  {
    type: "unit.archived",
    aggregateType: "property_properties",
    description: "Unit archived to offline (not available for assignment)",
    auditAction: "unit.archived"
  }
];

export function isPropertyEventType(value: string): value is PropertyEventType {
  return (PROPERTY_EVENT_TYPES as readonly string[]).includes(value);
}
