import { NextResponse } from "next/server";
import { apiError, apiInternalError } from "../../../../../lib/api/http";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import {
  evaluatePermission,
  resolveAuthorizationContext
} from "../../../../../lib/auth/authorization";
import { userHasMasterAdminCapability } from "../../../../../lib/master-admin/access";
import {
  appendCommunicationTimeline,
  listCommunicationTimeline,
  TIMELINE_CHANNELS,
  type TimelineChannel
} from "../../../../../lib/commercial/timeline";

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
 * COM-001 Slice C — commercial communication timeline (org-scoped).
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ organizationId: string }> }
) {
  try {
    const { organizationId } = await context.params;
    const access = await requireOrgAccess(organizationId);
    if (!access.ok) return access.response;

    const url = new URL(request.url);
    const limitRaw = url.searchParams.get("limit");
    const limit = limitRaw ? Number(limitRaw) : 50;

    const entries = await listCommunicationTimeline({ organizationId, limit });
    return NextResponse.json(
      { ok: true, entries },
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

    const canWrite =
      access.actorIsMasterAdmin ||
      evaluatePermission(access.authorization, "authorization:manage");
    if (!canWrite) return apiError(403, "FORBIDDEN", "Forbidden");

    const body = (await request.json()) as Record<string, unknown>;
    const channel =
      typeof body["channel"] === "string" ? body["channel"] : "call_note";
    if (!(TIMELINE_CHANNELS as readonly string[]).includes(channel)) {
      return apiError(400, "INVALID_INPUT", "Valid channel is required");
    }
    const summary = typeof body["summary"] === "string" ? body["summary"].trim() : "";
    if (!summary) return apiError(400, "INVALID_INPUT", "summary is required");

    const entry = await appendCommunicationTimeline({
      organizationId,
      channel: channel as TimelineChannel,
      entryType:
        typeof body["entryType"] === "string"
          ? body["entryType"]
          : "customer_success_check_in",
      templateKey:
        typeof body["templateKey"] === "string"
          ? body["templateKey"]
          : "cs.manual_note",
      direction: body["direction"] === "outbound" ? "outbound" : "inbound_note",
      actorType: "cs_user",
      actorUserId: access.user.id,
      deliveryStatus: "n_a",
      summary,
      metadata:
        body["metadata"] && typeof body["metadata"] === "object"
          ? (body["metadata"] as Record<string, unknown>)
          : {},
      actorEmitUserId: access.user.id
    });

    return NextResponse.json(
      { ok: true, entry },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Timeline append failed";
    if (message.includes("credential") || message.includes("required")) {
      return apiError(400, "INVALID_INPUT", message);
    }
    return apiInternalError();
  }
}
