import { NextResponse } from "next/server";
import { requireLeasingPermission } from "../../../../../lib/leasing/authz";
import { getLeaseCommandCenter } from "../../../../../lib/leasing/lease-service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ leaseId: string }> }
) {
  const authz = await requireLeasingPermission("pm.leasing:read");
  if ("error" in authz) {
    return authz.error;
  }

  const { leaseId } = await context.params;

  try {
    const commandCenter = await getLeaseCommandCenter(
      authz.supabase,
      authz.organizationId,
      leaseId
    );
    if (!commandCenter) {
      return NextResponse.json({ error: "Lease not found" }, { status: 404 });
    }
    return NextResponse.json(commandCenter);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load lease" },
      { status: 400 }
    );
  }
}
