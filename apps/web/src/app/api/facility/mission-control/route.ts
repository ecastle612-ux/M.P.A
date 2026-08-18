import { NextResponse } from "next/server";
import { FACILITY_MANAGER_ROLES } from "@mpa/shared";
import { requireFacilityOperation } from "../../../../lib/facility/authz";
import { getFacilityMissionControlSnapshot } from "../../../../lib/facility/mission-control-service";

export async function GET() {
  const authz = await requireFacilityOperation("pm.maintenance:read", "facility.mission_control");
  if ("error" in authz) {
    return authz.error;
  }

  try {
    const roles = (authz.roles as string[]) ?? [];
    const isManager = FACILITY_MANAGER_ROLES.some((role) => roles.includes(role));
    const snapshot = await getFacilityMissionControlSnapshot(authz.supabase, authz.organizationId, {
      viewerMode: isManager ? "manager" : "technician"
    });
    return NextResponse.json({ snapshot });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load Facility Mission Control" },
      { status: 400 }
    );
  }
}
