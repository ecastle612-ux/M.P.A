import { NextResponse } from "next/server";
import { upsertLateFeePolicyInputSchema } from "@mpa/shared";
import { requireFinancePermission } from "../../../../lib/finance/authz";
import { upsertLateFeePolicy } from "../../../../lib/finance/collections-service";
import { createServiceRoleClient } from "../../../../lib/supabase/service-role";

export async function GET() {
  const authz = await requireFinancePermission("pm.finance:read");
  if ("error" in authz) {
    return authz.error;
  }
  const { data, error } = await authz.supabase
    .from("financial_late_fee_policies")
    .select("*")
    .eq("organization_id", authz.organizationId)
    .order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ policies: data ?? [] });
}

export async function POST(request: Request) {
  const authz = await requireFinancePermission("pm.finance:late_fee.manage");
  if ("error" in authz) {
    return authz.error;
  }
  const payload = await request.json().catch(() => null);
  const parsed = upsertLateFeePolicyInputSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }
  try {
    let writer = authz.supabase;
    try {
      writer = createServiceRoleClient();
    } catch {
      writer = authz.supabase;
    }
    const policy = await upsertLateFeePolicy(writer, authz.organizationId, authz.user.id, parsed.data);
    return NextResponse.json({ policy });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Late fee policy failed" },
      { status: 400 }
    );
  }
}
