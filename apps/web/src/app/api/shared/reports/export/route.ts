import { NextResponse } from "next/server";
import {
  REPORT_AREAS,
  resolveAuthorizedReportShape,
  type ReportArea,
  type ReportingFilters
} from "@mpa/shared";
import { requireReportPermission } from "../../../../../lib/reports/authz";
import { buildOrganizationReportingSnapshot } from "../../../../../lib/reports/analytics-service";
import { buildReportingCsv } from "../../../../../lib/reports/csv-export";
import { buildReportingPdf } from "../../../../../lib/reports/pdf-export";

export async function GET(request: Request) {
  const authz = await requireReportPermission();
  if ("error" in authz) return authz.error;

  const url = new URL(request.url);
  const format = url.searchParams.get("format") ?? "pdf";
  const personaRaw = url.searchParams.get("persona");
  const areaRaw = url.searchParams.get("area");
  const area =
    areaRaw === "all"
      ? "all"
      : areaRaw && (REPORT_AREAS as readonly string[]).includes(areaRaw)
        ? (areaRaw as ReportArea)
        : null;

  const shape = resolveAuthorizedReportShape({
    roles: authz.roles,
    sku: authz.sku,
    entitlements: authz.entitlements,
    capabilities: authz.permissions,
    personaOverride: personaRaw,
    areaOverride: areaRaw,
    storedScope: authz.storedScope
  });
  if (!shape.allowed || !shape.persona) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const filters: ReportingFilters = {
    dateFrom: url.searchParams.get("dateFrom"),
    dateTo: url.searchParams.get("dateTo"),
    propertyId: url.searchParams.get("propertyId"),
    category: url.searchParams.get("category"),
    status: url.searchParams.get("status"),
    area,
    persona: shape.persona
  };

  const snapshot = await buildOrganizationReportingSnapshot(authz.supabase, authz.organizationId, {
    roles: authz.roles,
    filters,
    shape
  });

  if (format === "csv") {
    const csv = buildReportingCsv(snapshot);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="mpa-reporting-export.csv"`
      }
    });
  }

  const { bytes, fileName } = await buildReportingPdf(snapshot);
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`
    }
  });
}
