import { NextResponse } from "next/server";
import { createPartCategoryInputSchema } from "@mpa/shared";
import { requireFacilityPermission } from "../../../../../lib/facility/authz";
import { createPartCategory, listPartCategories } from "../../../../../lib/facility/inventory-service";

export async function GET() {
  const authz = await requireFacilityPermission("facility.parts:read");
  if ("error" in authz) {
    return authz.error;
  }
  try {
    const categories = await listPartCategories(authz.supabase, authz.organizationId);
    return NextResponse.json({ categories });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load categories" },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  const authz = await requireFacilityPermission("facility.parts:write");
  if ("error" in authz) {
    return authz.error;
  }
  try {
    const body = createPartCategoryInputSchema.parse(await request.json());
    const category = await createPartCategory(authz.supabase, authz.organizationId, body);
    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create category" },
      { status: 400 }
    );
  }
}
