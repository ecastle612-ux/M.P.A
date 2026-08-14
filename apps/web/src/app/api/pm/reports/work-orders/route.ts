import { NextResponse } from "next/server";
import { requireMaintenancePermission } from "../../../../../lib/maintenance/authz";
import { parseWorkOrderReportFilters } from "../../../../../lib/work-order-reports/parse-filters";
import { buildWorkOrderReportSnapshot } from "../../../../../lib/work-order-reports/service";

export async function GET(request: Request) {
  const authz = await requireMaintenancePermission("pm.maintenance:read", "pm.maintenance");
  if ("error" in authz) {
    return authz.error;
  }

  try {
    const filters = parseWorkOrderReportFilters(new URL(request.url).searchParams);
    const result = await buildWorkOrderReportSnapshot({
      supabase: authz.supabase,
      organizationId: authz.organizationId,
      actorUserId: authz.user.id,
      surface: "residential",
      filters
    });

    return NextResponse.json({
      snapshot: result.snapshot,
      filterOptions: result.filterOptions
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to load property work order report"
      },
      { status: 400 }
    );
  }
}
