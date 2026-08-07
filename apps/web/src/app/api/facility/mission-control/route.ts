import { NextResponse } from "next/server";
import { requireFacilityPermission } from "../../../../lib/facility/authz";
import { getFacilityMissionControlState } from "../../../../lib/facility/mission-control-service";
import { getOrganizationCommercialState } from "../../../../lib/commercial/server";

export async function GET() {
  const authz = await requireFacilityPermission("facility.sites:read");
  if ("error" in authz) {
    return authz.error;
  }

  try {
    const commercial = await getOrganizationCommercialState(authz.organizationId);
    const state = await getFacilityMissionControlState(
      authz.supabase,
      authz.organizationId,
      commercial.setupComplete
    );
    return NextResponse.json({
      ...state,
      organizationId: authz.organizationId,
      productSku: commercial.sku,
      productLabel: commercial.skuLabel,
      setupComplete: commercial.setupComplete
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load Facility Mission Control" },
      { status: 400 }
    );
  }
}
