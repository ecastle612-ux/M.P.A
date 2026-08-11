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
    return NextResponse.json({ workOrder, updates });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load facility work order" },
      { status: 400 }
    );
  }
}
