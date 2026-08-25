import {
  FOUNDING_PARTNER_COMMISSION_BPS,
  FOUNDING_PARTNER_QUALIFYING_MONTHS,
  type PartnerCommissionStatus,
  type PartnerStatus,
  type PartnerType
} from "./config";
import { bpsToPercent } from "./commission";
import { partnerPortalIsLive } from "./portal";
import { partnerReferralPath, partnerRequestPreviewPath } from "./slug";

export const PARTNER_COMMAND_CENTER_PATH = "/partner";

export const PARTNER_COMMAND_CENTER_NAV = [
  { href: "/partner", label: "Overview" },
  { href: "/partner/services", label: "Service Requests" },
  { href: "/partner/opportunities", label: "Opportunities" },
  { href: "/partner/properties", label: "Properties" },
  { href: "/partner/referrals", label: "Referrals" },
  { href: "/partner/earnings", label: "Earnings" },
  { href: "/partner/portal", label: "Service Portal" },
  { href: "/partner/profile", label: "Profile" }
] as const;

export const PARTNER_COMMAND_CENTER_TITLE = "Partner Command Center";
export const PARTNER_COMMAND_CENTER_SUBTITLE =
  "Manage your service portal, customer requests, referrals and M.P.A. partnership.";

export const PARTNER_SERVICE_REQUEST_LINK_PURPOSE =
  "Their customers request physical property service.";
export const PARTNER_REFERRAL_LINK_PURPOSE =
  "Property managers/facility operators sign up for M.P.A.";

export const PARTNER_REFERRAL_EARNINGS_EXPLAINER =
  "When an eligible new M.P.A. customer subscribes through your referral, qualifying subscription revenue can earn Partner Program commission according to your agreement.";

export const PARTNER_EARNINGS_TRACKING_EXPLAINER =
  "M.P.A. tracks qualifying commissions here. Payout processing is currently handled separately.";

export const PARTNER_QR_PLACEMENT_GUIDANCE =
  "Place this QR code on invoices, business cards, service vehicles, property notices or other customer-facing materials so customers can quickly submit a service request.";

export const PARTNER_PUBLIC_PROFILE_EDITABLE_FIELDS = [
  "portalDescription",
  "phone",
  "email",
  "website",
  "serviceArea",
  "servicesOffered"
] as const;

export type PartnerPublicProfileEditableField = (typeof PARTNER_PUBLIC_PROFILE_EDITABLE_FIELDS)[number];

export const PARTNER_PROTECTED_PROFILE_FIELDS = [
  "commissionBps",
  "commissionPercentage",
  "status",
  "partnerType",
  "interestedPartnerType",
  "organizationId",
  "publicSlug",
  "publicPortalEnabled",
  "approvedAt",
  "activatedAt",
  "rejectedAt",
  "suspendedAt",
  "payoutStatus",
  "paidAt",
  "paidBy"
] as const;

export type PartnerDisplayStatusKey = "active" | "pending_approval" | "suspended" | "portal_disabled";

export type PartnerDisplayStatus = {
  key: PartnerDisplayStatusKey;
  label: string;
  portalLive: boolean;
  partnerStatus: PartnerStatus;
};

