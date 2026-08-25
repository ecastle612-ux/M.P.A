import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { isPlatformOperatorUser } from "../../../../../lib/commercial/server";
import { loadPartnerRequestDeps } from "../../../../../lib/partners/request-deps";
import {
  listAuthorizedPropertyPortals,
  updateAuthorizedPropertyPortal
} from "../../../../../lib/partners/property-portal-service";
import { assertSafePublicRequestUrl, buildPublicRequestQrSvg } from "../../../../../lib/facility/public-request-qr";

export const runtime = "nodejs";

async function requireOperator() {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthenticated" }, { status: 401 }) };
  }
  if (!(await isPlatformOperatorUser(user))) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { user };
}

export async function GET(request: Request) {
  const auth = await requireOperator();
  if ("error" in auth) return auth.error;
  const url = new URL(request.url);
  const partnerId = url.searchParams.get("partnerId") ?? "";
  if (!partnerId) {
    return NextResponse.json({ error: "partnerId is required." }, { status: 400 });
  }
  const deps = await loadPartnerRequestDeps();
  const partner = await deps.store.getPartner(partnerId);
  if (!partner?.organizationId) {
    return NextResponse.json({ error: "Partner not found." }, { status: 404 });
  }
  const listed = await listAuthorizedPropertyPortals(
    {
      organizationId: partner.organizationId,
      partnerId: partner.id,
      query: url.searchParams.get("q") ?? "",
      page: Number(url.searchParams.get("page") ?? "1"),
      pageSize: Number(url.searchParams.get("pageSize") ?? "25")
    },
    deps
  );
  if (!listed.ok) {
    return NextResponse.json({ error: listed.error }, { status: 400 });
  }
  const items = await Promise.all(
    listed.items.map(async (item) => {
      const safe = assertSafePublicRequestUrl(item.qrPayload);
      return {
        ...item,
        canonicalPropertyId: item.propertyId,
        qrSvg: safe.ok ? await buildPublicRequestQrSvg(item.qrPayload) : null
      };
    })
  );
  return NextResponse.json({
    partnerId: partner.id,
    organizationId: partner.organizationId,
    items,
    page: listed.page,
    pageSize: listed.pageSize,
    total: listed.total,
    totalPages: listed.totalPages
  });
}

export async function PATCH(request: Request) {
  const auth = await requireOperator();
  if ("error" in auth) return auth.error;
  const body = (await request.json().catch(() => null)) as {
    linkId?: string;
    enabled?: boolean;
    publicSlug?: string;
    publicDisplayName?: string | null;
    publicInstructions?: string | null;
    organizationId?: string;
    propertyId?: string;
  } | null;
  if (!body?.linkId) {
    return NextResponse.json({ error: "linkId is required." }, { status: 400 });
  }
  if (body.organizationId !== undefined || body.propertyId !== undefined) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const deps = await loadPartnerRequestDeps();
  const current = await deps.propertyPortals?.getPortal(body.linkId);
  if (!current) {
    return NextResponse.json({ error: "Property portal not found." }, { status: 404 });
  }
  const updated = await updateAuthorizedPropertyPortal(
    {
      linkId: body.linkId,
      organizationId: current.organizationId,
      actorUserId: auth.user.id,
      payload: {
        ...(typeof body.enabled === "boolean" ? { enabled: body.enabled } : {}),
        ...(body.publicSlug !== undefined ? { publicSlug: body.publicSlug } : {}),
        ...(body.publicDisplayName !== undefined ? { publicDisplayName: body.publicDisplayName } : {}),
        ...(body.publicInstructions !== undefined ? { publicInstructions: body.publicInstructions } : {})
      },
      allowCrossOrg: true
    },
    deps
  );
  if (!updated.ok) {
    const status = updated.code === "not_found" ? 404 : updated.code === "conflict" ? 409 : 400;
    return NextResponse.json({ error: updated.error }, { status });
  }
  return NextResponse.json({ portal: updated.portal });
}
