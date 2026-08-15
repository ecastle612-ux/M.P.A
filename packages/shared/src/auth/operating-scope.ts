import {
  FACILITY_ENTITLEMENTS,
  FUTURE_FACILITY_ENTITLEMENTS,
  PROPERTY_MANAGER_ENTITLEMENTS,
  entitlementsForSku,
  type EntitlementKey
} from "../commercial/entitlements";
import { skuIncludesFacilityOperations, skuIncludesPropertyManager, type ProductSku } from "../commercial/skus";
import type { WorkSurface } from "../maintenance/schemas";
import type { UserRole } from "../types/roles";

export const MEMBER_OPERATING_SCOPES = ["property_operations", "facility_operations", "both"] as const;
export type MemberOperatingScope = (typeof MEMBER_OPERATING_SCOPES)[number];

export type OperatingSurface = "property" | "facility";

const BOOTSTRAP_ENTITLEMENTS = [
  "platform.org",
  "platform.guided_setup",
  "platform.billing_self",
  "platform.launcher"
] as const satisfies readonly EntitlementKey[];

const PORTAL_ROLES = new Set(["tenant", "vendor", "property_owner"]);

export function isMemberOperatingScope(value: unknown): value is MemberOperatingScope {
  return typeof value === "string" && (MEMBER_OPERATING_SCOPES as readonly string[]).includes(value);
}

export function toOperatingScopeLabel(scope: MemberOperatingScope): string {
  switch (scope) {
    case "property_operations":
      return "Property Operations";
    case "facility_operations":
      return "Facility Operations";
    case "both":
      return "Both";
    default:
      return "Both";
  }
}

export function isPortalOnlyRoles(roles: readonly string[]): boolean {
  const staff = roles.some(
    (role) =>
      role === "organization_admin" ||
      role === "property_manager" ||
      role === "leasing_agent" ||
      role === "maintenance_technician"
  );
  return !staff && roles.some((role) => PORTAL_ROLES.has(role));
}

/** SKU outer boundary. Single-product orgs always have exactly one surface. */
export function skuSurfaces(sku: ProductSku | null | undefined): ReadonlySet<OperatingSurface> {
  const surfaces = new Set<OperatingSurface>();
  if (sku && skuIncludesPropertyManager(sku)) {
    surfaces.add("property");
  }
  if (sku && skuIncludesFacilityOperations(sku)) {
    surfaces.add("facility");
  }
  return surfaces;
}

export function scopeSurfaces(scope: MemberOperatingScope): ReadonlySet<OperatingSurface> {
  if (scope === "property_operations") {
    return new Set<OperatingSurface>(["property"]);
  }
  if (scope === "facility_operations") {
    return new Set<OperatingSurface>(["facility"]);
  }
  return new Set<OperatingSurface>(["property", "facility"]);
}

/**
 * Existing-membership defaults (docs/127 §16).
 * Complete non-admin staff default to both (compatibility) when unassigned.
 */
/** Explicit stored value for a newly created staff membership (not invite-time Complete). */
export function storedScopeForNewMembership(sku: ProductSku | null | undefined): MemberOperatingScope | null {
  if (sku === "mpa_property_manager") {
    return "property_operations";
  }
  if (sku === "mpa_facility_operations") {
    return "facility_operations";
  }
  if (sku === "mpa_complete_platform") {
    return "both";
  }
  return null;
}

export function compatibilityDefaultScope(
  sku: ProductSku | null | undefined,
  roles: readonly string[]
): MemberOperatingScope | null {
  if (!sku || isPortalOnlyRoles(roles)) {
    return null;
  }
  if (sku === "mpa_property_manager") {
    return "property_operations";
  }
  if (sku === "mpa_facility_operations") {
    return "facility_operations";
  }
  return "both";
}

export function resolveMemberOperatingScope(input: {
  sku: ProductSku | null | undefined;
  roles?: readonly string[] | undefined;
  storedScope?: MemberOperatingScope | null | undefined;
}): MemberOperatingScope | null {
  const roles = input.roles ?? [];
  if (isPortalOnlyRoles(roles)) {
    return null;
  }
  if (input.storedScope) {
    return input.storedScope;
  }
  return compatibilityDefaultScope(input.sku ?? null, roles);
}

