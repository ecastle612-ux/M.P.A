import { NextResponse } from "next/server";
import { createStaffResidentialWorkOrderInputSchema, isManagerClassRole } from "@mpa/shared";
import { requireMaintenancePermission } from "../../../../lib/maintenance/authz";
import {
  createStaffResidentialWorkOrder,
  getMaintenanceReadiness,
  listTechnicians,
  listVendors,
  listWorkOrders
} from "../../../../lib/maintenance/maintenance-service";

export async function GET() {
  const authz = await requireMaintenancePermission("pm.maintenance:read");
  if ("error" in authz) {
    return authz.error;
  }

  try {
    const [workOrders, technicians, vendors, readiness] = await Promise.all([
      listWorkOrders(authz.supabase, authz.organizationId, { surface: "residential" }),
      listTechnicians(authz.supabase, authz.organizationId),
      listVendors(authz.supabase, authz.organizationId),
      getMaintenanceReadiness(authz.supabase, authz.organizationId)
    ]);
    return NextResponse.json({
      workOrders,
      technicians,
      vendors,
      readiness,
      assistantRecommendation: readiness.maintenanceReady
        ? "Review your daily operations."
        : "Review your maintenance queue."
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load maintenance" },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  const authz = await requireMaintenancePermission("pm.maintenance:write");
  if ("error" in authz) {
    return authz.error;
  }
  if (!isManagerClassRole(authz.roles)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = createStaffResidentialWorkOrderInputSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const workOrder = await createStaffResidentialWorkOrder(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      parsed.data
    );
    return NextResponse.json({ workOrder }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create maintenance" },
      { status: 400 }
    );
  }
}
