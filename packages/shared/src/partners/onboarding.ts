import { PARTNER_TYPE_LABELS, isPartnerType, type PartnerStatus, type PartnerType } from "./config";
import { partnerPortalIsLive, partnerTypeAllowsPortal } from "./portal";

/** Single source for invitation lifetime. Do not scatter this value. */
export const PARTNER_INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const PARTNER_INVITATION_STATUSES = ["pending", "accepted", "expired", "revoked"] as const;
export type PartnerInvitationStatus = (typeof PARTNER_INVITATION_STATUSES)[number];

export const PARTNER_INVITATION_SOURCES = ["application_approval", "direct_invite", "resend"] as const;
export type PartnerInvitationSource = (typeof PARTNER_INVITATION_SOURCES)[number];

export const PARTNER_ONBOARDING_STATUSES = ["not_started", "in_progress", "complete"] as const;
export type PartnerOnboardingStatus = (typeof PARTNER_ONBOARDING_STATUSES)[number];

export const PARTNER_READINESS = ["ready", "not_ready"] as const;
export type PartnerReadiness = (typeof PARTNER_READINESS)[number];

export const PARTNER_DIRECTORY_FILTERS = [
  "applications",
  "invited",
  "onboarding",
  "ready",
  "active",
  "suspended"
] as const;
export type PartnerDirectoryFilter = (typeof PARTNER_DIRECTORY_FILTERS)[number];

export const PARTNER_INVITE_PATH_PREFIX = "/partner/invite";

export const PARTNER_INVITATION_EMAIL_SUBJECT = "You're invited to join M.P.A. Partners";
export const PARTNER_INVITATION_CTA_LABEL = "Accept Partner Invitation";
export const PARTNER_INVITATION_EXPIRED_MESSAGE = "This partner invitation has expired.";
export const PARTNER_INVITATION_UNAVAILABLE_MESSAGE = "This partner invitation is not available.";
export const PARTNER_INVITATION_EMAIL_MISMATCH_MESSAGE =
  "This invitation is for a different account. Sign in with the invited email to continue.";

export const PARTNER_ONBOARDING_EVENTS = {
  invited: "partner.invited",
  invitation_resent: "partner.invitation_resent",
  invitation_accepted: "partner.invitation_accepted",
  onboarding_started: "partner.onboarding_started",
  profile_completed: "partner.profile_completed",
  portal_configured: "partner.portal_configured",
  property_added: "partner.property_added",
  qr_completed: "partner.qr_completed",
  onboarding_completed: "partner.onboarding_completed",
  ready: "partner.ready",
  earnings_acknowledged: "partner.earnings_acknowledged",
  referral_shared: "partner.referral_shared"
} as const;

export type PartnerChecklistItemId =
  | "company_profile"
  | "company_logo"
  | "services_service_area"
  | "service_portal"
  | "first_property"
  | "first_qr"
  | "referral_link"
  | "understand_earnings"
  | "share_referral_link";

export type PartnerChecklistItem = {
  id: PartnerChecklistItemId;
  label: string;
  href: string;
  complete: boolean;
  required: boolean;
};

const CHECKLIST_LABELS: Record<PartnerChecklistItemId, string> = {
  company_profile: "Complete company profile",
  company_logo: "Upload company logo",
  services_service_area: "Confirm services & service area",
  service_portal: "Configure service portal",
  first_property: "Add first property portal",
  first_qr: "Download or print first QR code",
  referral_link: "Get your M.P.A. referral link",
  understand_earnings: "Understand tracked earnings",
  share_referral_link: "Share your referral link"
};

const CHECKLIST_HREFS: Record<PartnerChecklistItemId, string> = {
  company_profile: "/partner/profile",
  company_logo: "/partner/profile",
  services_service_area: "/partner/profile",
  service_portal: "/partner/portal",
  first_property: "/partner/properties",
  first_qr: "/partner/properties",
  referral_link: "/partner/referrals",
  understand_earnings: "/partner/earnings",
  share_referral_link: "/partner/referrals"
};

export type PartnerOnboardingInput = {
  status: PartnerStatus;
  partnerType: PartnerType;
  organizationId: string | null | undefined;
  publicSlug: string | null | undefined;
  publicPortalEnabled: boolean;
  portalDescription: string | null | undefined;
  phone: string | null | undefined;
  email: string | null | undefined;
  website?: string | null | undefined;
  serviceArea: string | null | undefined;
  servicesOffered: string | null | undefined;
  logoMediaId: string | null | undefined;
  invitationStatus: PartnerInvitationStatus | null;
  invitationAcceptedAt: string | null;
  propertyPortalCount: number;
  eventActions: readonly string[];
};

