import { NextResponse } from "next/server";
import { applyFacilityStockMovementInputSchema, FACILITY_MANAGER_ROLES } from "@mpa/shared";
import { requireFacilityInventoryPermission } from "../../../../../../lib/facility/authz";
import { applyFacilityStockMovement } from "../../../../../../lib/facility/inventory-service";

export async function POST(
  request: Request,
  context: { params: Promise<{ itemId: string }> }
) {
  const payload = await request.json().catch(() => null);
  const parsed = applyFacilityStockMovementInputSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const managerOnly = parsed.data.movementType !== "usage";
  const authz = await requireFacilityInventoryPermission(
    "pm.maintenance:write",
    managerOnly
      ? { managerOnly: true }
      : { allowedRoles: [...FACILITY_MANAGER_ROLES, "maintenance_technician"] }
  );
  if ("error" in authz) return authz.error;
  const { itemId } = await context.params;

  try {
    const movement = await applyFacilityStockMovement(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      itemId,
      parsed.data
    );
    return NextResponse.json({ movement }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to apply movement" },
      { status: 400 }
    );
  }
}
