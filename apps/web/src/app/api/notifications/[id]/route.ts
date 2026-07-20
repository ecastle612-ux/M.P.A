import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { parseNotificationMutationInput } from "../../../../lib/notifications/contracts";
import { mutateNotification } from "../../../../lib/notifications/server";
import { apiError, apiInternalError } from "../../../../lib/api/http";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) return apiError(400, "NO_ORGANIZATION", "No active organization");

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "notification:update")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const body = await request.json().catch(() => null);
    const input = parseNotificationMutationInput(body);
    if (!input) return apiError(400, "INVALID_INPUT", "Invalid mutation");

    const item = await mutateNotification(organizationId, user.id, id, input, supabase);
    if (!item) return apiError(404, "NOT_FOUND", "Notification not found");
    return NextResponse.json({ item }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return apiInternalError();
  }
}
