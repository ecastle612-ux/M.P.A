import { NextResponse } from "next/server";
import { apiError, apiInternalError } from "../../../../../lib/api/http";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import {
  evaluatePermission,
  resolveAuthorizationContext
} from "../../../../../lib/auth/authorization";
import { userHasMasterAdminCapability } from "../../../../../lib/master-admin/access";
import {
  CS_MOTION_KEYS,
  completeCsMotion,
  listCsMotions,
  refreshCsMotionDueHooks,
  scheduleCsMotions,
  type CsMotionKey
} from "../../../../../lib/commercial/cs-motions";

async function requireOrgAccess(organizationId: string, manage: boolean) {
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
  if (manage) {
    const canManage =
      actorIsMasterAdmin || evaluatePermission(authorization, "authorization:manage");
    if (!canManage) {
      return { ok: false as const, response: apiError(403, "FORBIDDEN", "Forbidden") };
    }
  }
  return { ok: true as const, user };
}

/**
 * COM-001 Slice D — CS 30/90 motion schedule (org-scoped).
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ organizationId: string }> }
) {
  try {
    const { organizationId } = await context.params;
    const access = await requireOrgAccess(organizationId, false);
    if (!access.ok) return access.response;

    const motions = await refreshCsMotionDueHooks({
      organizationId,
      actorUserId: access.user.id
    });
    return NextResponse.json(
      { ok: true, motions },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return apiInternalError();
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ organizationId: string }> }
) {
  try {
    const { organizationId } = await context.params;
    const access = await requireOrgAccess(organizationId, true);
    if (!access.ok) return access.response;

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const action = typeof body["action"] === "string" ? body["action"] : "refresh";

    if (action === "schedule") {
      const motions = await scheduleCsMotions({
        organizationId,
        actorUserId: access.user.id
      });
      return NextResponse.json(
        { ok: true, motions },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    if (action === "refresh") {
      const motions = await refreshCsMotionDueHooks({
        organizationId,
        actorUserId: access.user.id
      });
      return NextResponse.json(
        { ok: true, motions },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    if (action === "complete" || action === "skip") {
      const motionKey = String(body["motionKey"] ?? "") as CsMotionKey;
      if (!(CS_MOTION_KEYS as readonly string[]).includes(motionKey)) {
        return apiError(400, "INVALID_INPUT", "Unknown motion key");
      }
      const motion = await completeCsMotion({
        organizationId,
        motionKey,
        notes: typeof body["notes"] === "string" ? body["notes"] : null,
        actorUserId: access.user.id,
        skip: action === "skip"
      });
      const motions = await listCsMotions(organizationId);
      return NextResponse.json(
        { ok: true, motion, motions },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    return apiError(400, "INVALID_INPUT", "Unknown action");
  } catch (err) {
    const message = err instanceof Error ? err.message : "CS motion failed";
    if (message.includes("Unknown")) return apiError(400, "INVALID_INPUT", message);
    return apiInternalError();
  }
}
