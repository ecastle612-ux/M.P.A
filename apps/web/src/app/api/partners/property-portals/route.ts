import { NextResponse } from "next/server";
import { requirePartnerServicesRead, requirePartnerServicesWrite } from "../../../../lib/partners/authz";
import { loadPartnerRequestDeps } from "../../../../lib/partners/request-deps";
import {
  createAuthorizedPropertyPortal,
  listAuthorizedPropertyPortals
} from "../../../../lib/partners/property-portal-service";
import { assertSafePublicRequestUrl, buildPublicRequestQrSvg } from "../../../../lib/facility/public-request-qr";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authz = await requirePartnerServicesRead();
  if ("error" in authz) return authz.error;
  const url = new URL(request.url);
  const deps = await loadPartnerRequestDeps();
  const listed = await listAuthorizedPropertyPortals(
    {
      organizationId: authz.organizationId,
      query: url.searchParams.get("q") ?? "",
      page: Number(url.searchParams.get("page") ?? "1"),
      pageSize: Number(url.searchParams.get("pageSize") ?? "25"),
      sku: authz.sku,
      entitlements: authz.entitlements
    },
    deps
  );
  if (!listed.ok) {
    return NextResponse.json({ error: listed.error }, { status: listed.code === "not_found" ? 404 : 400 });
  }
  const items = await Promise.all(
    listed.items.map(async (item) => {
      const safe = assertSafePublicRequestUrl(item.qrPayload);
      return {
        ...item,
        qrSvg: safe.ok ? await buildPublicRequestQrSvg(item.qrPayload) : null
      };
    })
  );
  return NextResponse.json({
    partnerId: listed.partnerId,
    items,
    page: listed.page,
    pageSize: listed.pageSize,
    total: listed.total,
    totalPages: listed.totalPages
  });
}

export async function POST(request: Request) {
  const authz = await requirePartnerServicesWrite();
  if ("error" in authz) return authz.error;
  const payload = await request.json().catch(() => null);
  const deps = await loadPartnerRequestDeps();
  const created = await createAuthorizedPropertyPortal(
    {
      organizationId: authz.organizationId,
      actorUserId: authz.user.id,
      payload
    },
    deps
  );
  if (!created.ok) {
    const status = created.code === "not_found" ? 404 : created.code === "conflict" ? 409 : 400;
    return NextResponse.json({ error: created.error }, { status });
  }
  return NextResponse.json({ portal: created.portal });
}
