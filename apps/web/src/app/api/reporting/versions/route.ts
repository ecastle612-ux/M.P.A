import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { apiError, apiInternalError } from "../../../../lib/api/http";
import { isReportType } from "../../../../lib/reporting/contracts";
import { ReportingService } from "../../../../lib/reporting/service";

export async function GET(request: Request) {
  try {
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) return apiError(400, "NO_ACTIVE_ORGANIZATION", "No active organization selected");

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "financial:read")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const url = new URL(request.url);
    const propertyId = url.searchParams.get("propertyId")?.trim() ?? "";
    if (!propertyId) return apiError(400, "INVALID_PAYLOAD", "propertyId is required");

    const reportTypeRaw = url.searchParams.get("reportType");
    const yearRaw = url.searchParams.get("year");
    const monthRaw = url.searchParams.get("month");
    const yearNum = yearRaw ? Number(yearRaw) : NaN;
    const monthNum = monthRaw ? Number(monthRaw) : NaN;

    const input: Parameters<typeof ReportingService.listVersions>[0] = {
      organizationId,
      propertyId
    };
    if (isReportType(reportTypeRaw)) input.reportType = reportTypeRaw;
    if (Number.isInteger(yearNum)) input.year = yearNum;
    if (Number.isInteger(monthNum)) input.month = monthNum;
    const versions = await ReportingService.listVersions(input);

    return NextResponse.json({ versions }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return apiInternalError();
  }
}
