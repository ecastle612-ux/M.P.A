/**
 * ScreeningProvider abstraction (API-003).
 * Business modules must never import Checkr/SmartMove SDKs — only ScreeningService.
 */

import type {
  NormalizedScreeningReport,
  ScreeningComponentType,
  ScreeningProviderId
} from "../../screening/contracts";

export type { NormalizedScreeningReport } from "../../screening/contracts";

export type ScreeningOrderInput = {
  organizationId: string;
  screeningCaseId: string;
  caseNumber: string;
  packageCode: string;
  components: ScreeningComponentType[];
  consentAttestationId: string;
  party: {
    id: string;
    fullName: string;
    email: string | null;
    role: string;
    externalCandidateId?: string | null;
  };
  callbackUrl?: string;
  sandbox?: boolean;
};

export type ScreeningOrderRef = {
  externalReference: string;
  externalCandidateId?: string | null;
  authorizationUrl?: string | null;
};

export type ProviderCaseStatus = {
  externalReference: string;
  status: "pending" | "in_progress" | "completed" | "failed" | "cancelled";
  message?: string;
};

export type ProviderArtifact = {
  name: string;
  contentType: string;
  url?: string;
  bytes?: Uint8Array;
};

export type ScreeningWebhookResult = {
  externalEventId: string;
  screeningExternalReference: string | null;
  normalized?: NormalizedScreeningReport | null;
  ignored?: boolean;
  message?: string;
};

export type ScreeningProvider = {
  readonly id: ScreeningProviderId | string;
  createOrder(input: ScreeningOrderInput): Promise<ScreeningOrderRef>;
  getAuthorizationUrl?(ref: ScreeningOrderRef): Promise<string | null>;
  getStatus(ref: ScreeningOrderRef): Promise<ProviderCaseStatus>;
  fetchNormalizedReport(ref: ScreeningOrderRef): Promise<NormalizedScreeningReport>;
  listArtifacts?(ref: ScreeningOrderRef): Promise<ProviderArtifact[]>;
  cancel?(ref: ScreeningOrderRef): Promise<void>;
  handleWebhook(
    payload: unknown,
    headers: Record<string, string>
  ): Promise<ScreeningWebhookResult>;
};

/** @deprecated Use ScreeningProvider from this module. Kept for gradual migration. */
export type LegacyScreeningProviderResult = {
  externalReference: string;
  status: string;
  resultSummary: string;
};
