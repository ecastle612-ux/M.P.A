import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { apiError, apiInternalError, parseJsonBody } from "../../../../lib/api/http";
import { bulkSkipPendingReviewItems, getCustomerSwitchingSnapshot } from "../../../../lib/migration/switching";

export async function GET() {
  try {
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) {
      return NextResponse.json({ switching: null }, { headers: { "Cache-Control": "no-store" } });
    }

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "migration:read")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const switching = await getCustomerSwitchingSnapshot(organizationId, supabase);
    return NextResponse.json({ switching }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return apiInternalError();
  }
}

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
    if (!evaluatePermission(authorization, "migration:update")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const parsedBody = await parseJsonBody(request);
    if (!parsedBody.ok) return parsedBody.response;

    const payload = parsedBody.payload as Record<string, unknown>;
    const action = payload["action"];
    if (action === "bulk_skip_review") {
      const jobId = typeof payload["jobId"] === "string" ? payload["jobId"] : null;
      const result = await bulkSkipPendingReviewItems(organizationId, user.id, jobId, supabase);
      return NextResponse.json({ result });
    }

    return apiError(400, "INVALID_ACTION", "Unknown switching action");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Switching action failed";
    return apiError(400, "SWITCHING_ACTION_FAILED", message);
  }
}
