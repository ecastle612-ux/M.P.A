import { NextResponse } from "next/server";
import { requireFinancePermission } from "../../../../lib/finance/authz";
import { sendPaymentReminderForLease } from "../../../../lib/finance/billing-service";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const authz = await requireFinancePermission("pm.finance:charge.write");
  if ("error" in authz) {
    return authz.error;
  }

  const payload = (await request.json().catch(() => null)) as { leaseId?: unknown } | null;
  const leaseId = typeof payload?.leaseId === "string" ? payload.leaseId : "";
  if (!UUID_RE.test(leaseId)) {
    return NextResponse.json({ error: "Invalid payload", details: { leaseId: "uuid required" } }, { status: 400 });
  }

  try {
    const result = await sendPaymentReminderForLease(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      leaseId
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send reminder" },
      { status: 400 }
    );
  }
}
