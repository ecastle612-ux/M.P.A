import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { markAllNotificationsRead } from "../../../../lib/notifications/server";
import { apiError, apiInternalError } from "../../../../lib/api/http";

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
    if (!evaluatePermission(authorization, "notification:update")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const markedCount = await markAllNotificationsRead(organizationId, user.id, supabase);
    return NextResponse.json({ markedCount }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return apiInternalError();
  }
}
