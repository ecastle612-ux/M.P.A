import type {
  PartnerCommissionStatus,
  PartnerInvitationSource,
  PartnerInvitationStatus,
  PartnerStatus,
  PartnerType
} from "@mpa/shared";
import { createServiceRoleClient } from "../supabase/service-role";
import { notifyPartnerStaff } from "./partner-notifications";
import { getMemoryPartnerStore } from "./store";
import type { PartnerServiceDeps } from "./service";
import type {
  PartnerCommission,
  PartnerEvent,
  PartnerInvitation,
  PartnerReferral,
  PartnerStore,
  PlatformPartner
} from "./types";

type DbClient = ReturnType<typeof createServiceRoleClient>;

function asPartnerType(value: unknown, fallback: PartnerType): PartnerType {
  return value === "referral" || value === "certified_service" || value === "strategic"
    ? value
    : fallback;
}

function asStatus(value: unknown): PartnerStatus {
  if (
    value === "applied" ||
    value === "approved" ||
    value === "active" ||
    value === "suspended" ||
    value === "rejected"
  ) {
    return value;
  }
  return "applied";
}

function asCommissionStatus(value: unknown): PartnerCommissionStatus {
  if (value === "pending" || value === "earned" || value === "paid" || value === "void") {
    return value;
  }
  return "earned";
}

function mapPartner(row: Record<string, unknown>): PlatformPartner {
  return {
    id: String(row["id"]),
    companyName: String(row["company_name"] ?? ""),
    contactName: String(row["contact_name"] ?? ""),
    email: String(row["email"] ?? ""),
    phone: String(row["phone"] ?? ""),
    website: typeof row["website"] === "string" ? row["website"] : null,
    city: String(row["city"] ?? ""),
    state: String(row["state"] ?? ""),
    serviceArea: String(row["service_area"] ?? ""),
    companyServiceType: String(row["company_service_type"] ?? ""),
    servicesOffered: String(row["services_offered"] ?? ""),
    customersServed: typeof row["customers_served"] === "string" ? row["customers_served"] : null,
    mpaAccountEmail: typeof row["mpa_account_email"] === "string" ? row["mpa_account_email"] : null,
    interestedPartnerType: asPartnerType(row["interested_partner_type"], "referral"),
    notes: typeof row["notes"] === "string" ? row["notes"] : null,
    partnerType: asPartnerType(row["partner_type"], "referral"),
    status: asStatus(row["status"]),
    publicSlug: typeof row["public_slug"] === "string" ? row["public_slug"] : null,
    organizationId: typeof row["organization_id"] === "string" ? row["organization_id"] : null,
    publicPortalEnabled: Boolean(row["public_portal_enabled"]),
    portalDescription: typeof row["portal_description"] === "string" ? row["portal_description"] : null,
    logoMediaId: typeof row["logo_media_id"] === "string" ? row["logo_media_id"] : null,
    commissionBps: typeof row["commission_bps"] === "number" ? row["commission_bps"] : 2000,
    approvedAt: typeof row["approved_at"] === "string" ? row["approved_at"] : null,
    activatedAt: typeof row["activated_at"] === "string" ? row["activated_at"] : null,
    rejectedAt: typeof row["rejected_at"] === "string" ? row["rejected_at"] : null,
    suspendedAt: typeof row["suspended_at"] === "string" ? row["suspended_at"] : null,
    createdAt: String(row["created_at"] ?? new Date().toISOString()),
    updatedAt: String(row["updated_at"] ?? new Date().toISOString())
  };
}

function partnerColumns(partner: PlatformPartner): Record<string, unknown> {
  return {
    id: partner.id,
    company_name: partner.companyName,
    contact_name: partner.contactName,
    email: partner.email,
    phone: partner.phone,
    website: partner.website,
    city: partner.city,
    state: partner.state,
    service_area: partner.serviceArea,
    company_service_type: partner.companyServiceType,
    services_offered: partner.servicesOffered,
    customers_served: partner.customersServed,
    mpa_account_email: partner.mpaAccountEmail,
    interested_partner_type: partner.interestedPartnerType,
    notes: partner.notes,
    partner_type: partner.partnerType,
    status: partner.status,
    public_slug: partner.publicSlug,
    organization_id: partner.organizationId,
    public_portal_enabled: partner.publicPortalEnabled,
    portal_description: partner.portalDescription,
    logo_media_id: partner.logoMediaId,
    commission_bps: partner.commissionBps,
    approved_at: partner.approvedAt,
    activated_at: partner.activatedAt,
    rejected_at: partner.rejectedAt,
    suspended_at: partner.suspendedAt,
    created_at: partner.createdAt,
    updated_at: partner.updatedAt
  };
}

