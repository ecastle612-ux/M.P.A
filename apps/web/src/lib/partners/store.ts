import type {
  PartnerCommission,
  PartnerEvent,
  PartnerInvitation,
  PartnerReferral,
  PartnerStore,
  PlatformPartner
} from "./types";

const globalStore = globalThis as typeof globalThis & {
  __mpaPartnerStore?: MemoryPartnerStore;
};

export class MemoryPartnerStore implements PartnerStore {
  partners = new Map<string, PlatformPartner>();
  referrals = new Map<string, PartnerReferral>();
  commissions = new Map<string, PartnerCommission>();
  invitations = new Map<string, PartnerInvitation>();
  events: PartnerEvent[] = [];

  async listPartners(): Promise<PlatformPartner[]> {
    return [...this.partners.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getPartner(id: string): Promise<PlatformPartner | null> {
    return this.partners.get(id) ?? null;
  }

  async getPartnerBySlug(slug: string): Promise<PlatformPartner | null> {
    const normalized = slug.trim().toLowerCase();
    return (
      [...this.partners.values()].find((row) => row.publicSlug?.toLowerCase() === normalized) ?? null
    );
  }

  async getPartnerByOrganization(organizationId: string): Promise<PlatformPartner | null> {
    const rows = [...this.partners.values()].filter((row) => row.organizationId === organizationId);
    rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return rows[0] ?? null;
  }

  async insertPartner(partner: PlatformPartner): Promise<PlatformPartner> {
    this.partners.set(partner.id, partner);
    return partner;
  }

  async updatePartner(partner: PlatformPartner): Promise<PlatformPartner> {
    this.partners.set(partner.id, partner);
    return partner;
  }

  async listReferrals(partnerId?: string): Promise<PartnerReferral[]> {
    return [...this.referrals.values()]
      .filter((row) => !partnerId || row.partnerId === partnerId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getReferralByOrganization(organizationId: string): Promise<PartnerReferral | null> {
    return [...this.referrals.values()].find((row) => row.organizationId === organizationId) ?? null;
  }

  async insertReferral(row: PartnerReferral): Promise<PartnerReferral | "conflict"> {
    if ([...this.referrals.values()].some((existing) => existing.organizationId === row.organizationId)) {
      return "conflict";
    }
    this.referrals.set(row.id, row);
    return row;
  }

  async listCommissions(partnerId?: string): Promise<PartnerCommission[]> {
    return [...this.commissions.values()]
      .filter((row) => !partnerId || row.partnerId === partnerId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getCommissionByEventId(eventId: string): Promise<PartnerCommission | null> {
    return [...this.commissions.values()].find((row) => row.stripeEventId === eventId) ?? null;
  }

  async getCommissionByInvoiceId(invoiceId: string): Promise<PartnerCommission | null> {
    return [...this.commissions.values()].find((row) => row.stripeInvoiceId === invoiceId) ?? null;
  }

  async insertCommission(row: PartnerCommission): Promise<PartnerCommission> {
    this.commissions.set(row.id, row);
    return row;
  }

  async updateCommission(row: PartnerCommission): Promise<PartnerCommission> {
    this.commissions.set(row.id, row);
    return row;
  }

  async listEvents(partnerId?: string): Promise<PartnerEvent[]> {
    return this.events
      .filter((row) => !partnerId || row.partnerId === partnerId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async insertEvent(row: PartnerEvent): Promise<void> {
    this.events.push(row);
  }

  async getPartnerByEmail(email: string): Promise<PlatformPartner | null> {
    const normalized = email.trim().toLowerCase();
    const rows = [...this.partners.values()].filter((row) => row.email.toLowerCase() === normalized);
    rows.sort((a, b) => {
      const rank = (status: PlatformPartner["status"]) =>
        status === "rejected" ? 1 : 0;
      if (rank(a.status) !== rank(b.status)) return rank(a.status) - rank(b.status);
      return b.updatedAt.localeCompare(a.updatedAt);
    });
    return rows[0] ?? null;
  }

  async listInvitations(partnerId?: string): Promise<PartnerInvitation[]> {
    return [...this.invitations.values()]
      .filter((row) => !partnerId || row.partnerId === partnerId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getInvitation(id: string): Promise<PartnerInvitation | null> {
    return this.invitations.get(id) ?? null;
  }

  async getInvitationByTokenHash(hash: string): Promise<PartnerInvitation | null> {
    return [...this.invitations.values()].find((row) => row.tokenHash === hash) ?? null;
  }

  async getPendingInvitationByPartner(partnerId: string): Promise<PartnerInvitation | null> {
    return (
      [...this.invitations.values()].find((row) => row.partnerId === partnerId && row.status === "pending") ??
      null
    );
  }

  async getPendingInvitationByEmail(email: string): Promise<PartnerInvitation | null> {
    const normalized = email.trim().toLowerCase();
    return (
      [...this.invitations.values()].find(
        (row) => row.email.toLowerCase() === normalized && row.status === "pending"
      ) ?? null
    );
  }

  async insertInvitation(row: PartnerInvitation): Promise<PartnerInvitation> {
    this.invitations.set(row.id, row);
    return row;
  }

  async updateInvitation(row: PartnerInvitation): Promise<PartnerInvitation> {
    this.invitations.set(row.id, row);
    return row;
  }
}

export function getMemoryPartnerStore(): MemoryPartnerStore {
  if (!globalStore.__mpaPartnerStore) {
    globalStore.__mpaPartnerStore = new MemoryPartnerStore();
  }
  return globalStore.__mpaPartnerStore;
}

export function resetMemoryPartnerStore(): MemoryPartnerStore {
  globalStore.__mpaPartnerStore = new MemoryPartnerStore();
  return globalStore.__mpaPartnerStore;
}
