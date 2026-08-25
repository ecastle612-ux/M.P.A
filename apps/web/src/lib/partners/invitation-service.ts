import {
  DEFAULT_COMMISSION_BPS,
  PARTNER_INVITATION_CTA_LABEL,
  PARTNER_INVITATION_EMAIL_MISMATCH_MESSAGE,
  PARTNER_INVITATION_EMAIL_SUBJECT,
  PARTNER_ONBOARDING_EVENTS,
  derivePartnerOnboarding,
  normalizePartnerInviteEmail,
  parsePartnerDirectInviteInput,
  partnerInviteEmailsMatch,
  partnerInvitationAbsoluteUrl,
  partnerInvitationEmailBody,
  partnerInvitationPublicView,
  partnerSetupReminderEmailBody,
  proposePartnerSlug,
  type PartnerInvitationSource,
  type PartnerOnboardingSnapshot
} from "@mpa/shared";
import { clientEnv } from "../env/client-env";
import { hashPartnerInvitationToken, issuePartnerInvitationToken, partnerInvitationTokenLooksValid } from "./invitation-tokens";
import { defaultPartnerDeps, type PartnerServiceDeps } from "./service";
import type { PartnerInvitation, PartnerStore, PlatformPartner } from "./types";

export type PartnerInvitationEmailInput = {
  to: string;
  subject: string;
  body: string;
  ctaUrl: string;
  ctaLabel: string;
  idempotencyKey?: string;
};

export type PartnerInvitationServiceDeps = PartnerServiceDeps & {
  sendInvitationEmail?: (input: PartnerInvitationEmailInput) => Promise<void>;
  createPartnerOrganization?: (input: {
    name: string;
    ownerUserId: string;
  }) => Promise<{ organizationId: string }>;
  ensurePartnerMembership?: (input: { organizationId: string; userId: string }) => Promise<void>;
  listPropertyPortalCount?: (partnerId: string) => Promise<number>;
  appOrigin?: string;
};

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  return crypto.randomUUID();
}

async function writeEvent(
  deps: PartnerServiceDeps,
  input: { partnerId: string | null; action: string; actorUserId?: string | null; payload?: Record<string, unknown> }
): Promise<void> {
  await deps.store.insertEvent({
    id: newId(),
    partnerId: input.partnerId,
    action: input.action,
    actorUserId: input.actorUserId ?? null,
    payload: input.payload ?? {},
    createdAt: nowIso()
  });
}

function origin(deps: PartnerInvitationServiceDeps): string {
  return deps.appOrigin || clientEnv.NEXT_PUBLIC_APP_URL || "https://www.my-property-assistant.com";
}

async function takenSlugs(store: PartnerStore, exceptId?: string): Promise<Set<string>> {
  const rows = await store.listPartners();
  return new Set(
    rows
      .filter((row) => row.id !== exceptId && row.publicSlug)
      .map((row) => row.publicSlug!.toLowerCase())
  );
}

export async function latestInvitationForPartner(
  store: PartnerStore,
  partnerId: string
): Promise<PartnerInvitation | null> {
  const rows = await store.listInvitations(partnerId);
  return rows[0] ?? null;
}

export async function buildPartnerOnboardingSnapshot(
  partner: PlatformPartner,
  deps: PartnerInvitationServiceDeps
): Promise<PartnerOnboardingSnapshot> {
  const invitation = await latestInvitationForPartner(deps.store, partner.id);
  const events = await deps.store.listEvents(partner.id);
  const propertyPortalCount = deps.listPropertyPortalCount
    ? await deps.listPropertyPortalCount(partner.id)
    : 0;
  return derivePartnerOnboarding({
    status: partner.status,
    partnerType: partner.partnerType,
    organizationId: partner.organizationId,
    publicSlug: partner.publicSlug,
    publicPortalEnabled: partner.publicPortalEnabled,
    portalDescription: partner.portalDescription,
    phone: partner.phone,
    email: partner.email,
    website: partner.website,
    serviceArea: partner.serviceArea,
    servicesOffered: partner.servicesOffered,
    logoMediaId: partner.logoMediaId,
    invitationStatus: invitation?.status ?? null,
    invitationAcceptedAt: invitation?.acceptedAt ?? null,
    propertyPortalCount,
    eventActions: events.map((row) => row.action)
  });
}

