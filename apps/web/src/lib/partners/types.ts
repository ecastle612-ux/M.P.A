import type {
  PartnerCommissionStatus,
  PartnerStatus,
  PartnerType
} from "@mpa/shared";

export type PlatformPartner = {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  website: string | null;
  city: string;
  state: string;
  serviceArea: string;
  companyServiceType: string;
  servicesOffered: string;
  customersServed: string | null;
  mpaAccountEmail: string | null;
  interestedPartnerType: PartnerType;
  notes: string | null;
  partnerType: PartnerType;
  status: PartnerStatus;
  publicSlug: string | null;
  organizationId: string | null;
  publicPortalEnabled: boolean;
  portalDescription: string | null;
  logoMediaId: string | null;
  commissionBps: number;
  approvedAt: string | null;
  activatedAt: string | null;
  rejectedAt: string | null;
  suspendedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PartnerReferral = {
  id: string;
  partnerId: string;
  organizationId: string;
  slugSnapshot: string;
  source: string;
  flaggedReason: string | null;
  createdAt: string;
};

export type PartnerCommission = {
  id: string;
  partnerId: string;
  organizationId: string;
  referralId: string | null;
  stripeEventId: string | null;
  stripeInvoiceId: string | null;
  stripeSubscriptionId: string | null;
  eligibleRevenueCents: number;
  commissionBps: number;
  commissionCents: number;
  qualifyingMonthIndex: number;
  status: PartnerCommissionStatus;
  offsetRequired: boolean;
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
  paidBy: string | null;
};

export type PartnerEvent = {
  id: string;
  partnerId: string | null;
  action: string;
  actorUserId: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
};

export type PartnerStore = {
  listPartners(): Promise<PlatformPartner[]>;
  getPartner(id: string): Promise<PlatformPartner | null>;
  getPartnerBySlug(slug: string): Promise<PlatformPartner | null>;
  getPartnerByOrganization(organizationId: string): Promise<PlatformPartner | null>;
  insertPartner(partner: PlatformPartner): Promise<PlatformPartner>;
  updatePartner(partner: PlatformPartner): Promise<PlatformPartner>;
  listReferrals(partnerId?: string): Promise<PartnerReferral[]>;
  getReferralByOrganization(organizationId: string): Promise<PartnerReferral | null>;
  insertReferral(row: PartnerReferral): Promise<PartnerReferral | "conflict">;
  listCommissions(partnerId?: string): Promise<PartnerCommission[]>;
  getCommissionByEventId(eventId: string): Promise<PartnerCommission | null>;
  getCommissionByInvoiceId(invoiceId: string): Promise<PartnerCommission | null>;
  insertCommission(row: PartnerCommission): Promise<PartnerCommission>;
  updateCommission(row: PartnerCommission): Promise<PartnerCommission>;
  listEvents(partnerId?: string): Promise<PartnerEvent[]>;
  insertEvent(row: PartnerEvent): Promise<void>;
};
