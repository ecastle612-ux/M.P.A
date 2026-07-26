import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { getFacilityCalendarItems } from "../../../../lib/facility/calendar";
import { apiError, apiInternalError } from "../../../../lib/api/http";

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
    if (!evaluatePermission(authorization, "facility:calendar:read")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const url = new URL(request.url);
    const now = new Date();
    const year = Number.parseInt(url.searchParams.get("year") ?? String(now.getUTCFullYear()), 10);
    const month = Number.parseInt(url.searchParams.get("month") ?? String(now.getUTCMonth() + 1), 10);
    if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
      return apiError(400, "INVALID_RANGE", "Invalid year/month");
    }

    const items = await getFacilityCalendarItems(organizationId, { year, month }, supabase);
    return NextResponse.json({ items, year, month }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return apiInternalError();
  }
}
