import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { apiError, parseJsonBody } from "../../../../lib/api/http";
import { parseBulkLifecycleAction } from "../../../../lib/resident-lifecycle/contracts";
import { runBulkLifecycleAction } from "../../../../lib/resident-lifecycle/server";

export async function POST(request: Request) {
  try {
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) return apiError(400, "NO_ACTIVE_ORGANIZATION", "No active organization selected");

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "tenant:update")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const parsedBody = await parseJsonBody(request);
    if (!parsedBody.ok) return parsedBody.response;

    const input = parseBulkLifecycleAction(parsedBody.payload);
    if (!input) return apiError(400, "INVALID_PAYLOAD", "Invalid bulk lifecycle payload");

    const result = await runBulkLifecycleAction(organizationId, user.id, input, supabase);
    return NextResponse.json({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bulk action failed";
    return apiError(400, "BULK_LIFECYCLE_FAILED", message);
  }
}
