import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { getBuildingQrForProperty } from "../../../../lib/communication/server";
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
    if (!evaluatePermission(authorization, "communication:read")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const propertyId = new URL(request.url).searchParams.get("propertyId");
    if (!propertyId) return apiError(400, "INVALID_PAYLOAD", "Missing propertyId");

    const qrCode = await getBuildingQrForProperty(organizationId, propertyId, supabase);
    return NextResponse.json({ qrCode }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return apiInternalError();
  }
}