export type PartnerOnboardingSnapshot = {
  onboardingStatus: PartnerOnboardingStatus;
  readiness: PartnerReadiness;
  items: PartnerChecklistItem[];
  completedCount: number;
  totalCount: number;
  percent: number;
  nextItem: PartnerChecklistItem | null;
  nextLabel: string | null;
  progressLabel: string;
  accountConnected: boolean;
  profileComplete: boolean;
  logoComplete: boolean;
  servicesComplete: boolean;
  portalConfigured: boolean;
  propertyConfigured: boolean;
  qrComplete: boolean;
  invitationStatus: PartnerInvitationStatus | null;
};

export function isPartnerInvitationStatus(value: unknown): value is PartnerInvitationStatus {
  return typeof value === "string" && (PARTNER_INVITATION_STATUSES as readonly string[]).includes(value);
}

export function isPartnerDirectoryFilter(value: unknown): value is PartnerDirectoryFilter {
  return typeof value === "string" && (PARTNER_DIRECTORY_FILTERS as readonly string[]).includes(value);
}

export function partnerInvitationPath(token: string): string {
  return `${PARTNER_INVITE_PATH_PREFIX}/${encodeURIComponent(token)}`;
}

export function partnerInvitationAbsoluteUrl(origin: string, token: string): string {
  return `${origin.replace(/\/$/, "")}${partnerInvitationPath(token)}`;
}

export function normalizePartnerInviteEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function partnerInviteEmailsMatch(expected: string, actual: string | null | undefined): boolean {
  const left = normalizePartnerInviteEmail(expected);
  const right = normalizePartnerInviteEmail(actual);
  return Boolean(left && right && left === right);
}

export function invitationPublicState(status: PartnerInvitationStatus | null, expiresAt: string | null): "valid" | "expired" | "unavailable" {
  if (!status) return "unavailable";
  if (status === "revoked" || status === "accepted") return "unavailable";
  if (status === "expired") return "expired";
  if (status === "pending") {
    if (expiresAt && Date.parse(expiresAt) <= Date.now()) return "expired";
    return "valid";
  }
  return "unavailable";
}

export function checklistItemIdsForPartnerType(type: PartnerType): PartnerChecklistItemId[] {
  if (type === "referral") {
    return ["company_profile", "referral_link", "understand_earnings", "share_referral_link"];
  }
  return [
    "company_profile",
    "company_logo",
    "services_service_area",
    "service_portal",
    "first_property",
    "first_qr"
  ];
}

export function isPartnerProfileSufficient(input: {
  portalDescription: string | null | undefined;
  phone: string | null | undefined;
  email: string | null | undefined;
  serviceArea: string | null | undefined;
  servicesOffered: string | null | undefined;
}): boolean {
  return Boolean(
    input.portalDescription?.trim() &&
      input.phone?.trim() &&
      input.email?.trim() &&
      input.serviceArea?.trim() &&
      input.servicesOffered?.trim()
  );
}

export function isPartnerServicesConfigured(input: {
  serviceArea: string | null | undefined;
  servicesOffered: string | null | undefined;
}): boolean {
  return Boolean(input.serviceArea?.trim() && input.servicesOffered?.trim());
}

function hasEvent(actions: readonly string[], action: string): boolean {
  return actions.includes(action);
}

