import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/server";
import { apiError, apiInternalError, parseJsonBody } from "../../../../../lib/api/http";
import { sendOwnerOnboardingNudge } from "../../../../../lib/owner-payouts/service";

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
    const ownerUserId = typeof payload["ownerUserId"] === "string" ? payload["ownerUserId"] : "";
    if (!ownerUserId) return apiError(400, "INVALID_PAYLOAD", "ownerUserId required");

    const result = await sendOwnerOnboardingNudge({
      organizationId,
      ownerUserId,
      actorUserId: user.id,
      client: supabase
    });

    return NextResponse.json({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nudge failed";
    if (message.includes("disabled")) return apiError(403, "PHASE_DISABLED", message);
    return apiInternalError();
  }
}
