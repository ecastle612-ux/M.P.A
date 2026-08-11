import { NextResponse } from "next/server";
import { createPortfolioPropertyInputSchema } from "@mpa/shared";
import { requireFacilityOperation } from "../../../../lib/facility/authz";
import {
  createPortfolioProperty,
  listPortfolioProperties
} from "../../../../lib/property/property-catalog";

/** FO buildings = org properties (shared catalog — no parallel facility model). */
export async function GET() {
  const authz = await requireFacilityOperation("pm.maintenance:read", "facility.assets");
  if ("error" in authz) {
    return authz.error;
  }

  try {
    const properties = await listPortfolioProperties(authz.supabase, authz.organizationId);
    return NextResponse.json({ buildings: properties });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load buildings" },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  const authz = await requireFacilityOperation("pm.properties:write", "facility.assets");
  if ("error" in authz) {
    return authz.error;
  }

  const payload = await request.json().catch(() => null);
  const parsed = createPortfolioPropertyInputSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const result = await createPortfolioProperty(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      parsed.data
    );
    return NextResponse.json(
      { building: result.property, units: result.units },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create building" },
      { status: 400 }
    );
  }
}
