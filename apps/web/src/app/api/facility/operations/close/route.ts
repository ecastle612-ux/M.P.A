import { NextResponse } from "next/server";
import { closeFacilityWorkOrderInputSchema } from "@mpa/shared";
import { requireFacilityPermission } from "../../../../../lib/facility/authz";
import { closeFacilityOperationsWorkOrder } from "../../../../../lib/facility/operations-service";

export async function POST(request: Request) {
  const authz = await requireFacilityPermission("facility.operations:write");
  if ("error" in authz) {
    return authz.error;
  }

  try {
    const input = closeFacilityWorkOrderInputSchema.parse(await request.json());
    const workOrder = await closeFacilityOperationsWorkOrder(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      input.workOrderId,
      input.note
    );
    return NextResponse.json({ workOrder });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to close work order" },
      { status: 400 }
    );
  }
}
