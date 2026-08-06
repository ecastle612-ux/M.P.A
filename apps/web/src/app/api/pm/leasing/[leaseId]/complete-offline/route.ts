import { NextResponse } from "next/server";
import { completeLeaseOfflineInputSchema } from "@mpa/shared";
import { requireLeasingPermission } from "../../../../../../lib/leasing/authz";
import { completeLeaseOffline } from "../../../../../../lib/leasing/lease-service";

export async function POST(
  request: Request,
  context: { params: Promise<{ leaseId: string }> }
) {
  const authz = await requireLeasingPermission("pm.leasing:write");
  if ("error" in authz) {
    return authz.error;
  }

  const { leaseId } = await context.params;
  const payload = await request.json().catch(() => ({}));
  const parsed = completeLeaseOfflineInputSchema.safeParse({ ...payload, leaseId });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const result = await completeLeaseOffline(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      leaseId,
      parsed.data.note
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to complete lease" },
      { status: 400 }
    );
  }
}
