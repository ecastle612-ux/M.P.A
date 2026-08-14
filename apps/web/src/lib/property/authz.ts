import type { NextResponse } from "next/server";
import type { PropertyCapability } from "@mpa/shared";
import { requireAuthorizedAction } from "../auth/require-authorized-action";

export async function requirePropertyPermission(
  capability: PropertyCapability,
  organizationId?: string
) {
  return requireAuthorizedAction({
    capability,
    entitlement: "pm.properties",
    organizationId
  });
}

export type PropertyAuthz = Exclude<
  Awaited<ReturnType<typeof requirePropertyPermission>>,
  { error: NextResponse }
>;
