import type { UserRole } from "@mpa/shared";

/**
 * AUTH-001 Slice D — assignable membership role catalog (internal assignment / invite).
 * master_admin is never a membership role.
 */
export const ASSIGNABLE_MEMBERSHIP_ROLES: readonly UserRole[] = [
  "organization_admin",
  "property_manager",
  "leasing_agent",
  "facility_technician",
  "property_owner",
  "tenant",
  "vendor"
] as const;

export const SLICE_D_CERTIFICATION_ROLES: readonly UserRole[] = [
  "organization_admin",
  "leasing_agent",
  "facility_technician"
] as const;

export function isAssignableMembershipRole(role: string): role is UserRole {
  return (ASSIGNABLE_MEMBERSHIP_ROLES as readonly string[]).includes(role);
}
