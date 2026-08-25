import { NextResponse } from "next/server";
import { partnerPortalIsLive, partnerServiceRequestAbsoluteUrl } from "@mpa/shared";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { isPlatformOperatorUser } from "../../../../../lib/commercial/server";
import { loadPartnerDeps } from "../../../../../lib/partners/runtime";
import { assertSafePublicRequestUrl, buildPublicRequestQrSvg } from "../../../../../lib/facility/public-request-qr";
import { clientEnv } from "../../../../../lib/env/client-env";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (!(await isPlatformOperatorUser(user))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const partnerId = new URL(request.url).searchParams.get("partnerId");
  if (!partnerId) return NextResponse.json({ error: "partnerId required" }, { status: 400 });
  const deps = await loadPartnerDeps();
  const partner = await deps.store.getPartner(partnerId);
  if (!partner?.publicSlug) {
    return NextResponse.json({ error: "Portal is not available." }, { status: 404 });
  }
  const portalUrl = partnerServiceRequestAbsoluteUrl(clientEnv.NEXT_PUBLIC_APP_URL, partner.publicSlug);
  const safe = assertSafePublicRequestUrl(portalUrl);
  if (!safe.ok) return NextResponse.json({ error: safe.error }, { status: 400 });
  const qrSvg = await buildPublicRequestQrSvg(portalUrl);
  return NextResponse.json({
    portalUrl,
    qrSvg,
    live: partnerPortalIsLive(partner)
  });
}
