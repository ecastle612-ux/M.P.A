import { NextResponse } from "next/server";
import { apiError, apiInternalError } from "../../../../../lib/api/http";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import {
  evaluatePermission,
  resolveAuthorizationContext
} from "../../../../../lib/auth/authorization";
import { userHasMasterAdminCapability } from "../../../../../lib/master-admin/access";
import {
  dismissOrSnoozeDiscovery,
  getFeatureDiscoveries,
  impressDiscovery
} from "../../../../../lib/commercial/discovery";
import {
  DISCOVERY_KEYS,
  type DiscoveryKey
} from "../../../../../lib/commercial/discovery-types";

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
 * COM-001 Slice C — entitlement-safe feature discovery.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ organizationId: string }> }
) {
  try {
    const { organizationId } = await context.params;
    const access = await requireOrgAccess(organizationId);
    if (!access.ok) return access.response;

    const discoveries = await getFeatureDiscoveries(organizationId);
    return NextResponse.json(
      { ok: true, discoveries },
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
    const access = await requireOrgAccess(organizationId);
    if (!access.ok) return access.response;

    const canManage =
      access.actorIsMasterAdmin ||
      evaluatePermission(access.authorization, "membership:update") ||
      evaluatePermission(access.authorization, "authorization:manage") ||
      evaluatePermission(access.authorization, "organization:update");
    if (!canManage) return apiError(403, "FORBIDDEN", "Forbidden");

    const body = (await request.json()) as Record<string, unknown>;
    const action = typeof body["action"] === "string" ? body["action"] : "";
    const discoveryKey =
      typeof body["discoveryKey"] === "string" ? body["discoveryKey"] : "";
    if (!(DISCOVERY_KEYS as readonly string[]).includes(discoveryKey)) {
      return apiError(400, "INVALID_INPUT", "Valid discoveryKey is required");
    }
    const key = discoveryKey as DiscoveryKey;

    if (action === "impress") {
      const discoveries = await impressDiscovery({
        organizationId,
        discoveryKey: key,
        actorUserId: access.user.id
      });
      return NextResponse.json(
        { ok: true, discoveries },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    if (action === "dismiss" || action === "snooze" || action === "accept") {
      const discoveries = await dismissOrSnoozeDiscovery({
        organizationId,
        discoveryKey: key,
        mode: action,
        ...(typeof body["snoozeDays"] === "number" ? { snoozeDays: body["snoozeDays"] } : {}),
        actorUserId: access.user.id
      });
      return NextResponse.json(
        { ok: true, discoveries },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    return apiError(400, "INVALID_INPUT", "Unknown action");
  } catch (err) {
    const message = err instanceof Error ? err.message : "Discovery update failed";
    if (
      message.includes("not currently") ||
      message.includes("not entitled") ||
      message.includes("Unknown")
    ) {
      return apiError(400, "INVALID_INPUT", message);
    }
    return apiInternalError();
  }
}
