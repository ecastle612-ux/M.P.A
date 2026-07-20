import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { isTimelineFilter } from "../../../../lib/facility/contracts";
import { listFacilityTimelineEvents } from "../../../../lib/facility/timeline";
import { apiError, apiInternalError } from "../../../../lib/api/http";

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
    if (!evaluatePermission(authorization, "maintenance:read")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const url = new URL(request.url);
    const filterParam = url.searchParams.get("filter");
    const items = await listFacilityTimelineEvents(
      organizationId,
      {
        propertyId: url.searchParams.get("propertyId") ?? undefined,
        unitId: url.searchParams.get("unitId") ?? undefined,
        vendorId: url.searchParams.get("vendorId") ?? undefined,
        search: url.searchParams.get("search") ?? url.searchParams.get("q") ?? undefined,
        filter: isTimelineFilter(filterParam) ? filterParam : "all",
        includePropertyWide: url.searchParams.get("includePropertyWide") === "true",
        limit: url.searchParams.get("limit") ? Number(url.searchParams.get("limit")) : undefined
      },
      supabase
    );

    return NextResponse.json({ items });
  } catch {
    return apiInternalError();
  }
}
