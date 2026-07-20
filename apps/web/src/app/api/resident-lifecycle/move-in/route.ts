import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { apiError, parseJsonBody } from "../../../../lib/api/http";
import { parseMoveInDraftInput } from "../../../../lib/resident-lifecycle/contracts";
import {
  buildMoveInChecklist,
  completeResidentMoveIn,
  getMoveInPreview
} from "../../../../lib/resident-lifecycle/server";

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

    const url = new URL(request.url);
    const propertyId = url.searchParams.get("propertyId");
    const unitId = url.searchParams.get("unitId");
    const tenantId = url.searchParams.get("tenantId");
    const leaseId = url.searchParams.get("leaseId");

    if (tenantId) {
      const checklist = await buildMoveInChecklist(organizationId, tenantId, leaseId, supabase);
      return NextResponse.json({ checklist }, { headers: { "Cache-Control": "no-store" } });
    }

    if (!propertyId || !unitId) {
      return apiError(400, "INVALID_QUERY", "propertyId and unitId are required");
    }

    const preview = await getMoveInPreview(organizationId, propertyId, unitId, supabase);
    return NextResponse.json({ preview }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load move-in preview";
    return apiError(400, "MOVE_IN_PREVIEW_FAILED", message);
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
    if (!evaluatePermission(authorization, "tenant:create") && !evaluatePermission(authorization, "tenant:update")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const parsedBody = await parseJsonBody(request);
    if (!parsedBody.ok) return parsedBody.response;

    const input = parseMoveInDraftInput(parsedBody.payload);
    if (!input) return apiError(400, "INVALID_PAYLOAD", "Invalid move-in payload");

    const result = await completeResidentMoveIn(
      organizationId,
      user.id,
      input,
      { canOverrideOccupied: evaluatePermission(authorization, "lease:update") },
      supabase
    );

    return NextResponse.json({ result }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Move-in failed";
    return apiError(400, "MOVE_IN_FAILED", message);
  }
}
