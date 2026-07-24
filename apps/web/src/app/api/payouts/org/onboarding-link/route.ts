import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/server";
import { apiError, apiInternalError, parseJsonBody } from "../../../../../lib/api/http";
import { createOrgSettlementOnboardingLink } from "../../../../../lib/owner-payouts/service";

export async function POST(request: Request) {
  try {
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) return apiError(400, "NO_ACTIVE_ORGANIZATION", "No active organization");

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "payout:manage")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const parsed = await parseJsonBody(request);
    if (!parsed.ok) return parsed.response;
    const payload = parsed.payload as Record<string, unknown>;
    const returnPath =
      typeof payload["returnPath"] === "string" ? payload["returnPath"] : "/settings/payouts";
    const refreshPath =
      typeof payload["refreshPath"] === "string" ? payload["refreshPath"] : returnPath;

    const result = await createOrgSettlementOnboardingLink({
      organizationId,
      email: user.email ?? null,
      returnPath,
      refreshPath,
      actorUserId: user.id,
      client: supabase
    });

    return NextResponse.json({ link: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Onboarding link failed";
    if (message.includes("disabled")) return apiError(403, "PHASE_DISABLED", message);
    if (message.toLowerCase().includes("not allowed")) {
      return apiError(400, "INVALID_RETURN_URL", message);
    }
    return apiInternalError();
  }
}