function mapReferral(row: Record<string, unknown>): PartnerReferral {
  return {
    id: String(row["id"]),
    partnerId: String(row["partner_id"]),
    organizationId: String(row["organization_id"]),
    slugSnapshot: String(row["slug_snapshot"] ?? ""),
    source: String(row["source"] ?? "checkout_ref"),
    flaggedReason: typeof row["flagged_reason"] === "string" ? row["flagged_reason"] : null,
    createdAt: String(row["created_at"] ?? new Date().toISOString())
  };
}

function mapCommission(row: Record<string, unknown>): PartnerCommission {
  return {
    id: String(row["id"]),
    partnerId: String(row["partner_id"]),
    organizationId: String(row["organization_id"]),
    referralId: typeof row["referral_id"] === "string" ? row["referral_id"] : null,
    stripeEventId: typeof row["stripe_event_id"] === "string" ? row["stripe_event_id"] : null,
    stripeInvoiceId: typeof row["stripe_invoice_id"] === "string" ? row["stripe_invoice_id"] : null,
    stripeSubscriptionId:
      typeof row["stripe_subscription_id"] === "string" ? row["stripe_subscription_id"] : null,
    eligibleRevenueCents: Number(row["eligible_revenue_cents"] ?? 0),
    commissionBps: Number(row["commission_bps"] ?? 0),
    commissionCents: Number(row["commission_cents"] ?? 0),
    qualifyingMonthIndex: Number(row["qualifying_month_index"] ?? 1),
    status: asCommissionStatus(row["status"]),
    offsetRequired: Boolean(row["offset_required"]),
    createdAt: String(row["created_at"] ?? new Date().toISOString()),
    updatedAt: String(row["updated_at"] ?? new Date().toISOString()),
    paidAt: typeof row["paid_at"] === "string" ? row["paid_at"] : null,
    paidBy: typeof row["paid_by"] === "string" ? row["paid_by"] : null
  };
}

function mapEvent(row: Record<string, unknown>): PartnerEvent {
  return {
    id: String(row["id"]),
    partnerId: typeof row["partner_id"] === "string" ? row["partner_id"] : null,
    action: String(row["action"] ?? ""),
    actorUserId: typeof row["actor_user_id"] === "string" ? row["actor_user_id"] : null,
    payload:
      row["payload"] && typeof row["payload"] === "object"
        ? (row["payload"] as Record<string, unknown>)
        : {},
    createdAt: String(row["created_at"] ?? new Date().toISOString())
  };
}

class SupabasePartnerStore implements PartnerStore {
  constructor(private readonly db: DbClient) {}

  async listPartners(): Promise<PlatformPartner[]> {
    const { data, error } = await this.db
      .from("platform_partners")
      .select("*")
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return data.map((row) => mapPartner(row as Record<string, unknown>));
  }

  async getPartner(id: string): Promise<PlatformPartner | null> {
    const { data, error } = await this.db.from("platform_partners").select("*").eq("id", id).maybeSingle();
    if (error || !data) return null;
    return mapPartner(data as Record<string, unknown>);
  }

  async getPartnerBySlug(slug: string): Promise<PlatformPartner | null> {
    const { data, error } = await this.db
      .from("platform_partners")
      .select("*")
      .eq("public_slug", slug)
      .maybeSingle();
    if (error || !data) return null;
    return mapPartner(data as Record<string, unknown>);
  }

