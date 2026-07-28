import { NextResponse } from "next/server";
import { createAuthServerClient, createServiceRoleServerClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { apiError, apiInternalError } from "../../../../lib/api/http";
import { runGlobalSearch } from "../../../../lib/ops/global-search";
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
    const q = url.searchParams.get("q") ?? "";
    const limit = Math.min(Number(url.searchParams.get("limit") ?? "20") || 20, 40);

    const result = await runGlobalSearch({
      organizationId,
      principalId: user.id,
      rolePlane: authorization.roles[0] ?? "unknown",
      permissions: authorization.permissions,
      query: q,
      limit
    });

    const db = createServiceRoleServerClient() as unknown as OpsDbClient;
    void emitOpsDomainEvent(db, {
      eventType: "ops.search.performed",
      organizationId,
      subject: { type: "ops_search", id: organizationId },
      actor: { actor_type: "user", principal_id: user.id },
      summary: "Global search performed",
      payload: {
        summary: "Global search performed",
        queryLength: q.trim().length,
        resultCount: result.total,
        deniedCorpora: result.deniedCorpora
      }
    }).catch(() => undefined);

    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[ops/search GET]", error);
    return apiInternalError();
  }
}
