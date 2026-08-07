import { NextResponse } from "next/server";
import { createFacilityWorkOrderInputSchema } from "@mpa/shared";
import { requireFacilityPermission } from "../../../../lib/facility/authz";
import {
  buildFacilityOperationsAssistant,
  createFacilityWorkOrder,
  listFacilityExecutionSupport,
  listFacilityWorkOrders,
  summarizeFacilityWorkOrders
} from "../../../../lib/facility/operations-service";

export async function GET() {
  const authz = await requireFacilityPermission("facility.operations:read");
  if ("error" in authz) {
    return authz.error;
  }

  try {
    const [workOrders, support] = await Promise.all([
      listFacilityWorkOrders(authz.supabase, authz.organizationId),
      listFacilityExecutionSupport(authz.supabase, authz.organizationId)
    ]);
    const summary = summarizeFacilityWorkOrders(workOrders);
    return NextResponse.json({
      workOrders,
      technicians: support.technicians,
      vendors: support.vendors,
      productContext: "facility",
      summary,
      assistantRecommendation: buildFacilityOperationsAssistant(workOrders)
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load facility operations" },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  const authz = await requireFacilityPermission("facility.operations:write");
  if ("error" in authz) {
    return authz.error;
  }

  try {
    const body = createFacilityWorkOrderInputSchema.parse(await request.json());
    const workOrder = await createFacilityWorkOrder(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      body
    );
    return NextResponse.json({ workOrder }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create facility work order" },
      { status: 400 }
    );
  }
}