export function derivePartnerOnboarding(input: PartnerOnboardingInput): PartnerOnboardingSnapshot {
  const profileComplete = isPartnerProfileSufficient(input);
  const servicesComplete = isPartnerServicesConfigured(input);
  const logoComplete = Boolean(input.logoMediaId);
  const accountConnected = Boolean(input.organizationId);
  const portalConfigured =
    partnerTypeAllowsPortal(input.partnerType) &&
    Boolean(input.publicSlug) &&
    input.publicPortalEnabled;
  const propertyConfigured = input.propertyPortalCount > 0;
  const qrComplete = hasEvent(input.eventActions, PARTNER_ONBOARDING_EVENTS.qr_completed);
  const referralLinkComplete = Boolean(input.publicSlug);
  const earningsAcknowledged = hasEvent(input.eventActions, PARTNER_ONBOARDING_EVENTS.earnings_acknowledged);
  const referralShared = hasEvent(input.eventActions, PARTNER_ONBOARDING_EVENTS.referral_shared);

  const completion: Record<PartnerChecklistItemId, boolean> = {
    company_profile: profileComplete,
    company_logo: logoComplete,
    services_service_area: servicesComplete,
    service_portal: portalConfigured,
    first_property: propertyConfigured,
    first_qr: qrComplete,
    referral_link: referralLinkComplete,
    understand_earnings: earningsAcknowledged,
    share_referral_link: referralShared
  };

  const items: PartnerChecklistItem[] = checklistItemIdsForPartnerType(input.partnerType).map((id) => ({
    id,
    label: CHECKLIST_LABELS[id],
    href: CHECKLIST_HREFS[id],
    complete: completion[id],
    required: true
  }));

  const completedCount = items.filter((item) => item.complete).length;
  const totalCount = items.length;
  const percent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
  const nextItem = items.find((item) => !item.complete) ?? null;

  let onboardingStatus: PartnerOnboardingStatus = "not_started";
  if (completedCount > 0 && completedCount < totalCount) onboardingStatus = "in_progress";
  if (totalCount > 0 && completedCount === totalCount) onboardingStatus = "complete";
  if (
    onboardingStatus === "not_started" &&
    (input.invitationAcceptedAt || hasEvent(input.eventActions, PARTNER_ONBOARDING_EVENTS.onboarding_started))
  ) {
    onboardingStatus = "in_progress";
  }

  const readiness = derivePartnerReadiness({
    ...input,
    profileComplete,
    servicesComplete,
    accountConnected,
    onboardingComplete: onboardingStatus === "complete"
  });

  const progressLabel =
    onboardingStatus === "complete"
      ? "Partner Setup — Complete"
      : `Partner Setup — ${percent}% Complete`;

  return {
    onboardingStatus,
    readiness,
    items,
    completedCount,
    totalCount,
    percent,
    nextItem,
    nextLabel: nextItem ? `Next: ${nextItem.label}` : null,
    progressLabel,
    accountConnected,
    profileComplete,
    logoComplete,
    servicesComplete,
    portalConfigured,
    propertyConfigured,
    qrComplete,
    invitationStatus: input.invitationStatus
  };
}

export function derivePartnerReadiness(input: {
  status: PartnerStatus;
  partnerType: PartnerType;
  organizationId: string | null | undefined;
  publicSlug: string | null | undefined;
  publicPortalEnabled: boolean;
  propertyPortalCount: number;
  profileComplete: boolean;
  servicesComplete: boolean;
  accountConnected: boolean;
  onboardingComplete: boolean;
}): PartnerReadiness {
  if (input.status !== "active" || !input.accountConnected) {
    return "not_ready";
  }
  if (input.partnerType === "referral") {
    return input.onboardingComplete && Boolean(input.publicSlug) ? "ready" : "not_ready";
  }
  const portalLive = partnerPortalIsLive({
    status: input.status,
    partnerType: input.partnerType,
    publicPortalEnabled: input.publicPortalEnabled,
    organizationId: input.organizationId,
    publicSlug: input.publicSlug
  });
  if (!input.profileComplete || !input.servicesComplete || !portalLive || input.propertyPortalCount < 1) {
    return "not_ready";
  }
  return "ready";
}

export function partnerMatchesDirectoryFilter(
  filter: PartnerDirectoryFilter,
  input: {
    status: PartnerStatus;
    invitationStatus: PartnerInvitationStatus | null;
    onboardingStatus: PartnerOnboardingStatus;
    readiness: PartnerReadiness;
  }
): boolean {
  switch (filter) {
    case "applications":
      return input.status === "applied";
    case "invited":
      return input.invitationStatus === "pending" && input.status !== "applied";
    case "onboarding":
      return input.invitationStatus === "accepted" && input.onboardingStatus !== "complete";
    case "ready":
      return input.readiness === "ready";
    case "active":
      return input.status === "active";
    case "suspended":
      return input.status === "suspended";
    default:
      return true;
  }
}

const MAX_INVITE_TEXT = {
  companyName: 160,
  contactName: 120,
  email: 254,
  phone: 40,
  website: 200,
  serviceArea: 240,
  servicesOffered: 800,
  notes: 2000
} as const;

