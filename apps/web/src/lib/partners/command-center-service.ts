import {
  FOUNDING_PARTNER_QUALIFYING_MONTHS,
  PARTNER_REQUEST_STATUS_LABELS,
  PARTNER_SERVICE_CATEGORY_LABELS,
  PARTNER_REQUEST_URGENCY_LABELS,
  partnerDisplayStatus,
  partnerPortalIsLive,
  partnerRateDisplay,
  partnerReferralAbsoluteUrl,
  partnerReferralDisplayHost,
  partnerServiceRequestAbsoluteUrl,
  partnerServiceRequestDisplayHost,
  partnerServiceRequestPath,
  requestOperationalMetrics,
  summarizeCommissionLedger,
  type PartnerCommissionStatus
} from "@mpa/shared";
import { clientEnv } from "../env/client-env";
import { createServiceRoleClient } from "../supabase/service-role";
import { loadPartnerRequestDeps } from "./request-deps";
import type { PartnerRequestStore } from "./request-types";
import { getMemoryPartnerRequestStore } from "./request-store";
import { getMemoryPartnerStore } from "./store";
import type { PartnerCommission, PartnerReferral, PartnerStore, PlatformPartner } from "./types";

export type CommandCenterDeps = {
  store: PartnerStore;
  requests: PartnerRequestStore;
  lookupOrganizationNames?: (ids: string[]) => Promise<Record<string, string>>;
};

export function defaultCommandCenterDeps(): CommandCenterDeps {
  return { store: getMemoryPartnerStore(), requests: getMemoryPartnerRequestStore() };
}

export async function lookupOrganizationNames(ids: string[]): Promise<Record<string, string>> {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  if (unique.length === 0) return {};
  try {
    const db = createServiceRoleClient();
    const { data } = await db.from("organizations").select("id, name").in("id", unique);
    return Object.fromEntries((data ?? []).map((row) => [String(row.id), String(row.name)]));
  } catch {
    return {};
  }
}

export async function loadCommandCenterDeps(): Promise<CommandCenterDeps> {
  const loaded = await loadPartnerRequestDeps();
  if (process.env["VITEST"]) {
    return { store: loaded.store, requests: loaded.requests };
  }
  return {
    store: loaded.store,
    requests: loaded.requests,
    lookupOrganizationNames
  };
}

export async function resolveBoundPartner(
  organizationId: string,
  store: PartnerStore
): Promise<PlatformPartner | null> {
  return store.getPartnerByOrganization(organizationId);
}

function origin(): string {
  return clientEnv.NEXT_PUBLIC_APP_URL || "https://www.my-property-assistant.com";
}

function sanitizeActivityAction(action: string): string {
  switch (action) {
    case "applied":
      return "Application submitted";
    case "approved":
      return "Application approved";
    case "activate":
    case "activated":
      return "Partner activated";
    case "suspend":
      return "Partner suspended";
    case "update":
      return "Partner record updated";
    case "referral_attributed":
      return "Referral attributed";
    case "commission_recorded":
      return "Commission recorded";
    case "commission_paid":
      return "Commission marked paid";
    case "commission_voided":
      return "Commission voided";
    case "profile_updated":
      return "Profile updated";
    case "logo_updated":
      return "Logo updated";
    default:
      return "Partner activity";
  }
}

export type PartnerCommandCenterSnapshot = {
  bound: boolean;
  partner: null | {
    id: string;
    companyName: string;
    partnerType: PlatformPartner["partnerType"];
    partnerTypeLabel: string;
    displayStatus: ReturnType<typeof partnerDisplayStatus>;
    rate: ReturnType<typeof partnerRateDisplay>;
    publicSlug: string | null;
    portalLive: boolean;
    serviceRequestPath: string | null;
    serviceRequestDisplayUrl: string | null;
    serviceRequestAbsoluteUrl: string | null;
    referralPath: string | null;
    referralDisplayUrl: string | null;
    referralAbsoluteUrl: string | null;
    website: string | null;
    phone: string;
    email: string;
    serviceArea: string;
    servicesOffered: string;
    portalDescription: string | null;
    logoMediaId: string | null;
  };
  requests: ReturnType<typeof requestOperationalMetrics> & {
    recent: Array<{
      id: string;
      publicRef: string;
      requesterName: string;
      propertyAddress: string;
      categoryLabel: string;
      urgencyLabel: string;
      statusLabel: string;
      createdAt: string;
    }>;
  };
  referrals: {
    totalAttributedOrganizations: number;
    activeQualifyingReferrals: number;
    qualifyingPaidMonths: number;
    totalTrackedCommissionsCents: number;
  };
  earnings: ReturnType<typeof summarizeCommissionLedger>;
  activity: Array<{ id: string; label: string; createdAt: string }>;
};

