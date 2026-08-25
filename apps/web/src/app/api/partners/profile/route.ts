import { NextResponse } from "next/server";
import { PARTNER_TYPE_LABELS } from "@mpa/shared";
import { requirePartnerServicesRead, requirePartnerServicesWrite } from "../../../../lib/partners/authz";
import { loadCommandCenterDeps, resolveBoundPartner } from "../../../../lib/partners/command-center-service";
import { loadPartnerDeps } from "../../../../lib/partners/runtime";
import { updatePartnerPublicProfile } from "../../../../lib/partners/service";

export const runtime = "nodejs";

export async function GET() {
  const authz = await requirePartnerServicesRead();
  if ("error" in authz) return authz.error;
  const deps = await loadCommandCenterDeps();
  const partner = await resolveBoundPartner(authz.organizationId, deps.store);
  if (!partner) {
    return NextResponse.json({ error: "No Partner Program account is bound to this workspace." }, { status: 404 });
  }
  return NextResponse.json({
    profile: {
      companyName: partner.companyName,
      partnerTypeLabel: PARTNER_TYPE_LABELS[partner.partnerType],
      partnerType: partner.partnerType,
      status: partner.status,
      publicSlug: partner.publicSlug,
      portalEnabled: partner.publicPortalEnabled,
      portalDescription: partner.portalDescription,
      phone: partner.phone,
      email: partner.email,
      website: partner.website,
      serviceArea: partner.serviceArea,
      servicesOffered: partner.servicesOffered,
      logoMediaId: partner.logoMediaId,
      commissionBps: partner.commissionBps
    }
  });
}

export async function PATCH(request: Request) {
  const authz = await requirePartnerServicesWrite();
  if ("error" in authz) return authz.error;
  const payload = await request.json().catch(() => null);
  const deps = await loadPartnerDeps();
  const result = await updatePartnerPublicProfile(
    { organizationId: authz.organizationId, actorUserId: authz.user.id, payload },
    deps
  );
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({
    profile: {
      companyName: result.partner.companyName,
      portalDescription: result.partner.portalDescription,
      phone: result.partner.phone,
      email: result.partner.email,
      website: result.partner.website,
      serviceArea: result.partner.serviceArea,
      servicesOffered: result.partner.servicesOffered
    }
  });
}
