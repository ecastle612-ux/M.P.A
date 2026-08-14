import { NextResponse } from "next/server";
import { createFacilityStockItemInputSchema, FACILITY_MANAGER_ROLES } from "@mpa/shared";
import { requireFacilityInventoryPermission } from "../../../../lib/facility/authz";
import {
  createFacilityStockItem,
  decorateStockItem,
  listFacilityStockItems
} from "../../../../lib/facility/inventory-service";
import { listPortfolioProperties } from "../../../../lib/property/property-catalog";
import { listVendors } from "../../../../lib/maintenance/maintenance-service";

function isManager(roles: string[]) {
  return roles.some((role) => (FACILITY_MANAGER_ROLES as readonly string[]).includes(role));
}

export async function GET() {
  const authz = await requireFacilityInventoryPermission("pm.maintenance:read");
  if ("error" in authz) return authz.error;

  const manager = isManager(authz.roles);
  if (!manager) {
    return NextResponse.json({
      items: [],
      properties: [],
      vendors: [],
      canManage: false
    });
  }

  try {
    const [items, properties, vendors] = await Promise.all([
      listFacilityStockItems(authz.supabase, authz.organizationId),
      listPortfolioProperties(authz.supabase, authz.organizationId),
      listVendors(authz.supabase, authz.organizationId)
    ]);
    return NextResponse.json({
      items: items.map(decorateStockItem),
      properties,
      vendors,
      canManage: true
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load inventory" },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  const authz = await requireFacilityInventoryPermission("pm.maintenance:write", {
    managerOnly: true
  });
  if ("error" in authz) return authz.error;

  const payload = await request.json().catch(() => null);
  const parsed = createFacilityStockItemInputSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const item = await createFacilityStockItem(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      parsed.data
    );
    return NextResponse.json({ item: decorateStockItem(item) }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create stock item" },
      { status: 400 }
    );
  }
}
