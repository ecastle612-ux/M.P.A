import { NextResponse } from "next/server";
import type { EntitlementKey, MaintenanceCapability } from "@mpa/shared";
import { requireAuthorizedAction } from "../auth/require-authorized-action";

/**
 * Property Manager maintenance / vendor API gate.
 * Auth + membership + role/SKU/permission via requireAuthorizedAction (ADR-026).
 */
export async function requireMaintenancePermission(
  capability: MaintenanceCapability,
  moduleEntitlement: EntitlementKey = "pm.maintenance",
  organizationId?: string
) {
  return requireAuthorizedAction({
    capability,
    entitlement: moduleEntitlement,
    organizationId
  });
}

export type MaintenanceAuthz = Exclude<
  Awaited<ReturnType<typeof requireMaintenancePermission>>,
  { error: NextResponse }
>;
