import { NextResponse } from "next/server";
import { createFacilityAssetCategoryInputSchema } from "@mpa/shared";
import { requireFacilityPermission } from "../../../../lib/facility/authz";
import {
  createFacilityAssetCategory,
  listFacilityAssetCategories
} from "../../../../lib/facility/asset-service";

export async function GET() {
  const authz = await requireFacilityPermission("facility.assets:read");
  if ("error" in authz) {
    return authz.error;
  }

  try {
    const categories = await listFacilityAssetCategories(authz.supabase, authz.organizationId);
    return NextResponse.json({ categories });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list categories" },
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
  const parsed = createFacilityAssetCategoryInputSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const category = await createFacilityAssetCategory(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      parsed.data
    );
    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create category" },
      { status: 400 }
    );
  }
}
