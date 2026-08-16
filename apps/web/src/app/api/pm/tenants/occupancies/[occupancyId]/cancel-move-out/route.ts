import { NextResponse } from "next/server";
import { requireResidentPermission } from "../../../../../../../lib/resident/authz";
import {
  cancelFutureMoveOut,
  TenantLifecycleError
} from "../../../../../../../lib/tenant-lifecycle/tenant-lifecycle-service";

export async function POST(
  _request: Request,
  context: { params: Promise<{ occupancyId: string }> }
) {
  const authz = await requireResidentPermission("pm.residents:write");
  if ("error" in authz) {
    return authz.error;
  }

  const { occupancyId } = await context.params;
  try {
    const result = await cancelFutureMoveOut({
      supabase: authz.supabase,
      organizationId: authz.organizationId,
      actorId: authz.user.id,
      occupancyId
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof TenantLifecycleError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to cancel move-out" },
      { status: 400 }
    );
  }
}
