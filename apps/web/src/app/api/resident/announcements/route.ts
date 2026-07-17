import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import {
  getResidentAnnouncementsForUser,
  markAnnouncementReadForUser
} from "../../../../lib/communication/server";
import { apiError, apiInternalError, parseJsonBody } from "../../../../lib/api/http";

export async function GET() {
  try {
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) return NextResponse.json({ items: [] }, { headers: { "Cache-Control": "no-store" } });

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "communication:read")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const items = await getResidentAnnouncementsForUser(organizationId, user.id, supabase);
    return NextResponse.json({ items }, { headers: { "Cache-Control": "no-store" } });
  } catch {
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

    const parsedBody = await parseJsonBody(request);
    if (!parsedBody.ok) return parsedBody.response;
    const payload = parsedBody.payload as Record<string, unknown>;
    const announcementId = typeof payload["announcementId"] === "string" ? payload["announcementId"] : "";
    if (!announcementId) return apiError(400, "INVALID_PAYLOAD", "Missing announcementId");

    await markAnnouncementReadForUser(
      organizationId,
      announcementId,
      user.id,
      payload["acknowledged"] === true,
      supabase
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to mark announcement read";
    return apiError(400, "READ_FAILED", message);
  }
}
