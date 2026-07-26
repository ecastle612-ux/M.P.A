import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../../lib/organization/server";
import { parseUpdatePmScheduleInput } from "../../../../../../lib/facility/pm-contracts";
import { getPmSchedule, updatePmSchedule } from "../../../../../../lib/facility/pm-server";
import { apiError, apiInternalError, parseJsonBody } from "../../../../../../lib/api/http";

export async function GET(
  _request: Request,
  context: { params: Promise<{ scheduleId: string }> }
) {
  try {
    const { scheduleId } = await context.params;
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) return apiError(400, "NO_ACTIVE_ORGANIZATION", "No active organization selected");

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "facility:pm:read")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const schedule = await getPmSchedule(organizationId, scheduleId, supabase);
    if (!schedule) return apiError(404, "NOT_FOUND", "Schedule not found");
    return NextResponse.json({ schedule }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return apiInternalError();
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ scheduleId: string }> }
) {
  try {
    const { scheduleId } = await context.params;
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

    const parsedBody = await parseJsonBody(request);
    if (!parsedBody.ok) return parsedBody.response;

    const input = parseUpdatePmScheduleInput(parsedBody.payload);
    if (!input) return apiError(400, "INVALID_PAYLOAD", "Invalid PM schedule update");

    const schedule = await updatePmSchedule(organizationId, scheduleId, user.id, input, supabase);
    return NextResponse.json({ schedule });
  } catch (error) {
    const message = error instanceof Error ? error.message : "PM schedule update failed";
    return apiError(400, "PM_UPDATE_FAILED", message);
  }
}
