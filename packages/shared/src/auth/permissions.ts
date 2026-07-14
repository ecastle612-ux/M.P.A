export const FOUNDATION_CAPABILITIES = [
  "identity:read",
  "organization:create",
  "organization:read",
  "organization:switch",
  "invitation:create",
  "invitation:read",
  "membership:read",
  "membership:update",
  "profile:read",
  "profile:update",
  "navigation:access",
  "authorization:manage"
] as const;

export type PermissionCapability = (typeof FOUNDATION_CAPABILITIES)[number] | `${string}:${string}`;

export function evaluateCapability(
  grantedCapabilities: readonly string[],
  requiredCapability: PermissionCapability
): boolean {
  if (grantedCapabilities.includes(requiredCapability)) {
    return true;
  }
  const [requiredNamespace] = requiredCapability.split(":");
  return grantedCapabilities.includes(`${requiredNamespace}:*`);
}
