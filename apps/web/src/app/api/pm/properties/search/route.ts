import { NextResponse } from "next/server";
import { requirePropertyPermission } from "../../../../../lib/property/authz";
import { searchPortfolioProperties } from "../../../../../lib/property/property-service";

export async function GET(request: Request) {
  const authz = await requirePropertyPermission("pm.properties:read");
  if ("error" in authz) {
    return authz.error;
  }

  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";

  try {
    const properties = await searchPortfolioProperties(
      authz.supabase,
      authz.organizationId,
      query
    );
    return NextResponse.json({
      results: properties.map((property) => ({
        id: property.id,
        label: property.name,
        href: `/pm/properties/${property.id}`,
        group: "Properties",
        status: property.status
      }))
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Search failed" },
      { status: 400 }
    );
  }
}
