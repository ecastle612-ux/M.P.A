import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { getMigrationDashboardMetrics } from "../../../../lib/migration/server";
import { apiError, apiInternalError } from "../../../../lib/api/http";

export async function GET() {
  try {
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) {
      return NextResponse.json({ metrics: null }, { headers: { "Cache-Control": "no-store" } });
    }

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "migration:read")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const metrics = await getMigrationDashboardMetrics(organizationId, supabase);
    return NextResponse.json({ metrics }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return apiInternalError();
  }
}
