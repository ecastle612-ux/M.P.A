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
  "authorization:manage",
  "dashboard:read",
  "property:create",
  "property:read",
  "property:update",
  "property:archive",
  "property:delete",
  "unit:create",
  "unit:read",
  "unit:update",
  "unit:archive",
  "unit:delete",
  "tenant:create",
  "tenant:read",
  "tenant:update",
  "tenant:archive",
  "tenant:delete",
  "maintenance:create",
  "maintenance:read",
  "maintenance:update",
  "maintenance:assign",
  "maintenance:archive",
  "maintenance:delete",
  "vendor:create",
  "vendor:read",
  "vendor:update",
  "vendor:archive",
  "vendor:delete",
  "vendor:assign",
  "lease:create",
  "lease:read",
  "lease:update",
  "lease:archive",
  "lease:delete"
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
