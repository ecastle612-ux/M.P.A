import { NextResponse } from "next/server";
import { PARTNER_ONBOARDING_EVENTS } from "@mpa/shared";
import { requirePartnerServicesWrite } from "../../../../../lib/partners/authz";
import { loadPartnerInvitationDeps } from "../../../../../lib/partners/invitation-runtime";
import { recordPartnerOnboardingAck } from "../../../../../lib/partners/invitation-service";

export const runtime = "nodejs";

const ALLOWED = new Set([
  PARTNER_ONBOARDING_EVENTS.qr_completed,
  PARTNER_ONBOARDING_EVENTS.earnings_acknowledged,
  PARTNER_ONBOARDING_EVENTS.referral_shared
]);

export async function POST(request: Request) {
  const authz = await requirePartnerServicesWrite();
  if ("error" in authz) return authz.error;
  const body = (await request.json().catch(() => null)) as { action?: string } | null;
  if (!body?.action || !ALLOWED.has(body.action)) {
    return NextResponse.json({ error: "Unknown onboarding acknowledgement." }, { status: 400 });
  }
  const deps = await loadPartnerInvitationDeps();
  const partner = await deps.store.getPartnerByOrganization(authz.organizationId);
  if (!partner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const onboarding = await recordPartnerOnboardingAck(
    {
      partner,
      actorUserId: authz.user.id,
      action: body.action as
        | typeof PARTNER_ONBOARDING_EVENTS.qr_completed
        | typeof PARTNER_ONBOARDING_EVENTS.earnings_acknowledged
        | typeof PARTNER_ONBOARDING_EVENTS.referral_shared
    },
    deps
  );
  return NextResponse.json({ onboarding });
}
