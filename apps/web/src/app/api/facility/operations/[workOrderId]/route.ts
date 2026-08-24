import { NextResponse } from "next/server";
import { requireFacilityOperation } from "../../../../../lib/facility/authz";
import {
  getWorkOrder,
  listWorkOrderUpdates
} from "../../../../../lib/maintenance/maintenance-service";

type Params = { params: Promise<{ workOrderId: string }> };

export async function GET(_request: Request, context: Params) {
  const authz = await requireFacilityOperation("pm.maintenance:read", "facility.operations");
  if ("error" in authz) {
    return authz.error;
  }

  const { workOrderId } = await context.params;
  try {
    const workOrder = await getWorkOrder(authz.supabase, authz.organizationId, workOrderId);
    if (!workOrder || workOrder.work_surface !== "facility") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const updates = await listWorkOrderUpdates(authz.supabase, authz.organizationId, workOrderId);
    const { data: submission } = await authz.supabase
      .from("facility_request_submissions")
      .select("source, requester_name, requester_email, requester_phone, values_snapshot, submitted_at")
      .eq("organization_id", authz.organizationId)
      .eq("work_order_id", workOrderId)
      .maybeSingle();
    return NextResponse.json({ workOrder, updates, submission: submission ?? null });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load facility work order" },
      { status: 400 }
    );
  }
}
