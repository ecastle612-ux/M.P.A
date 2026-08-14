import { NextResponse } from "next/server";
import { FACILITY_ASSET_REPORT_TYPES, type FacilityAssetReportType } from "@mpa/shared";
import { requireFacilityAssetPermission } from "../../../../../lib/facility/authz";
import {
  auditFacilityReportExport,
  buildFacilityAssetReport,
  reportToCsv
} from "../../../../../lib/facility/asset-inventory-reports";

function parseType(url: string): FacilityAssetReportType {
  const value = new URL(url).searchParams.get("type") ?? "asset_list";
  if ((FACILITY_ASSET_REPORT_TYPES as readonly string[]).includes(value)) {
    return value as FacilityAssetReportType;
  }
  return "asset_list";
}

export async function GET(request: Request) {
  const authz = await requireFacilityAssetPermission("pm.maintenance:read", { managerOnly: true });
  if ("error" in authz) return authz.error;

  try {
    const reportType = parseType(request.url);
    const report = await buildFacilityAssetReport(authz.supabase, authz.organizationId, reportType);
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
      { error: error instanceof Error ? error.message : "Failed to load asset report" },
      { status: 400 }
    );
  }
}
