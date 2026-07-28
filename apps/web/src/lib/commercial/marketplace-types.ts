/** COM-001 Slice E — marketplace data-model prep ([25]). No partner UI. */

export const ENGAGEMENT_PATHS = ["ai_guided", "professional"] as const;
export type EngagementPath = (typeof ENGAGEMENT_PATHS)[number];

export const PROVIDER_TYPES = ["mpa_internal", "certified_partner"] as const;
export type ProviderType = (typeof PROVIDER_TYPES)[number];

export const ENGAGEMENT_STATUSES = [
  "requested",
  "matched",
  "in_progress",
  "complete",
  "cancelled"
] as const;
export type EngagementStatus = (typeof ENGAGEMENT_STATUSES)[number];

export type ImplementationPartnerStub = {
  id: string;
  code: string;
  displayName: string;
  certificationStatus: "stub" | "pending" | "active" | "suspended";
  regions: string[];
  languages: string[];
  services: string[];
  capacityLimit: number | null;
  notes: string | null;
};

export type ImplementationEngagement = {
  id: string;
  organizationId: string;
  path: EngagementPath;
  providerType: ProviderType;
  partnerId: string | null;
  status: EngagementStatus;
  progressScore: number;
  accessGrantId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};
