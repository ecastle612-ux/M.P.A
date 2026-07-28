import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { apiError, apiInternalError } from "../../../../lib/api/http";
import { composeCommandCenterHome } from "../../../../lib/ops/command-center-home";

function canAccessOpsSurface(authorization: Awaited<ReturnType<typeof resolveAuthorizationContext>>) {
  return (
    evaluatePermission(authorization, "maintenance:read") ||
    evaluatePermission(authorization, "maintenance:write") ||
    evaluatePermission(authorization, "dashboard:read") ||
    evaluatePermission(authorization, "org:manage") ||
    evaluatePermission(authorization, "master_admin")
  );
}

/**
 * OPS-001 Slice E — Universal Command Center homepage composition.
 */
export async function GET() {
  try {
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) return apiError(400, "NO_ACTIVE_ORGANIZATION", "No active organization selected");

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!canAccessOpsSurface(authorization)) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const home = await composeCommandCenterHome({
      organizationId,
      principalId: user.id,
      rolePlane: authorization.roles[0] ?? "unknown",
      permissions: authorization.permissions
    });

    return NextResponse.json({ home }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[ops/command-center GET]", error);
    return apiInternalError();
  }
}
