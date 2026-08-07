import { NextResponse } from "next/server";
import { facilityAssetLifecycleInputSchema } from "@mpa/shared";
import { requireFacilityPermission } from "../../../../../../lib/facility/authz";
import { transitionFacilityAssetStatus } from "../../../../../../lib/facility/asset-service";

type Params = { params: Promise<{ assetId: string }> };

export async function POST(request: Request, context: Params) {
  const authz = await requireFacilityPermission("facility.assets:write");
  if ("error" in authz) {
    return authz.error;
  }

  const { assetId } = await context.params;
  const payload = await request.json().catch(() => null);
  const parsed = facilityAssetLifecycleInputSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const result = await transitionFacilityAssetStatus(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      assetId,
      parsed.data
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update asset lifecycle" },
      { status: 400 }
    );
  }
}
