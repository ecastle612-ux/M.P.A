import { NextResponse } from "next/server";
import { requirePropertyPermission } from "../../../../../lib/property/authz";
import { getPropertyCommandCenter } from "../../../../../lib/property/property-service";

type RouteContext = {
  params: Promise<{ propertyId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { propertyId } = await context.params;
  const authz = await requirePropertyPermission("pm.properties:read");
  if ("error" in authz) {
    return authz.error;
  }

  try {
    const commandCenter = await getPropertyCommandCenter(
      authz.supabase,
      authz.organizationId,
      propertyId
    );
    if (!commandCenter) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }
    return NextResponse.json(commandCenter);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load property" },
      { status: 400 }
    );
  }
}
