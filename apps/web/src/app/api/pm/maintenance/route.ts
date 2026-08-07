import { NextResponse } from "next/server";
import { requireMaintenancePermission } from "../../../../lib/maintenance/authz";
import {
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
      listWorkOrders(authz.supabase, authz.organizationId),
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
