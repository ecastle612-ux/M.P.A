import { NextResponse } from "next/server";
import { confirmWorkOrderInputSchema, createWorkOrderInputSchema } from "@mpa/shared";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/resolve-active-organization";
import {
  confirmWorkOrderResolution,
  createResidentWorkOrder,
  listResidentWorkOrders,
  listWorkOrderUpdates
} from "../../../../../lib/maintenance/maintenance-service";

export async function GET() {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const organizationId = await resolveActiveOrganizationIdForUser(supabase, user.id);
  if (!organizationId) {
    return NextResponse.json({ error: "Organization required" }, { status: 400 });
  }

  try {
    const workOrders = await listResidentWorkOrders(supabase, organizationId, user.id);
    const withUpdates = [];
    for (const workOrder of workOrders.slice(0, 20)) {
      const updates = await listWorkOrderUpdates(supabase, organizationId, workOrder.id);
      withUpdates.push({ workOrder, updates });
    }
    return NextResponse.json({ workOrders: withUpdates });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load maintenance" },
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
  const action = (payload as { action?: string } | null)?.action ?? "create";

  const organizationId = await resolveActiveOrganizationIdForUser(supabase, user.id);
  if (!organizationId) {
    return NextResponse.json({ error: "Organization required" }, { status: 400 });
  }

  try {
    if (action === "confirm") {
      const parsed = confirmWorkOrderInputSchema.safeParse(payload);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Invalid payload", details: parsed.error.flatten() },
          { status: 400 }
        );
      }
      const workOrder = await confirmWorkOrderResolution(
        supabase,
        organizationId,
        user.id,
        parsed.data
      );
      return NextResponse.json({ workOrder });
    }

    const parsed = createWorkOrderInputSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const workOrder = await createResidentWorkOrder(
      supabase,
      organizationId,
      user.id,
      parsed.data
    );
    return NextResponse.json({ workOrder }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Maintenance action failed" },
      { status: 400 }
    );
  }
}
