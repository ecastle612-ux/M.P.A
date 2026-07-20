import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../../lib/organization/server";
import { getFacilityRecordByWorkOrderId } from "../../../../../../lib/facility/server";
import { apiError, apiInternalError } from "../../../../../../lib/api/http";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ workOrderId: string }> }
) {
  try {
    const { workOrderId } = await params;
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

    const record = await getFacilityRecordByWorkOrderId(organizationId, workOrderId, supabase);
    if (!record) return apiError(404, "NOT_FOUND", "Not found");
    return NextResponse.json({ record });
  } catch {
    return apiInternalError();
  }
}
