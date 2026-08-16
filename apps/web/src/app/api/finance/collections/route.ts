import { NextResponse } from "next/server";
import { requireFinancePermission } from "../../../../lib/finance/authz";
import {
  financeM5CollectionCapability,
  financeM5NotAuthorizedResponse,
  isFinanceM5CollectionKind
} from "../../../../lib/finance/m5-hard-stop";
import { getCollectionsSnapshot } from "../../../../lib/finance/collections-service";

export async function GET() {
  const authz = await requireFinancePermission("pm.finance:read");
  if ("error" in authz) {
    return authz.error;
  }
  try {
    const snapshot = await getCollectionsSnapshot(authz.supabase, authz.organizationId);
    const { data: policies } = await authz.supabase
      .from("financial_late_fee_policies")
      .select("*")
      .eq("organization_id", authz.organizationId)
      .order("created_at", { ascending: false });
    return NextResponse.json({ snapshot, policies: policies ?? [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load collections" },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const kind = payload?.kind as string | undefined;

  if (isFinanceM5CollectionKind(kind)) {
    const authz = await requireFinancePermission(financeM5CollectionCapability(kind));
    if ("error" in authz) {
      return authz.error;
    }
    return financeM5NotAuthorizedResponse();
  }

  const authz = await requireFinancePermission("pm.finance:read");
  if ("error" in authz) {
    return authz.error;
  }
  return NextResponse.json({ error: "Unknown collections kind" }, { status: 400 });
}
