import { NextResponse } from "next/server";
import { apiError, apiInternalError } from "../../../../../lib/api/http";
import { requireMasterAdminApiAccess } from "../../../../../lib/master-admin/access";
import { getImplementationProgress } from "../../../../../lib/commercial/progress";
import { getTrialLifecycle } from "../../../../../lib/commercial/trial";

/**
 * COM-001 Slice B — Master Admin / CS ops-minimum progress + trial lookup.
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

    const [progress, trial] = await Promise.all([
      getImplementationProgress(organizationId, {
        refresh: true,
        actorUserId: access.user.id
      }),
      getTrialLifecycle(organizationId, {
        actorUserId: access.user.id,
        emitReminders: false
      })
    ]);

    return NextResponse.json(
      { ok: true, progress, trial },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Lookup failed";
    if (message.includes("not found")) return apiError(404, "NOT_FOUND", message);
    return apiInternalError();
  }
}
