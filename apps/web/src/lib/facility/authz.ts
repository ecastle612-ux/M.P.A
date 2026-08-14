import { NextResponse } from "next/server";
import type { EntitlementKey, PermissionCapability } from "@mpa/shared";
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
