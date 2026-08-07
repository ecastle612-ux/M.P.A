import { NextResponse } from "next/server";
import { requireFacilityPermission } from "../../../../../lib/facility/authz";
import {
  getFacilityWorkOrder,
  listFacilityWorkOrderTimeline,
  listFacilityWorkOrderUpdates
} from "../../../../../lib/facility/operations-service";

type Params = { params: Promise<{ workOrderId: string }> };

export async function GET(_request: Request, context: Params) {
  const authz = await requireFacilityPermission("facility.operations:read");
  if ("error" in authz) {
    return authz.error;
  }

  const { workOrderId } = await context.params;
  try {
    const workOrder = await getFacilityWorkOrder(
      authz.supabase,
      authz.organizationId,
      workOrderId
    );
    if (!workOrder) {
      return NextResponse.json({ error: "Work order not found" }, { status: 404 });
    }
    const [updates, timeline] = await Promise.all([
      listFacilityWorkOrderUpdates(authz.supabase, authz.organizationId, workOrderId),
      listFacilityWorkOrderTimeline(authz.supabase, authz.organizationId, workOrderId)
    ]);
    return NextResponse.json({
      workOrder,
      updates,
      timeline,
      executionHandoff: {
        productContext: "facility",
        reuseMaintenance: true,
        maintenanceHref: "/pm/maintenance",
        note: "Execution uses the shared Maintenance work-order engine."
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load work order" },
      { status: 400 }
    );
  }
}
