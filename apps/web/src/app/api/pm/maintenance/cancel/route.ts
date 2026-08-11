import { NextResponse } from "next/server";
import { cancelWorkOrderInputSchema } from "@mpa/shared";
import { requireMaintenancePermission } from "../../../../../lib/maintenance/authz";
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
  const authz = await requireMaintenancePermission("pm.maintenance:assign");
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
    const workOrder = await cancelWorkOrder(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      parsed.data
    );
    return NextResponse.json({ workOrder });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to cancel work order";
    if (isExpectedCancelError(message)) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return reportApiFailure({
      request,
      error,
      organizationId: authz.organizationId,
      actorId: authz.user.id,
      status: 500,
      publicMessage: "Failed to cancel work order",
      severity: "error"
    });
  }
}
