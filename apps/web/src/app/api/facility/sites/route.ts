import { NextResponse } from "next/server";
import { createFacilitySiteInputSchema } from "@mpa/shared";
import { requireFacilityPermission } from "../../../../lib/facility/authz";
import { createFacilitySite, listFacilitySites } from "../../../../lib/facility/site-service";

export async function GET() {
  const authz = await requireFacilityPermission("facility.sites:read");
  if ("error" in authz) {
    return authz.error;
  }

  try {
    const sites = await listFacilitySites(authz.supabase, authz.organizationId);
    return NextResponse.json({ sites });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list facility sites" },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  const authz = await requireFacilityPermission("facility.sites:write");
  if ("error" in authz) {
    return authz.error;
  }

  const payload = await request.json().catch(() => null);
  const parsed = createFacilitySiteInputSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const result = await createFacilitySite(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      parsed.data
    );
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create facility site" },
      { status: 400 }
    );
  }
}
