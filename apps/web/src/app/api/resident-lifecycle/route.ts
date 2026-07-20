import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../lib/organization/server";
import { apiError, apiInternalError } from "../../../lib/api/http";
import { getResidentLifecycleOpsMetrics } from "../../../lib/resident-lifecycle/server";

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
    if (!evaluatePermission(authorization, "tenant:read")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const metrics = await getResidentLifecycleOpsMetrics(organizationId, supabase);
    return NextResponse.json({ metrics }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return apiInternalError();
  }
}
