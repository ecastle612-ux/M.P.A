import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { dispatchPendingEvents } from "../../../../lib/ops/dispatcher";
import { getOutboxLagMetrics } from "../../../../lib/ops/metrics";
import { apiError, apiInternalError } from "../../../../lib/api/http";

/**
 * OPS-001 Slice A dispatcher endpoint.
 * Auth: org manager (ops) OR `Authorization: Bearer ${OPS_DISPATCH_SECRET}` for cron.
 */
export async function POST(request: Request) {
  try {
    const cronSecret = process.env["OPS_DISPATCH_SECRET"];
    const authHeader = request.headers.get("authorization");
    const isCron =
      Boolean(cronSecret) && authHeader === `Bearer ${cronSecret}`;

    if (!isCron) {
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
    }

    const url = new URL(request.url);
    const limit = url.searchParams.get("limit") ? Number(url.searchParams.get("limit")) : 25;
    const result = await dispatchPendingEvents(Number.isFinite(limit) ? limit : 25);
    const metrics = await getOutboxLagMetrics();

    return NextResponse.json({ result, metrics });
  } catch {
    return apiInternalError();
  }
}

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
    if (!evaluatePermission(authorization, "maintenance:read")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const metrics = await getOutboxLagMetrics();
    return NextResponse.json({ metrics });
  } catch {
    return apiInternalError();
  }
}
