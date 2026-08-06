import { NextResponse } from "next/server";
import { requireFinancePermission } from "../../../../../../lib/finance/authz";
import { getLeaseLedger } from "../../../../../../lib/finance/billing-service";

export async function GET(_request: Request, context: { params: Promise<{ leaseId: string }> }) {
  const { leaseId } = await context.params;
  const authz = await requireFinancePermission("pm.finance:read");
  if ("error" in authz) {
    return authz.error;
  }

  try {
    const ledger = await getLeaseLedger(authz.supabase, authz.organizationId, leaseId);
    return NextResponse.json(ledger);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load ledger" },
      { status: 400 }
    );
  }
}
