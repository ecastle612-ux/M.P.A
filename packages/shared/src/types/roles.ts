export const USER_ROLES = [
  "organization_admin",
  "property_manager",
  "leasing_agent",
  "maintenance_technician",
  "property_owner",
  "tenant",
  "vendor"
] as const;

export type UserRole = (typeof USER_ROLES)[number];

/** Roles offered in the LAUNCH-001 J2 invite experience. */
export const LAUNCH_INVITE_ROLES = [
  "organization_admin",
  "property_manager",
  "leasing_agent",
  "maintenance_technician",
  "vendor",
  "property_owner"
] as const;

export type LaunchInviteRole = (typeof LAUNCH_INVITE_ROLES)[number];

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && (USER_ROLES as readonly string[]).includes(value);
}

export function isLaunchInviteRole(value: unknown): value is LaunchInviteRole {
  return typeof value === "string" && (LAUNCH_INVITE_ROLES as readonly string[]).includes(value);
}

export function toRoleLabel(role: UserRole): string {
  switch (role) {
    case "organization_admin":
      return "Organization Admin";
    case "property_manager":
      return "Property Manager";
    case "leasing_agent":
      return "Leasing Agent";
    case "maintenance_technician":
      return "Maintenance Technician";
    case "tenant":
      return "Tenant";
    case "property_owner":
      return "Owner";
    case "vendor":
      return "Vendor";
    default:
      return "Unknown";
  }
}

/** Post-accept workspace home for a primary role. */
export function defaultHomeForRole(role: UserRole | null | undefined): string {
  switch (role) {
    case "organization_admin":
    case "property_manager":
      return "/pm/mission-control";
    case "leasing_agent":
      return "/pm/leasing";
    case "maintenance_technician":
      return "/pm/maintenance";
    case "property_owner":
      return "/portal/owner";
    case "vendor":
      return "/portal/vendor";
    case "tenant":
      return "/portal/tenant";
    default:
      return "/dashboard";
  }
}

export function primaryRole(roles: readonly UserRole[]): UserRole | null {
  const priority: UserRole[] = [
    "organization_admin",
    "property_manager",
    "leasing_agent",
    "maintenance_technician",
    "property_owner",
    "vendor",
    "tenant"
  ];
  for (const role of priority) {
    if (roles.includes(role)) {
      return role;
    }
  }
  return roles[0] ?? null;
}
