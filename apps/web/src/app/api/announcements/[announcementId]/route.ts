import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { parseAnnouncementMutationInput } from "../../../../lib/communication/contracts";
import { applyAnnouncementMutation, getAnnouncementForOrganization, getAnnouncementPushRecipientCount } from "../../../../lib/communication/server";
import { apiError, apiInternalError, parseJsonBody } from "../../../../lib/api/http";

type RouteContext = { params: Promise<{ announcementId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { announcementId } = await context.params;
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) return apiError(400, "NO_ACTIVE_ORGANIZATION", "No active organization selected");

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "communication:read")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const announcement = await getAnnouncementForOrganization(organizationId, announcementId, supabase);
    if (!announcement) return apiError(404, "NOT_FOUND", "Announcement not found");

    let pushRecipientCount = 0;
    let audienceUserCount = 0;
    try {
      const counts = await getAnnouncementPushRecipientCount(organizationId, announcementId, supabase);
      pushRecipientCount = counts.pushRecipientCount;
      audienceUserCount = counts.audienceUserCount;
    } catch {
      /* keep zeros */
    }

    return NextResponse.json(
      { announcement, pushRecipientCount, audienceUserCount },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return apiInternalError();
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { announcementId } = await context.params;
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) return apiError(400, "NO_ACTIVE_ORGANIZATION", "No active organization selected");

    const authorization = await resolveAuthorizationContext(user, organizationId);
    const parsedBody = await parseJsonBody(request);
    if (!parsedBody.ok) return parsedBody.response;

    const mutation = parseAnnouncementMutationInput(parsedBody.payload);
    if (!mutation) return apiError(400, "INVALID_PAYLOAD", "Invalid announcement mutation");

    const permissionByAction: Record<string, string> = {
      archive: "communication:archive",
      restore: "communication:archive",
      soft_delete: "communication:delete",
      duplicate: "communication:create",
      update: "communication:update",
      publish_now: "communication:publish",
      schedule: "communication:publish"
    };
    const required = permissionByAction[mutation.action];
    if (!required || !evaluatePermission(authorization, required as never)) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const announcement = await applyAnnouncementMutation(organizationId, announcementId, user.id, mutation, supabase);
    return NextResponse.json({ announcement }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Announcement mutation failed";
    return apiError(400, "ANNOUNCEMENT_MUTATION_FAILED", message);
  }
}
