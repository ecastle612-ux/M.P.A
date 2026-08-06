import { NextResponse } from "next/server";
import { requirePropertyPermission } from "../../../../lib/property/authz";
import { getMissionControlState } from "../../../../lib/property/property-service";
import { getOrganizationCommercialState } from "../../../../lib/commercial/server";

export async function GET() {
  const authz = await requirePropertyPermission("pm.properties:read");
  if ("error" in authz) {
    return authz.error;
  }

  try {
    const commercial = await getOrganizationCommercialState(authz.organizationId);
    const state = await getMissionControlState(
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
      { error: error instanceof Error ? error.message : "Failed to load Mission Control" },
      { status: 400 }
    );
  }
}
