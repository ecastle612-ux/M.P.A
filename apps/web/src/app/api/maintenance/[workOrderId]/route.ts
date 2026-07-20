import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { parseWorkOrderMutationInput } from "../../../../lib/maintenance/contracts";
import {
  archiveWorkOrder,
  getActivityForWorkOrder,
  getWorkOrderForOrganization,
  restoreWorkOrder,
  softDeleteWorkOrder,
  updateWorkOrder
} from "../../../../lib/maintenance/server";
import { parseWorkOrderVendorMutationInput } from "../../../../lib/vendor/contracts";
import { mutateWorkOrderVendor } from "../../../../lib/vendor/server";
import { apiError, apiInternalError, parseJsonBody } from "../../../../lib/api/http";

export async function GET(request: Request, { params }: { params: Promise<{ workOrderId: string }> }) {
  try {
    const { workOrderId } = await params;
    const url = new URL(request.url);
    const includeActivity = url.searchParams.get("includeActivity") === "true";

    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) {
      return apiError(401, "UNAUTHENTICATED", "Unauthenticated");
    }

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) {
      return apiError(400, "NO_ACTIVE_ORGANIZATION", "No active organization selected");
    }

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "maintenance:read")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const workOrder = await getWorkOrderForOrganization(organizationId, workOrderId, supabase);
    if (!workOrder) {
      return apiError(404, "NOT_FOUND", "Not found");
    }

    if (!includeActivity) {
      return NextResponse.json({ workOrder });
    }

    const activity = await getActivityForWorkOrder(organizationId, workOrderId, supabase);
    return NextResponse.json({ workOrder, activity });
  } catch {
    return apiInternalError();
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ workOrderId: string }> }) {
  try {
    const { workOrderId } = await params;
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) {
      return apiError(401, "UNAUTHENTICATED", "Unauthenticated");
    }

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) {
      return apiError(400, "NO_ACTIVE_ORGANIZATION", "No active organization selected");
    }

    const parsedBody = await parseJsonBody(request);
    if (!parsedBody.ok) {
      return parsedBody.response;
    }

    const authorization = await resolveAuthorizationContext(user, organizationId);

    const vendorMutation = parseWorkOrderVendorMutationInput(parsedBody.payload);
    if (vendorMutation) {
      const canAssignVendor = evaluatePermission(authorization, "vendor:assign");
      const canUpdateMaintenance = evaluatePermission(authorization, "maintenance:update");
      const isVendorStatusUpdate = vendorMutation.action === "update_vendor_status";
      if (!canAssignVendor && !(isVendorStatusUpdate && canUpdateMaintenance)) {
        return apiError(403, "FORBIDDEN", "Forbidden");
      }
      const result = await mutateWorkOrderVendor(organizationId, workOrderId, user.id, vendorMutation, supabase);
      return NextResponse.json(result);
    }

    const mutation = parseWorkOrderMutationInput(parsedBody.payload);
    if (!mutation) {
      return apiError(400, "INVALID_PAYLOAD", "Invalid work order update payload");
    }

    if (mutation.action === "archive") {
      if (!evaluatePermission(authorization, "maintenance:archive")) {
        return apiError(403, "FORBIDDEN", "Forbidden");
      }
      const workOrder = await archiveWorkOrder(organizationId, workOrderId, user.id, supabase);
      return workOrder ? NextResponse.json({ workOrder }) : apiError(404, "NOT_FOUND", "Not found");
    }

    if (mutation.action === "restore") {
      if (!evaluatePermission(authorization, "maintenance:archive")) {
        return apiError(403, "FORBIDDEN", "Forbidden");
      }
      const workOrder = await restoreWorkOrder(organizationId, workOrderId, user.id, supabase);
      return workOrder ? NextResponse.json({ workOrder }) : apiError(404, "NOT_FOUND", "Not found");
    }

    if (mutation.action === "soft_delete") {
      if (!evaluatePermission(authorization, "maintenance:delete")) {
        return apiError(403, "FORBIDDEN", "Forbidden");
      }
      const workOrder = await softDeleteWorkOrder(organizationId, workOrderId, user.id, supabase);
      return workOrder ? NextResponse.json({ workOrder }) : apiError(404, "NOT_FOUND", "Not found");
    }

    const canUpdate = evaluatePermission(authorization, "maintenance:update");
    const canAssign = evaluatePermission(authorization, "maintenance:assign");
    if (!canUpdate && !canAssign) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    if (!canUpdate) {
      const allowedKeys = new Set(["assignedToUserId", "status"]);
      const updateKeys = Object.keys(mutation.updates);
      if (updateKeys.some((key) => !allowedKeys.has(key))) {
        return apiError(403, "FORBIDDEN", "Forbidden");
      }
    }

    const workOrder = await updateWorkOrder(organizationId, workOrderId, user.id, mutation.updates, supabase);
    return workOrder ? NextResponse.json({ workOrder }) : apiError(404, "NOT_FOUND", "Not found");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Work order update failed";
    return apiError(400, "WORK_ORDER_UPDATE_FAILED", message);
  }
}
