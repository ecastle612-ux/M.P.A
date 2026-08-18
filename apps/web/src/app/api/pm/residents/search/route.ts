import { NextResponse } from "next/server";
import { requireResidentPermission } from "../../../../../lib/resident/authz";
import { searchResidents } from "../../../../../lib/resident/resident-service";
import { consumeRateLimit } from "../../../../../lib/security/durable-rate-limit";

export async function GET(request: Request) {
  const authz = await requireResidentPermission("pm.residents:read");
  if ("error" in authz) {
    return authz.error;
  }
  if (
    !(await consumeRateLimit({
      class: "APPLICATION",
      key: `pm-resident-search:${authz.organizationId}`
    }))
  ) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";

  try {
    const residents = await searchResidents(authz.supabase, authz.organizationId, query);
    return NextResponse.json({
      results: residents.map((resident) => {
        const propertyName = Array.isArray(resident.property_properties)
          ? resident.property_properties[0]?.name
          : (resident.property_properties as { name?: string } | null)?.name;
        return {
          id: resident.id as string,
          label: `${resident.display_name as string}${propertyName ? ` · ${propertyName}` : ""}`,
          href: `/pm/residents/${resident.id as string}`,
          group: "Residents",
          status: resident.status as string
        };
      })
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Search failed" },
      { status: 400 }
    );
  }
}
