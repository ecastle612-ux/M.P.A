/**
 * MAC-002 / Hybrid C — Platform Operator Mode vs Customer Surface Mode.
 *
 * Platform Master Admin is a breakglass capability (app_metadata only).
 * Customer surfaces require an explicit View As or Test Mode session.
 */

import type { PermissionCapability } from "@mpa/shared";

/** HQ / platform tools Master Admin may use without View As / Test Mode. */
export const PLATFORM_OPERATOR_CAPABILITIES = new Set<PermissionCapability | string>([
  "master_admin",
  "identity:read",
  "identity:update",
  "organization:read",
  "organization:switch",
  "organization:create",
  "organization:update",
  "profile:read",
  "profile:update",
  "navigation:access",
  "dashboard:read",
  "migration:read",
  "migration:create",
  "migration:update",
  "migration:delete",
  // Commercial / billing / settings tools used from Mission Control
  "financial:read",
  "financial:create",
  "financial:update",
  "property:read",
  "unit:read",
  "tenant:read",
  "lease:read",
  "maintenance:read",
  "document:read",
  "message:read",
  "notification:read"
]);

/** Routes that require Customer Surface Mode (View As or Test Mode). */
export const CUSTOMER_SURFACE_PATH_PREFIXES = [
  "/portal/tenant",
  "/portal/owner",
  "/portal/manager"
] as const;

export function isCustomerSurfacePath(pathname: string): boolean {
  return CUSTOMER_SURFACE_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function isPlatformOperatorCapability(capability: string): boolean {
  if (PLATFORM_OPERATOR_CAPABILITIES.has(capability)) return true;
  // Namespace wildcards used by some checks
  const ns = capability.split(":")[0];
  return PLATFORM_OPERATOR_CAPABILITIES.has(`${ns}:*`);
}
