import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { parseCreateThreadFromSourceInput, type ThreadListOptions } from "../../../../lib/messaging/contracts";
import { createThreadFromSource, getThreadsForOrganization } from "../../../../lib/messaging/server";
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
    if (!evaluatePermission(authorization, "message:read")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const url = new URL(request.url);
    const pagination = parsePaginationParams(url.searchParams);
    const options: ThreadListOptions = { ...pagination };
    const status = url.searchParams.get("status");
    if (status === "active" || status === "unread" || status === "read" || status === "archived" || status === "resolved" || status === "all") {
      options.status = status;
    }
    const threadType = url.searchParams.get("threadType");
    if (
      threadType === "resident_pm" ||
      threadType === "resident_maintenance" ||
      threadType === "pm_vendor" ||
      threadType === "pm_owner" ||
      threadType === "internal_staff" ||
      threadType === "applicant_leasing" ||
      threadType === "all"
    ) {
      options.threadType = threadType;
    }
    const search = url.searchParams.get("search");
    if (search?.trim()) options.search = search;
    const propertyId = url.searchParams.get("propertyId");
    if (propertyId) options.propertyId = propertyId;

    const items = await getThreadsForOrganization(organizationId, user.id, options, supabase);
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
    if (!evaluatePermission(authorization, "message:create")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const parsedBody = await parseJsonBody(request);
    if (!parsedBody.ok) return parsedBody.response;

    const input = parseCreateThreadFromSourceInput(parsedBody.payload);
    if (!input) return apiError(400, "INVALID_PAYLOAD", "Invalid thread payload");

    const thread = await createThreadFromSource(organizationId, user.id, input, supabase);
    return NextResponse.json({ thread }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Thread creation failed";
    return apiError(400, "THREAD_CREATE_FAILED", message);
  }
}
