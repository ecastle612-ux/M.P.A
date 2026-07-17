import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../lib/organization/server";
import { getNotificationsForUser } from "../../../lib/notifications/server";
import type { NotificationListOptions } from "../../../lib/notifications/contracts";
import { apiError, apiInternalError, parsePaginationParams } from "../../../lib/api/http";

export async function GET(request: Request) {
  try {
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) {
      return NextResponse.json({ unreadCount: 0, items: [] }, { headers: { "Cache-Control": "no-store" } });
    }

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "notification:read")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const url = new URL(request.url);
    const pagination = parsePaginationParams(url.searchParams);
    const options: NotificationListOptions = { ...pagination };
    if (url.searchParams.get("unreadOnly") === "true") options.unreadOnly = true;
    const category = url.searchParams.get("category");
    if (
      category === "message" ||
      category === "maintenance" ||
      category === "lease" ||
      category === "financial" ||
      category === "announcement" ||
      category === "applicant" ||
      category === "ai" ||
      category === "all"
    ) {
      options.category = category;
    }

    const summary = await getNotificationsForUser(organizationId, user.id, options, supabase);
    return NextResponse.json(summary, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return apiInternalError();
  }
}
