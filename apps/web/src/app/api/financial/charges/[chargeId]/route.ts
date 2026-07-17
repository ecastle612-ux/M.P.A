import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/server";
import { getRentChargeForOrganization } from "../../../../../lib/financial/server";
import { apiError, apiInternalError } from "../../../../../lib/api/http";

type RouteContext = { params: Promise<{ chargeId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { chargeId } = await context.params;
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

    const charge = await getRentChargeForOrganization(organizationId, chargeId, supabase);
    if (!charge) return apiError(404, "NOT_FOUND", "Charge not found");
    return NextResponse.json({ charge }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return apiInternalError();
  }
}
