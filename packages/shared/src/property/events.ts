export const PROPERTY_EVENT_TYPES = ["property.created", "property.activated"] as const;
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
  }
];

export function isPropertyEventType(value: string): value is PropertyEventType {
  return (PROPERTY_EVENT_TYPES as readonly string[]).includes(value);
}
