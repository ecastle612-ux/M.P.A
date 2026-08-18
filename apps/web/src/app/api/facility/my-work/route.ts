import { NextResponse } from "next/server";
import { requireFacilityOperation } from "../../../../lib/facility/authz";
import { listWorkOrders, type WorkOrderRow } from "../../../../lib/maintenance/maintenance-service";

export const runtime = "nodejs";

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

const OPEN = new Set(["submitted", "triaged", "assigned", "in_progress"]);

function bucketFor(wo: WorkOrderRow, now: Date): "today" | "overdue" | "upcoming" | null {
  if (!OPEN.has(wo.status)) return null;
  const due = wo.due_at ? new Date(wo.due_at) : null;
  if (due && due < startOfDay(now)) return "overdue";
  if (!due || (due >= startOfDay(now) && due <= endOfDay(now))) return "today";
  if (due > endOfDay(now)) return "upcoming";
  return "today";
}

export async function GET() {
  const auth = await requireFacilityOperation("pm.maintenance:read", "facility.operations");
  if ("error" in auth) return auth.error;

  try {
    const all = await listWorkOrders(auth.supabase, auth.organizationId, {
      surface: "facility"
    });
    const mine = all.filter((wo) => wo.technician_user_id === auth.user.id);

    const now = new Date();
    const today: WorkOrderRow[] = [];
    const overdue: WorkOrderRow[] = [];
    const upcoming: WorkOrderRow[] = [];
    for (const wo of mine) {
      const bucket = bucketFor(wo, now);
      if (bucket === "today") today.push(wo);
      else if (bucket === "overdue") overdue.push(wo);
      else if (bucket === "upcoming") upcoming.push(wo);
    }

    const roles = (auth.roles as string[]) ?? [];
    const isManager =
      roles.includes("organization_admin") || roles.includes("property_manager");

    return NextResponse.json({
      today,
      overdue,
      upcoming,
      viewer: { userId: auth.user.id, isManager }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load My Work" },
      { status: 500 }
    );
  }
}
