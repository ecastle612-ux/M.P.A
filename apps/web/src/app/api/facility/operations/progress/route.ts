import { NextResponse } from "next/server";
import { progressWorkOrderInputSchema } from "@mpa/shared";
import { requireFacilityOperation } from "../../../../../lib/facility/authz";
import { requireFacilityWorkOrder } from "../../../../../lib/facility/assert-facility-work-order";
import { progressWorkOrder } from "../../../../../lib/maintenance/maintenance-service";
import { resolveAuthorizationContext } from "../../../../../lib/auth/authorization";

export async function POST(request: Request) {
  const authz = await requireFacilityOperation("pm.maintenance:write", "facility.operations");
  if ("error" in authz) {
    return authz.error;
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
    const existing = await requireFacilityWorkOrder(
      authz.supabase,
      authz.organizationId,
      parsed.data.workOrderId
    );
    if ("error" in existing) {
      return NextResponse.json({ error: existing.error }, { status: existing.status });
    }

    const context = await resolveAuthorizationContext(authz.user, authz.organizationId);
    const roles = context.roles ?? [];
    const actorRole =
      roles.includes("property_manager") || roles.includes("organization_admin")
        ? "manager"
        : roles.includes("maintenance_technician")
          ? "technician"
          : roles.includes("vendor")
            ? "vendor"
            : "manager";

    const workOrder = await progressWorkOrder(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      actorRole,
      parsed.data
    );
    return NextResponse.json({ workOrder });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update facility progress" },
      { status: 400 }
    );
  }
}
