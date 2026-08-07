import { NextResponse } from "next/server";
import { progressWorkOrderInputSchema } from "@mpa/shared";
import { requireFacilityPermission } from "../../../../../lib/facility/authz";
import { progressFacilityWorkOrder } from "../../../../../lib/facility/operations-execution";

export async function POST(request: Request) {
  const authz = await requireFacilityPermission("facility.operations:write");
  if ("error" in authz) {
    return authz.error;
  }

  try {
    const input = progressWorkOrderInputSchema.parse(await request.json());
    const workOrder = await progressFacilityWorkOrder(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      "manager",
      input
    );
    return NextResponse.json({ workOrder });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to progress work order" },
      { status: 400 }
    );
  }
}
