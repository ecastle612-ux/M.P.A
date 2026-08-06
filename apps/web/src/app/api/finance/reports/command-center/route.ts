import { NextResponse } from "next/server";
import { requireFinancePermission } from "../../../../../lib/finance/authz";
import { getCommandCenterReport } from "../../../../../lib/finance/reporting-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const authz = await requireFinancePermission("pm.finance:reports.read");
  if ("error" in authz) {
    return authz.error;
  }

  try {
    const report = await getCommandCenterReport(authz.supabase, authz.organizationId);
    return NextResponse.json({ report });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load command center report" },
      { status: 400 }
    );
  }
}
