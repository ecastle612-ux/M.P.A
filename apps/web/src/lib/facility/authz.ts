import type { NextResponse } from "next/server";
import type { EntitlementKey, PermissionCapability, UserRole } from "@mpa/shared";
import { FACILITY_ASSET_READ_ROLES, FACILITY_MANAGER_ROLES } from "@mpa/shared";
import { requireAuthorizedAction } from "../auth/require-authorized-action";

/**
 * Facility Operations API gate (STAB-004 + ADR-026).
 * Fail closed: unauthenticated → 401; missing membership/capability/entitlement → 403.
 */
export async function requireFacilityOperation(
  capability: PermissionCapability,
  facilityEntitlement: EntitlementKey
) {
  return requireAuthorizedAction({
    capability,
    entitlement: facilityEntitlement
  });
}

export type FacilityAuthz = Exclude<
  Awaited<ReturnType<typeof requireFacilityOperation>>,
  { error: NextResponse }
>;

export async function requireFacilityAssetPermission(
  capability: PermissionCapability,
  options?: { managerOnly?: boolean }
) {
  return requireAuthorizedAction({
    capability,
    entitlement: "facility.assets",
    allowedRoles: options?.managerOnly
      ? [...FACILITY_MANAGER_ROLES]
      : [...FACILITY_ASSET_READ_ROLES]
  });
}

export async function requireFacilityRequestFormsPermission() {
  return requireAuthorizedAction({
    capability: "pm.maintenance:write",
    entitlement: "facility.request_forms",
    allowedRoles: [...FACILITY_MANAGER_ROLES]
  });
}

export async function requireFacilityInventoryPermission(
  capability: PermissionCapability,
  options?: { managerOnly?: boolean; allowedRoles?: readonly UserRole[] }
) {
  return requireAuthorizedAction({
    capability,
    entitlement: "facility.inventory",
    allowedRoles: options?.managerOnly
      ? [...FACILITY_MANAGER_ROLES]
      : options?.allowedRoles
        ? [...options.allowedRoles]
        : [...FACILITY_MANAGER_ROLES]
  });
}
