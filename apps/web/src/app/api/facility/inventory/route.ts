import { NextResponse } from "next/server";
import { createInventoryLocationInputSchema } from "@mpa/shared";
import { requireFacilityPermission } from "../../../../lib/facility/authz";
import {
  buildInventoryAssistant,
  createInventoryLocation,
  listInventoryLocations,
  listInventoryStock,
  listPartMovements,
  listParts,
  stockHealthFor,
  summarizeInventory
} from "../../../../lib/facility/inventory-service";
import { listFacilityWorkOrders } from "../../../../lib/facility/operations-service";

export async function GET() {
  const authz = await requireFacilityPermission("facility.inventory:read");
  if ("error" in authz) {
    return authz.error;
  }
  try {
    const [locations, stock, parts, movements, workOrders] = await Promise.all([
      listInventoryLocations(authz.supabase, authz.organizationId),
      listInventoryStock(authz.supabase, authz.organizationId),
      listParts(authz.supabase, authz.organizationId),
      listPartMovements(authz.supabase, authz.organizationId, { limit: 40 }),
      listFacilityWorkOrders(authz.supabase, authz.organizationId)
    ]);
    const summary = summarizeInventory(stock);
    return NextResponse.json({
      locations,
      stock: stock.map((row) => ({ ...row, health: stockHealthFor(row) })),
      parts: parts.filter((part) => part.status === "active"),
      movements,
      workOrders: workOrders
        .filter((wo) => !["closed", "cancelled"].includes(wo.status))
        .map((wo) => ({
          id: wo.id,
          title: wo.title,
          status: wo.status,
          site_id: wo.site_id
        })),
      summary,
      assistantRecommendation: buildInventoryAssistant({
        ...summary,
        partCount: parts.length
      })
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load inventory" },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  const authz = await requireFacilityPermission("facility.inventory:write");
  if ("error" in authz) {
    return authz.error;
  }
  try {
    const body = createInventoryLocationInputSchema.parse(await request.json());
    const location = await createInventoryLocation(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      body
    );
    return NextResponse.json({ location }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create location" },
      { status: 400 }
    );
  }
}
