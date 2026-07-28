import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { apiError, apiInternalError } from "../../../../lib/api/http";
import {
  executeQuickAction,
  listQuickActionsForContext,
  type QuickActionContext
} from "../../../../lib/ops/quick-actions";

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
    const context = (url.searchParams.get("context") as QuickActionContext) || "command_center";

    const actions = listQuickActionsForContext({
      rolePlane: authorization.roles[0] ?? "unknown",
      permissions: authorization.permissions,
      context
    });

    return NextResponse.json({ actions }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[ops/quick-actions GET]", error);
    return apiInternalError();
  }
}

export async function POST(request: Request) {
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
      actionId?: string;
      params?: Record<string, unknown>;
    };
    if (!body.actionId || typeof body.actionId !== "string") {
      return apiError(400, "INVALID_BODY", "actionId is required");
    }

    const result = await executeQuickAction({
      actionId: body.actionId,
      organizationId,
      principalId: user.id,
      rolePlane: authorization.roles[0] ?? "unknown",
      permissions: authorization.permissions,
      ...(body.params !== undefined ? { params: body.params } : {})
    });

    if (!result.ok) {
      return apiError(403, "ACTION_DENIED", result.error ?? "Action denied");
    }

    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[ops/quick-actions POST]", error);
    return apiInternalError();
  }
}
