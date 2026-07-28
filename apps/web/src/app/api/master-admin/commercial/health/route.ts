import { NextResponse } from "next/server";
import { apiError, apiInternalError } from "../../../../../lib/api/http";
import { requireMasterAdminApiAccess } from "../../../../../lib/master-admin/access";
import { getHealthScore } from "../../../../../lib/commercial/health";
import { getFeatureDiscoveries } from "../../../../../lib/commercial/discovery";
import { listCommunicationTimeline } from "../../../../../lib/commercial/timeline";

/**
 * COM-001 Slice C — Master Admin / CS ops-minimum health · discovery · timeline lookup.
 */
export async function GET(request: Request) {
  try {
    const access = await requireMasterAdminApiAccess();
    if (!access.ok) return access.response;

    const url = new URL(request.url);
    const organizationId = url.searchParams.get("organizationId")?.trim() ?? "";
    if (!organizationId) {
      return apiError(400, "INVALID_INPUT", "organizationId is required");
    }

    const [health, discoveries, timeline] = await Promise.all([
      getHealthScore(organizationId, {
        refresh: true,
        actorUserId: access.user.id
      }),
      getFeatureDiscoveries(organizationId),
      listCommunicationTimeline({ organizationId, limit: 25 })
    ]);

    return NextResponse.json(
      { ok: true, health, discoveries, timeline },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Lookup failed";
    if (message.includes("not found")) return apiError(404, "NOT_FOUND", message);
    return apiInternalError();
  }
}
