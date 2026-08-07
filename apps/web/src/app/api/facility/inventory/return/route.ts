import { NextResponse } from "next/server";
import { returnInventoryInputSchema } from "@mpa/shared";
import { requireFacilityPermission } from "../../../../../lib/facility/authz";
import { returnInventory } from "../../../../../lib/facility/inventory-service";

export async function POST(request: Request) {
  const authz = await requireFacilityPermission("facility.inventory:write");
  if ("error" in authz) {
    return authz.error;
  }
  try {
    const input = returnInventoryInputSchema.parse(await request.json());
    const result = await returnInventory(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      input
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Return failed" },
      { status: 400 }
    );
  }
}
