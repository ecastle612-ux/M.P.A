import { NextResponse } from "next/server";
import { recordManualPaymentInputSchema } from "@mpa/shared";
import { requireFinancePermission } from "../../../../lib/finance/authz";
import { recordManualPayment } from "../../../../lib/finance/billing-service";

export async function GET(request: Request) {
  const authz = await requireFinancePermission("pm.finance:read");
  if ("error" in authz) {
    return authz.error;
  }

  const leaseId = new URL(request.url).searchParams.get("leaseId");
  let query = authz.supabase
    .from("financial_payments")
    .select("*, financial_receipts(*)")
    .eq("organization_id", authz.organizationId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (leaseId) {
    query = query.eq("lease_id", leaseId);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ payments: data ?? [] });
}

export async function POST(request: Request) {
  const authz = await requireFinancePermission("pm.finance:charge.write");
  if ("error" in authz) {
    return authz.error;
  }

  const payload = await request.json().catch(() => null);
  const parsed = recordManualPaymentInputSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const result = await recordManualPayment(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      parsed.data
    );
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to record payment" },
      { status: 400 }
    );
  }
}
