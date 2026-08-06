import { NextResponse } from "next/server";
import { requireFinancePermission } from "../../../../../lib/finance/authz";
import { listPropertyFinancialSnapshots } from "../../../../../lib/finance/reporting-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const authz = await requireFinancePermission("pm.finance:reports.read");
  if ("error" in authz) {
    return authz.error;
  }

  try {
    const properties = await listPropertyFinancialSnapshots(authz.supabase, authz.organizationId);
    return NextResponse.json({ properties });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load property financials" },
      { status: 400 }
    );
  }
}
