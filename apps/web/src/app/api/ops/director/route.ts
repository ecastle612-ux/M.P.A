import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { apiError, apiInternalError } from "../../../../lib/api/http";
import {
  approveAiRecommendation,
  listAiRecommendations,
  rejectAiRecommendation,
  type RecommendationStatus
} from "../../../../lib/ops/ai-director";

/**
 * OPS-001 Slice D — AI Operations Director recommendations (no Command Center UI).
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
    const statusParam = url.searchParams.get("status");
    const recommendations = await listAiRecommendations({
      organizationId,
      ...(statusParam
        ? { status: statusParam.split(",") as RecommendationStatus[] }
        : {})
    });

    return NextResponse.json(
      { recommendations },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("[ops/director GET]", error);
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
    if (!evaluatePermission(authorization, "maintenance:write")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const body = (await request.json()) as Record<string, unknown>;
    const recommendationId =
      typeof body["recommendationId"] === "string" ? body["recommendationId"] : null;
    const action = typeof body["action"] === "string" ? body["action"] : null;

    if (!recommendationId || (action !== "approve" && action !== "reject")) {
      return apiError(400, "INVALID_BODY", "recommendationId and action=approve|reject required");
    }

    if (action === "approve") {
      const recommendation = await approveAiRecommendation({
        organizationId,
        recommendationId,
        actorPrincipalId: user.id
      });
      return NextResponse.json({ recommendation }, { headers: { "Cache-Control": "no-store" } });
    }

    const recommendation = await rejectAiRecommendation({
      organizationId,
      recommendationId,
      actorPrincipalId: user.id,
      reason: typeof body["reason"] === "string" ? body["reason"] : null
    });
    return NextResponse.json({ recommendation }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[ops/director POST]", error);
    const message = error instanceof Error ? error.message : "Director action failed";
    if (/not found|Cannot approve|Reject failed/i.test(message)) {
      return apiError(400, "DIRECTOR_ACTION_FAILED", message);
    }
    return apiInternalError();
  }
}
