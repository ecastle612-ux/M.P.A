import { NextResponse } from "next/server";
import { requirePartnerServicesRead } from "../../../../lib/partners/authz";
import { listPartnerEarningsLedger, loadCommandCenterDeps } from "../../../../lib/partners/command-center-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authz = await requirePartnerServicesRead();
  if ("error" in authz) return authz.error;
  const url = new URL(request.url);
  if (url.searchParams.get("partnerId") || url.searchParams.get("partner_id")) {
    return NextResponse.json({ error: "partner_id is not an authorization parameter." }, { status: 400 });
  }
  const deps = await loadCommandCenterDeps();
  const result = await listPartnerEarningsLedger(authz.organizationId, deps);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }
  return NextResponse.json({ summary: result.summary, commissions: result.rows });
}