/**
 * Effective surfaces: SKU always wins.
 * PM/FO ignore stored scope (cannot expand or shrink the purchased product).
 * Complete intersects stored/compat scope with the Complete union.
 */
export function effectiveSurfaces(input: {
  sku: ProductSku | null | undefined;
  roles?: readonly string[] | undefined;
  storedScope?: MemberOperatingScope | null | undefined;
}): ReadonlySet<OperatingSurface> {
  const purchased = skuSurfaces(input.sku);
  if (purchased.size === 0) {
    return purchased;
  }
  if (input.sku !== "mpa_complete_platform") {
    return purchased;
  }
  const scope = resolveMemberOperatingScope(input);
  if (!scope) {
    return purchased;
  }
  const allowed = scopeSurfaces(scope);
  return new Set<OperatingSurface>([...purchased].filter((surface) => allowed.has(surface)));
}

export function entitlementProductFamily(entitlement: string): OperatingSurface | "platform" {
  if ((PROPERTY_MANAGER_ENTITLEMENTS as readonly string[]).includes(entitlement) || entitlement.startsWith("pm.")) {
    return "property";
  }
  if (
    (FACILITY_ENTITLEMENTS as readonly string[]).includes(entitlement) ||
    (FUTURE_FACILITY_ENTITLEMENTS as readonly string[]).includes(entitlement) ||
    entitlement.startsWith("facility.")
  ) {
    return "facility";
  }
  return "platform";
}

export function entitlementsForMember(input: {
  sku: ProductSku | null | undefined;
  roles?: readonly string[] | undefined;
  storedScope?: MemberOperatingScope | null | undefined;
}): EntitlementKey[] {
  const skuEntitlements = input.sku ? entitlementsForSku(input.sku) : [...BOOTSTRAP_ENTITLEMENTS];
  const surfaces = effectiveSurfaces(input);
  return skuEntitlements.filter((entitlement) => {
    const family = entitlementProductFamily(entitlement);
    if (family === "platform") {
      return true;
    }
    return surfaces.has(family);
  });
}

export function memberAllowsWorkSurface(input: {
  sku: ProductSku | null | undefined;
  roles?: readonly string[] | undefined;
  storedScope?: MemberOperatingScope | null | undefined;
  surface: WorkSurface;
}): boolean {
  const surfaces = effectiveSurfaces(input);
  if (input.surface === "residential") {
    return surfaces.has("property");
  }
  return surfaces.has("facility");
}

export function roleAllowsOperatingScope(role: UserRole | string, scope: MemberOperatingScope): boolean {
  if (role === "tenant" || role === "vendor" || role === "property_owner") {
    return false;
  }
  if (role === "leasing_agent") {
    return scope === "property_operations";
  }
  return true;
}

export function validateInviteOperatingScope(input: {
  sku: ProductSku | null | undefined;
  roles: readonly string[];
  storedScope: MemberOperatingScope | null | undefined;
}): { ok: true; scope: MemberOperatingScope | null } | { ok: false; error: string } {
  const staffRoles = input.roles.filter(
    (role) =>
      role === "organization_admin" ||
      role === "property_manager" ||
      role === "leasing_agent" ||
      role === "maintenance_technician"
  );
  const portalOnly = isPortalOnlyRoles(input.roles);

  if (portalOnly || staffRoles.length === 0) {
    return { ok: true, scope: null };
  }

  if (input.sku === "mpa_property_manager") {
    return { ok: true, scope: "property_operations" };
  }
  if (input.sku === "mpa_facility_operations") {
    return { ok: true, scope: "facility_operations" };
  }

  if (input.sku === "mpa_complete_platform") {
    if (!input.storedScope) {
      return { ok: false, error: "Choose an operational responsibility." };
    }
    for (const role of staffRoles) {
      if (!roleAllowsOperatingScope(role, input.storedScope)) {
        return { ok: false, error: "Leasing Agent can only operate Property Operations." };
      }
    }
    return { ok: true, scope: input.storedScope };
  }

  return { ok: true, scope: input.storedScope ?? null };
}

