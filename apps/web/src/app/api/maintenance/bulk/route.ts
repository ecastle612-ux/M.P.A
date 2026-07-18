import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import {
  isMaintenancePriority,
  isMaintenanceStatus
} from "../../../../lib/maintenance/contracts";
import {
  archiveWorkOrder,
  updateWorkOrder
} from "../../../../lib/maintenance/server";
import { mutateWorkOrderVendor } from "../../../../lib/vendor/server";
import { apiError, apiInternalError, parseJsonBody } from "../../../../lib/api/http";

const MAX_BULK = 40;

type BulkAction = "set_status" | "set_priority" | "assign_vendor" | "archive";

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
    const parsedBody = await parseJsonBody(request);
    if (!parsedBody.ok) return parsedBody.response;

    const payload = parsedBody.payload as Record<string, unknown>;
    const action = payload["action"] as BulkAction | undefined;
    const workOrderIds = Array.isArray(payload["workOrderIds"])
      ? payload["workOrderIds"].filter((id): id is string => typeof id === "string" && id.length > 0)
      : [];

    if (!action || workOrderIds.length === 0) {
      return apiError(400, "INVALID_PAYLOAD", "action and workOrderIds are required");
    }
    if (workOrderIds.length > MAX_BULK) {
      return apiError(400, "INVALID_PAYLOAD", `Select at most ${MAX_BULK} work orders`);
    }

    const results: Array<{ id: string; ok: boolean; message: string }> = [];

    for (const workOrderId of workOrderIds) {
      try {
        if (action === "set_status") {
          if (!evaluatePermission(authorization, "maintenance:update") && !evaluatePermission(authorization, "maintenance:assign")) {
            throw new Error("Forbidden");
          }
          if (!isMaintenanceStatus(payload["status"])) throw new Error("Invalid status");
          await updateWorkOrder(organizationId, workOrderId, user.id, { status: payload["status"] }, supabase);
          results.push({ id: workOrderId, ok: true, message: "Status updated" });
          continue;
        }

        if (action === "set_priority") {
          if (!evaluatePermission(authorization, "maintenance:update")) throw new Error("Forbidden");
          if (!isMaintenancePriority(payload["priority"])) throw new Error("Invalid priority");
          await updateWorkOrder(organizationId, workOrderId, user.id, { priority: payload["priority"] }, supabase);
          results.push({ id: workOrderId, ok: true, message: "Priority updated" });
          continue;
        }

        if (action === "assign_vendor") {
          if (!evaluatePermission(authorization, "vendor:assign")) throw new Error("Forbidden");
          const vendorId = typeof payload["vendorId"] === "string" ? payload["vendorId"] : "";
          if (!vendorId) throw new Error("vendorId required");
          await mutateWorkOrderVendor(
            organizationId,
            workOrderId,
            user.id,
            { action: "assign_vendor", vendorId },
            supabase
          );
          results.push({ id: workOrderId, ok: true, message: "Vendor assigned" });
          continue;
        }

        if (action === "archive") {
          if (!evaluatePermission(authorization, "maintenance:archive")) throw new Error("Forbidden");
          await archiveWorkOrder(organizationId, workOrderId, user.id, supabase);
          results.push({ id: workOrderId, ok: true, message: "Archived" });
          continue;
        }

        throw new Error("Unknown action");
      } catch (error) {
        results.push({
          id: workOrderId,
          ok: false,
          message: error instanceof Error ? error.message : "Failed"
        });
      }
    }

    return NextResponse.json({
      result: {
        processed: results.filter((row) => row.ok).length,
        results
      }
    });
  } catch {
    return apiInternalError();
  }
}
