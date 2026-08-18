import { NextResponse } from "next/server";
import { rerunAssignmentRulesInputSchema } from "@mpa/shared";
import { requireFacilityRoutingPermission } from "../../../../../lib/facility/authz";
import { routeFacilityWorkOrder } from "../../../../../lib/facility/assignment-routing-service";

export async function POST(request: Request) {
  const authz = await requireFacilityRoutingPermission();
  if ("error" in authz) return authz.error;
  const payload = await request.json().catch(() => null);
  const parsed = rerunAssignmentRulesInputSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const routed = await routeFacilityWorkOrder(
      authz.supabase,
      authz.organizationId,
      parsed.data.workOrderId,
      {
        trigger: "manager_rerun",
        actorUserId: authz.user.id
      }
    );
    return NextResponse.json({ routing: routed });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to apply assignment rules" },
      { status: 400 }
    );
  }
}
