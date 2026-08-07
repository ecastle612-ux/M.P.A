import { NextResponse } from "next/server";
import { issueInventoryInputSchema } from "@mpa/shared";
import { requireFacilityPermission } from "../../../../../lib/facility/authz";
import { issueInventory } from "../../../../../lib/facility/inventory-service";

export async function POST(request: Request) {
  const authz = await requireFacilityPermission("facility.inventory:write");
  if ("error" in authz) {
    return authz.error;
  }
  try {
    const input = issueInventoryInputSchema.parse(await request.json());
    const result = await issueInventory(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      input
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Issue failed" },
      { status: 400 }
    );
  }
}
