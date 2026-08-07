import { NextResponse } from "next/server";
import { requireFacilityPermission } from "../../../../../lib/facility/authz";
import { getPart, listPartMovements } from "../../../../../lib/facility/inventory-service";

type Params = { params: Promise<{ partId: string }> };

export async function GET(_request: Request, context: Params) {
  const authz = await requireFacilityPermission("facility.parts:read");
  if ("error" in authz) {
    return authz.error;
  }
  const { partId } = await context.params;
  try {
    const part = await getPart(authz.supabase, authz.organizationId, partId);
    if (!part) {
      return NextResponse.json({ error: "Part not found" }, { status: 404 });
    }
    const movements = await listPartMovements(authz.supabase, authz.organizationId, {
      partId,
      limit: 40
    });
    return NextResponse.json({ part, movements });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load part" },
      { status: 400 }
    );
  }
}
