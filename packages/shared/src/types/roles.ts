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

/**
 * Invite/role explanation for Organization Admins.
 * Presentation only — does not alter permissions or entitlements.
 */
export function toRoleDescription(role: UserRole | LaunchInviteRole): string {
  switch (role) {
    case "organization_admin":
      return "Full organization management — properties/sites, team access, and operational setup.";
    case "property_manager":
      return "Manages property operations — portfolio, residents, leasing, and maintenance coordination.";
    case "leasing_agent":
      return "Runs leasing pipeline — prospects, applications, and lease workflows.";
    case "maintenance_technician":
      return "Executes facility and maintenance work — assigned work orders through completion.";
    case "vendor":
      return "External service provider — progresses assigned work in the vendor portal.";
    case "tenant":
      return "Resident portal access — requests and resident-facing workflows only.";
    case "property_owner":
      return "Portfolio owner view — investment visibility without day-to-day admin control.";
    default:
      return "Organization role with access defined by platform permissions.";
  }
}

/**
 * Role-only home helper. Do not use as a staff `homeHref` when a SKU is known.
 * Staff post-auth entry must call `resolvePostAuthHome`.
 */
export function defaultHomeForRole(role: UserRole | null | undefined): string {
  switch (role) {
    case "organization_admin":
    case "property_manager":
      return "/pm/mission-control";
    case "leasing_agent":
      return "/pm/leasing";
    case "maintenance_technician":
      return "/facility/my-work";
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
