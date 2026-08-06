import { NextResponse } from "next/server";
import { requireFinancePermission } from "../../../../lib/finance/authz";
import { getOrganizationFinanceSnapshot } from "../../../../lib/finance/billing-service";

export async function GET() {
  const authz = await requireFinancePermission("pm.finance:read");
  if ("error" in authz) {
    return authz.error;
  }

  try {
    const snapshot = await getOrganizationFinanceSnapshot(authz.supabase, authz.organizationId);
    return NextResponse.json({ snapshot });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load snapshot" },
      { status: 400 }
    );
  }
}
