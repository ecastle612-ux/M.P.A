import { NextResponse } from "next/server";
import { requireFacilityPermission } from "../../../../../../lib/facility/authz";
import { activateFacilitySite } from "../../../../../../lib/facility/site-service";

type Params = { params: Promise<{ siteId: string }> };

export async function POST(_request: Request, context: Params) {
  const authz = await requireFacilityPermission("facility.sites:write");
  if ("error" in authz) {
    return authz.error;
  }

  const { siteId } = await context.params;
  try {
    const result = await activateFacilitySite(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      siteId
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to activate facility site" },
      { status: 400 }
    );
  }
}
