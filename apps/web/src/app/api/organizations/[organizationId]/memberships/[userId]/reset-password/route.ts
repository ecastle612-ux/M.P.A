import { NextResponse } from "next/server";
import { apiError, apiInternalError } from "../../../../../../../lib/api/http";
import { createAuthServerClient } from "../../../../../../../lib/auth/server";
import {
  evaluatePermission,
  resolveAuthorizationContext
} from "../../../../../../../lib/auth/authorization";
import { userHasMasterAdminCapability } from "../../../../../../../lib/master-admin/access";
import { resetSubaccountCredentials } from "../../../../../../../lib/auth/recovery/subaccount-reset";
import { readRequestMeta } from "../../../../../../../lib/auth/recovery/request-meta";

export async function POST(
  request: Request,
  context: { params: Promise<{ organizationId: string; userId: string }> }
) {
  try {
    const { organizationId, userId } = await context.params;
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

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const meta = readRequestMeta(request);
    const result = await resetSubaccountCredentials({
      organizationId,
      targetUserId: userId,
      actorUserId: user.id,
      actorIsMasterAdmin,
      reason: typeof body["reason"] === "string" ? body["reason"] : null,
      ipAddress: meta.ipAddress,
      device: meta.device
    });

    return NextResponse.json(
      {
        ok: true,
        targetUserId: result.targetUserId,
        username: result.username,
        deliveryStatus: result.deliveryStatus,
        auditId: result.auditId
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Reset failed";
    if (
      message.includes("Forbidden") ||
      message.includes("cannot") ||
      message.includes("Cannot") ||
      message.includes("not found") ||
      message.includes("no contact") ||
      message.includes("self-serve") ||
      message.includes("only be recovered")
    ) {
      return apiError(400, "INVALID_INPUT", message);
    }
    return apiInternalError();
  }
}
