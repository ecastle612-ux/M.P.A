import { NextResponse } from "next/server";
import { cancelWorkOrderInputSchema } from "@mpa/shared";
import { requireFacilityOperation } from "../../../../../lib/facility/authz";
import { requireFacilityWorkOrder } from "../../../../../lib/facility/assert-facility-work-order";
import { cancelWorkOrder } from "../../../../../lib/maintenance/maintenance-service";

export async function POST(request: Request) {
  const authz = await requireFacilityOperation("pm.maintenance:assign", "facility.operations");
  if ("error" in authz) {
    return authz.error;
  }

  const payload = await request.json().catch(() => null);
  const parsed = cancelWorkOrderInputSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const existing = await requireFacilityWorkOrder(
      authz.supabase,
      authz.organizationId,
      parsed.data.workOrderId
    );
    if ("error" in existing) {
      return NextResponse.json({ error: existing.error }, { status: existing.status });
    }

    const workOrder = await cancelWorkOrder(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      parsed.data
    );
    return NextResponse.json({ workOrder });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to cancel facility work order" },
      { status: 400 }
    );
  }
}
