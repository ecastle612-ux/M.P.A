import { NextResponse } from "next/server";
import {
  EXECUTIVE_PERSONAS,
  REPORT_AREAS,
  type ExecutivePersona,
  type ReportArea,
  type ReportingFilters
} from "@mpa/shared";
import { requireReportPermission } from "../../../../lib/reports/authz";
import { buildOrganizationReportingSnapshot } from "../../../../lib/reports/analytics-service";

export async function GET(request: Request) {
  const authz = await requireReportPermission();
  if (authz.error) return authz.error;

  const url = new URL(request.url);
  const personaRaw = url.searchParams.get("persona");
  const areaRaw = url.searchParams.get("area");
  const persona =
    personaRaw && (EXECUTIVE_PERSONAS as readonly string[]).includes(personaRaw)
      ? (personaRaw as ExecutivePersona)
      : null;
  const area =
    areaRaw === "all"
      ? "all"
      : areaRaw && (REPORT_AREAS as readonly string[]).includes(areaRaw)
        ? (areaRaw as ReportArea)
        : null;

  const filters: ReportingFilters = {
    dateFrom: url.searchParams.get("dateFrom"),
    dateTo: url.searchParams.get("dateTo"),
    propertyId: url.searchParams.get("propertyId"),
    category: url.searchParams.get("category"),
    status: url.searchParams.get("status"),
    area,
    persona
  };

  const snapshot = await buildOrganizationReportingSnapshot(authz.supabase, authz.organizationId, {
    roles: authz.authorizationContext.roles ?? [],
    filters,
    personaOverride: persona
  });

  return NextResponse.json({ snapshot });
}
