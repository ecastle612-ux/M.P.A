import { NextResponse } from "next/server";
import { requireFacilityPermission } from "../../../../../lib/facility/authz";
import { searchFacilitySystems } from "../../../../../lib/facility/system-service";

export async function GET(request: Request) {
  const authz = await requireFacilityPermission("facility.systems:read");
  if ("error" in authz) {
    return authz.error;
  }

  const q = new URL(request.url).searchParams.get("q") ?? "";
  try {
    const rows = await searchFacilitySystems(authz.supabase, authz.organizationId, q);
    return NextResponse.json({
      results: rows.map((row) => ({
        id: row.id as string,
        label: `${row.name as string} · ${row.system_type as string}`,
        href: `/facility/building-systems/${row.id as string}`,
        group: "Building Systems",
        status: row.status as string
      }))
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to search building systems" },
      { status: 400 }
    );
  }
}
