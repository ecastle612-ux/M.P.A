import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/server";
import { updateInsightStatus } from "../../../../../lib/ai/server";
import { apiError, apiInternalError, parseJsonBody } from "../../../../../lib/api/http";

type RouteContext = { params: Promise<{ insightId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { insightId } = await context.params;
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) return apiError(400, "NO_ACTIVE_ORGANIZATION", "No active organization selected");

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "ai:use")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const parsedBody = await parseJsonBody(request);
    if (!parsedBody.ok) return parsedBody.response;
    const statusRaw = (parsedBody.payload as Record<string, unknown>)["status"];
    if (statusRaw !== "dismissed" && statusRaw !== "applied") {
      return apiError(400, "INVALID_PAYLOAD", "Status must be dismissed or applied");
    }

    const insight = await updateInsightStatus(organizationId, user.id, insightId, statusRaw, supabase);
    if (!insight) return apiError(404, "NOT_FOUND", "Insight not found");
    return NextResponse.json({ insight }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return apiInternalError();
  }
}
