import { NextResponse } from "next/server";
import { createResidentInputSchema } from "@mpa/shared";
import { requireResidentPermission } from "../../../../lib/resident/authz";
import { createResident, listResidents } from "../../../../lib/resident/resident-service";

export async function GET() {
  const authz = await requireResidentPermission("pm.residents:read");
  if ("error" in authz) {
    return authz.error;
  }

  try {
    const residents = await listResidents(authz.supabase, authz.organizationId);
    return NextResponse.json({ residents });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list residents" },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  const authz = await requireResidentPermission("pm.residents:write");
  if ("error" in authz) {
    return authz.error;
  }

  const payload = await request.json().catch(() => null);
  const parsed = createResidentInputSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const result = await createResident(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      parsed.data
    );
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create resident" },
      { status: 400 }
    );
  }
}
