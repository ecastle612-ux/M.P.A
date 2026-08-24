import {
  DEFAULT_COMMISSION_BPS,
  FOUNDING_PARTNER_QUALIFYING_MONTHS,
  calculateCommissionCents,
  commissionStatusForNewEntry,
  eligibleRevenueCentsFromInvoice,
  isPartnerType,
  parsePartnerApplicationInput,
  parsePartnerRefParam,
  partnerAcceptsReferrals,
  proposePartnerSlug,
  shouldCreateCommission,
  validatePartnerSlug,
  voidOrOffsetStatus,
  type PartnerApplicationInput,
  type PartnerType
} from "@mpa/shared";
import { getMemoryPartnerStore } from "./store";
import type {
  PartnerCommission,
  PartnerEvent,
  PartnerReferral,
  PartnerStore,
  PlatformPartner
} from "./types";

export type PartnerServiceDeps = {
  store: PartnerStore;
};

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  return crypto.randomUUID();
}

export function defaultPartnerDeps(): PartnerServiceDeps {
  return { store: getMemoryPartnerStore() };
}

async function takenSlugs(store: PartnerStore, exceptId?: string): Promise<Set<string>> {
  const rows = await store.listPartners();
  return new Set(
    rows
      .filter((row) => row.id !== exceptId && row.publicSlug)
      .map((row) => row.publicSlug!.toLowerCase())
  );
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

export async function submitPartnerApplication(
  payload: unknown,
  deps: PartnerServiceDeps = defaultPartnerDeps()
): Promise<{ ok: true; spam?: boolean } | { ok: false; error: string }> {
  const parsed = parsePartnerApplicationInput(payload);
  if (!parsed.ok) {
    if (parsed.error === "spam") {
      return { ok: true, spam: true };
    }
    return parsed;
  }
  return persistApplication(parsed.data, deps);
}

export async function persistApplication(
  data: PartnerApplicationInput,
  deps: PartnerServiceDeps = defaultPartnerDeps()
): Promise<{ ok: true } | { ok: false; error: string }> {
  const taken = await takenSlugs(deps.store);
  const slug = proposePartnerSlug(data.companyName, taken);
  const timestamp = nowIso();
  const partner: PlatformPartner = {
    id: newId(),
    companyName: data.companyName,
    contactName: data.contactName,
    email: data.email,
    phone: data.phone,
    website: data.website,
    city: data.city,
    state: data.state,
    serviceArea: data.serviceArea,
    companyServiceType: data.companyServiceType,
    servicesOffered: data.servicesOffered,
    customersServed: data.customersServed,
    mpaAccountEmail: data.mpaAccountEmail,
    interestedPartnerType: data.interestedPartnerType,
    notes: data.notes,
    partnerType: data.interestedPartnerType,
    status: "applied",
    publicSlug: slug,
    organizationId: null,
    publicPortalEnabled: false,
    portalDescription: null,
    commissionBps: DEFAULT_COMMISSION_BPS,
    approvedAt: null,
    activatedAt: null,
    rejectedAt: null,
    suspendedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp
  };
  await deps.store.insertPartner(partner);
  await writeEvent(deps, {
    partnerId: partner.id,
    action: "applied",
    payload: { companyName: partner.companyName, slug }
  });
  return { ok: true };
}

export async function listPartnerConsole(deps: PartnerServiceDeps = defaultPartnerDeps()): Promise<{
  partners: PlatformPartner[];
  referrals: PartnerReferral[];
  commissions: PartnerCommission[];
  events: PartnerEvent[];
}> {
  const [partners, referrals, commissions, events] = await Promise.all([
    deps.store.listPartners(),
    deps.store.listReferrals(),
    deps.store.listCommissions(),
    deps.store.listEvents()
  ]);
  return { partners, referrals, commissions, events };
}

export async function mutatePartner(
  input: {
    partnerId: string;
    action:
      | "approve"
      | "reject"
      | "activate"
      | "suspend"
      | "update"
      | "mark_paid"
      | "clear_flag";
    actorUserId: string;
    publicSlug?: string;
    partnerType?: string;
    commissionBps?: number;
    commissionId?: string;
    organizationId?: string | null;
    publicPortalEnabled?: boolean;
    portalDescription?: string | null;
  },
  deps: PartnerServiceDeps = defaultPartnerDeps()
): Promise<{ ok: true; partner?: PlatformPartner; commission?: PartnerCommission } | { ok: false; error: string }> {
  if (input.action === "mark_paid" || input.action === "clear_flag") {
    return mutateCommission(
      {
        action: input.action,
        actorUserId: input.actorUserId,
        partnerId: input.partnerId,
        ...(input.commissionId ? { commissionId: input.commissionId } : {})
      },
      deps
    );
  }

  const partner = await deps.store.getPartner(input.partnerId);
  if (!partner) {
    return { ok: false, error: "Partner not found." };
  }

  const next: PlatformPartner = { ...partner, updatedAt: nowIso() };

  if (input.action === "update" || input.action === "approve" || input.action === "activate") {
    if (input.partnerType !== undefined) {
      if (!isPartnerType(input.partnerType)) {
        return { ok: false, error: "Invalid partner type." };
      }
      next.partnerType = input.partnerType as PartnerType;
    }
    if (typeof input.commissionBps === "number") {
      if (!Number.isInteger(input.commissionBps) || input.commissionBps < 0 || input.commissionBps > 5000) {
        return { ok: false, error: "Commission percentage is out of range." };
      }
      next.commissionBps = input.commissionBps;
    }
    if (input.publicSlug !== undefined) {
      const slug = validatePartnerSlug(input.publicSlug);
      if (!slug.ok) {
        return { ok: false, error: slug.error };
      }
      const taken = await takenSlugs(deps.store, partner.id);
      if (taken.has(slug.slug)) {
        return { ok: false, error: "That public slug is already in use." };
      }
      next.publicSlug = slug.slug;
    }
    if (input.organizationId !== undefined) {
      next.organizationId = input.organizationId;
    }
    if (typeof input.publicPortalEnabled === "boolean") {
      next.publicPortalEnabled = input.publicPortalEnabled;
    }
    if (input.portalDescription !== undefined) {
      next.portalDescription = input.portalDescription;
    }
  }

  if (input.action === "approve") {
    if (partner.status !== "applied" && partner.status !== "rejected") {
      return { ok: false, error: "Only applied or rejected applications can be approved." };
    }
    if (!next.publicSlug) {
      const taken = await takenSlugs(deps.store, partner.id);
      next.publicSlug = proposePartnerSlug(partner.companyName, taken);
    }
    next.status = "approved";
    next.approvedAt = nowIso();
    next.rejectedAt = null;
  } else if (input.action === "reject") {
    next.status = "rejected";
    next.rejectedAt = nowIso();
  } else if (input.action === "activate") {
    if (partner.status !== "approved" && partner.status !== "suspended") {
      return { ok: false, error: "Activate is available after approval or from suspended." };
    }
    if (!next.publicSlug) {
      return { ok: false, error: "A public slug is required before activation." };
    }
    next.status = "active";
    next.activatedAt = nowIso();
    next.suspendedAt = null;
  } else if (input.action === "suspend") {
    if (partner.status !== "active" && partner.status !== "approved") {
      return { ok: false, error: "Only approved or active partners can be suspended." };
    }
    next.status = "suspended";
    next.suspendedAt = nowIso();
    next.publicPortalEnabled = false;
  }

  await deps.store.updatePartner(next);
  await writeEvent(deps, {
    partnerId: next.id,
    action: input.action,
    actorUserId: input.actorUserId,
    payload: {
      from: partner.status,
      to: next.status,
      publicSlug: next.publicSlug,
      partnerType: next.partnerType,
      commissionBps: next.commissionBps
    }
  });
  return { ok: true, partner: next };
}

async function mutateCommission(
  input: {
    action: "mark_paid" | "clear_flag";
    actorUserId: string;
    commissionId?: string;
    partnerId: string;
  },
  deps: PartnerServiceDeps
): Promise<{ ok: true; commission: PartnerCommission } | { ok: false; error: string }> {
  if (!input.commissionId) {
    return { ok: false, error: "commissionId is required." };
  }
  const rows = await deps.store.listCommissions(input.partnerId);
  const row = rows.find((item) => item.id === input.commissionId);
  if (!row) {
    return { ok: false, error: "Commission record not found." };
  }
  if (input.action === "mark_paid") {
    if (row.status !== "earned") {
      return { ok: false, error: "Only earned commissions can be marked paid." };
    }
    const next: PartnerCommission = {
      ...row,
      status: "paid",
      paidAt: nowIso(),
      paidBy: input.actorUserId,
      updatedAt: nowIso()
    };
    await deps.store.updateCommission(next);
    await writeEvent(deps, {
      partnerId: row.partnerId,
      action: "commission_paid",
      actorUserId: input.actorUserId,
      payload: { commissionId: row.id }
    });
    return { ok: true, commission: next };
  }
  if (row.status !== "pending") {
    return { ok: false, error: "Only pending review records can be cleared." };
  }
  const next: PartnerCommission = { ...row, status: "earned", updatedAt: nowIso() };
  await deps.store.updateCommission(next);
  await writeEvent(deps, {
    partnerId: row.partnerId,
    action: "commission_cleared",
    actorUserId: input.actorUserId,
    payload: { commissionId: row.id }
  });
  return { ok: true, commission: next };
}

function selfReferralReason(partner: PlatformPartner, customerEmail?: string | null): string | null {
  const email = customerEmail?.trim().toLowerCase();
  if (!email) return null;
  if (partner.email === email || partner.mpaAccountEmail === email) {
    return "self_referral_email";
  }
  return null;
}

export async function recordPartnerAttribution(
  input: {
    organizationId: string;
    slug: string;
    source: string;
    customerEmail?: string | null;
    existingOrganization?: boolean;
  },
  deps: PartnerServiceDeps = defaultPartnerDeps()
): Promise<
  | { ok: true; referral: PartnerReferral; created: boolean; flaggedReason: string | null }
  | { ok: false; error: string }
> {
  const slug = parsePartnerRefParam(input.slug);
  if (!slug) {
    return { ok: false, error: "invalid_ref" };
  }
  const existing = await deps.store.getReferralByOrganization(input.organizationId);
  if (existing) {
    return { ok: true, referral: existing, created: false, flaggedReason: existing.flaggedReason };
  }
  const partner = await deps.store.getPartnerBySlug(slug);
  if (!partner || !partnerAcceptsReferrals(partner.status)) {
    return { ok: false, error: partner ? "partner_not_accepting" : "partner_not_found" };
  }
  const flaggedReason =
    selfReferralReason(partner, input.customerEmail) ??
    (input.existingOrganization ? "existing_organization_review" : null);
  const inserted = await deps.store.insertReferral({
    id: newId(),
    partnerId: partner.id,
    organizationId: input.organizationId,
    slugSnapshot: slug,
    source: input.source,
    flaggedReason,
    createdAt: nowIso()
  });
  if (inserted === "conflict") {
    const raced = await deps.store.getReferralByOrganization(input.organizationId);
    if (raced) {
      return { ok: true, referral: raced, created: false, flaggedReason: raced.flaggedReason };
    }
    return { ok: false, error: "attribution_conflict" };
  }
  await writeEvent(deps, {
    partnerId: partner.id,
    action: "referral_attributed",
    payload: {
      organizationId: input.organizationId,
      slug,
      flaggedReason,
      source: input.source
    }
  });
  return { ok: true, referral: inserted, created: true, flaggedReason };
}

export async function recordPartnerCommissionFromPaidInvoice(
  input: {
    organizationId: string | null;
    slug?: string | null;
    customerEmail?: string | null;
    amountPaidCents: number;
    taxCents?: number | null;
    stripeEventId: string;
    stripeInvoiceId?: string | null;
    stripeSubscriptionId?: string | null;
    complimentaryOnly?: boolean;
  },
  deps: PartnerServiceDeps = defaultPartnerDeps()
): Promise<{ ok: true; commission?: PartnerCommission | null; skipped?: string } | { ok: false; error: string }> {
  if (await deps.store.getCommissionByEventId(input.stripeEventId)) {
    return { ok: true, skipped: "duplicate_event" };
  }
  if (input.stripeInvoiceId && (await deps.store.getCommissionByInvoiceId(input.stripeInvoiceId))) {
    return { ok: true, skipped: "duplicate_invoice" };
  }

  const organizationId = input.organizationId;
  let referral = organizationId ? await deps.store.getReferralByOrganization(organizationId) : null;
  if (!referral && organizationId && input.slug) {
    const attributed = await recordPartnerAttribution(
      {
        organizationId,
        slug: input.slug,
        source: "invoice_paid",
        ...(input.customerEmail !== undefined ? { customerEmail: input.customerEmail } : {})
      },
      deps
    );
    if (attributed.ok) {
      referral = attributed.referral;
    }
  }
  if (!referral) {
    return { ok: true, skipped: "no_attribution" };
  }

  const partner = await deps.store.getPartner(referral.partnerId);
  if (!partner) {
    return { ok: true, skipped: "partner_missing" };
  }

  const eligibleRevenueCents = eligibleRevenueCentsFromInvoice({
    amountPaidCents: input.amountPaidCents,
    ...(input.taxCents !== undefined ? { taxCents: input.taxCents } : {})
  });
  const existing = await deps.store.listCommissions(partner.id);
  const qualifyingCount = existing.filter(
    (row) =>
      row.organizationId === referral!.organizationId &&
      row.status !== "void"
  ).length;
  const create = shouldCreateCommission({
    partnerActive: partner.status === "active",
    paymentCollected: eligibleRevenueCents > 0,
    paymentFailed: false,
    refunded: false,
    complimentaryOnly: Boolean(input.complimentaryOnly),
    existingQualifyingCount: qualifyingCount
  });
  if (!create) {
    return { ok: true, skipped: "not_commissionable" };
  }

  const commissionBps = partner.commissionBps;
  const flagged = Boolean(referral.flaggedReason);
  const row: PartnerCommission = {
    id: newId(),
    partnerId: partner.id,
    organizationId: referral.organizationId,
    referralId: referral.id,
    stripeEventId: input.stripeEventId,
    stripeInvoiceId: input.stripeInvoiceId ?? null,
    stripeSubscriptionId: input.stripeSubscriptionId ?? null,
    eligibleRevenueCents,
    commissionBps,
    commissionCents: calculateCommissionCents({ eligibleRevenueCents, commissionBps }),
    qualifyingMonthIndex: Math.min(qualifyingCount + 1, FOUNDING_PARTNER_QUALIFYING_MONTHS),
    status: commissionStatusForNewEntry(flagged),
    offsetRequired: false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    paidAt: null,
    paidBy: null
  };
  await deps.store.insertCommission(row);
  await writeEvent(deps, {
    partnerId: partner.id,
    action: "commission_recorded",
    payload: {
      commissionId: row.id,
      organizationId: row.organizationId,
      status: row.status,
      commissionCents: row.commissionCents,
      qualifyingMonthIndex: row.qualifyingMonthIndex
    }
  });
  return { ok: true, commission: row };
}

export async function voidPartnerCommissionsForRefund(
  input: {
    organizationId?: string | null;
    stripeInvoiceId?: string | null;
    stripeSubscriptionId?: string | null;
    stripeEventId: string;
  },
  deps: PartnerServiceDeps = defaultPartnerDeps()
): Promise<{ ok: true; updated: number }> {
  const rows = await deps.store.listCommissions();
  const matches = rows.filter((row) => {
    if (row.status === "void") return false;
    if (input.stripeInvoiceId && row.stripeInvoiceId === input.stripeInvoiceId) return true;
    if (input.organizationId && input.stripeSubscriptionId) {
      return (
        row.organizationId === input.organizationId &&
        row.stripeSubscriptionId === input.stripeSubscriptionId &&
        (row.status === "pending" || row.status === "earned" || row.status === "paid")
      );
    }
    return false;
  });
  let updated = 0;
  for (const row of matches) {
    const nextStatus = voidOrOffsetStatus(row.status);
    const next: PartnerCommission = {
      ...row,
      status: nextStatus.next,
      offsetRequired: nextStatus.offsetRequired || row.offsetRequired,
      updatedAt: nowIso()
    };
    await deps.store.updateCommission(next);
    await writeEvent(deps, {
      partnerId: row.partnerId,
      action: "commission_voided",
      payload: {
        commissionId: row.id,
        stripeEventId: input.stripeEventId,
        offsetRequired: next.offsetRequired
      }
    });
    updated += 1;
  }
  return { ok: true, updated };
}
