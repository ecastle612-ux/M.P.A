import { NextResponse } from "next/server";
import { requireFacilityPermission } from "../../../../../lib/facility/authz";
import { searchFacilityAssets } from "../../../../../lib/facility/asset-service";

export async function GET(request: Request) {
  const authz = await requireFacilityPermission("facility.assets:read");
  if ("error" in authz) {
    return authz.error;
  }

  const q = new URL(request.url).searchParams.get("q") ?? "";
  try {
    const rows = await searchFacilityAssets(authz.supabase, authz.organizationId, q);
    return NextResponse.json({
      results: rows.map((row) => ({
        id: row.id as string,
        label: `${row.name as string}${row.asset_tag ? ` · ${row.asset_tag as string}` : ""}`,
        href: `/facility/assets/${row.id as string}`,
        group: "Facility Assets",
        status: row.status as string,
        criticality: row.criticality as string
      }))
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to search assets" },
      { status: 400 }
    );
  }
}
