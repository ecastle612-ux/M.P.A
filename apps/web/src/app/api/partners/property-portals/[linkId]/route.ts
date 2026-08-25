import { NextResponse } from "next/server";
import { requirePartnerServicesRead, requirePartnerServicesWrite } from "../../../../../lib/partners/authz";
import { loadPartnerRequestDeps } from "../../../../../lib/partners/request-deps";
import {
  getAuthorizedPropertyPortal,
  updateAuthorizedPropertyPortal
} from "../../../../../lib/partners/property-portal-service";
import { assertSafePublicRequestUrl, buildPublicRequestQrSvg } from "../../../../../lib/facility/public-request-qr";

export const runtime = "nodejs";

type Params = { params: Promise<{ linkId: string }> };

export async function GET(_request: Request, context: Params) {
  const authz = await requirePartnerServicesRead();
  if ("error" in authz) return authz.error;
  const { linkId } = await context.params;
  const deps = await loadPartnerRequestDeps();
  const item = await getAuthorizedPropertyPortal(
    { linkId, organizationId: authz.organizationId, sku: authz.sku, entitlements: authz.entitlements },
    deps
  );
  if (!item) {
    return NextResponse.json({ error: "Property portal not found." }, { status: 404 });
  }
  const safe = assertSafePublicRequestUrl(item.qrPayload);
  return NextResponse.json({
    portal: {
      ...item,
      qrSvg: safe.ok ? await buildPublicRequestQrSvg(item.qrPayload) : null
    }
  });
}

export async function PATCH(request: Request, context: Params) {
  const authz = await requirePartnerServicesWrite();
  if ("error" in authz) return authz.error;
  const { linkId } = await context.params;
  const payload = await request.json().catch(() => null);
  const deps = await loadPartnerRequestDeps();
  const updated = await updateAuthorizedPropertyPortal(
    {
      linkId,
      organizationId: authz.organizationId,
      actorUserId: authz.user.id,
      payload
    },
    deps
  );
  if (!updated.ok) {
    const status = updated.code === "not_found" ? 404 : updated.code === "conflict" ? 409 : 400;
    return NextResponse.json({ error: updated.error }, { status });
  }
  return NextResponse.json({ portal: updated.portal });
}
