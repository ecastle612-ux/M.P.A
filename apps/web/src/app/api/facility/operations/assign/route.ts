import { NextResponse } from "next/server";
import { assignWorkOrderInputSchema } from "@mpa/shared";
import { requireFacilityOperation } from "../../../../../lib/facility/authz";
import { requireFacilityWorkOrder } from "../../../../../lib/facility/assert-facility-work-order";
import { assignWorkOrder } from "../../../../../lib/maintenance/maintenance-service";

export async function POST(request: Request) {
  const authz = await requireFacilityOperation("pm.maintenance:assign", "facility.operations");
  if ("error" in authz) {
    return authz.error;
  }

  const payload = await request.json().catch(() => null);
  const parsed = assignWorkOrderInputSchema.safeParse(payload);
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

    const result = await assignWorkOrder(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      parsed.data
    );
    return NextResponse.json({
      workOrder: result.workOrder,
      vendorPortalHandoff: result.vendorPortalHandoff
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to assign facility work order" },
      { status: 400 }
    );
  }
}
