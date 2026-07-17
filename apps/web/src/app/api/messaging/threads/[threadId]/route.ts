import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/server";
import { parseThreadMutationInput } from "../../../../../lib/messaging/contracts";
import { getThreadForOrganization, mutateThread } from "../../../../../lib/messaging/server";
import { apiError, apiInternalError, parseJsonBody } from "../../../../../lib/api/http";

type RouteContext = { params: Promise<{ threadId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { threadId } = await context.params;
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) return apiError(400, "NO_ACTIVE_ORGANIZATION", "No active organization selected");

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "message:read")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const thread = await getThreadForOrganization(organizationId, threadId, user.id, supabase);
    if (!thread) return apiError(404, "NOT_FOUND", "Thread not found");

    return NextResponse.json({ thread }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return apiInternalError();
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { threadId } = await context.params;
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) return apiError(400, "NO_ACTIVE_ORGANIZATION", "No active organization selected");

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "message:update")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const parsedBody = await parseJsonBody(request);
    if (!parsedBody.ok) return parsedBody.response;

    const input = parseThreadMutationInput(parsedBody.payload);
    if (!input) return apiError(400, "INVALID_PAYLOAD", "Invalid thread mutation");

    const thread = await mutateThread(organizationId, threadId, user.id, input, supabase);
    if (!thread) return apiError(404, "NOT_FOUND", "Thread not found");

    return NextResponse.json({ thread }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Thread update failed";
    return apiError(400, "THREAD_UPDATE_FAILED", message);
  }
}
