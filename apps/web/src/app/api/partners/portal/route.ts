import { NextResponse } from "next/server";
import { partnerPortalIsLive, partnerServiceRequestAbsoluteUrl, partnerServiceRequestPath } from "@mpa/shared";
import { requirePartnerServicesRead } from "../../../../lib/partners/authz";
import { loadPartnerRequestDeps } from "../../../../lib/partners/request-deps";
import { assertSafePublicRequestUrl, buildPublicRequestQrSvg } from "../../../../lib/facility/public-request-qr";
import { clientEnv } from "../../../../lib/env/client-env";

export const runtime = "nodejs";

export async function GET() {
  const authz = await requirePartnerServicesRead();
  if ("error" in authz) return authz.error;
  const deps = await loadPartnerRequestDeps();
  const partners = (await deps.store.listPartners()).filter(
    (row) => row.organizationId === authz.organizationId
  );
  const live = partners.find((row) => partnerPortalIsLive(row));
  if (!live?.publicSlug) {
    return NextResponse.json({
      live: false,
      portalUrl: null,
      displayUrl: null,
      qrSvg: null,
      companyName: partners[0]?.companyName ?? null
    });
  }
  const portalUrl = partnerServiceRequestAbsoluteUrl(clientEnv.NEXT_PUBLIC_APP_URL, live.publicSlug);
  const safe = assertSafePublicRequestUrl(portalUrl);
  const qrSvg = safe.ok ? await buildPublicRequestQrSvg(portalUrl) : null;
  return NextResponse.json({
    live: true,
    companyName: live.companyName,
    slug: live.publicSlug,
    portalUrl,
    displayUrl: `my-property-assistant.com${partnerServiceRequestPath(live.publicSlug)}`,
    path: partnerServiceRequestPath(live.publicSlug),
    qrSvg
  });
}
