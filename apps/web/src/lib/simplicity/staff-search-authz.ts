import { NextResponse } from "next/server";
import { isPortalOnlyRoles, isStaffSearchActor } from "@mpa/shared";
import { requireAuthorizedAction, type AuthorizedActionResult } from "../auth/require-authorized-action";

export async function requireStaffSearch(): Promise<AuthorizedActionResult> {
  const authz = await requireAuthorizedAction({
    entitlement: "platform.search",
    capability: "navigation:access"
  });
  if ("error" in authz) {
    return authz;
  }
  if (isPortalOnlyRoles(authz.roles) || !isStaffSearchActor(authz.roles)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return authz;
}
