import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { getOwnerStatementForOrganization } from "../../../../lib/financial/server";
import { apiError, apiInternalError } from "../../../../lib/api/http";

type RouteContext = { params: Promise<{ statementId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { statementId } = await context.params;
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

    const statement = await getOwnerStatementForOrganization(organizationId, statementId, supabase);
    if (!statement) return apiError(404, "NOT_FOUND", "Owner statement not found");
    return NextResponse.json({ statement }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return apiInternalError();
  }
}
