import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/server";
import { isPropertyLifecycleStage } from "../../../../../lib/property/lifecycle";
import { transitionPropertyLifecycle } from "../../../../../lib/property/lifecycle-server";
import { getPropertyForOrganization } from "../../../../../lib/property/server";
import { apiError, apiInternalError, parseJsonBody } from "../../../../../lib/api/http";

export async function POST(request: Request, { params }: { params: Promise<{ propertyId: string }> }) {
  try {
    const { propertyId } = await params;
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) {
      return apiError(401, "UNAUTHENTICATED", "Unauthenticated");
    }
    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) {
      return apiError(400, "NO_ACTIVE_ORGANIZATION", "No active organization selected");
    }

    const parsedBody = await parseJsonBody(request);
    if (!parsedBody.ok) {
      return parsedBody.response;
    }
    const payload = parsedBody.payload as Record<string, unknown>;
    const toStage = payload["toStage"];
    if (!isPropertyLifecycleStage(toStage)) {
      return apiError(400, "INVALID_PAYLOAD", "Invalid lifecycle stage.");
    }

    const authorization = await resolveAuthorizationContext(user, organizationId);
    const current = await getPropertyForOrganization(organizationId, propertyId, supabase);
    if (!current) {
      return apiError(404, "NOT_FOUND", "Not found");
    }

    const isRestore = current.lifecycleStage === "archived" && toStage === "operational";
    if (toStage === "archived" || isRestore) {
      if (!evaluatePermission(authorization, "property:archive")) {
        return apiError(403, "FORBIDDEN", "Forbidden");
      }
    } else if (!evaluatePermission(authorization, "property:update")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    try {
      const result = await transitionPropertyLifecycle(
        {
          organizationId,
          propertyId,
          actorUserId: user.id,
          toStage,
          reason: typeof payload["reason"] === "string" ? payload["reason"] : null,
          force: isRestore
        },
        supabase
      );
      return NextResponse.json({
        property: result.property,
        fromStage: result.fromStage,
        toStage: result.toStage,
        automation: result.automation
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Lifecycle transition failed.";
      if (message.includes("not allowed") || message.includes("before")) {
        return apiError(400, "INVALID_TRANSITION", message);
      }
      throw error;
    }
  } catch {
    return apiInternalError();
  }
}
