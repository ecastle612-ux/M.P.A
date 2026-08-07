import { NextResponse } from "next/server";
import { triageWorkOrderInputSchema } from "@mpa/shared";
import { requireFacilityPermission } from "../../../../../lib/facility/authz";
import { triageFacilityWorkOrder } from "../../../../../lib/facility/operations-execution";

export async function POST(request: Request) {
  const authz = await requireFacilityPermission("facility.operations:assign");
  if ("error" in authz) {
    return authz.error;
  }

  try {
    const input = triageWorkOrderInputSchema.parse(await request.json());
    const workOrder = await triageFacilityWorkOrder(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      input
    );
    return NextResponse.json({ workOrder });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to triage work order" },
      { status: 400 }
    );
  }
}
