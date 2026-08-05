import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/server";
import { resolveLinkedTenantForUser } from "../../../../../lib/resident/resolve-tenant";
import { confirmMaintenanceByResident } from "../../../../../lib/maintenance/workflow-server";
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

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "maintenance:read")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const tenant = await resolveLinkedTenantForUser(organizationId, user.id, user.email, supabase);
    if (!tenant) {
      return apiError(403, "NO_RESIDENT_PROFILE", "No resident profile linked to this account.");
    }

    const parsedBody = await parseJsonBody(request);
    if (!parsedBody.ok) return parsedBody.response;
    const payload = parsedBody.payload as Record<string, unknown>;
    const feedback = typeof payload["feedback"] === "string" ? payload["feedback"] : null;
    const rating = typeof payload["rating"] === "number" ? payload["rating"] : null;

    try {
      const result = await confirmMaintenanceByResident({
        organizationId,
        workOrderId,
        actorUserId: user.id,
        tenantId: tenant.id,
        feedback,
        rating,
        client: supabase
      });
      return NextResponse.json({
        workOrder: result.workOrder,
        fromStage: result.fromStage,
        toStage: result.toStage
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Confirmation failed.";
      if (
        message.includes("Only the linked") ||
        message.includes("not awaiting") ||
        message.includes("not found")
      ) {
        return apiError(400, "INVALID_CONFIRMATION", message);
      }
      throw error;
    }
  } catch {
    return apiInternalError();
  }
}
