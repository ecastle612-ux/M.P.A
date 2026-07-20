import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { apiError, apiInternalError } from "../../../../lib/api/http";
import { runDataIntegrityAudit } from "../../../../lib/trust/data-integrity";

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
    if (!evaluatePermission(authorization, "organization:read") && !evaluatePermission(authorization, "migration:read")) {
      return apiError(403, "FORBIDDEN", "You don’t have permission to run a data integrity check.");
    }

    const integrity = await runDataIntegrityAudit(organizationId, supabase);
    return NextResponse.json({ integrity }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return apiInternalError();
  }
}
