import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { apiError, apiInternalError } from "../../../../lib/api/http";
import { getOpsMonitoringSnapshot } from "../../../../lib/ops/ops-monitoring";

/**
 * OPS-001 Slice D — Operational monitoring snapshot (API/query; no Command Center homepage).
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
    if (
      !evaluatePermission(authorization, "maintenance:read") &&
      !evaluatePermission(authorization, "maintenance:write")
    ) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const monitoring = await getOpsMonitoringSnapshot(organizationId);
    return NextResponse.json(
      { monitoring },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("[ops/monitoring GET]", error);
    return apiInternalError();
  }
}
