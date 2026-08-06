import { NextResponse } from "next/server";
import { requireLeasingPermission } from "../../../../../../lib/leasing/authz";
import { sendLeaseForSignature } from "../../../../../../lib/leasing/lease-service";

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
    const result = await sendLeaseForSignature(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      leaseId
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send lease" },
      { status: 400 }
    );
  }
}
