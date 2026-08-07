import { NextResponse } from "next/server";
import { assignWorkOrderInputSchema } from "@mpa/shared";
import { requireFacilityPermission } from "../../../../../lib/facility/authz";
import { assignFacilityWorkOrder } from "../../../../../lib/facility/operations-execution";

export async function POST(request: Request) {
  const authz = await requireFacilityPermission("facility.operations:assign");
  if ("error" in authz) {
    return authz.error;
  }

  try {
    const input = assignWorkOrderInputSchema.parse(await request.json());
    const result = await assignFacilityWorkOrder(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      input
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to assign work order" },
      { status: 400 }
    );
  }
}
