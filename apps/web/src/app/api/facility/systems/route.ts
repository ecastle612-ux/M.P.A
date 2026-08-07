import { NextResponse } from "next/server";
import { createFacilitySystemInputSchema } from "@mpa/shared";
import { requireFacilityPermission } from "../../../../lib/facility/authz";
import { createFacilitySystem, listFacilitySystems } from "../../../../lib/facility/system-service";

export async function GET(request: Request) {
  const authz = await requireFacilityPermission("facility.systems:read");
  if ("error" in authz) {
    return authz.error;
  }

  const url = new URL(request.url);
  const siteId = url.searchParams.get("siteId");
  const status = url.searchParams.get("status");
  try {
    const systems = await listFacilitySystems(authz.supabase, authz.organizationId, {
      ...(siteId ? { siteId } : {}),
      ...(status ? { status } : {})
    });
    return NextResponse.json({ systems });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list building systems" },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  const authz = await requireFacilityPermission("facility.systems:write");
  if ("error" in authz) {
    return authz.error;
  }

  const payload = await request.json().catch(() => null);
  const parsed = createFacilitySystemInputSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const result = await createFacilitySystem(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      parsed.data
    );
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create building system" },
      { status: 400 }
    );
  }
}
