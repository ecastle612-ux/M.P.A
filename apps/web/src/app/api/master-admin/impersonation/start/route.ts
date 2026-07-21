import { NextResponse } from "next/server";
import { apiError, apiInternalError } from "../../../../../lib/api/http";
import { requireMasterAdminApiAccess } from "../../../../../lib/master-admin/access";
import { startImpersonationSession } from "../../../../../lib/master-admin/session";

export async function POST(request: Request) {
  try {
    const access = await requireMasterAdminApiAccess();
    if (!access.ok) return access.response;

    const body = (await request.json().catch(() => null)) as {
      targetUserId?: string;
      targetDisplayName?: string;
      targetRoleLabel?: string;
      reason?: string;
      redirectTo?: string;
    } | null;

    if (!body?.targetUserId || !body.targetDisplayName || !body.targetRoleLabel) {
      return apiError(
        400,
        "INVALID_INPUT",
        "targetUserId, targetDisplayName, and targetRoleLabel are required."
      );
    }

    const session = await startImpersonationSession({
      user: access.user,
      organizationId: access.organizationId,
      targetUserId: body.targetUserId,
      targetDisplayName: body.targetDisplayName,
      targetRoleLabel: body.targetRoleLabel,
      reason: body.reason ?? null
    });

    return NextResponse.json(
      {
        session,
        redirectTo: body.redirectTo ?? "/dashboard"
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to start impersonation.";
    if (message.includes("Master Admin") || message.includes("Cannot impersonate") || message.includes("not an active")) {
      return apiError(400, "IMPERSONATION_DENIED", message);
    }
    return apiInternalError();
  }
}
