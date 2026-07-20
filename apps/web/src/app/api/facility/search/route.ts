import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { searchFacilityMemory } from "../../../../lib/facility/search";
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
    const q = url.searchParams.get("q") ?? url.searchParams.get("search") ?? "";
    const propertyId = url.searchParams.get("propertyId");
    const items = await searchFacilityMemory(
      organizationId,
      q,
      {
        limit: url.searchParams.get("limit") ? Number(url.searchParams.get("limit")) : 24,
        ...(propertyId ? { propertyId } : {})
      },
      supabase
    );

    return NextResponse.json({ items });
  } catch {
    return apiInternalError();
  }
}
