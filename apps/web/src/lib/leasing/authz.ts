import { NextResponse } from "next/server";
import type { LeasingCapability } from "@mpa/shared";
import { requireAuthorizedAction } from "../auth/require-authorized-action";

export async function requireLeasingPermission(
  capability: LeasingCapability,
  organizationId?: string
) {
  return requireAuthorizedAction({
    capability,
    entitlement: "pm.leasing",
    organizationId
  });
}

export type LeasingAuthz = Exclude<
  Awaited<ReturnType<typeof requireLeasingPermission>>,
  { error: NextResponse }
>;
