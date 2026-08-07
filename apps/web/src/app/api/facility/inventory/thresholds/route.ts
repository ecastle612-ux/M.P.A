import { NextResponse } from "next/server";
import { updateStockThresholdsInputSchema } from "@mpa/shared";
import { requireFacilityPermission } from "../../../../../lib/facility/authz";
import { updateStockThresholds } from "../../../../../lib/facility/inventory-service";

export async function PATCH(request: Request) {
  const authz = await requireFacilityPermission("facility.inventory:write");
  if ("error" in authz) {
    return authz.error;
  }
  try {
    const body = updateStockThresholdsInputSchema.parse(await request.json());
    const result = await updateStockThresholds(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      body
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update thresholds" },
      { status: 400 }
    );
  }
}
