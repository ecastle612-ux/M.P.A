import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../lib/organization/server";
import { getNotificationsForUser } from "../../../lib/notifications/server";
import {
  NOTIFICATION_CATEGORIES,
  type NotificationCategory,
  type NotificationListOptions,
  type NotificationPriority
} from "../../../lib/notifications/contracts";
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
    if (url.searchParams.get("archived") === "true") options.archived = true;
    const q = url.searchParams.get("q");
    if (q) options.q = q;
    const propertyId = url.searchParams.get("propertyId");
    if (propertyId) options.propertyId = propertyId;

    const category = url.searchParams.get("category");
    if (category === "all" || (NOTIFICATION_CATEGORIES as readonly string[]).includes(category ?? "")) {
      options.category = category as NotificationCategory | "all";
    }

    const priority = url.searchParams.get("priority");
    if (
      priority === "critical" ||
      priority === "low" ||
      priority === "normal" ||
      priority === "high" ||
      priority === "emergency"
    ) {
      options.priority = priority as NotificationPriority | "critical";
    }

    const summary = await getNotificationsForUser(organizationId, user.id, options, supabase);
    return NextResponse.json(summary, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return apiInternalError();
  }
}
