import { NextResponse } from "next/server";
import { requireMaintenancePermission } from "../../../../lib/maintenance/authz";
import {
  getMaintenanceReadiness,
  listTechnicians,
  listVendors,
  listWorkOrders
} from "../../../../lib/maintenance/maintenance-service";

export async function GET(request: Request) {
  const authz = await requireMaintenancePermission("pm.maintenance:read");
  if ("error" in authz) {
    return authz.error;
  }

  const requested = new URL(request.url).searchParams.get("productContext");
  // Default residential queue. Facility WOs require an explicit labeled filter (E3-3).
  const productContext =
    requested === "facility" || requested === "property_manager" ? requested : "property_manager";

  try {
    const [workOrders, technicians, vendors, readiness] = await Promise.all([
      listWorkOrders(authz.supabase, authz.organizationId, { productContext }),
      listTechnicians(authz.supabase, authz.organizationId),
      listVendors(authz.supabase, authz.organizationId),
      getMaintenanceReadiness(authz.supabase, authz.organizationId)
    ]);
    return NextResponse.json({
      workOrders,
      technicians,
      vendors,
      readiness,
      productContext,
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
