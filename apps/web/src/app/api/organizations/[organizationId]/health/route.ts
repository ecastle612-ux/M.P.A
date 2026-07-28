import { NextResponse } from "next/server";
import { apiError, apiInternalError } from "../../../../../lib/api/http";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import {
  evaluatePermission,
  resolveAuthorizationContext
} from "../../../../../lib/auth/authorization";
import { userHasMasterAdminCapability } from "../../../../../lib/master-admin/access";
import { getHealthScore } from "../../../../../lib/commercial/health";

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
  return { ok: true as const, user };
}

/**
 * COM-001 Slice C — org health score (customer / CS / support).
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ organizationId: string }> }
) {
  try {
    const { organizationId } = await context.params;
    const access = await requireOrgAccess(organizationId);
    if (!access.ok) return access.response;

    const health = await getHealthScore(organizationId, {
      refresh: true,
      actorUserId: access.user.id
    });
    return NextResponse.json(
      { ok: true, health },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Health failed";
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

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const action = typeof body["action"] === "string" ? body["action"] : "refresh";
    if (action !== "refresh") return apiError(400, "INVALID_INPUT", "Unknown action");

    const health = await getHealthScore(organizationId, {
      refresh: true,
      actorUserId: access.user.id
    });
    return NextResponse.json(
      { ok: true, health },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return apiInternalError();
  }
}
