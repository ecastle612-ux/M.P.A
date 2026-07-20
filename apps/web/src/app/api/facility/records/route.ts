import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { listFacilityRecords } from "../../../../lib/facility/server";
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
    const items = await listFacilityRecords(
      organizationId,
      {
        search: url.searchParams.get("search") ?? undefined,
        propertyId: url.searchParams.get("propertyId") ?? undefined,
        unitId: url.searchParams.get("unitId") ?? undefined,
        vendorId: url.searchParams.get("vendorId") ?? undefined,
        completedFrom: url.searchParams.get("completedFrom") ?? undefined,
        completedTo: url.searchParams.get("completedTo") ?? undefined,
        limit: url.searchParams.get("limit")
          ? Number(url.searchParams.get("limit"))
          : undefined,
        includeSuperseded: url.searchParams.get("includeSuperseded") === "true"
      },
      supabase
    );

    return NextResponse.json({ items });
  } catch {
    return apiInternalError();
  }
}
