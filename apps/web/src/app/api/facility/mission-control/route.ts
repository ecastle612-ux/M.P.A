import { NextResponse } from "next/server";
import { requireFacilityOperation } from "../../../../lib/facility/authz";
import { getFacilityMissionControlSnapshot } from "../../../../lib/maintenance/maintenance-service";

export async function GET() {
  const authz = await requireFacilityOperation("pm.maintenance:read", "facility.mission_control");
  if ("error" in authz) {
    return authz.error;
  }

  try {
    const snapshot = await getFacilityMissionControlSnapshot(authz.supabase, authz.organizationId);
    return NextResponse.json({ snapshot });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load Facility Mission Control" },
      { status: 400 }
    );
  }
}
