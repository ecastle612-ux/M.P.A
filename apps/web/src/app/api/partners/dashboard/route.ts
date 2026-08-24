import { NextResponse } from "next/server";
import { requirePartnerServicesRead } from "../../../../lib/partners/authz";
import { loadCommandCenterDeps, loadPartnerCommandCenter } from "../../../../lib/partners/command-center-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authz = await requirePartnerServicesRead();
  if ("error" in authz) return authz.error;
  const url = new URL(request.url);
  if (url.searchParams.get("partnerId") || url.searchParams.get("partner_id")) {
    return NextResponse.json({ error: "partner_id is not an authorization parameter." }, { status: 400 });
  }
  const deps = await loadCommandCenterDeps();
  const snapshot = await loadPartnerCommandCenter(authz.organizationId, deps);
  return NextResponse.json(snapshot);
}
