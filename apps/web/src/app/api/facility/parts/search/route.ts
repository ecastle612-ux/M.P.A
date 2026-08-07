import { NextResponse } from "next/server";
import { requireFacilityPermission } from "../../../../../lib/facility/authz";
import { searchParts } from "../../../../../lib/facility/inventory-service";

export async function GET(request: Request) {
  const authz = await requireFacilityPermission("facility.parts:read");
  if ("error" in authz) {
    return authz.error;
  }
  const q = new URL(request.url).searchParams.get("q") ?? "";
  try {
    const results = await searchParts(authz.supabase, authz.organizationId, q);
    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Search failed" },
      { status: 400 }
    );
  }
}
