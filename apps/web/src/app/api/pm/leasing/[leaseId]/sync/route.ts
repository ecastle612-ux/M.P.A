import { NextResponse } from "next/server";
import { requireLeasingPermission } from "../../../../../../lib/leasing/authz";
import { syncLeaseFromSignWell } from "../../../../../../lib/leasing/lease-service";

export async function POST(
  _request: Request,
  context: { params: Promise<{ leaseId: string }> }
) {
  const authz = await requireLeasingPermission("pm.leasing:write");
  if ("error" in authz) {
    return authz.error;
  }

  const { leaseId } = await context.params;

  try {
    const result = await syncLeaseFromSignWell(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      leaseId
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to sync SignWell" },
      { status: 400 }
    );
  }
}
