import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/server";
import { isLeasingWorkflowStage } from "../../../../../lib/lease/workflow";
import { transitionLeasingWorkflow } from "../../../../../lib/lease/workflow-server";
import { apiError, apiInternalError, parseJsonBody } from "../../../../../lib/api/http";

/** CORE-004 Phase 3 — advance canonical leasing workflow on a lease carrier. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ leaseId: string }> }
) {
  try {
    const { leaseId } = await params;
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
    if (!isLeasingWorkflowStage(toStage)) {
      return apiError(400, "INVALID_PAYLOAD", "Invalid workflow stage.");
    }

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "lease:update")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    try {
      const result = await transitionLeasingWorkflow(
        {
          organizationId,
          leaseId,
          actorUserId: user.id,
          toStage,
          reason: typeof payload["reason"] === "string" ? payload["reason"] : null,
          applicantId:
            typeof payload["applicantId"] === "string" ? payload["applicantId"] : null
        },
        supabase
      );
      return NextResponse.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Workflow transition failed.";
      if (
        message.includes("not allowed") ||
        message.includes("before") ||
        message.includes("required") ||
        message.includes("Link")
      ) {
        return apiError(400, "INVALID_TRANSITION", message);
      }
      throw error;
    }
  } catch {
    return apiInternalError();
  }
}
