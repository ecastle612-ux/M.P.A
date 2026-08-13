import { NextResponse } from "next/server";
import { createPropertyUnitInputSchema, suggestNextUnitLabel } from "@mpa/shared";
import { requirePropertyPermission } from "../../../../../../lib/property/authz";
import { getPortfolioProperty } from "../../../../../../lib/property/property-service";
import {
  createPropertyUnit,
  suggestUnitLabelForProperty
} from "../../../../../../lib/property/unit-catalog";
import { assertWithinUnitCapacityOrGate } from "../../../../../../lib/saas-lifecycle/unit-capacity-service";

type RouteContext = { params: Promise<{ propertyId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const authz = await requirePropertyPermission("pm.properties:read");
  if ("error" in authz) {
    return authz.error;
  }

  const { propertyId } = await context.params;
  try {
    const property = await getPortfolioProperty(authz.supabase, authz.organizationId, propertyId);
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }
    const units = property.property_units ?? [];
    const suggestedLabel = suggestNextUnitLabel(
      units.map((unit: { unit_label: string }) => unit.unit_label)
    );
    return NextResponse.json({ units, suggestedLabel });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list units" },
      { status: 400 }
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  const authz = await requirePropertyPermission("pm.properties:write");
  if ("error" in authz) {
    return authz.error;
  }

  const { propertyId } = await context.params;
  const payload = await request.json().catch(() => ({}));
  let unitLabel =
    payload && typeof payload === "object" && "unitLabel" in payload
      ? (payload as { unitLabel?: unknown }).unitLabel
      : undefined;

  if (typeof unitLabel !== "string" || unitLabel.trim().length === 0) {
    try {
      unitLabel = await suggestUnitLabelForProperty(
        authz.supabase,
        authz.organizationId,
        propertyId
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Property not found";
      const status = message === "Property not found" ? 404 : 400;
      return NextResponse.json({ error: message }, { status });
    }
  }

  const parsed = createPropertyUnitInputSchema.safeParse({ unitLabel });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const capacity = await assertWithinUnitCapacityOrGate({
      supabase: authz.supabase,
      organizationId: authz.organizationId,
      additionalUnits: 1,
      source: "pm.properties.units.create"
    });
    if (!capacity.ok) {
      return NextResponse.json(capacity.body, { status: capacity.status });
    }

    const unit = await createPropertyUnit(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      propertyId,
      parsed.data
    );
    return NextResponse.json({ unit }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create unit";
    const status = message === "Property not found" ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