async function sendIssuedEmail(
  deps: PartnerInvitationServiceDeps,
  input: {
    partner: PlatformPartner;
    token: string;
    expiresAt: string;
    invitedByLabel: string;
    actorUserId: string;
  }
): Promise<void> {
  if (!deps.sendInvitationEmail) return;
  const ctaUrl = partnerInvitationAbsoluteUrl(origin(deps), input.token);
  await deps.sendInvitationEmail({
    to: input.partner.email,
    subject: PARTNER_INVITATION_EMAIL_SUBJECT,
    body: partnerInvitationEmailBody({
      invitedByLabel: input.invitedByLabel,
      companyName: input.partner.companyName,
      partnerType: input.partner.partnerType,
      expiresAt: input.expiresAt
    }),
    ctaUrl,
    ctaLabel: PARTNER_INVITATION_CTA_LABEL,
    idempotencyKey: `partner-invite:${input.partner.id}:${input.expiresAt}`
  });
  void input.actorUserId;
}

export async function issuePartnerInvitation(
  input: {
    partnerId: string;
    actorUserId: string;
    source: PartnerInvitationSource;
    rotate?: boolean;
    invitedByLabel?: string;
  },
  deps: PartnerInvitationServiceDeps = defaultPartnerDeps()
): Promise<
  | { ok: true; partner: PlatformPartner; invitation: PartnerInvitation; reused: boolean }
  | { ok: false; error: string }
> {
  const partner = await deps.store.getPartner(input.partnerId);
  if (!partner) {
    return { ok: false, error: "Partner not found." };
  }
  if (partner.status === "rejected") {
    return { ok: false, error: "Rejected partners cannot be invited." };
  }

  const pending = await deps.store.getPendingInvitationByPartner(partner.id);
  if (pending && !input.rotate) {
    return { ok: true, partner, invitation: pending, reused: true };
  }
  if (pending && input.rotate) {
    await deps.store.updateInvitation({
      ...pending,
      status: "revoked",
      updatedAt: nowIso()
    });
  }

  const issued = issuePartnerInvitationToken();
  const timestamp = nowIso();
  const invitation: PartnerInvitation = {
    id: newId(),
    partnerId: partner.id,
    email: normalizePartnerInviteEmail(partner.email),
    tokenHash: issued.hash,
    status: "pending",
    source: input.source,
    expiresAt: issued.expiresAt,
    invitedBy: input.actorUserId,
    acceptedAt: null,
    acceptedUserId: null,
    createdAt: timestamp,
    updatedAt: timestamp
  };
  await deps.store.insertInvitation(invitation);
  await writeEvent(deps, {
    partnerId: partner.id,
    action: input.rotate ? PARTNER_ONBOARDING_EVENTS.invitation_resent : PARTNER_ONBOARDING_EVENTS.invited,
    actorUserId: input.actorUserId,
    payload: {
      invitationId: invitation.id,
      source: input.source,
      expiresAt: invitation.expiresAt
    }
  });
  await sendIssuedEmail(deps, {
    partner,
    token: issued.token,
    expiresAt: issued.expiresAt,
    invitedByLabel: input.invitedByLabel ?? "M.P.A. Master Admin",
    actorUserId: input.actorUserId
  });
  return { ok: true, partner, invitation, reused: false };
}

export async function inviteApprovedPartner(
  input: { partnerId: string; actorUserId: string; invitedByLabel?: string },
  deps: PartnerInvitationServiceDeps = defaultPartnerDeps()
) {
  return issuePartnerInvitation(
    {
      partnerId: input.partnerId,
      actorUserId: input.actorUserId,
      source: "application_approval",
      rotate: false,
      ...(input.invitedByLabel ? { invitedByLabel: input.invitedByLabel } : {})
    },
    deps
  );
}

export async function resendPartnerInvitation(
  input: { partnerId: string; actorUserId: string; invitedByLabel?: string },
  deps: PartnerInvitationServiceDeps = defaultPartnerDeps()
) {
  return issuePartnerInvitation(
    {
      partnerId: input.partnerId,
      actorUserId: input.actorUserId,
      source: "resend",
      rotate: true,
      ...(input.invitedByLabel ? { invitedByLabel: input.invitedByLabel } : {})
    },
    deps
  );
}

export async function invitePartnerDirect(
  payload: unknown,
  input: { actorUserId: string; invitedByLabel?: string },
  deps: PartnerInvitationServiceDeps = defaultPartnerDeps()
): Promise<
  | { ok: true; partner: PlatformPartner; invitation: PartnerInvitation; created: boolean; reused: boolean }
  | { ok: false; error: string }
