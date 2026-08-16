import { NextResponse } from "next/server";
import { addTenantInputSchema } from "@mpa/shared";
import { requireResidentPermission } from "../../../../lib/resident/authz";
import {
  addTenantToLease,
  TenantLifecycleError
} from "../../../../lib/tenant-lifecycle/tenant-lifecycle-service";

export async function POST(request: Request) {
  const authz = await requireResidentPermission("pm.residents:write");
  if ("error" in authz) {
    return authz.error;
  }

  const payload = await request.json().catch(() => null);
  const parsed = addTenantInputSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { data: organization } = await authz.supabase
    .from("organizations")
    .select("name")
    .eq("id", authz.organizationId)
    .maybeSingle();

  try {
    const result = await addTenantToLease({
      supabase: authz.supabase,
      organizationId: authz.organizationId,
      actorId: authz.user.id,
      organizationName: (organization?.name as string | undefined) ?? "your property",
      input: parsed.data
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof TenantLifecycleError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to add tenant" },
      { status: 400 }
    );
  }
}
