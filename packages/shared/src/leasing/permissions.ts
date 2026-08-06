import { evaluateCapability, type PermissionCapability } from "../auth/permissions";

export const LEASING_CAPABILITIES = ["pm.leasing:read", "pm.leasing:write"] as const;
export type LeasingCapability = (typeof LEASING_CAPABILITIES)[number];

export const LEASING_CAPABILITY_DESCRIPTIONS: Record<LeasingCapability, string> = {
  "pm.leasing:read": "Read leases, signing status, and Leasing Command Center",
  "pm.leasing:write": "Create leases, send for signature, and activate the leasing lifecycle"
};

export function hasLeasingCapability(
  grantedCapabilities: readonly string[],
  required: LeasingCapability
): boolean {
  return evaluateCapability(grantedCapabilities, required as PermissionCapability);
}
