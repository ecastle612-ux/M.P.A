import { NextResponse } from "next/server";
import { cancelWorkOrderInputSchema } from "@mpa/shared";
import { requireFacilityOperation } from "../../../../../lib/facility/authz";
import { requireFacilityWorkOrder } from "../../../../../lib/facility/assert-facility-work-order";
import { cancelWorkOrder } from "../../../../../lib/maintenance/maintenance-service";
import { reportApiFailure } from "../../../../../lib/observability/api-error";

function isExpectedCancelError(message: string) {
  return (
    /not found/i.test(message) ||
    /cannot cancel/i.test(message) ||
    /completed|closed|cancelled/i.test(message)
  );
}

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
    const message =
      error instanceof Error ? error.message : "Failed to cancel facility work order";
    if (isExpectedCancelError(message)) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return reportApiFailure({
      request,
      error,
      organizationId: authz.organizationId,
      actorId: authz.user.id,
      status: 500,
      publicMessage: "Failed to cancel facility work order",
      severity: "error"
    });
  }
}
