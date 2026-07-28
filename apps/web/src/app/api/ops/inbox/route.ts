import { NextResponse } from "next/server";
import { createAuthServerClient, createServiceRoleServerClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { apiError, apiInternalError } from "../../../../lib/api/http";
import { listUnifiedInbox, markInboxItemRead, type UnifiedInboxFilters } from "../../../../lib/ops/unified-inbox";
import { emitOpsDomainEvent } from "../../../../lib/ops/emit";
import type { OpsDbClient } from "../../../../lib/ops/types";

function canAccessOpsSurface(authorization: Awaited<ReturnType<typeof resolveAuthorizationContext>>) {
  return (
    evaluatePermission(authorization, "maintenance:read") ||
    evaluatePermission(authorization, "maintenance:write") ||
    evaluatePermission(authorization, "dashboard:read") ||
    evaluatePermission(authorization, "org:manage") ||
    evaluatePermission(authorization, "master_admin")
  );
}

export async function GET(request: Request) {
  try {
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) return apiError(400, "NO_ACTIVE_ORGANIZATION", "No active organization selected");

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!canAccessOpsSurface(authorization)) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const url = new URL(request.url);
    const filters: UnifiedInboxFilters = {
      organizationId,
      principalId: user.id,
      kind: (url.searchParams.get("kind") as UnifiedInboxFilters["kind"]) ?? "all",
      status: (url.searchParams.get("status") as UnifiedInboxFilters["status"]) ?? "all",
      unreadOnly: url.searchParams.get("unreadOnly") === "1",
      assignedToMe: url.searchParams.get("assignedToMe") === "1",
      limit: Math.min(Number(url.searchParams.get("limit") ?? "50") || 50, 100)
    };

    const result = await listUnifiedInbox(filters);

    const db = createServiceRoleServerClient() as unknown as OpsDbClient;
    void emitOpsDomainEvent(db, {
      eventType: "ops.inbox.opened",
      organizationId,
      subject: { type: "ops_inbox", id: organizationId },
      actor: { actor_type: "user", principal_id: user.id },
      summary: "Unified Inbox opened",
      payload: {
        summary: "Unified Inbox opened",
        unreadCount: result.unreadCount,
        kind: filters.kind ?? "all"
      }
    }).catch(() => undefined);

    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[ops/inbox GET]", error);
    return apiInternalError();
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) return apiError(400, "NO_ACTIVE_ORGANIZATION", "No active organization selected");

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!canAccessOpsSurface(authorization)) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const body = (await request.json()) as {
      sourceId?: string;
      read?: boolean;
    };
    if (!body.sourceId || typeof body.sourceId !== "string") {
      return apiError(400, "INVALID_BODY", "sourceId is required");
    }

    const ok = await markInboxItemRead({
      organizationId,
      principalId: user.id,
      sourceId: body.sourceId,
      read: body.read !== false
    });
    if (!ok) return apiError(400, "MARK_FAILED", "Could not update read state for this item kind");

    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[ops/inbox PATCH]", error);
    return apiInternalError();
  }
}
