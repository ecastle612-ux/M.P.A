import { NextResponse } from "next/server";
import { z } from "zod";
import { requireFacilityPermission } from "../../../../../lib/facility/authz";
import { closeFacilityOperationsWorkOrder } from "../../../../../lib/facility/operations-service";

const closeSchema = z.object({
  workOrderId: z.string().uuid(),
  note: z.string().trim().max(1000).optional()
});

export async function POST(request: Request) {
  const authz = await requireFacilityPermission("facility.operations:write");
  if ("error" in authz) {
    return authz.error;
  }

  try {
    const input = closeSchema.parse(await request.json());
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
