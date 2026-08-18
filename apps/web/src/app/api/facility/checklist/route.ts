import { NextResponse } from "next/server";
import { saveChecklistResponsesInputSchema } from "@mpa/shared";
import { requireFacilityOperation } from "../../../../lib/facility/authz";
import {
  listChecklistItems,
  saveChecklistResponses
} from "../../../../lib/facility/work-template-service";
import { getWorkOrder } from "../../../../lib/maintenance/maintenance-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireFacilityOperation("pm.maintenance:read", "facility.operations");
  if ("error" in auth) return auth.error;

  const workOrderId = new URL(request.url).searchParams.get("workOrderId");
  if (!workOrderId) {
    return NextResponse.json({ error: "workOrderId is required" }, { status: 400 });
  }

  try {
    const workOrder = await getWorkOrder(auth.supabase, auth.organizationId, workOrderId);
    if (!workOrder || workOrder.work_surface !== "facility") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const items = await listChecklistItems(auth.supabase, auth.organizationId, workOrderId);
    return NextResponse.json({
      items,
      requireCompletionPhoto: Boolean(workOrder.require_completion_photo),
      checklistSnapshot: workOrder.checklist_snapshot ?? null
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load checklist" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireFacilityOperation("pm.maintenance:write", "facility.operations");
  if ("error" in auth) return auth.error;

  try {
    const body = saveChecklistResponsesInputSchema.parse(await request.json());
    const workOrder = await getWorkOrder(auth.supabase, auth.organizationId, body.workOrderId);
    if (!workOrder || workOrder.work_surface !== "facility") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const roles = (auth.roles as string[]) ?? [];
    const isManager =
      roles.includes("organization_admin") || roles.includes("property_manager");
    if (!isManager && workOrder.technician_user_id !== auth.user.id) {
      return NextResponse.json({ error: "This work order is not assigned to you" }, { status: 403 });
    }

    const items = await saveChecklistResponses(auth.supabase, auth.organizationId, body);
    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save checklist" },
      { status: 400 }
    );
  }
}
