import { NextResponse } from "next/server";
import { createFacilityWorkOrderInputSchema } from "@mpa/shared";
import { requireFacilityOperation } from "../../../../lib/facility/authz";
import {
  createFacilityWorkOrder,
  listTechnicians,
  listVendors,
  listWorkOrders
} from "../../../../lib/maintenance/maintenance-service";
import { listPortfolioProperties } from "../../../../lib/property/property-catalog";

export async function GET(request: Request) {
  const authz = await requireFacilityOperation("pm.maintenance:read", "facility.operations");
  if ("error" in authz) {
    return authz.error;
  }

  try {
    const category = new URL(request.url).searchParams.get("category")?.trim() || null;
    const [workOrders, technicians, vendors, properties] = await Promise.all([
      listWorkOrders(authz.supabase, authz.organizationId, { surface: "facility" }),
      listTechnicians(authz.supabase, authz.organizationId),
      listVendors(authz.supabase, authz.organizationId),
      listPortfolioProperties(authz.supabase, authz.organizationId)
    ]);

    const filtered =
      category && category !== "all"
        ? workOrders.filter((row) => row.category === category)
        : workOrders;

    return NextResponse.json({
      workOrders: filtered,
      technicians,
      vendors,
      properties
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load facility operations" },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  const authz = await requireFacilityOperation("pm.maintenance:write", "facility.operations");
  if ("error" in authz) {
    return authz.error;
  }

  const payload = await request.json().catch(() => null);
  const parsed = createFacilityWorkOrderInputSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const workOrder = await createFacilityWorkOrder(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      parsed.data
    );
    return NextResponse.json({ workOrder }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create facility work order" },
      { status: 400 }
    );
  }
}
