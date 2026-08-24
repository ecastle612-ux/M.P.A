import { NextResponse } from "next/server";
import { applyWorkTemplateInputSchema, FACILITY_MANAGER_ROLES } from "@mpa/shared";
import { requireAuthorizedAction } from "../../../../../lib/auth/require-authorized-action";
import { applyTemplateToWorkOrder } from "../../../../../lib/facility/work-template-service";
import { getWorkOrder } from "../../../../../lib/maintenance/maintenance-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireAuthorizedAction({
    capability: "pm.maintenance:write",
    entitlement: "facility.operations",
    allowedRoles: [...FACILITY_MANAGER_ROLES]
  });
  if ("error" in auth) return auth.error;

  try {
    const body = applyWorkTemplateInputSchema.parse(await request.json());
    const workOrder = await getWorkOrder(auth.supabase, auth.organizationId, body.workOrderId);
    if (!workOrder || workOrder.work_surface !== "facility") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const version = await applyTemplateToWorkOrder(
      auth.supabase,
      auth.organizationId,
      body.workOrderId,
      body.templateId
    );
    return NextResponse.json({ ok: true, version });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to apply template" },
      { status: 400 }
    );
  }
}
