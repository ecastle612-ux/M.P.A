import { NextResponse } from "next/server";
import { buildWorkOrderReportCsv, workOrderReportCsvFileName } from "@mpa/shared";
import { requireFacilityOperation } from "../../../../../../lib/facility/authz";
import { parseWorkOrderReportFilters } from "../../../../../../lib/work-order-reports/parse-filters";
import { buildWorkOrderReportPdf } from "../../../../../../lib/work-order-reports/pdf-export";
import {
  auditWorkOrderReportExport,
  buildWorkOrderReportSnapshot
} from "../../../../../../lib/work-order-reports/service";

export async function GET(request: Request) {
  const authz = await requireFacilityOperation("pm.maintenance:read", "facility.operations");
  if ("error" in authz) {
    return authz.error;
  }

  try {
    const searchParams = new URL(request.url).searchParams;
    const format = searchParams.get("format") === "csv" ? "csv" : "pdf";
    const filters = parseWorkOrderReportFilters(searchParams);
    const { snapshot } = await buildWorkOrderReportSnapshot({
      supabase: authz.supabase,
      organizationId: authz.organizationId,
      actorUserId: authz.user.id,
      surface: "facility",
      filters
    });

    await auditWorkOrderReportExport({
      supabase: authz.supabase,
      organizationId: authz.organizationId,
      actorUserId: authz.user.id,
      surface: "facility",
      format,
      snapshot
    });

    if (format === "csv") {
      const csv = buildWorkOrderReportCsv(snapshot);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${workOrderReportCsvFileName(snapshot)}"`
        }
      });
    }

    const pdf = await buildWorkOrderReportPdf(snapshot);
    return new NextResponse(Buffer.from(pdf.bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${pdf.fileName}"`
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to export facility work order report" },
      { status: 400 }
    );
  }
}
