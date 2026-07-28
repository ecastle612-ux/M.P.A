export const USER_ROLES = [
  "organization_admin",
  "property_manager",
  "leasing_agent",
  "facility_technician",
  "tenant",
  "property_owner",
  "vendor"
] as const;

export type UserRole = (typeof USER_ROLES)[number];

/** Roles that enter the Operations Center shell (AUTH-001 Slice D). */
export const OPERATIONS_MEMBERSHIP_ROLES = [
  "organization_admin",
  "property_manager",
  "leasing_agent",
  "facility_technician"
] as const;

export type OperationsMembershipRole = (typeof OPERATIONS_MEMBERSHIP_ROLES)[number];

/** Roles that require property-scope assignment (fail closed when empty). */
export const PROPERTY_SCOPED_ROLES = ["leasing_agent", "facility_technician"] as const;

export type PropertyScopedRole = (typeof PROPERTY_SCOPED_ROLES)[number];

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && (USER_ROLES as readonly string[]).includes(value);
}

export function isOperationsMembershipRole(value: unknown): value is OperationsMembershipRole {
  return typeof value === "string" && (OPERATIONS_MEMBERSHIP_ROLES as readonly string[]).includes(value);
}

export function isPropertyScopedRole(value: unknown): value is PropertyScopedRole {
  return typeof value === "string" && (PROPERTY_SCOPED_ROLES as readonly string[]).includes(value);
}

export function toRoleLabel(role: UserRole): string {
  switch (role) {
    case "organization_admin":
      return "Organization Administrator";
    case "property_manager":
      return "Property Manager";
    case "leasing_agent":
      return "Leasing Agent";
    case "facility_technician":
      return "Facility Technician";
    case "tenant":
      return "Tenant";
    case "property_owner":
      return "Property Owner";
    case "vendor":
      return "Vendor";
    default:
      return "Unknown";
  }
}

/**
 * AUTH-001 §07 role priority for multi-role memberships (highest first).
 */
export const ROLE_SURFACE_PRIORITY: readonly UserRole[] = [
  "organization_admin",
  "property_manager",
  "leasing_agent",
  "facility_technician",
  "property_owner",
  "vendor",
  "tenant"
] as const;

export function primaryRoleByPriority(roles: readonly string[]): UserRole | null {
  for (const candidate of ROLE_SURFACE_PRIORITY) {
    if (roles.includes(candidate)) return candidate;
  }
  return null;
}
