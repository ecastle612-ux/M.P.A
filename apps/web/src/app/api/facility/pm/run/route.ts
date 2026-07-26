import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/server";
import { runDuePreventiveMaintenance } from "../../../../../lib/facility/pm-server";
import { apiError, apiInternalError } from "../../../../../lib/api/http";

/**
 * FAC-002 Slice B — materialize due PM schedules into work orders.
 * Auth: session + facility:pm:write, or Bearer FACILITY_PM_RUN_SECRET / OPS_DISPATCH_SECRET.
 */
export async function POST(request: Request) {
  try {
    const cronSecret =
      process.env["FACILITY_PM_RUN_SECRET"] ?? process.env["OPS_DISPATCH_SECRET"];
    const authHeader = request.headers.get("authorization");
    const isCron = Boolean(cronSecret) && authHeader === `Bearer ${cronSecret}`;

    const url = new URL(request.url);
    const limitRaw = url.searchParams.get("limit");
    const limit = limitRaw ? Number.parseInt(limitRaw, 10) : 50;
    const asOf = url.searchParams.get("asOf") ?? undefined;

    if (isCron) {
      const result = await runDuePreventiveMaintenance({
        ...(asOf ? { asOf } : {}),
        limit: Number.isFinite(limit) ? limit : 50
      });
      return NextResponse.json({ result });
    }

    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) return apiError(400, "NO_ACTIVE_ORGANIZATION", "No active organization selected");

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "facility:pm:write")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const result = await runDuePreventiveMaintenance({
      organizationId,
      actorUserId: user.id,
      ...(asOf ? { asOf } : {}),
      limit: Number.isFinite(limit) ? limit : 50,
      client: supabase
    });

    return NextResponse.json({ result });
  } catch {
    return apiInternalError();
  }
}
