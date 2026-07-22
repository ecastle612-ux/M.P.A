import { NextResponse } from "next/server";
import { requireMasterAdminApiAccess } from "../../../../../lib/master-admin/access";
import { getPushDiagnosticsSnapshot } from "../../../../../lib/master-admin/push-diagnostics";
import { apiError } from "../../../../../lib/api/http";

/** PUSH-001 — Master Admin push diagnostics for the active organization. */
export async function GET() {
  try {
    const access = await requireMasterAdminApiAccess();
    if (!access.ok) return access.response;

    const snapshot = await getPushDiagnosticsSnapshot(access.organizationId);
    return NextResponse.json(snapshot, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return apiError(
      500,
      "PUSH_DIAGNOSTICS_FAILED",
      error instanceof Error ? error.message : "Failed to load push diagnostics"
    );
  }
}
