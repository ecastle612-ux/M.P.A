import { NextResponse } from "next/server";
import { requireFinancePermission } from "../../../../../../lib/finance/authz";
import {
  getPropertyFinancialSnapshot,
  getRecentFinancialActivity,
  recordSummaryGenerated
} from "../../../../../../lib/finance/reporting-service";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ propertyId: string }> };

export async function GET(_request: Request, context: Params) {
  const authz = await requireFinancePermission("pm.finance:reports.read");
  if ("error" in authz) {
    return authz.error;
  }

  const { propertyId } = await context.params;

  try {
    const [snapshot, recentActivity] = await Promise.all([
      getPropertyFinancialSnapshot(authz.supabase, authz.organizationId, propertyId),
      getRecentFinancialActivity(authz.supabase, authz.organizationId, 20)
    ]);
    await recordSummaryGenerated(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      "property",
      propertyId
    );
    return NextResponse.json({
      snapshot,
      recentActivity: recentActivity.filter((item) => item.propertyId === propertyId)
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load property snapshot" },
      { status: 400 }
    );
  }
}
