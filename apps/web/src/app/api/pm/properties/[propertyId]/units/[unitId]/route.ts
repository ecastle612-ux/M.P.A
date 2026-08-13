import { NextResponse } from "next/server";
import { updatePropertyUnitInputSchema } from "@mpa/shared";
import { requirePropertyPermission } from "../../../../../../../lib/property/authz";
import {
  archivePropertyUnit,
  updatePropertyUnit
} from "../../../../../../../lib/property/unit-catalog";

type RouteContext = { params: Promise<{ propertyId: string; unitId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const authz = await requirePropertyPermission("pm.properties:write");
  if ("error" in authz) {
    return authz.error;
  }

  const { propertyId, unitId } = await context.params;
  const payload = await request.json().catch(() => null);
  const parsed = updatePropertyUnitInputSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const unit = await updatePropertyUnit(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      propertyId,
      unitId,
      parsed.data
    );
    return NextResponse.json({ unit });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update unit";
    const status = message === "Unit not found" ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

/** Archive unit (status → offline). Prefer this over hard delete. */
export async function DELETE(_request: Request, context: RouteContext) {
  const authz = await requirePropertyPermission("pm.properties:write");
  if ("error" in authz) {
    return authz.error;
  }

  const { propertyId, unitId } = await context.params;
  try {
    const unit = await archivePropertyUnit(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      propertyId,
      unitId
    );
    return NextResponse.json({ unit, archived: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to archive unit";
    const status = message === "Unit not found" ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