> {
  const parsed = parsePartnerDirectInviteInput(payload);
  if (!parsed.ok) return parsed;

  const existing = await deps.store.getPartnerByEmail(parsed.data.email);
  if (existing) {
    if (existing.status === "applied") {
      const timestamp = nowIso();
      const approved: PlatformPartner = {
        ...existing,
        status: "approved",
        approvedAt: existing.approvedAt ?? timestamp,
        partnerType: parsed.data.partnerType,
        updatedAt: timestamp
      };
      if (!approved.publicSlug) {
        approved.publicSlug = proposePartnerSlug(approved.companyName, await takenSlugs(deps.store, approved.id));
      }
      await deps.store.updatePartner(approved);
      await writeEvent(deps, {
        partnerId: approved.id,
        action: "approve",
        actorUserId: input.actorUserId,
        payload: { source: "direct_invite_reconcile", email: approved.email }
      });
      const issued = await issuePartnerInvitation(
        {
          partnerId: approved.id,
          actorUserId: input.actorUserId,
          source: "direct_invite",
          rotate: false,
          ...(input.invitedByLabel ? { invitedByLabel: input.invitedByLabel } : {})
        },
        deps
      );
      if (!issued.ok) return issued;
      return { ok: true, partner: issued.partner, invitation: issued.invitation, created: false, reused: issued.reused };
    }
    if (existing.status === "rejected") {
      return { ok: false, error: "An existing rejected application uses this email. Approve it or use a different email." };
    }
    const issued = await issuePartnerInvitation(
      {
        partnerId: existing.id,
        actorUserId: input.actorUserId,
        source: "direct_invite",
        rotate: false,
        ...(input.invitedByLabel ? { invitedByLabel: input.invitedByLabel } : {})
      },
      deps
    );
    if (!issued.ok) return issued;
    return { ok: true, partner: issued.partner, invitation: issued.invitation, created: false, reused: issued.reused };
  }

  const timestamp = nowIso();
  const partner: PlatformPartner = {
    id: newId(),
    companyName: parsed.data.companyName,
    contactName: parsed.data.contactName,
    email: parsed.data.email,
    phone: parsed.data.phone ?? "",
    website: parsed.data.website,
    city: "",
    state: "",
    serviceArea: parsed.data.serviceArea ?? "",
    companyServiceType: parsed.data.partnerType,
    servicesOffered: parsed.data.servicesOffered ?? "",
    customersServed: null,
    mpaAccountEmail: null,
    interestedPartnerType: parsed.data.partnerType,
    notes: parsed.data.notes,
    partnerType: parsed.data.partnerType,
    status: "approved",
    publicSlug: proposePartnerSlug(parsed.data.companyName, await takenSlugs(deps.store)),
    organizationId: null,
    publicPortalEnabled: false,
    portalDescription: null,
    logoMediaId: null,
    commissionBps: DEFAULT_COMMISSION_BPS,
    approvedAt: timestamp,
    activatedAt: null,
    rejectedAt: null,
    suspendedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp
  };
  await deps.store.insertPartner(partner);
  const issued = await issuePartnerInvitation(
    {
      partnerId: partner.id,
      actorUserId: input.actorUserId,
      source: "direct_invite",
      rotate: false,
      ...(input.invitedByLabel ? { invitedByLabel: input.invitedByLabel } : {})
    },
    deps
  );
  if (!issued.ok) return issued;
  return { ok: true, partner: issued.partner, invitation: issued.invitation, created: true, reused: issued.reused };
}

export function inspectPartnerInvitationToken(
  token: string,
  invitation: PartnerInvitation | null,
  partner: PlatformPartner | null
) {
  if (!partnerInvitationTokenLooksValid(token) || !invitation) {
    return partnerInvitationPublicView({ status: null, expiresAt: null });
  }
  return partnerInvitationPublicView({
    status: invitation.status,
    expiresAt: invitation.expiresAt,
    companyName: partner?.companyName ?? null,
    partnerType: partner?.partnerType ?? null
  });
}

export async function lookupInvitationByRawToken(
  token: string,
  store: PartnerStore
): Promise<{ invitation: PartnerInvitation | null; partner: PlatformPartner | null }> {
  if (!partnerInvitationTokenLooksValid(token)) {
    return { invitation: null, partner: null };
  }
  const invitation = await store.getInvitationByTokenHash(hashPartnerInvitationToken(token));
  if (!invitation) {
    return { invitation: null, partner: null };
  }
  const partner = await store.getPartner(invitation.partnerId);
  return { invitation, partner };
}

