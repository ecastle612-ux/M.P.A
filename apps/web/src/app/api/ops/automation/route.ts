import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { apiError, apiInternalError } from "../../../../lib/api/http";
import {
  listAutomationFires,
  listAutomationRules,
  setAutomationRuleEnabled
} from "../../../../lib/ops/automation-engine";

/**
 * OPS-001 Slice D — Automation Engine rules / fire ledger (no Command Center UI).
 */
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
    if (
      !evaluatePermission(authorization, "maintenance:read") &&
      !evaluatePermission(authorization, "maintenance:write")
    ) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const url = new URL(request.url);
    const view = url.searchParams.get("view") ?? "rules";

    if (view === "fires") {
      const fires = await listAutomationFires({ organizationId });
      return NextResponse.json({ fires }, { headers: { "Cache-Control": "no-store" } });
    }

    const rules = await listAutomationRules({ organizationId });
    return NextResponse.json({ rules }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[ops/automation GET]", error);
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
    if (!evaluatePermission(authorization, "maintenance:write")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const body = (await request.json()) as Record<string, unknown>;
    const ruleId = typeof body["ruleId"] === "string" ? body["ruleId"] : null;
    if (!ruleId || typeof body["enabled"] !== "boolean") {
      return apiError(400, "INVALID_BODY", "ruleId and enabled boolean required");
    }

    const rule = await setAutomationRuleEnabled({
      organizationId,
      ruleId,
      enabled: body["enabled"]
    });
    return NextResponse.json({ rule }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[ops/automation PATCH]", error);
    const message = error instanceof Error ? error.message : "Automation update failed";
    if (/not found|not org-owned/i.test(message)) {
      return apiError(400, "AUTOMATION_UPDATE_FAILED", message);
    }
    return apiInternalError();
  }
}
