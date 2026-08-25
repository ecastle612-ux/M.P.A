import { NextResponse } from "next/server";
import { PARTNER_TYPE_LABELS, bpsToPercent, partnerPortalIsLive, partnerServiceRequestPath } from "@mpa/shared";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { isPlatformOperatorUser } from "../../../../lib/commercial/server";
import { listPartnerConsole, mutatePartner } from "../../../../lib/partners/service";
import { loadPartnerDeps } from "../../../../lib/partners/runtime";
import { loadPartnerRequestDeps } from "../../../../lib/partners/request-deps";
import { loadPartnerInvitationDeps } from "../../../../lib/partners/invitation-runtime";
import {
  buildPartnerOnboardingSnapshot,
  inviteApprovedPartner,
  invitePartnerDirect,
  latestInvitationForPartner,
  resendPartnerInvitation,
  sendPartnerSetupReminder
} from "../../../../lib/partners/invitation-service";
import { PARTNER_ONBOARDING_EVENTS } from "@mpa/shared";

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

export async function GET() {
  const auth = await requireOperator();
  if ("error" in auth) {
    return auth.error;
  }
  const deps = await loadPartnerDeps();
  const requestDeps = await loadPartnerRequestDeps();
  const inviteDeps = await loadPartnerInvitationDeps();
  const consoleState = await listPartnerConsole(deps);
  const requestCounts = await Promise.all(
    consoleState.partners.map(async (partner) => ({
      id: partner.id,
      count: await requestDeps.requests.countForPartner(partner.id)
    }))
  );
  const counts = Object.fromEntries(requestCounts.map((row) => [row.id, row.count]));
  const partners = await Promise.all(
    consoleState.partners.map(async (partner) => {
      const invitation = await latestInvitationForPartner(inviteDeps.store, partner.id);
      const onboarding = await buildPartnerOnboardingSnapshot(partner, inviteDeps);
      return {
        ...partner,
        partnerTypeLabel: PARTNER_TYPE_LABELS[partner.partnerType],
        commissionPercent: bpsToPercent(partner.commissionBps),
        portalLive: partnerPortalIsLive(partner),
        portalPath: partner.publicSlug ? partnerServiceRequestPath(partner.publicSlug) : null,
        requestCount: counts[partner.id] ?? 0,
        invitationStatus: invitation?.status ?? null,
        invitationSentAt: invitation?.createdAt ?? null,
        invitationAcceptedAt: invitation?.acceptedAt ?? null,
        accountConnected: Boolean(partner.organizationId),
        propertyCount: inviteDeps.listPropertyPortalCount
          ? await inviteDeps.listPropertyPortalCount(partner.id)
          : 0,
        onboarding
      };
    })
  );
  return NextResponse.json({
    partners,
    referrals: consoleState.referrals,
    commissions: consoleState.commissions,
    events: consoleState.events
  });
}

export async function POST(request: Request) {
  const auth = await requireOperator();
  if ("error" in auth) {
    return auth.error;
  }
  const body = await request.json().catch(() => null);
  const deps = await loadPartnerInvitationDeps();
  const result = await invitePartnerDirect(
    body,
    { actorUserId: auth.user.id, invitedByLabel: "M.P.A. Master Admin" },
    deps
  );
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({
    partner: result.partner,
    invitationStatus: result.invitation.status,
    created: result.created,
    reused: result.reused
  });
}

export async function PATCH(request: Request) {
  const auth = await requireOperator();
  if ("error" in auth) {
    return auth.error;
  }
  const body = (await request.json().catch(() => null)) as {
    partnerId?: string;
    action?: string;
    publicSlug?: string;
    partnerType?: string;
    commissionPercent?: number;
    commissionId?: string;
    organizationId?: string | null;
    publicPortalEnabled?: boolean;
    portalDescription?: string | null;
  } | null;
  if (!body?.partnerId || !body.action) {
    return NextResponse.json({ error: "partnerId and action required" }, { status: 400 });
  }

  const inviteDeps = await loadPartnerInvitationDeps();
  if (body.action === "invite") {
    const issued = await inviteApprovedPartner(
      { partnerId: body.partnerId, actorUserId: auth.user.id, invitedByLabel: "M.P.A. Master Admin" },
      inviteDeps
    );
    if (!issued.ok) return NextResponse.json({ error: issued.error }, { status: 400 });
    return NextResponse.json({ partner: issued.partner, invitationStatus: issued.invitation.status, reused: issued.reused });
  }
  if (body.action === "resend_invitation") {
    const issued = await resendPartnerInvitation(
      { partnerId: body.partnerId, actorUserId: auth.user.id, invitedByLabel: "M.P.A. Master Admin" },
      inviteDeps
    );
    if (!issued.ok) return NextResponse.json({ error: issued.error }, { status: 400 });
    return NextResponse.json({ partner: issued.partner, invitationStatus: issued.invitation.status });
  }
  if (body.action === "send_setup_reminder") {
    const reminder = await sendPartnerSetupReminder(
      { partnerId: body.partnerId, actorUserId: auth.user.id },
      inviteDeps
    );
    if (!reminder.ok) return NextResponse.json({ error: reminder.error }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  const allowed = new Set([
    "approve",
    "reject",
    "activate",
    "suspend",
    "update",
    "mark_paid",
    "clear_flag"
  ]);
  if (!allowed.has(body.action)) {
    return NextResponse.json({ error: "unknown_action" }, { status: 400 });
  }
  const deps = await loadPartnerDeps();
  const previous = await deps.store.getPartner(body.partnerId);
  const result = await mutatePartner(
    {
      partnerId: body.partnerId,
      action: body.action as
        | "approve"
        | "reject"
        | "activate"
        | "suspend"
        | "update"
        | "mark_paid"
        | "clear_flag",
      actorUserId: auth.user.id,
      ...(body.publicSlug !== undefined ? { publicSlug: body.publicSlug } : {}),
      ...(body.partnerType !== undefined ? { partnerType: body.partnerType } : {}),
      ...(typeof body.commissionPercent === "number"
        ? { commissionBps: Math.round(body.commissionPercent * 100) }
        : {}),
      ...(body.commissionId ? { commissionId: body.commissionId } : {}),
      ...(body.organizationId !== undefined ? { organizationId: body.organizationId } : {}),
      ...(typeof body.publicPortalEnabled === "boolean"
        ? { publicPortalEnabled: body.publicPortalEnabled }
        : {}),
      ...(body.portalDescription !== undefined ? { portalDescription: body.portalDescription } : {})
    },
    deps
  );
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  if (body.action === "approve" && result.partner) {
    await inviteApprovedPartner(
      { partnerId: result.partner.id, actorUserId: auth.user.id, invitedByLabel: "M.P.A. Master Admin" },
      inviteDeps
    );
  }
  if (
    result.partner &&
    previous &&
    !previous.publicPortalEnabled &&
    result.partner.publicPortalEnabled
  ) {
    await inviteDeps.store.insertEvent({
      id: crypto.randomUUID(),
      partnerId: result.partner.id,
      action: PARTNER_ONBOARDING_EVENTS.portal_configured,
      actorUserId: auth.user.id,
      payload: {},
      createdAt: new Date().toISOString()
    });
  }
  return NextResponse.json({
    partner: result.partner ?? null,
    commission: result.commission ?? null
  });
}
