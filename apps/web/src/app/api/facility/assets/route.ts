import { NextResponse } from "next/server";
import { createFacilityAssetInputSchema } from "@mpa/shared";
import { requireFacilityPermission } from "../../../../lib/facility/authz";
import { createFacilityAsset, listFacilityAssets } from "../../../../lib/facility/asset-service";

export async function GET(request: Request) {
  const authz = await requireFacilityPermission("facility.assets:read");
  if ("error" in authz) {
    return authz.error;
  }

  const url = new URL(request.url);
  const siteId = url.searchParams.get("siteId");
  const status = url.searchParams.get("status");
  try {
    const assets = await listFacilityAssets(authz.supabase, authz.organizationId, {
      ...(siteId ? { siteId } : {}),
      ...(status ? { status } : {})
    });
    return NextResponse.json({ assets });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list assets" },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  const authz = await requireFacilityPermission("facility.assets:write");
  if ("error" in authz) {
    return authz.error;
  }

  const payload = await request.json().catch(() => null);
  const parsed = createFacilityAssetInputSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const result = await createFacilityAsset(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      parsed.data
    );
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create asset" },
      { status: 400 }
    );
  }
}
