import { NextResponse } from "next/server";
import { correctMoveOutInputSchema } from "@mpa/shared";
import { requireResidentPermission } from "../../../../../../../lib/resident/authz";
import {
  correctMoveOut,
  TenantLifecycleError
} from "../../../../../../../lib/tenant-lifecycle/tenant-lifecycle-service";

export async function POST(
  request: Request,
  context: { params: Promise<{ occupancyId: string }> }
) {
  const authz = await requireResidentPermission("pm.residents:write");
  if ("error" in authz) {
    return authz.error;
  }

  const { occupancyId } = await context.params;
  const payload = await request.json().catch(() => null);
  const parsed = correctMoveOutInputSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const result = await correctMoveOut({
      supabase: authz.supabase,
      organizationId: authz.organizationId,
      actorId: authz.user.id,
      occupancyId,
      occupyTo: parsed.data.occupyTo ?? null,
      ...(parsed.data.note ? { note: parsed.data.note } : {})
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof TenantLifecycleError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to correct move-out" },
      { status: 400 }
    );
  }
}
