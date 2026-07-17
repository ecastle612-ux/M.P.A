import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../lib/organization/server";
import { parseCreateAnnouncementInput } from "../../../lib/communication/contracts";
import { createAnnouncement, getAnnouncementsForOrganization, type AnnouncementListOptions } from "../../../lib/communication/server";
import { apiError, apiInternalError, parseJsonBody, parsePaginationParams } from "../../../lib/api/http";

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
    if (!evaluatePermission(authorization, "communication:read")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const url = new URL(request.url);
    const pagination = parsePaginationParams(url.searchParams);
    const options: AnnouncementListOptions = { ...pagination };
    const status = url.searchParams.get("status");
    if (status === "draft" || status === "scheduled" || status === "published" || status === "archived" || status === "all") {
      options.status = status;
    }
    const category = url.searchParams.get("category");
    if (category === "general" || category === "community" || category === "emergency" || category === "maintenance" || category === "lease" || category === "all") {
      options.category = category;
    }
    const priority = url.searchParams.get("priority");
    if (priority === "normal" || priority === "high" || priority === "emergency" || priority === "all") {
      options.priority = priority;
    }
    const search = url.searchParams.get("search");
    if (search?.trim()) options.search = search;
    const propertyId = url.searchParams.get("propertyId");
    if (propertyId) options.propertyId = propertyId;

    const items = await getAnnouncementsForOrganization(organizationId, options, supabase);
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

    const input = parseCreateAnnouncementInput(parsedBody.payload);
    if (!input) return apiError(400, "INVALID_PAYLOAD", "Invalid announcement payload");

    const announcement = await createAnnouncement(organizationId, user.id, input, supabase);
    return NextResponse.json({ announcement }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Announcement creation failed";
    return apiError(400, "ANNOUNCEMENT_CREATE_FAILED", message);
  }
}
