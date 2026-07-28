import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { apiError, apiInternalError } from "../../../../lib/api/http";
import {
  getOperationalAnalyticsSummary,
  listKpiSnapshots,
  materializeOrgKpis
} from "../../../../lib/ops/operational-analytics";

/**
 * OPS-001 Slice D — Operational Analytics KPIs (no customer BI / Command Center).
 */
export async function GET(request: Request) {
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

    const url = new URL(request.url);
    if (url.searchParams.get("view") === "snapshots") {
      const snapshots = await listKpiSnapshots({ organizationId });
      return NextResponse.json({ snapshots }, { headers: { "Cache-Control": "no-store" } });
    }

    const summary = await getOperationalAnalyticsSummary(organizationId);
    return NextResponse.json({ summary }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[ops/analytics GET]", error);
    return apiInternalError();
  }
}

export async function POST() {
  try {
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) return apiError(400, "NO_ACTIVE_ORGANIZATION", "No active organization selected");

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "maintenance:write")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const result = await materializeOrgKpis(organizationId);
    const summary = await getOperationalAnalyticsSummary(organizationId);
    return NextResponse.json(
      { result, summary },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("[ops/analytics POST]", error);
    return apiInternalError();
  }
}