export async function loadPartnerCommandCenter(
  organizationId: string,
  deps: CommandCenterDeps = defaultCommandCenterDeps()
): Promise<PartnerCommandCenterSnapshot> {
  const partner = await resolveBoundPartner(organizationId, deps.store);
  if (!partner) {
    return {
      bound: false,
      partner: null,
      requests: { ...requestOperationalMetrics([]), recent: [] },
      referrals: {
        totalAttributedOrganizations: 0,
        activeQualifyingReferrals: 0,
        qualifyingPaidMonths: 0,
        totalTrackedCommissionsCents: 0
      },
      earnings: summarizeCommissionLedger([]),
      activity: []
    };
  }

  const [requests, referrals, commissions, events] = await Promise.all([
    deps.requests.listRequests(partner.id),
    deps.store.listReferrals(partner.id),
    deps.store.listCommissions(partner.id),
    deps.store.listEvents(partner.id)
  ]);

  const requestMetrics = requestOperationalMetrics(requests);
  const earnings = summarizeCommissionLedger(commissions);
  const monthsByOrg = new Map<string, number>();
  for (const row of commissions) {
    if (row.status === "void") continue;
    monthsByOrg.set(row.organizationId, (monthsByOrg.get(row.organizationId) ?? 0) + 1);
  }
  const activeQualifyingReferrals = referrals.filter((row) => {
    const months = monthsByOrg.get(row.organizationId) ?? 0;
    return months < FOUNDING_PARTNER_QUALIFYING_MONTHS;
  }).length;

  const slug = partner.publicSlug;
  return {
    bound: true,
    partner: {
      id: partner.id,
      companyName: partner.companyName,
      partnerType: partner.partnerType,
      partnerTypeLabel:
        partner.partnerType === "certified_service"
          ? "Certified Service Partner"
          : partner.partnerType === "strategic"
            ? "Strategic Partner"
            : "Referral Partner",
      displayStatus: partnerDisplayStatus(partner),
      rate: partnerRateDisplay(partner.commissionBps),
      publicSlug: slug,
      portalLive: partnerPortalIsLive(partner),
      serviceRequestPath: slug ? partnerServiceRequestPath(slug) : null,
      serviceRequestDisplayUrl: slug ? partnerServiceRequestDisplayHost(slug) : null,
      serviceRequestAbsoluteUrl: slug ? partnerServiceRequestAbsoluteUrl(origin(), slug) : null,
      referralPath: slug ? `/get-started?ref=${encodeURIComponent(slug)}` : null,
      referralDisplayUrl: slug ? partnerReferralDisplayHost(slug) : null,
      referralAbsoluteUrl: slug ? partnerReferralAbsoluteUrl(origin(), slug) : null,
      website: partner.website,
      phone: partner.phone,
      email: partner.email,
      serviceArea: partner.serviceArea,
      servicesOffered: partner.servicesOffered,
      portalDescription: partner.portalDescription,
      logoMediaId: partner.logoMediaId
    },
    requests: {
      ...requestMetrics,
      recent: requests.slice(0, 8).map((row) => ({
        id: row.id,
        publicRef: row.publicRef,
        requesterName: row.requesterName,
        propertyAddress: row.propertyAddress,
        categoryLabel: PARTNER_SERVICE_CATEGORY_LABELS[row.category],
        urgencyLabel: PARTNER_REQUEST_URGENCY_LABELS[row.urgency],
        statusLabel: PARTNER_REQUEST_STATUS_LABELS[row.status],
        createdAt: row.createdAt
      }))
    },
    referrals: {
      totalAttributedOrganizations: referrals.length,
      activeQualifyingReferrals,
      qualifyingPaidMonths: [...monthsByOrg.values()].reduce((sum, value) => sum + value, 0),
      totalTrackedCommissionsCents: earnings.trackedCents
    },
    earnings,
    activity: events.slice(0, 12).map((event) => ({
      id: event.id,
      label: sanitizeActivityAction(event.action),
      createdAt: event.createdAt
    }))
  };
}

