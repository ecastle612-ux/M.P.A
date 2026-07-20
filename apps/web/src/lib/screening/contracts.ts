/**
 * API-003 screening domain contracts.
 * Structured results are system of record; vault holds original PDFs (Q3).
 */

export const SCREENING_CASE_STATUSES = [
  "draft",
  "awaiting_consent",
  "consent_complete",
  "identity_in_progress",
  "screening_in_progress",
  "partial_results",
  "ready_for_review",
  "in_review",
  "approved",
  "conditionally_approved",
  "rejected",
  "adverse_action_pending",
  "adverse_action_complete",
  "expired",
  "cancelled",
  "failed"
] as const;

export type ScreeningCaseStatus = (typeof SCREENING_CASE_STATUSES)[number];

export const SCREENING_PARTY_ROLES = [
  "primary",
  "co_applicant",
  "guarantor",
  "co_signer",
  "adult_occupant"
] as const;

export type ScreeningPartyRole = (typeof SCREENING_PARTY_ROLES)[number];

export const SCREENING_COMPONENT_TYPES = [
  "identity",
  "credit",
  "criminal",
  "eviction",
  "sex_offender",
  "income"
] as const;

export type ScreeningComponentType = (typeof SCREENING_COMPONENT_TYPES)[number];

export const SCREENING_COMPONENT_STATUSES = [
  "pending",
  "not_requested",
  "clear",
  "review",
  "fail",
  "error"
] as const;

export type ScreeningComponentStatus = (typeof SCREENING_COMPONENT_STATUSES)[number];

export const SCREENING_DECISIONS = ["approve", "reject", "conditional"] as const;
export type ScreeningDecision = (typeof SCREENING_DECISIONS)[number];

export const SCREENING_PROVIDERS = ["noop", "checkr", "smartmove", "rentprep", "equifax"] as const;
export type ScreeningProviderId = (typeof SCREENING_PROVIDERS)[number];

export const DEFAULT_PACKAGE_COMPONENTS: Record<string, ScreeningComponentType[]> = {
  standard_rental: ["identity", "credit", "criminal", "eviction", "sex_offender"],
  guarantor_credit: ["identity", "credit"],
  occupant_criminal: ["identity", "criminal", "eviction", "sex_offender"]
};

export type ScreeningFlag = {
  code: string;
  severity: "info" | "review" | "fail";
  message: string;
};

export type NormalizedComponentResult = {
  type: ScreeningComponentType;
  status: ScreeningComponentStatus;
  flags: ScreeningFlag[];
  summary?: string;
  providerReference?: string;
  completedAt?: string;
};

export type NormalizedScreeningReport = {
  externalReference: string;
  status: "pending" | "in_progress" | "completed" | "failed" | "cancelled";
  components: NormalizedComponentResult[];
  resultSummary: string;
  completedAt?: string;
  expiresAt?: string;
  rawArtifactHints?: Array<{ name: string; url?: string; contentType?: string }>;
};

export type ScreeningCaseRecord = {
  id: string;
  organizationId: string;
  applicantId: string;
  caseNumber: string;
  provider: string;
  packageCode: string;
  status: ScreeningCaseStatus;
  externalReference: string | null;
  resultSummary: string | null;
  normalizedSummary: Record<string, unknown>;
  decision: ScreeningDecision | null;
  expiresAt: string | null;
  consentCompletedAt: string | null;
  readyForReviewAt: string | null;
  decidedAt: string | null;
  leaseId: string | null;
  supersedesCaseId: string | null;
  retryCount: number;
  lastError: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type ScreeningPartyRecord = {
  id: string;
  organizationId: string;
  screeningCaseId: string;
  applicantId: string | null;
  role: ScreeningPartyRole;
  fullName: string;
  email: string | null;
  phone: string | null;
  status: string;
  consentToken: string | null;
  consentTokenExpiresAt: string | null;
  externalCandidateId: string | null;
};

export type ScreeningComponentRecord = {
  id: string;
  organizationId: string;
  screeningCaseId: string;
  screeningPartyId: string | null;
  componentType: ScreeningComponentType;
  status: ScreeningComponentStatus;
  flags: ScreeningFlag[];
  providerReference: string | null;
  summary: string | null;
  completedAt: string | null;
  vaultDocumentId: string | null;
};

export type ScreeningProgressStep = {
  key: string;
  status: "pending" | "in_progress" | "complete" | "failed" | "skipped";
  label: string;
};

export type CreateScreeningCaseInput = {
  applicantId: string;
  provider?: ScreeningProviderId | string;
  packageCode?: string;
  parties?: Array<{
    role: ScreeningPartyRole;
    fullName: string;
    email?: string | null;
    phone?: string | null;
    applicantId?: string | null;
  }>;
  supersedesCaseId?: string | null;
};

export type GrantConsentInput = {
  signedName: string;
  attestedDisclosure: boolean;
  attestedAuthorization: boolean;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type RecordDecisionInput = {
  decision: ScreeningDecision;
  reasonCodes?: string[];
  notes?: string | null;
  conditions?: Array<{ conditionType: string; description: string; dueAt?: string | null }>;
};

export type ScreeningOpsSnapshot = {
  pendingScreenings: number;
  awaitingConsent: number;
  readyForReview: number;
  flaggedApplicants: number;
  providerFailures: number;
  completedToday: number;
  averageTurnaroundHours: number | null;
};

export function isScreeningDecision(value: unknown): value is ScreeningDecision {
  return typeof value === "string" && (SCREENING_DECISIONS as readonly string[]).includes(value);
}

export function packageComponentsFor(packageCode: string): ScreeningComponentType[] {
  return DEFAULT_PACKAGE_COMPONENTS[packageCode] ?? DEFAULT_PACKAGE_COMPONENTS["standard_rental"] ?? ["identity", "credit"];
}
