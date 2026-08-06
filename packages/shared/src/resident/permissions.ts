import { evaluateCapability, type PermissionCapability } from "../auth/permissions";

export const RESIDENT_CAPABILITIES = ["pm.residents:read", "pm.residents:write"] as const;
export type ResidentCapability = (typeof RESIDENT_CAPABILITIES)[number];

export const RESIDENT_CAPABILITY_DESCRIPTIONS: Record<ResidentCapability, string> = {
  "pm.residents:read": "Read resident directory, profiles, and Resident Command Center",
  "pm.residents:write": "Create residents and assign them to properties and units"
};

export function hasResidentCapability(
  grantedCapabilities: readonly string[],
  required: ResidentCapability
): boolean {
  return evaluateCapability(grantedCapabilities, required as PermissionCapability);
}
