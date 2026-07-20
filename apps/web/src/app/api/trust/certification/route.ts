import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { apiError, apiInternalError } from "../../../../lib/api/http";
import { buildTrustCertificationReport } from "../../../../lib/trust/certification-report";

export async function GET() {
  try {
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Please sign in to continue.");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) {
      return apiError(400, "NO_ORGANIZATION", "Select or create an organization first.");
    }

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "authorization:manage") && !evaluatePermission(authorization, "migration:read")) {
      return apiError(403, "FORBIDDEN", "You don’t have permission to view trust certification.");
    }

    const report = await buildTrustCertificationReport({
      organizationId,
      includeIntegrity: evaluatePermission(authorization, "organization:read")
    });

    return NextResponse.json({ report }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return apiInternalError();
  }
}
