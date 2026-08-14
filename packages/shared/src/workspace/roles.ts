import type { UserRole } from "../types/roles";

/** Staff who may enter the Operational Workspace (Documents + Tables). */
export const WORKSPACE_STAFF_ROLES = [
  "organization_admin",
  "property_manager",
  "leasing_agent",
  "maintenance_technician"
] as const satisfies readonly UserRole[];

/** Staff who may create, edit, export-administer, and connect tables. */
export const WORKSPACE_MANAGER_ROLES = [
  "organization_admin",
  "property_manager",
  "leasing_agent"
] as const satisfies readonly UserRole[];

export const WORKSPACE_DENIED_ROLES = ["tenant", "vendor", "property_owner"] as const satisfies readonly UserRole[];

export function isWorkspaceStaffRole(role: string): boolean {
  return (WORKSPACE_STAFF_ROLES as readonly string[]).includes(role);
}

export function isWorkspaceManagerRole(role: string): boolean {
  return (WORKSPACE_MANAGER_ROLES as readonly string[]).includes(role);
}

export function hasWorkspaceStaffRole(roles: readonly string[]): boolean {
  return roles.some((role) => isWorkspaceStaffRole(role));
}

export function hasWorkspaceManagerRole(roles: readonly string[]): boolean {
  return roles.some((role) => isWorkspaceManagerRole(role));
}

export function isWorkspaceDeniedRole(role: string): boolean {
  return (WORKSPACE_DENIED_ROLES as readonly string[]).includes(role);
}
