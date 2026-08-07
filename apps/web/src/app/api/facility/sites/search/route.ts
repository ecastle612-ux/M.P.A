import { NextResponse } from "next/server";
import { requireFacilityPermission } from "../../../../../lib/facility/authz";
import { searchFacilitySites } from "../../../../../lib/facility/site-service";

export async function GET(request: Request) {
  const authz = await requireFacilityPermission("facility.sites:read");
  if ("error" in authz) {
    return authz.error;
  }

  const q = new URL(request.url).searchParams.get("q") ?? "";
  try {
    const rows = await searchFacilitySites(authz.supabase, authz.organizationId, q);
    return NextResponse.json({
      results: rows.map((row) => ({
        id: row.id as string,
        label: `${row.name as string}${row.city ? ` · ${row.city as string}` : ""}`,
        href: `/facility/sites/${row.id as string}`,
        group: "Facility Sites",
        status: row.status as string
      }))
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to search facility sites" },
      { status: 400 }
    );
  }
}
