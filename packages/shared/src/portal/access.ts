import { isUserRole, type UserRole } from "../types/roles";

export const PORTAL_ACCESS_ROLES = ["tenant", "vendor"] as const;
export type PortalAccessRole = (typeof PORTAL_ACCESS_ROLES)[number];

export function isPortalAccessRole(value: unknown): value is PortalAccessRole {
  return typeof value === "string" && (PORTAL_ACCESS_ROLES as readonly string[]).includes(value);
}

/** Merge an existing membership role set with a required portal role (idempotent). */
export function mergeRolesWithPortalRole(
  existing: readonly unknown[],
  portalRole: PortalAccessRole
): UserRole[] {
  const roles = existing.filter(isUserRole);
  if (!roles.includes(portalRole)) {
    roles.push(portalRole);
  }
  return roles;
}

export function membershipHasPortalRole(
  roles: readonly unknown[],
  portalRole: PortalAccessRole
): boolean {
  return roles.filter(isUserRole).includes(portalRole);
}
