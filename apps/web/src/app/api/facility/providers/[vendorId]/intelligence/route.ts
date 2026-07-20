import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../../lib/organization/server";
import { getServiceProviderIntelligence } from "../../../../../../lib/facility/provider-intelligence";
import { apiError, apiInternalError } from "../../../../../../lib/api/http";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ vendorId: string }> }
) {
  try {
    const { vendorId } = await params;
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) return apiError(400, "NO_ACTIVE_ORGANIZATION", "No active organization selected");

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (
      !evaluatePermission(authorization, "vendor:read") &&
      !evaluatePermission(authorization, "maintenance:read")
    ) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const intelligence = await getServiceProviderIntelligence(organizationId, vendorId, supabase);
    if (!intelligence) return apiError(404, "NOT_FOUND", "Not found");
    return NextResponse.json({ intelligence });
  } catch {
    return apiInternalError();
  }
}
