import { NextResponse } from "next/server";
import { apiError, apiInternalError } from "../../../../../lib/api/http";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import {
  evaluatePermission,
  resolveAuthorizationContext
} from "../../../../../lib/auth/authorization";
import { userHasMasterAdminCapability } from "../../../../../lib/master-admin/access";
import { getTrialLifecycle, startTrialConversion } from "../../../../../lib/commercial/trial";

async function requireOrgAccess(organizationId: string) {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, response: apiError(401, "UNAUTHENTICATED", "Please sign in.") };

  const actorIsMasterAdmin = await userHasMasterAdminCapability(user);
  const authorization = await resolveAuthorizationContext(user, organizationId);
  const canRead =
    actorIsMasterAdmin ||
    evaluatePermission(authorization, "organization:read") ||
    evaluatePermission(authorization, "saas:read");
  if (!canRead) {
    return { ok: false as const, response: apiError(403, "FORBIDDEN", "Forbidden") };
  }
  return { ok: true as const, user, actorIsMasterAdmin, authorization };
}

/**
 * COM-001 Slice B — trial lifecycle status + convert via BILL-001 portal.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ organizationId: string }> }
) {
  try {
    const { organizationId } = await context.params;
    const access = await requireOrgAccess(organizationId);
    if (!access.ok) return access.response;

    const trial = await getTrialLifecycle(organizationId, {
      actorUserId: access.user.id,
      emitReminders: true
    });
    return NextResponse.json({ ok: true, trial }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Trial status failed";
    if (message.includes("not found")) return apiError(404, "NOT_FOUND", message);
    return apiInternalError();
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ organizationId: string }> }
) {
  try {
    const { organizationId } = await context.params;
    const access = await requireOrgAccess(organizationId);
    if (!access.ok) return access.response;

    const canManage =
      access.actorIsMasterAdmin ||
      evaluatePermission(access.authorization, "saas:manage") ||
      evaluatePermission(access.authorization, "organization:update");
    if (!canManage) return apiError(403, "FORBIDDEN", "Forbidden");

    const body = (await request.json()) as Record<string, unknown>;
    const action = typeof body["action"] === "string" ? body["action"] : "convert";

    if (action === "refresh") {
      const trial = await getTrialLifecycle(organizationId, {
        actorUserId: access.user.id,
        emitReminders: true
      });
      return NextResponse.json({ ok: true, trial }, { headers: { "Cache-Control": "no-store" } });
    }

    if (action === "convert") {
      const returnUrl =
        typeof body["returnUrl"] === "string" && body["returnUrl"].trim()
          ? body["returnUrl"].trim()
          : `${new URL(request.url).origin}/settings/billing?saas=success`;
      const result = await startTrialConversion({
        organizationId,
        actorUserId: access.user.id,
        returnUrl
      });
      return NextResponse.json(
        { ok: true, ...result },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    return apiError(400, "INVALID_INPUT", "Unknown action");
  } catch (err) {
    const message = err instanceof Error ? err.message : "Trial action failed";
    if (
      message.includes("not on a trial") ||
      message.includes("already") ||
      message.includes("grace ended") ||
      message.includes("customer")
    ) {
      return apiError(400, "INVALID_INPUT", message);
    }
    return apiInternalError();
  }
}
