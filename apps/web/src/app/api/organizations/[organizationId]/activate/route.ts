import { NextResponse } from "next/server";
import { apiError, apiInternalError } from "../../../../../lib/api/http";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import {
  evaluatePermission,
  resolveAuthorizationContext
} from "../../../../../lib/auth/authorization";
import { userHasMasterAdminCapability } from "../../../../../lib/master-admin/access";
import { activateOrganizationCommercialStatus } from "../../../../../lib/auth/recovery/commercial-activate";
import { readRequestMeta } from "../../../../../lib/auth/recovery/request-meta";

export async function POST(
  request: Request,
  context: { params: Promise<{ organizationId: string }> }
) {
  try {
    const { organizationId } = await context.params;
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Please sign in to continue.");

    const actorIsMasterAdmin = await userHasMasterAdminCapability(user);
    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "membership:update") && !actorIsMasterAdmin) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const meta = readRequestMeta(request);
    const result = await activateOrganizationCommercialStatus({
      organizationId,
      actorUserId: user.id,
      actorIsMasterAdmin,
      ipAddress: meta.ipAddress,
      device: meta.device
    });

    return NextResponse.json({ ok: true, ...result }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Activation failed";
    if (message.includes("must be") || message.includes("not found") || message.includes("Forbidden")) {
      return apiError(400, "INVALID_INPUT", message);
    }
    return apiInternalError();
  }
}
