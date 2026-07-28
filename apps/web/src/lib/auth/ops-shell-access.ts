import {
  isOperationsMembershipRole,
  isUserRole,
  primaryRoleByPriority,
  type UserRole
} from "@mpa/shared";

/**
 * Roles allowed to enter the Operations Center shell ((app) layout).
 * AUTH-001 Slice D: organization_admin, property_manager, leasing_agent, facility_technician.
 */
export const OPERATIONS_SHELL_MEMBERSHIP_ROLES = [
  "organization_admin",
  "property_manager",
  "leasing_agent",
  "facility_technician"
] as const;

const OPS_PATH_PREFIXES = [
  "/dashboard",
  "/inbox",
  "/activity",
  "/properties",
  "/units",
  "/tenants",
  "/leases",
  "/maintenance",
  "/vendors",
  "/communications",
  "/financials",
  "/ai-operations",
  "/settings",
  "/facility",
  "/applicants",
  "/residents",
  "/migration",
  "/setup",
  "/accounting",
  "/profile"
] as const;

/** Leasing Agent may use these Ops prefixes only (plus profile). */
const LEASING_ALLOWED_PREFIXES = [
  "/dashboard",
  "/inbox",
  "/activity",
  "/leases",
  "/applicants",
  "/residents",
  "/tenants",
  "/properties",
  "/units",
  "/communications",
  "/profile"
] as const;

/** Facility Technician may use these Ops prefixes only (plus profile). */
const TECHNICIAN_ALLOWED_PREFIXES = [
  "/dashboard",
  "/inbox",
  "/activity",
  "/maintenance",
  "/facility",
  "/properties",
  "/units",
  "/vendors",
  "/profile"
] as const;

export function flattenMembershipRoles(rows: Array<{ roles?: string[] | null } | null | undefined>): string[] {
  const roles = new Set<string>();
  for (const row of rows) {
    for (const role of row?.roles ?? []) {
      if (typeof role === "string" && role.length > 0) {
        roles.add(role);
      }
    }
  }
  return [...roles];
}

export function hasOperationsShellRole(roles: readonly string[]): boolean {
  return roles.some((role) => isOperationsMembershipRole(role));
}

/** Master Admin HQ may use (app) with masterAdminOnlyShell; portal-only roles may not. */
export function canAccessOperationsShell(roles: readonly string[], isMasterAdmin: boolean): boolean {
  return isMasterAdmin || hasOperationsShellRole(roles);
}

export type AssignedSurfaceOptions = {
  /** organizations.organization_type — drives Org Admin Owner vs Manager surface */
  organizationType?: string | null;
};

/**
 * Deterministic landing surface (AUTH-001 §07 — never user-selected).
 * Priority: Org Admin → PM → Leasing → Technician → Owner → Vendor → Tenant → master → unauthorized.
 */
export function assignedSurfaceHome(
  roles: readonly string[],
  isMasterAdmin: boolean,
  options?: AssignedSurfaceOptions
): string {
  const primary = primaryRoleByPriority(roles);

  if (primary === "organization_admin") {
    const orgType = (options?.organizationType ?? "").trim().toLowerCase();
    if (orgType === "property_owner" || orgType === "owner") {
      return "/portal/owner";
    }
    return "/dashboard";
  }
  if (primary === "property_manager") return "/dashboard";
  if (primary === "leasing_agent") return "/leases";
  if (primary === "facility_technician") return "/maintenance";
  if (primary === "property_owner" || roles.includes("property_owner")) return "/portal/owner";
  if (primary === "tenant" || roles.includes("tenant")) return "/portal/tenant";
  // Product correction: Vendor Portal retired — vendors use secure action links only.
  if (primary === "vendor" || roles.includes("vendor")) return "/vendor-access";
  if (isMasterAdmin) return "/master-admin";
  return "/unauthorized";
}

export function isOperationsShellPath(pathname: string): boolean {
  if (pathname.startsWith("/portal")) return false;
  if (pathname.startsWith("/master-admin")) return false;
  if (pathname.startsWith("/unauthorized")) return false;
  if (pathname.startsWith("/login")) return false;
  if (pathname.startsWith("/forgot-password")) return false;
  if (pathname.startsWith("/reset-password")) return false;
  if (pathname.startsWith("/accept-invitation")) return false;
  if (pathname.startsWith("/join")) return false;
  if (pathname.startsWith("/v/")) return false;
  if (pathname.startsWith("/vendor-access")) return false;

  return OPS_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function pathAllowed(pathname: string, prefixes: readonly string[]): boolean {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/**
 * Path-scoped Ops access for leasing / technician (full Ops for Org Admin + PM).
 * Master Admin bypasses path scoping.
 */
export function canAccessOperationsPath(
  pathname: string,
  roles: readonly string[],
  isMasterAdmin: boolean
): boolean {
  if (!isOperationsShellPath(pathname)) return true;
  if (isMasterAdmin) return true;
  if (roles.includes("organization_admin") || roles.includes("property_manager")) return true;

  if (roles.includes("leasing_agent") && pathAllowed(pathname, LEASING_ALLOWED_PREFIXES)) {
    return true;
  }
  if (roles.includes("facility_technician") && pathAllowed(pathname, TECHNICIAN_ALLOWED_PREFIXES)) {
    return true;
  }

  // Multi-role: if they have leasing AND tech, union of prefixes
  if (roles.includes("leasing_agent") || roles.includes("facility_technician")) {
    return false;
  }

  return hasOperationsShellRole(roles);
}

export function assertUserRoles(roles: readonly string[]): UserRole[] {
  return roles.filter((role): role is UserRole => isUserRole(role));
}
