import { NextResponse } from "next/server";
import { requireFacilityInventoryPermission } from "../../../../../lib/facility/authz";
import {
  decorateStockItem,
  getFacilityStockItem,
  listFacilityStockMovements
} from "../../../../../lib/facility/inventory-service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ itemId: string }> }
) {
  const authz = await requireFacilityInventoryPermission("pm.maintenance:read", {
    managerOnly: true
  });
  if ("error" in authz) return authz.error;
  const { itemId } = await context.params;

  try {
    const item = await getFacilityStockItem(authz.supabase, authz.organizationId, itemId);
    if (!item) {
      return NextResponse.json({ error: "Stock item not found" }, { status: 404 });
    }
    const movements = await listFacilityStockMovements(
      authz.supabase,
      authz.organizationId,
      itemId
    );
    return NextResponse.json({ item: decorateStockItem(item), movements, canManage: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load stock item" },
      { status: 400 }
    );
  }
}
