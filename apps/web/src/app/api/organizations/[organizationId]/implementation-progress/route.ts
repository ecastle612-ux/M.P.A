import { NextResponse } from "next/server";
import { apiError, apiInternalError } from "../../../../../lib/api/http";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import {
  evaluatePermission,
  resolveAuthorizationContext
} from "../../../../../lib/auth/authorization";
import { userHasMasterAdminCapability } from "../../../../../lib/master-admin/access";
import {
  getImplementationProgress,
  waiveOrDeferMilestone
} from "../../../../../lib/commercial/progress";
import {
  IMPLEMENTATION_MILESTONES,
  type ImplementationMilestone
} from "../../../../../lib/commercial/progress-types";

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
 * COM-001 Slice B — org implementation score (customer / CS / support).
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ organizationId: string }> }
) {
  try {
    const { organizationId } = await context.params;
    const access = await requireOrgAccess(organizationId);
    if (!access.ok) return access.response;

    const progress = await getImplementationProgress(organizationId, {
      refresh: true,
      actorUserId: access.user.id
    });
    return NextResponse.json(
      { ok: true, progress },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Progress failed";
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
      evaluatePermission(access.authorization, "membership:update") ||
      evaluatePermission(access.authorization, "authorization:manage");
    if (!canManage) return apiError(403, "FORBIDDEN", "Forbidden");

    const body = (await request.json()) as Record<string, unknown>;
    const action = typeof body["action"] === "string" ? body["action"] : "refresh";

    if (action === "refresh") {
      const progress = await getImplementationProgress(organizationId, {
        refresh: true,
        actorUserId: access.user.id
      });
      return NextResponse.json(
        { ok: true, progress },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    if (action === "waive" || action === "defer" || action === "solo_ack") {
      const milestone = typeof body["milestone"] === "string" ? body["milestone"] : "";
      if (!(IMPLEMENTATION_MILESTONES as readonly string[]).includes(milestone)) {
        return apiError(400, "INVALID_INPUT", "Valid milestone is required");
      }
      const progress = await waiveOrDeferMilestone({
        organizationId,
        milestone: milestone as ImplementationMilestone,
        mode: action,
        reason: typeof body["reason"] === "string" ? body["reason"] : null,
        actorUserId: access.user.id
      });
      return NextResponse.json(
        { ok: true, progress },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    return apiError(400, "INVALID_INPUT", "Unknown action");
  } catch (err) {
    const message = err instanceof Error ? err.message : "Progress update failed";
    if (message.includes("cannot") || message.includes("required") || message.includes("only")) {
      return apiError(400, "INVALID_INPUT", message);
    }
    return apiInternalError();
  }
}
