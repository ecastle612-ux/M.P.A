import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { apiError, apiInternalError, parseJsonBody } from "../../../../lib/api/http";
import { parseReportRequestInput } from "../../../../lib/reporting/contracts";
import { ReportingService } from "../../../../lib/reporting/service";

export async function POST(request: Request) {
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

    const parsedBody = await parseJsonBody(request);
    if (!parsedBody.ok) return parsedBody.response;
    const payload = parsedBody.payload as Record<string, unknown>;
    const input = parseReportRequestInput(payload);
    if (!input) return apiError(400, "INVALID_PAYLOAD", "Invalid report generate payload");

    const wait = payload["wait"] === false ? false : true;
    const job = await ReportingService.generateReport({
      user,
      organizationId,
      request: input,
      wait,
      client: supabase
    });

    return NextResponse.json({ job }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return apiInternalError();
  }
}
