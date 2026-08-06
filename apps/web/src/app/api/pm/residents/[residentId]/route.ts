import { NextResponse } from "next/server";
import { requireResidentPermission } from "../../../../../lib/resident/authz";
import { getResidentCommandCenter } from "../../../../../lib/resident/resident-service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ residentId: string }> }
) {
  const authz = await requireResidentPermission("pm.residents:read");
  if ("error" in authz) {
    return authz.error;
  }

  const { residentId } = await context.params;

  try {
    const commandCenter = await getResidentCommandCenter(
      authz.supabase,
      authz.organizationId,
      residentId
    );
    if (!commandCenter) {
      return NextResponse.json({ error: "Resident not found" }, { status: 404 });
    }
    return NextResponse.json(commandCenter);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load resident" },
      { status: 400 }
    );
  }
}
