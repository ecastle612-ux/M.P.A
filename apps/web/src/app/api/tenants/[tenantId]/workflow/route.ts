import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/server";
import { isResidentWorkflowStage } from "../../../../../lib/resident/workflow";
import { transitionResidentWorkflow } from "../../../../../lib/resident/workflow-server";
import { apiError, apiInternalError, parseJsonBody } from "../../../../../lib/api/http";

/** CORE-004 Phase 4 — advance canonical resident workflow on the tenant carrier. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params;
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) {
      return apiError(400, "NO_ACTIVE_ORGANIZATION", "No active organization selected");
    }

    const parsedBody = await parseJsonBody(request);
    if (!parsedBody.ok) return parsedBody.response;
    const payload = parsedBody.payload as Record<string, unknown>;
    const toStage = payload["toStage"];
    if (!isResidentWorkflowStage(toStage)) {
      return apiError(400, "INVALID_PAYLOAD", "Invalid workflow stage.");
    }

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "tenant:update")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    try {
      const result = await transitionResidentWorkflow(
        {
          organizationId,
          tenantId,
          actorUserId: user.id,
          toStage,
          reason: typeof payload["reason"] === "string" ? payload["reason"] : null
        },
        supabase
      );
      return NextResponse.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Workflow transition failed.";
      if (
        message.includes("not allowed") ||
        message.includes("before") ||
        message.includes("required")
      ) {
        return apiError(400, "INVALID_TRANSITION", message);
      }
      throw error;
    }
  } catch {
    return apiInternalError();
  }
}
