import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/server";
import { getSchedulerTelemetry, tickScheduler } from "../../../../../lib/ops/scheduler";
import { apiError, apiInternalError } from "../../../../../lib/api/http";

/**
 * OPS-001 Slice B scheduler tick.
 * Auth: `Authorization: Bearer ${OPS_DISPATCH_SECRET}` (cron) OR org manager with maintenance:write.
 */
export async function POST(request: Request) {
  try {
    const cronSecret = process.env["OPS_DISPATCH_SECRET"];
    const authHeader = request.headers.get("authorization");
    const isCron = Boolean(cronSecret) && authHeader === `Bearer ${cronSecret}`;

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

    const result = await tickScheduler();
    const telemetry = await getSchedulerTelemetry(result.holderId);
    return NextResponse.json({ result, telemetry });
  } catch {
    return apiInternalError();
  }
}