function trim(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function optionalTrim(value: unknown, max: number): string | null {
  const next = trim(value, max);
  return next ? next : null;
}

export type PartnerDirectInviteInput = {
  companyName: string;
  contactName: string;
  email: string;
  partnerType: PartnerType;
  phone: string | null;
  website: string | null;
  serviceArea: string | null;
  servicesOffered: string | null;
  notes: string | null;
};

export function parsePartnerDirectInviteInput(
  payload: unknown
): { ok: true; data: PartnerDirectInviteInput } | { ok: false; error: string } {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { ok: false, error: "Invalid invitation." };
  }
  const body = payload as Record<string, unknown>;
  if (body["organizationId"] != null || body["organization_id"] != null || body["userId"] != null || body["user_id"] != null) {
    return { ok: false, error: "Client organization or user identifiers are not accepted." };
  }
  const companyName = trim(body["companyName"], MAX_INVITE_TEXT.companyName);
  const contactName = trim(body["contactName"], MAX_INVITE_TEXT.contactName);
  const email = normalizePartnerInviteEmail(trim(body["email"], MAX_INVITE_TEXT.email));
  if (!companyName || !contactName || !email) {
    return { ok: false, error: "Company name, contact name, and email are required." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Enter a valid email address." };
  }
  if (!isPartnerType(body["partnerType"])) {
    return { ok: false, error: "Select a partner type." };
  }
  return {
    ok: true,
    data: {
      companyName,
      contactName,
      email,
      partnerType: body["partnerType"],
      phone: optionalTrim(body["phone"], MAX_INVITE_TEXT.phone),
      website: optionalTrim(body["website"], MAX_INVITE_TEXT.website),
      serviceArea: optionalTrim(body["serviceArea"], MAX_INVITE_TEXT.serviceArea),
      servicesOffered: optionalTrim(body["servicesOffered"], MAX_INVITE_TEXT.servicesOffered),
      notes: optionalTrim(body["notes"], MAX_INVITE_TEXT.notes)
    }
  };
}

export function partnerInvitationEmailBody(input: {
  invitedByLabel: string;
  companyName: string;
  partnerType: PartnerType;
  expiresAt: string;
}): string {
  const expires = new Date(input.expiresAt);
  const expiresLabel = Number.isNaN(expires.getTime())
    ? "7 days"
    : expires.toUTCString();
  return [
    `${input.invitedByLabel} invited ${input.companyName} to join M.P.A. Partners as a ${PARTNER_TYPE_LABELS[input.partnerType]}.`,
    "",
    "M.P.A. Partners gives service and referral companies a branded way to work with property and facility teams — a Partner Command Center, optional service-request links, and tracked referral earnings when an eligible customer subscribes.",
    "",
    "Create or sign in to your M.P.A. account to accept this invitation and finish setup. This invitation expires on " +
      expiresLabel +
      ".",
    "",
    "This invitation does not promise leads or guaranteed income."
  ].join("\n");
}

export function partnerSetupReminderEmailBody(input: {
  companyName: string;
  percent: number;
  nextLabel: string | null;
}): string {
  const next = input.nextLabel ? ` Next: ${input.nextLabel.replace(/^Next:\s*/, "")}.` : "";
  return [
    `Hi ${input.companyName},`,
    "",
    `Your M.P.A. Partner setup is ${input.percent}% complete.${next}`,
    "",
    "Open Partner Command Center to continue. This reminder does not include commission or payment details."
  ].join("\n");
}

export type PartnerInvitationPublicView = {
  state: "valid" | "expired" | "unavailable";
  message: string;
  companyName: string | null;
  partnerTypeLabel: string | null;
  expiresAt: string | null;
  benefits: string[];
};

export function partnerInvitationPublicView(input: {
  status: PartnerInvitationStatus | null;
  expiresAt: string | null;
  companyName?: string | null;
  partnerType?: PartnerType | null;
}): PartnerInvitationPublicView {
  const state = invitationPublicState(input.status, input.expiresAt);
  if (state === "expired") {
    return {
      state,
      message: PARTNER_INVITATION_EXPIRED_MESSAGE,
      companyName: null,
      partnerTypeLabel: null,
      expiresAt: null,
      benefits: []
    };
  }
  if (state !== "valid" || !input.companyName || !input.partnerType) {
    return {
      state: "unavailable",
      message: PARTNER_INVITATION_UNAVAILABLE_MESSAGE,
      companyName: null,
      partnerTypeLabel: null,
      expiresAt: null,
      benefits: []
    };
  }
  const serviceBenefits = [
    "A Partner Command Center for requests, referrals, and your public profile",
    "Branded service-request links and QR codes for properties you already service",
    "Tracked referral earnings when an eligible customer subscribes — not a promise of leads or income"
  ];
  const referralBenefits = [
    "A unique M.P.A. referral link you can share with property and facility teams",
    "Tracked referral earnings when an eligible customer subscribes — not a promise of leads or income",
    "A Partner Command Center to watch referrals and setup progress"
  ];
  return {
    state: "valid",
    message: "You're invited to M.P.A. Partners",
    companyName: input.companyName,
    partnerTypeLabel: PARTNER_TYPE_LABELS[input.partnerType],
    expiresAt: input.expiresAt,
    benefits: input.partnerType === "referral" ? referralBenefits : serviceBenefits
  };
}