export function derivedOperatingPositionLabel(input: {
  role: UserRole | string | null;
  scope: MemberOperatingScope | null;
  sku?: ProductSku | null;
}): string {
  const role = input.role;
  const scope = input.scope;
  if (!role) {
    return "Team member";
  }
  if (input.sku === "mpa_facility_operations") {
    if (role === "property_manager") {
      return "Facility Manager";
    }
    if (role === "maintenance_technician") {
      return "Facility Technician";
    }
  }
  if (role === "organization_admin") {
    if (scope === "property_operations") {
      return "Organization Admin (Property Operations)";
    }
    if (scope === "facility_operations") {
      return "Organization Admin (Facility Operations)";
    }
    return "Organization Admin";
  }
  if (role === "property_manager") {
    if (scope === "facility_operations") {
      return "Facility Operations Manager";
    }
    if (scope === "both") {
      return "Operations Manager (Both)";
    }
    return "Property Operations Manager";
  }
  if (role === "maintenance_technician") {
    if (scope === "facility_operations") {
      return "Facility Technician";
    }
    return "Maintenance Technician";
  }
  if (role === "leasing_agent") {
    return "Leasing Agent";
  }
  if (role === "property_owner") {
    return "Owner";
  }
  if (role === "tenant") {
    return "Tenant";
  }
  if (role === "vendor") {
    return "Vendor";
  }
  return "Team member";
}

export function wouldLeaveCompleteWithoutBothAdmin(input: {
  sku: ProductSku | null | undefined;
  admins: ReadonlyArray<{
    id: string;
    roles: readonly string[];
    storedScope?: MemberOperatingScope | null;
    status?: string;
  }>;
  targetMembershipId: string;
  nextScope: MemberOperatingScope | null;
  nextStatus?: "active" | "inactive";
  nextRoles?: readonly string[];
  removed?: boolean;
}): boolean {
  if (input.sku !== "mpa_complete_platform") {
    return false;
  }
  const remaining = input.admins.filter((admin) => {
    if (admin.id === input.targetMembershipId && input.removed) {
      return false;
    }
    const roles = admin.id === input.targetMembershipId ? (input.nextRoles ?? admin.roles) : admin.roles;
    if (!roles.includes("organization_admin")) {
      return false;
    }
    const status = admin.id === input.targetMembershipId ? (input.nextStatus ?? "active") : (admin.status ?? "active");
    if (status !== "active") {
      return false;
    }
    const stored = admin.id === input.targetMembershipId ? input.nextScope : admin.storedScope;
    const effective = resolveMemberOperatingScope({
      sku: input.sku,
      roles,
      storedScope: stored ?? null
    });
    return effective === "both";
  });
  return remaining.length === 0;
}

/**
 * Complete inviter grant cap (docs/127 §6, docs/135).
 * Evaluated from the inviter's membership, not the request's self-description.
 */
export function inviterMayGrantInvitation(input: {
  sku: ProductSku | null | undefined;
  inviterRoles: readonly string[];
  inviterStoredScope?: MemberOperatingScope | null;
  grantRoles: readonly string[];
  grantScope: MemberOperatingScope | null;
}): { ok: true } | { ok: false; error: string } {
  if (input.grantRoles.includes("organization_admin") && !input.inviterRoles.includes("organization_admin")) {
    return { ok: false, error: "Only an Organization Admin can invite another Organization Admin." };
  }

  if (!input.grantScope || input.sku !== "mpa_complete_platform") {
    return { ok: true };
  }

  const inviterEffective = resolveMemberOperatingScope({
    sku: input.sku,
    roles: input.inviterRoles,
    storedScope: input.inviterStoredScope ?? null
  });

  if (inviterEffective === "both") {
    return { ok: true };
  }

  if (input.grantScope === "both" || input.grantScope !== inviterEffective) {
    return { ok: false, error: "You can only assign operational responsibility you hold." };
  }

  return { ok: true };
}
