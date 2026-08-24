import type { PartnerPropertyIntakeSource, PartnerPropertyPortalType } from "@mpa/shared";

export type CanonicalPropertyRecord = {
  id: string;
  organizationId: string;
  name: string;
  addressLine1: string | null;
  city: string | null;
  region: string | null;
  postalCode: string | null;
  status: string | null;
};

export type PartnerPropertyPortal = {
  id: string;
  partnerId: string;
  organizationId: string;
  propertyId: string;
  publicSlug: string;
  enabled: boolean;
  publicDisplayName: string | null;
  publicInstructions: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PartnerRequestSummary = {
  partnerId: string;
  propertyPortalId: string | null;
  status: string;
  createdAt: string;
};

export type PartnerPropertyPortalMetrics = {
  total: number;
  thisMonth: number;
  accepted: number;
  converted: number;
  declined: number;
  conversionRate: number | null;
};

export type PartnerPropertyPortalListItem = PartnerPropertyPortal & {
  publicName: string;
  address: string;
  type: PartnerPropertyPortalType;
  typeLabel: string;
  portalUrl: string;
  displayUrl: string;
  qrPayload: string;
  requestCount: number;
  metrics: PartnerPropertyPortalMetrics;
};

export type PropertyCatalog = {
  getProperty(id: string): Promise<CanonicalPropertyRecord | null>;
  listProperties(organizationId: string): Promise<CanonicalPropertyRecord[]>;
};

export type PartnerPropertyPortalStore = {
  insertPortal(row: PartnerPropertyPortal): Promise<PartnerPropertyPortal>;
  updatePortal(row: PartnerPropertyPortal): Promise<PartnerPropertyPortal>;
  getPortal(id: string): Promise<PartnerPropertyPortal | null>;
  getPortalByPartnerAndSlug(partnerId: string, slug: string): Promise<PartnerPropertyPortal | null>;
  getPortalByPartnerAndProperty(partnerId: string, propertyId: string): Promise<PartnerPropertyPortal | null>;
  listPortals(partnerId: string): Promise<PartnerPropertyPortal[]>;
};

export type { PartnerPropertyIntakeSource };
