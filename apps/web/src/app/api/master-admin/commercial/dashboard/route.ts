import { NextResponse } from "next/server";
import { apiInternalError } from "../../../../../lib/api/http";
import { requireMasterAdminApiAccess } from "../../../../../lib/master-admin/access";
import { getCommercialDashboardSnapshot } from "../../../../../lib/commercial/dashboard";

/**
 * COM-001 Slice E — staff-only commercial dashboard aggregates.
 * Master Admin API only — never mounted under customer org routes.
 */
export async function GET(request: Request) {
  try {
    const access = await requireMasterAdminApiAccess();
    if (!access.ok) return access.response;

    const url = new URL(request.url);
    const emitOpened = url.searchParams.get("emitOpened") === "1";

    const dashboard = await getCommercialDashboardSnapshot({
      actorUserId: access.user.id,
      emitOpened
    });

    return NextResponse.json(
      { ok: true, dashboard },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return apiInternalError();
  }
}
