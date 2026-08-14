import { NextResponse } from "next/server";
import {
  FACILITY_INVENTORY_REPORT_TYPES,
  type FacilityInventoryReportType
} from "@mpa/shared";
import { requireFacilityInventoryPermission } from "../../../../../lib/facility/authz";
import {
  auditFacilityReportExport,
  buildFacilityInventoryReport,
  reportToCsv
} from "../../../../../lib/facility/asset-inventory-reports";

function parseType(url: string): FacilityInventoryReportType {
  const value = new URL(url).searchParams.get("type") ?? "current_stock";
  if ((FACILITY_INVENTORY_REPORT_TYPES as readonly string[]).includes(value)) {
    return value as FacilityInventoryReportType;
  }
  return "current_stock";
}

export async function GET(request: Request) {
  const authz = await requireFacilityInventoryPermission("pm.maintenance:read", {
    managerOnly: true
  });
  if ("error" in authz) return authz.error;

  try {
    const reportType = parseType(request.url);
    const report = await buildFacilityInventoryReport(
      authz.supabase,
      authz.organizationId,
      reportType
    );
    const format = new URL(request.url).searchParams.get("format");
    if (format === "csv") {
      await auditFacilityReportExport({
        supabase: authz.supabase,
        organizationId: authz.organizationId,
        actorUserId: authz.user.id,
        reportType,
        format: "csv",
        rowCount: report.rows.length
      });
      return new NextResponse(reportToCsv(report.title, report.rows as Array<Record<string, unknown>>), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${reportType}.csv"`
        }
      });
    }
    return NextResponse.json({ report });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load inventory report" },
      { status: 400 }
    );
  }
}
