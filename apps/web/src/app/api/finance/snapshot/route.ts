import { NextResponse } from "next/server";
import { requireFinancePermission } from "../../../../lib/finance/authz";
import { getOrganizationFinanceSnapshot } from "../../../../lib/finance/billing-service";
import { getCollectionsSnapshot } from "../../../../lib/finance/collections-service";

export async function GET() {
  const authz = await requireFinancePermission("pm.finance:read");
  if ("error" in authz) {
    return authz.error;
  }

  try {
    const [billing, collections] = await Promise.all([
      getOrganizationFinanceSnapshot(authz.supabase, authz.organizationId),
      getCollectionsSnapshot(authz.supabase, authz.organizationId)
    ]);
    return NextResponse.json({
      snapshot: {
        ...billing,
        ...collections,
        alerts: [...billing.alerts, ...collections.alerts]
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load snapshot" },
      { status: 400 }
    );
  }
}
