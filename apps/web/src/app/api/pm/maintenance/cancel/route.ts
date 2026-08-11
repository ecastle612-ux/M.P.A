import { NextResponse } from "next/server";
import { cancelWorkOrderInputSchema } from "@mpa/shared";
import { requireMaintenancePermission } from "../../../../../lib/maintenance/authz";
import { cancelWorkOrder } from "../../../../../lib/maintenance/maintenance-service";

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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to cancel work order" },
      { status: 400 }
    );
  }
}
