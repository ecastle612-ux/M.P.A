import { NextResponse } from "next/server";
import { relocateFacilityAssetInputSchema } from "@mpa/shared";
import { requireFacilityPermission } from "../../../../../../lib/facility/authz";
import { relocateFacilityAsset } from "../../../../../../lib/facility/asset-service";

type Params = { params: Promise<{ assetId: string }> };

export async function POST(request: Request, context: Params) {
  const authz = await requireFacilityPermission("facility.assets:write");
  if ("error" in authz) {
    return authz.error;
  }

  const { assetId } = await context.params;
  const payload = await request.json().catch(() => null);
  const parsed = relocateFacilityAssetInputSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const result = await relocateFacilityAsset(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      assetId,
      parsed.data
    );
    return NextResponse.json({
      asset: result.asset,
      locationHistory: result.locationHistory,
      unchanged: result.unchanged
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to relocate asset" },
      { status: 400 }
    );
  }
}
