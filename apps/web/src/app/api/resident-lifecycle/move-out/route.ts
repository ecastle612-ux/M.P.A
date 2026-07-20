import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { apiError, parseJsonBody } from "../../../../lib/api/http";
import { parseMoveOutDraftInput } from "../../../../lib/resident-lifecycle/contracts";
import { completeResidentMoveOut, getMoveOutContext } from "../../../../lib/resident-lifecycle/server";

export async function GET(request: Request) {
  try {
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) return apiError(400, "NO_ACTIVE_ORGANIZATION", "No active organization selected");

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "tenant:read")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const tenantId = new URL(request.url).searchParams.get("tenantId");
    if (!tenantId) return apiError(400, "INVALID_QUERY", "tenantId is required");

    const context = await getMoveOutContext(organizationId, tenantId, supabase);
    return NextResponse.json({ context }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load move-out context";
    return apiError(400, "MOVE_OUT_CONTEXT_FAILED", message);
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
    if (!evaluatePermission(authorization, "tenant:update") && !evaluatePermission(authorization, "lease:update")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const parsedBody = await parseJsonBody(request);
    if (!parsedBody.ok) return parsedBody.response;

    const input = parseMoveOutDraftInput(parsedBody.payload);
    if (!input) return apiError(400, "INVALID_PAYLOAD", "Invalid move-out payload");

    const result = await completeResidentMoveOut(organizationId, user.id, input, supabase);
    return NextResponse.json({ result }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Move-out failed";
    return apiError(400, "MOVE_OUT_FAILED", message);
  }
}
