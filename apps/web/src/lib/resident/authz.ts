import type { NextResponse } from "next/server";
import type { ResidentCapability } from "@mpa/shared";
import { requireAuthorizedAction } from "../auth/require-authorized-action";

export async function requireResidentPermission(
  capability: ResidentCapability,
  organizationId?: string
) {
  return requireAuthorizedAction({
    capability,
    entitlement: "pm.residents",
    organizationId
  });
}

export type ResidentAuthz = Exclude<
  Awaited<ReturnType<typeof requireResidentPermission>>,
  { error: NextResponse }
>;
