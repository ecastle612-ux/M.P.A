import { NextResponse } from "next/server";
import { requireFacilityOperation } from "../../../../../lib/facility/authz";
import { parseWorkOrderReportFilters } from "../../../../../lib/work-order-reports/parse-filters";
import { buildWorkOrderReportSnapshot } from "../../../../../lib/work-order-reports/service";

export async function GET(request: Request) {
  const authz = await requireFacilityOperation("pm.maintenance:read", "facility.operations");
  if ("error" in authz) {
    return authz.error;
  }

  try {
    const filters = parseWorkOrderReportFilters(new URL(request.url).searchParams);
    const result = await buildWorkOrderReportSnapshot({
      supabase: authz.supabase,
      organizationId: authz.organizationId,
      actorUserId: authz.user.id,
      surface: "facility",
      filters
    });

    return NextResponse.json({
      snapshot: result.snapshot,
      filterOptions: result.filterOptions
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load facility work order report" },
      { status: 400 }
    );
  }
}
