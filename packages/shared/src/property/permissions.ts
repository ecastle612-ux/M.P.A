import { evaluateCapability, type PermissionCapability } from "../auth/permissions";

export const PROPERTY_CAPABILITIES = ["pm.properties:read", "pm.properties:write"] as const;
export type PropertyCapability = (typeof PROPERTY_CAPABILITIES)[number];

export const PROPERTY_CAPABILITY_DESCRIPTIONS: Record<PropertyCapability, string> = {
  "pm.properties:read": "Read portfolio properties, units, and Property Command Center",
  "pm.properties:write": "Create and activate portfolio properties and units"
};

export function hasPropertyCapability(
  grantedCapabilities: readonly string[],
  required: PropertyCapability
): boolean {
  return evaluateCapability(grantedCapabilities, required as PermissionCapability);
}