export async function acceptPartnerInvitation(
  input: {
    token: string;
    userId: string;
    userEmail: string | null | undefined;
    clientPayload?: unknown;
  },
  deps: PartnerInvitationServiceDeps = defaultPartnerDeps()
): Promise<
  | { ok: true; partner: PlatformPartner; organizationId: string; alreadyAccepted: boolean }
  | { ok: false; error: string; code: "unavailable" | "expired" | "email_mismatch" | "unauthenticated" | "invalid" }
> {
  if (input.clientPayload && typeof input.clientPayload === "object") {
    const body = input.clientPayload as Record<string, unknown>;
    if (
      body["organizationId"] != null ||
      body["organization_id"] != null ||
      body["partnerId"] != null ||
      body["partner_id"] != null ||
      body["userId"] != null ||
      body["user_id"] != null
    ) {
      return { ok: false, error: "Client identifiers are not accepted.", code: "invalid" };
    }
  }
  if (!input.userId) {
    return { ok: false, error: "Sign in to accept this invitation.", code: "unauthenticated" };
  }

  const { invitation, partner } = await lookupInvitationByRawToken(input.token, deps.store);
  const view = inspectPartnerInvitationToken(input.token, invitation, partner);
  if (invitation && partner && invitation.status === "accepted") {
    if (!partnerInviteEmailsMatch(invitation.email, input.userEmail)) {
      return { ok: false, error: PARTNER_INVITATION_EMAIL_MISMATCH_MESSAGE, code: "email_mismatch" };
    }
    if (invitation.acceptedUserId === input.userId && partner.organizationId) {
      return { ok: true, partner, organizationId: partner.organizationId, alreadyAccepted: true };
    }
    return { ok: false, error: view.message, code: "unavailable" };
  }
  if (view.state === "expired") {
    return { ok: false, error: view.message, code: "expired" };
  }
  if (view.state !== "valid" || !invitation || !partner) {
    return { ok: false, error: view.message, code: "unavailable" };
  }
  if (!partnerInviteEmailsMatch(invitation.email, input.userEmail)) {
    return { ok: false, error: PARTNER_INVITATION_EMAIL_MISMATCH_MESSAGE, code: "email_mismatch" };
  }
  if (partner.status === "rejected" || partner.status === "suspended") {
    return { ok: false, error: view.message, code: "unavailable" };
  }

  let organizationId = partner.organizationId;
  if (!organizationId) {
    if (!deps.createPartnerOrganization) {
      return { ok: false, error: "Partner organization could not be created.", code: "unavailable" };
    }
    const created = await deps.createPartnerOrganization({
      name: partner.companyName,
      ownerUserId: input.userId
    });
    organizationId = created.organizationId;
  }
  if (deps.ensurePartnerMembership) {
    await deps.ensurePartnerMembership({ organizationId, userId: input.userId });
  }

  const timestamp = nowIso();
  const nextPartner: PlatformPartner = {
    ...partner,
    organizationId,
    status: partner.status === "approved" ? "active" : partner.status,
    activatedAt: partner.status === "approved" ? partner.activatedAt ?? timestamp : partner.activatedAt,
    updatedAt: timestamp,
    commissionBps: partner.commissionBps
  };
  await deps.store.updatePartner(nextPartner);
  await deps.store.updateInvitation({
    ...invitation,
    status: "accepted",
    acceptedAt: timestamp,
    acceptedUserId: input.userId,
    updatedAt: timestamp
  });
  await writeEvent(deps, {
    partnerId: nextPartner.id,
    action: PARTNER_ONBOARDING_EVENTS.invitation_accepted,
    actorUserId: input.userId,
    payload: { invitationId: invitation.id, organizationId }
  });
  await writeEvent(deps, {
    partnerId: nextPartner.id,
    action: PARTNER_ONBOARDING_EVENTS.onboarding_started,
    actorUserId: input.userId,
    payload: {}
  });
  if (nextPartner.organizationId && deps.notifyPartnerEvent) {
    try {
      await deps.notifyPartnerEvent({
        organizationId: nextPartner.organizationId,
        partnerName: nextPartner.companyName,
        kind: "invitation_accepted",
        title: "Partner invitation accepted",
        body: "Your M.P.A. Partner account is connected. Continue setup in Partner Command Center.",
        href: "/partner"
      });
    } catch {
      // Notifications must never fail invitation acceptance.
    }
  }
  return { ok: true, partner: nextPartner, organizationId, alreadyAccepted: false };
}

