import { evaluateCapability, type PermissionCapability } from "../auth/permissions";

export const COMMUNICATIONS_CAPABILITIES = [
  "platform.communications:read",
  "platform.communications:write"
] as const;

export type CommunicationsCapability = (typeof COMMUNICATIONS_CAPABILITIES)[number];

export function hasCommunicationsCapability(
  grantedCapabilities: readonly string[],
  required: CommunicationsCapability
): boolean {
  return evaluateCapability(grantedCapabilities, required as PermissionCapability);
}