  async getPartnerByOrganization(organizationId: string): Promise<PlatformPartner | null> {
    const { data, error } = await this.db
      .from("platform_partners")
      .select("*")
      .eq("organization_id", organizationId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    return mapPartner(data as Record<string, unknown>);
  }

  async insertPartner(partner: PlatformPartner): Promise<PlatformPartner> {
    const { error } = await this.db.from("platform_partners").insert(partnerColumns(partner));
    if (error) {
      throw new Error(error.message);
    }
    return partner;
  }

  async updatePartner(partner: PlatformPartner): Promise<PlatformPartner> {
    const { error } = await this.db
      .from("platform_partners")
      .update(partnerColumns(partner))
      .eq("id", partner.id);
    if (error) {
      throw new Error(error.message);
    }
    return partner;
  }

  async listReferrals(partnerId?: string): Promise<PartnerReferral[]> {
    let query = this.db.from("platform_partner_referrals").select("*").order("created_at", { ascending: false });
    if (partnerId) {
      query = query.eq("partner_id", partnerId);
    }
    const { data, error } = await query;
    if (error || !data) return [];
    return data.map((row) => mapReferral(row as Record<string, unknown>));
  }

  async getReferralByOrganization(organizationId: string): Promise<PartnerReferral | null> {
    const { data, error } = await this.db
      .from("platform_partner_referrals")
      .select("*")
      .eq("organization_id", organizationId)
      .maybeSingle();
    if (error || !data) return null;
    return mapReferral(data as Record<string, unknown>);
  }

  async insertReferral(row: PartnerReferral): Promise<PartnerReferral | "conflict"> {
    const { error } = await this.db.from("platform_partner_referrals").insert({
      id: row.id,
      partner_id: row.partnerId,
      organization_id: row.organizationId,
      slug_snapshot: row.slugSnapshot,
      source: row.source,
      flagged_reason: row.flaggedReason,
      created_at: row.createdAt
    });
    if (error) {
      if (error.code === "23505") return "conflict";
      throw new Error(error.message);
    }
    return row;
  }

  async listCommissions(partnerId?: string): Promise<PartnerCommission[]> {
    let query = this.db
      .from("platform_partner_commissions")
      .select("*")
      .order("created_at", { ascending: false });
    if (partnerId) {
      query = query.eq("partner_id", partnerId);
    }
    const { data, error } = await query;
    if (error || !data) return [];
    return data.map((row) => mapCommission(row as Record<string, unknown>));
  }

  async getCommissionByEventId(eventId: string): Promise<PartnerCommission | null> {
    const { data, error } = await this.db
      .from("platform_partner_commissions")
      .select("*")
      .eq("stripe_event_id", eventId)
      .maybeSingle();
    if (error || !data) return null;
    return mapCommission(data as Record<string, unknown>);
  }

  async getCommissionByInvoiceId(invoiceId: string): Promise<PartnerCommission | null> {
    const { data, error } = await this.db
      .from("platform_partner_commissions")
      .select("*")
      .eq("stripe_invoice_id", invoiceId)
      .maybeSingle();
    if (error || !data) return null;
    return mapCommission(data as Record<string, unknown>);
  }

  async insertCommission(row: PartnerCommission): Promise<PartnerCommission> {
    const { error } = await this.db.from("platform_partner_commissions").insert({
      id: row.id,
      partner_id: row.partnerId,
      organization_id: row.organizationId,
      referral_id: row.referralId,
      stripe_event_id: row.stripeEventId,
      stripe_invoice_id: row.stripeInvoiceId,
      stripe_subscription_id: row.stripeSubscriptionId,
      eligible_revenue_cents: row.eligibleRevenueCents,
      commission_bps: row.commissionBps,
      commission_cents: row.commissionCents,
      qualifying_month_index: row.qualifyingMonthIndex,
      status: row.status,
      offset_required: row.offsetRequired,
      created_at: row.createdAt,
      updated_at: row.updatedAt,
      paid_at: row.paidAt,
      paid_by: row.paidBy
    });
    if (error) {
      throw new Error(error.message);
    }
    return row;
  }

  async updateCommission(row: PartnerCommission): Promise<PartnerCommission> {
    const { error } = await this.db
      .from("platform_partner_commissions")
      .update({
        status: row.status,
        offset_required: row.offsetRequired,
        paid_at: row.paidAt,
        paid_by: row.paidBy,
        updated_at: row.updatedAt
      })
      .eq("id", row.id);
    if (error) {
      throw new Error(error.message);
    }
    return row;
  }

  async listEvents(partnerId?: string): Promise<PartnerEvent[]> {
    let query = this.db.from("platform_partner_events").select("*").order("created_at", { ascending: false });
    if (partnerId) {
      query = query.eq("partner_id", partnerId);
    }
    const { data, error } = await query;
    if (error || !data) return [];
    return data.map((row) => mapEvent(row as Record<string, unknown>));
  }

  async insertEvent(row: PartnerEvent): Promise<void> {
    await this.db.from("platform_partner_events").insert({
      id: row.id,
      partner_id: row.partnerId,
      action: row.action,
      actor_user_id: row.actorUserId,
      payload: row.payload,
      created_at: row.createdAt
    });
  }

  async getPartnerByEmail(email: string): Promise<PlatformPartner | null> {
    const { data, error } = await this.db
      .from("platform_partners")
      .select("*")
      .ilike("email", email.trim())
      .order("updated_at", { ascending: false });
    if (error || !data || data.length === 0) return null;
    const mapped = data.map((row) => mapPartner(row as Record<string, unknown>));
    mapped.sort((a, b) => {
      const rank = (status: PlatformPartner["status"]) => (status === "rejected" ? 1 : 0);
      if (rank(a.status) !== rank(b.status)) return rank(a.status) - rank(b.status);
      return b.updatedAt.localeCompare(a.updatedAt);
    });
    return mapped.find((row) => row.email.toLowerCase() === email.trim().toLowerCase()) ?? mapped[0] ?? null;
  }

  async listInvitations(partnerId?: string): Promise<PartnerInvitation[]> {
    let query = this.db
      .from("platform_partner_invitations")
      .select("*")
      .order("created_at", { ascending: false });
    if (partnerId) {
      query = query.eq("partner_id", partnerId);
    }
    const { data, error } = await query;
    if (error || !data) return [];
    return data.map((row) => mapInvitation(row as Record<string, unknown>));
  }

  async getInvitation(id: string): Promise<PartnerInvitation | null> {
    const { data, error } = await this.db
      .from("platform_partner_invitations")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return mapInvitation(data as Record<string, unknown>);
  }

  async getInvitationByTokenHash(hash: string): Promise<PartnerInvitation | null> {
    const { data, error } = await this.db
      .from("platform_partner_invitations")
      .select("*")
      .eq("token_hash", hash)
      .maybeSingle();
    if (error || !data) return null;
    return mapInvitation(data as Record<string, unknown>);
  }

  async getPendingInvitationByPartner(partnerId: string): Promise<PartnerInvitation | null> {
    const { data, error } = await this.db
      .from("platform_partner_invitations")
      .select("*")
      .eq("partner_id", partnerId)
      .eq("status", "pending")
      .maybeSingle();
    if (error || !data) return null;
    return mapInvitation(data as Record<string, unknown>);
  }

  async getPendingInvitationByEmail(email: string): Promise<PartnerInvitation | null> {
    const { data, error } = await this.db
      .from("platform_partner_invitations")
      .select("*")
      .eq("status", "pending")
      .ilike("email", email.trim())
      .maybeSingle();
    if (error || !data) return null;
    const mapped = mapInvitation(data as Record<string, unknown>);
    return mapped.email.toLowerCase() === email.trim().toLowerCase() ? mapped : null;
  }

  async insertInvitation(row: PartnerInvitation): Promise<PartnerInvitation> {
    const { error } = await this.db.from("platform_partner_invitations").insert(invitationColumns(row));
    if (error) {
      throw new Error(error.message);
    }
    return row;
  }

  async updateInvitation(row: PartnerInvitation): Promise<PartnerInvitation> {
    const { error } = await this.db
      .from("platform_partner_invitations")
      .update(invitationColumns(row))
      .eq("id", row.id);
    if (error) {
      throw new Error(error.message);
    }
    return row;
  }
}

function asInvitationStatus(value: unknown): PartnerInvitationStatus {
  if (value === "pending" || value === "accepted" || value === "expired" || value === "revoked") {
    return value;
  }
  return "pending";
}

function asInvitationSource(value: unknown): PartnerInvitationSource {
  if (value === "application_approval" || value === "direct_invite" || value === "resend") {
    return value;
  }
  return "direct_invite";
}

function mapInvitation(row: Record<string, unknown>): PartnerInvitation {
  return {
    id: String(row["id"]),
    partnerId: String(row["partner_id"]),
    email: String(row["email"] ?? ""),
    tokenHash: String(row["token_hash"] ?? ""),
    status: asInvitationStatus(row["status"]),
    source: asInvitationSource(row["source"]),
    expiresAt: String(row["expires_at"] ?? ""),
    invitedBy: typeof row["invited_by"] === "string" ? row["invited_by"] : null,
    acceptedAt: typeof row["accepted_at"] === "string" ? row["accepted_at"] : null,
    acceptedUserId: typeof row["accepted_user_id"] === "string" ? row["accepted_user_id"] : null,
    createdAt: String(row["created_at"] ?? new Date().toISOString()),
    updatedAt: String(row["updated_at"] ?? new Date().toISOString())
  };
}

function invitationColumns(row: PartnerInvitation): Record<string, unknown> {
  return {
    id: row.id,
    partner_id: row.partnerId,
    email: row.email,
    token_hash: row.tokenHash,
    status: row.status,
    source: row.source,
    expires_at: row.expiresAt,
    invited_by: row.invitedBy,
    accepted_at: row.acceptedAt,
    accepted_user_id: row.acceptedUserId,
    created_at: row.createdAt,
    updated_at: row.updatedAt
  };
}

export async function loadPartnerDeps(): Promise<PartnerServiceDeps & { durable: boolean }> {
  if (process.env["VITEST"]) {
    return { store: getMemoryPartnerStore(), durable: false };
  }
  try {
    const db = createServiceRoleClient();
    return { store: new SupabasePartnerStore(db), durable: true, notifyPartnerEvent: notifyPartnerStaff };
  } catch {
    return { store: getMemoryPartnerStore(), durable: false, notifyPartnerEvent: notifyPartnerStaff };
  }
}
