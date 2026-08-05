import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/server";
import { isMaintenanceWorkflowStage } from "../../../../../lib/maintenance/workflow";
import { transitionMaintenanceWorkflow } from "../../../../../lib/maintenance/workflow-server";
import { apiError, apiInternalError, parseJsonBody } from "../../../../../lib/api/http";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ workOrderId: string }> }
) {
  try {
    const { workOrderId } = await params;
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
    if (!isMaintenanceWorkflowStage(toStage)) {
      return apiError(400, "INVALID_PAYLOAD", "Invalid workflow stage.");
    }

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (
      toStage === "assignment" ||
      toStage === "dispatch" ||
      toStage === "vendor_escalation"
    ) {
      if (
        !evaluatePermission(authorization, "maintenance:assign") &&
        !evaluatePermission(authorization, "maintenance:update")
      ) {
        return apiError(403, "FORBIDDEN", "Forbidden");
      }
    } else if (!evaluatePermission(authorization, "maintenance:update")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    try {
      const result = await transitionMaintenanceWorkflow(
        {
          organizationId,
          workOrderId,
          actorUserId: user.id,
          toStage,
          reason: typeof payload["reason"] === "string" ? payload["reason"] : null
        },
        supabase
      );
      return NextResponse.json({
        workOrder: result.workOrder,
        fromStage: result.fromStage,
        toStage: result.toStage,
        automation: result.automation
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Workflow transition failed.";
      if (message.includes("not allowed") || message.includes("before") || message.includes("No resident")) {
        return apiError(400, "INVALID_TRANSITION", message);
      }
      throw error;
    }
  } catch {
    return apiInternalError();
  }
}
