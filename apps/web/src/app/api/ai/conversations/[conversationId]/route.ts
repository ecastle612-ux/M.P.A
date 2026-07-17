import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/server";
import { getConversationForUser } from "../../../../../lib/ai/server";
import { apiError, apiInternalError } from "../../../../../lib/api/http";

type RouteContext = { params: Promise<{ conversationId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { conversationId } = await context.params;
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) return apiError(400, "NO_ACTIVE_ORGANIZATION", "No active organization selected");

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "ai:read")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const conversation = await getConversationForUser(organizationId, user.id, conversationId, supabase);
    if (!conversation) return apiError(404, "NOT_FOUND", "Conversation not found");
    return NextResponse.json({ conversation }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return apiInternalError();
  }
}