export type PartnerPublicProfilePatch = {
  portalDescription?: string | null;
  phone?: string;
  email?: string;
  website?: string | null;
  serviceArea?: string;
  servicesOffered?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function partnerDisplayStatus(input: {
  status: PartnerStatus;
  partnerType: PartnerType;
  publicPortalEnabled: boolean;
  organizationId: string | null | undefined;
  publicSlug: string | null | undefined;
}): PartnerDisplayStatus {
  const portalLive = partnerPortalIsLive(input);
  if (input.status === "suspended") {
    return { key: "suspended", label: "Suspended", portalLive: false, partnerStatus: input.status };
  }
  if (input.status === "applied" || input.status === "approved" || input.status === "rejected") {
    return {
      key: "pending_approval",
      label: "Pending Approval",
      portalLive: false,
      partnerStatus: input.status
    };
  }
  if (input.status === "active" && !portalLive) {
    return {
      key: "portal_disabled",
      label: "Portal Disabled",
      portalLive: false,
      partnerStatus: input.status
    };
  }
  return { key: "active", label: "Active", portalLive, partnerStatus: input.status };
}

export function partnerRateDisplay(commissionBps: number): {
  percent: number;
  commissionBps: number;
  label: string;
  founding: boolean;
  qualifyingMonths: number;
  qualifyingCopy: string;
} {
  const percent = bpsToPercent(commissionBps);
  const founding = commissionBps === FOUNDING_PARTNER_COMMISSION_BPS;
  return {
    percent,
    commissionBps,
    label: founding ? `Founding Partner Rate: ${percent}%` : `Partner Rate: ${percent}%`,
    founding,
    qualifyingMonths: FOUNDING_PARTNER_QUALIFYING_MONTHS,
    qualifyingCopy: `Up to the first ${FOUNDING_PARTNER_QUALIFYING_MONTHS} qualifying paid subscription months per referred organization.`
  };
}

export function partnerServiceRequestDisplayHost(slug: string): string {
  return `my-property-assistant.com${partnerRequestPreviewPath(slug)}`;
}

export function partnerReferralDisplayHost(slug: string): string {
  return `www.my-property-assistant.com${partnerReferralPath(slug)}`;
}

export function partnerReferralAbsoluteUrl(origin: string, slug: string): string {
  return `${origin.replace(/\/$/, "")}${partnerReferralPath(slug)}`;
}

export function centsToUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function summarizeCommissionLedger(
  rows: ReadonlyArray<{ status: PartnerCommissionStatus; commissionCents: number }>
): {
  pendingCents: number;
  earnedCents: number;
  paidCents: number;
  voidCents: number;
  trackedCents: number;
  pendingCount: number;
  earnedCount: number;
  paidCount: number;
  voidCount: number;
} {
  const summary = {
    pendingCents: 0,
    earnedCents: 0,
    paidCents: 0,
    voidCents: 0,
    trackedCents: 0,
    pendingCount: 0,
    earnedCount: 0,
    paidCount: 0,
    voidCount: 0
  };
  for (const row of rows) {
    if (row.status === "pending") {
      summary.pendingCents += row.commissionCents;
      summary.pendingCount += 1;
    } else if (row.status === "earned") {
      summary.earnedCents += row.commissionCents;
      summary.earnedCount += 1;
    } else if (row.status === "paid") {
      summary.paidCents += row.commissionCents;
      summary.paidCount += 1;
    } else if (row.status === "void") {
      summary.voidCents += row.commissionCents;
      summary.voidCount += 1;
    }
  }
  summary.trackedCents = summary.pendingCents + summary.earnedCents + summary.paidCents;
  return summary;
}

export function requestOperationalMetrics(
  rows: ReadonlyArray<{ status: string; createdAt: string }>,
  now = new Date()
): {
  newCount: number;
  acceptedCount: number;
  convertedCount: number;
  declinedCount: number;
  thisMonthCount: number;
  conversionRate: number | null;
} {
  const month = now.getUTCMonth();
  const year = now.getUTCFullYear();
  let newCount = 0;
  let acceptedCount = 0;
  let convertedCount = 0;
  let declinedCount = 0;
  let thisMonthCount = 0;
  for (const row of rows) {
    const created = new Date(row.createdAt);
    if (created.getUTCFullYear() === year && created.getUTCMonth() === month) {
      thisMonthCount += 1;
    }
    if (row.status === "submitted" || row.status === "under_review") newCount += 1;
    if (row.status === "accepted") acceptedCount += 1;
    if (row.status === "converted") convertedCount += 1;
    if (row.status === "declined") declinedCount += 1;
  }
  const decided = convertedCount + declinedCount;
  return {
    newCount,
    acceptedCount,
    convertedCount,
    declinedCount,
    thisMonthCount,
    conversionRate: decided > 0 ? Math.round((convertedCount / decided) * 1000) / 10 : null
  };
}

export function parsePartnerPublicProfileInput(
  payload: unknown
): { ok: true; data: PartnerPublicProfilePatch } | { ok: false; error: string } {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { ok: false, error: "Invalid profile update." };
  }
  const record = payload as Record<string, unknown>;
  for (const field of PARTNER_PROTECTED_PROFILE_FIELDS) {
    if (field in record) {
      return { ok: false, error: "Those fields are managed by M.P.A. Master Admin." };
    }
  }
  if ("logoMediaId" in record || "logo_media_id" in record) {
    return { ok: false, error: "Use the logo upload control to change branding." };
  }
  const data: PartnerPublicProfilePatch = {};
  if ("portalDescription" in record) {
    if (record["portalDescription"] !== null && typeof record["portalDescription"] !== "string") {
      return { ok: false, error: "Description must be text." };
    }
    const value = typeof record["portalDescription"] === "string" ? record["portalDescription"].trim() : "";
    data.portalDescription = value ? value.slice(0, 500) : null;
  }
  if ("phone" in record) {
    if (typeof record["phone"] !== "string" || !record["phone"].trim()) {
      return { ok: false, error: "Public phone is required." };
    }
    data.phone = record["phone"].trim().slice(0, 40);
  }
  if ("email" in record) {
    if (typeof record["email"] !== "string" || !EMAIL_RE.test(record["email"].trim())) {
      return { ok: false, error: "Public email is invalid." };
    }
    data.email = record["email"].trim().toLowerCase().slice(0, 160);
  }
  if ("website" in record) {
    if (record["website"] !== null && typeof record["website"] !== "string") {
      return { ok: false, error: "Website must be text." };
    }
    const value = typeof record["website"] === "string" ? record["website"].trim() : "";
    data.website = value ? value.slice(0, 200) : null;
  }
  if ("serviceArea" in record) {
    if (typeof record["serviceArea"] !== "string" || !record["serviceArea"].trim()) {
      return { ok: false, error: "Service area is required." };
    }
    data.serviceArea = record["serviceArea"].trim().slice(0, 200);
  }
  if ("servicesOffered" in record) {
    if (typeof record["servicesOffered"] !== "string" || !record["servicesOffered"].trim()) {
      return { ok: false, error: "Services offered is required." };
    }
    data.servicesOffered = record["servicesOffered"].trim().slice(0, 500);
  }
  if (Object.keys(data).length === 0) {
    return { ok: false, error: "No allowed profile fields were provided." };
  }
  return { ok: true, data };
}
