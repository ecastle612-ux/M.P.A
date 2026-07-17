import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { parseCreateCommunityEventInput } from "../../../../lib/community/contracts";
import { createCommunityEvent, getCommunityEventsForOrganization } from "../../../../lib/community/server";
import { apiError, apiInternalError, parseJsonBody, parsePaginationParams } from "../../../../lib/api/http";

export async function GET(request: Request) {
  try {
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) {
      return NextResponse.json({ items: [] }, { headers: { "Cache-Control": "no-store" } });
    }

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (
      !evaluatePermission(authorization, "communication:read") &&
      !evaluatePermission(authorization, "message:read")
    ) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const url = new URL(request.url);
    const pagination = parsePaginationParams(url.searchParams);
    const propertyId = url.searchParams.get("propertyId") ?? undefined;
    const upcomingOnly = url.searchParams.get("upcomingOnly") === "true";

    const items = await getCommunityEventsForOrganization(
      organizationId,
      {
        ...(propertyId ? { propertyId } : {}),
        upcomingOnly,
        ...(pagination.limit !== undefined ? { limit: pagination.limit } : {})
      },
      supabase
    );
    return NextResponse.json({ items }, { headers: { "Cache-Control": "no-store" } });
  } catch {
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
    if (!evaluatePermission(authorization, "communication:create")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const parsedBody = await parseJsonBody(request);
    if (!parsedBody.ok) return parsedBody.response;

    const input = parseCreateCommunityEventInput(parsedBody.payload);
    if (!input) return apiError(400, "INVALID_PAYLOAD", "Invalid community event payload");

    const event = await createCommunityEvent(organizationId, user.id, input, supabase);
    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Community event creation failed";
    return apiError(400, "COMMUNITY_EVENT_CREATE_FAILED", message);
  }
}