export type PartnerReferralRow = {
  id: string;
  organizationId: string;
  organizationName: string;
  referralDate: string;
  status: string;
  qualifyingPaidMonths: number;
  commissionStatus: string;
};

export async function listPartnerReferralCustomers(
  organizationId: string,
  deps: CommandCenterDeps = defaultCommandCenterDeps()
): Promise<{ ok: true; rows: PartnerReferralRow[] } | { ok: false; error: string }> {
  const partner = await resolveBoundPartner(organizationId, deps.store);
  if (!partner) {
    return { ok: false, error: "No Partner Program account is bound to this workspace." };
  }
  const [referrals, commissions] = await Promise.all([
    deps.store.listReferrals(partner.id),
    deps.store.listCommissions(partner.id)
  ]);
  const names = deps.lookupOrganizationNames
    ? await deps.lookupOrganizationNames(referrals.map((row) => row.organizationId))
    : {};
  const rows = referrals.map((referral) => toReferralRow(referral, commissions, names));
  return { ok: true, rows };
}

function toReferralRow(
  referral: PartnerReferral,
  commissions: PartnerCommission[],
  names: Record<string, string>
): PartnerReferralRow {
  const related = commissions.filter((row) => row.organizationId === referral.organizationId);
  const qualifying = related.filter((row) => row.status !== "void");
  const statuses = new Set(qualifying.map((row) => row.status));
  let commissionStatus = "None yet";
  if (statuses.has("paid") && statuses.size === 1) commissionStatus = "Paid";
  else if (statuses.has("earned")) commissionStatus = "Earned";
  else if (statuses.has("pending")) commissionStatus = "Pending review";
  else if (related.some((row) => row.status === "void") && qualifying.length === 0) {
    commissionStatus = "Voided";
  }
  return {
    id: referral.id,
    organizationId: referral.organizationId,
    organizationName: names[referral.organizationId] ?? "Referred organization",
    referralDate: referral.createdAt,
    status: referral.flaggedReason ? "Needs review" : "Attributed",
    qualifyingPaidMonths: qualifying.length,
    commissionStatus
  };
}

export type PartnerCommissionRow = {
  id: string;
  organizationId: string;
  organizationName: string;
  qualifyingMonth: number;
  eligibleRevenueCents: number;
  commissionBps: number;
  commissionPercent: number;
  commissionCents: number;
  status: PartnerCommissionStatus;
  earnedDate: string;
  paidDate: string | null;
};

export async function listPartnerEarningsLedger(
  organizationId: string,
  deps: CommandCenterDeps = defaultCommandCenterDeps()
): Promise<
  | { ok: true; summary: ReturnType<typeof summarizeCommissionLedger>; rows: PartnerCommissionRow[] }
  | { ok: false; error: string }
> {
  const partner = await resolveBoundPartner(organizationId, deps.store);
  if (!partner) {
    return { ok: false, error: "No Partner Program account is bound to this workspace." };
  }
  const commissions = await deps.store.listCommissions(partner.id);
  const names = deps.lookupOrganizationNames
    ? await deps.lookupOrganizationNames(commissions.map((row) => row.organizationId))
    : {};
  return {
    ok: true,
    summary: summarizeCommissionLedger(commissions),
    rows: commissions.map((row) => ({
      id: row.id,
      organizationId: row.organizationId,
      organizationName: names[row.organizationId] ?? "Referred organization",
      qualifyingMonth: row.qualifyingMonthIndex,
      eligibleRevenueCents: row.eligibleRevenueCents,
      commissionBps: row.commissionBps,
      commissionPercent: row.commissionBps / 100,
      commissionCents: row.commissionCents,
      status: row.status,
      earnedDate: row.createdAt,
      paidDate: row.paidAt
    }))
  };
}

export function assertPartnerScoped(
  organizationId: string,
  partner: PlatformPartner | null
): partner is PlatformPartner {
  return Boolean(partner && partner.organizationId === organizationId);
}
