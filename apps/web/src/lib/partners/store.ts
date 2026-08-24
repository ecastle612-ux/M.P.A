import type { PartnerCommission, PartnerEvent, PartnerReferral, PartnerStore, PlatformPartner } from "./types";

const globalStore = globalThis as typeof globalThis & {
  __mpaPartnerStore?: MemoryPartnerStore;
};

export class MemoryPartnerStore implements PartnerStore {
  partners = new Map<string, PlatformPartner>();
  referrals = new Map<string, PartnerReferral>();
  commissions = new Map<string, PartnerCommission>();
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
