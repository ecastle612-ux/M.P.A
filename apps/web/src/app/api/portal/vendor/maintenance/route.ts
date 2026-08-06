import { NextResponse } from "next/server";
import { progressWorkOrderInputSchema } from "@mpa/shared";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import {
  listVendorPortalWorkOrders,
  listWorkOrderUpdates,
  progressWorkOrder
} from "../../../../../lib/maintenance/maintenance-service";

export async function GET() {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  try {
    const { vendors, workOrders } = await listVendorPortalWorkOrders(supabase, user.id);
    const detailed = [];
    for (const workOrder of workOrders) {
      const updates = await listWorkOrderUpdates(
        supabase,
        workOrder.organization_id,
        workOrder.id
      );
      detailed.push({ workOrder, updates });
    }
    return NextResponse.json({ vendors, workOrders: detailed });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load vendor work" },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = progressWorkOrderInputSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const { workOrders } = await listVendorPortalWorkOrders(supabase, user.id);
    const target = workOrders.find((row) => row.id === parsed.data.workOrderId);
    if (!target) {
      return NextResponse.json({ error: "Work order not assigned to this vendor" }, { status: 403 });
    }
    const workOrder = await progressWorkOrder(
      supabase,
      target.organization_id,
      user.id,
      "vendor",
      parsed.data
    );
    return NextResponse.json({ workOrder });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update work order" },
      { status: 400 }
    );
  }
}