export async function sendPartnerSetupReminder(
  input: { partnerId: string; actorUserId: string },
  deps: PartnerInvitationServiceDeps = defaultPartnerDeps()
): Promise<{ ok: true } | { ok: false; error: string }> {
  const partner = await deps.store.getPartner(input.partnerId);
  if (!partner) return { ok: false, error: "Partner not found." };
  const invitation = await latestInvitationForPartner(deps.store, partner.id);
  if (invitation?.status !== "accepted") {
    return { ok: false, error: "Setup reminders are available after the invitation is accepted." };
  }
  const snapshot = await buildPartnerOnboardingSnapshot(partner, deps);
  if (snapshot.onboardingStatus === "complete") {
    return { ok: false, error: "Onboarding is already complete." };
  }
  if (deps.sendInvitationEmail) {
    await deps.sendInvitationEmail({
      to: partner.email,
      subject: "Continue your M.P.A. Partner setup",
      body: partnerSetupReminderEmailBody({
        companyName: partner.companyName,
        percent: snapshot.percent,
        nextLabel: snapshot.nextLabel
      }),
      ctaUrl: `${origin(deps).replace(/\/$/, "")}/partner`,
      ctaLabel: "Open Partner Command Center",
      idempotencyKey: `partner-setup-reminder:${partner.id}:${snapshot.percent}`
    });
  }
  await writeEvent(deps, {
    partnerId: partner.id,
    action: "setup_reminder_sent",
    actorUserId: input.actorUserId,
    payload: { percent: snapshot.percent, nextItem: snapshot.nextItem?.id ?? null }
  });
  return { ok: true };
}

export async function recordPartnerOnboardingAck(
  input: {
    partner: PlatformPartner;
    actorUserId: string;
    action:
      | typeof PARTNER_ONBOARDING_EVENTS.qr_completed
      | typeof PARTNER_ONBOARDING_EVENTS.earnings_acknowledged
      | typeof PARTNER_ONBOARDING_EVENTS.referral_shared;
  },
  deps: PartnerInvitationServiceDeps = defaultPartnerDeps()
): Promise<PartnerOnboardingSnapshot> {
  const existing = await deps.store.listEvents(input.partner.id);
  if (!existing.some((row) => row.action === input.action)) {
    await writeEvent(deps, {
      partnerId: input.partner.id,
      action: input.action,
      actorUserId: input.actorUserId,
      payload: {}
    });
  }
  const snapshot = await buildPartnerOnboardingSnapshot(input.partner, deps);
  if (
    snapshot.onboardingStatus === "complete" &&
    !existing.some((row) => row.action === PARTNER_ONBOARDING_EVENTS.onboarding_completed)
  ) {
    await writeEvent(deps, {
      partnerId: input.partner.id,
      action: PARTNER_ONBOARDING_EVENTS.onboarding_completed,
      actorUserId: input.actorUserId,
      payload: { percent: snapshot.percent }
    });
    if (input.partner.organizationId && deps.notifyPartnerEvent) {
      try {
        await deps.notifyPartnerEvent({
          organizationId: input.partner.organizationId,
          partnerName: input.partner.companyName,
          kind: "onboarding_completed",
          title: "Partner onboarding completed",
          body: "Partner setup is complete.",
          href: "/partner"
        });
      } catch {
        // ignore
      }
    }
  }
  if (
    snapshot.readiness === "ready" &&
    !existing.some((row) => row.action === PARTNER_ONBOARDING_EVENTS.ready)
  ) {
    await writeEvent(deps, {
      partnerId: input.partner.id,
      action: PARTNER_ONBOARDING_EVENTS.ready,
      actorUserId: input.actorUserId,
      payload: {}
    });
    if (input.partner.organizationId && deps.notifyPartnerEvent) {
      try {
        await deps.notifyPartnerEvent({
          organizationId: input.partner.organizationId,
          partnerName: input.partner.companyName,
          kind: "ready",
          title: "Ready to receive requests",
          body: "This partner now meets the minimum setup required to receive service requests.",
          href: "/partner"
        });
      } catch {
        // ignore
      }
    }
  }
  return snapshot;
}
