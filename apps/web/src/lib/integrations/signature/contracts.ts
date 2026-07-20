/**
 * SignatureProvider abstraction (API-004).
 * Business modules must never import Dropbox Sign / DocuSign SDKs — only SignatureService.
 */

export type EnvelopeDocument = {
  title: string;
  fileName: string;
  contentBase64: string;
  contentType?: string;
};

export type EnvelopeRecipient = {
  id: string;
  role: string;
  fullName: string;
  email: string;
  signingOrder: number;
  signingGroup: number;
  isRequired: boolean;
};

export type CreateEnvelopeInput = {
  organizationId: string;
  packageId: string;
  packageNumber: string;
  subject: string;
  message?: string | null;
  expiresAt?: string | null;
  documents: EnvelopeDocument[];
  recipients: EnvelopeRecipient[];
  metadata?: Record<string, unknown>;
  sandbox?: boolean;
};

export type EnvelopeRef = {
  externalReference: string;
  recipientExternalIds?: Record<string, string>;
  signingUrls?: Record<string, string>;
};

export type EnvelopeStatus = {
  externalReference: string;
  status: "sent" | "in_progress" | "completed" | "declined" | "expired" | "cancelled" | "failed";
  message?: string;
};

export type ExecutedArtifact = {
  name: string;
  contentType: string;
  kind: "executed" | "certificate" | "other";
  contentBase64?: string;
  url?: string;
};

export type NormalizedSignatureEvent = {
  externalEventId: string;
  externalEnvelopeId: string | null;
  type: "sent" | "viewed" | "signed" | "declined" | "completed" | "expired" | "cancelled" | "failed";
  recipientExternalId?: string | null;
  recipientEmail?: string | null;
  occurredAt: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  payloadDigest?: string | null;
  ignored?: boolean;
  message?: string;
};

export type SignatureProvider = {
  readonly id: string;
  createEnvelope(input: CreateEnvelopeInput): Promise<EnvelopeRef>;
  getEnvelopeStatus(ref: EnvelopeRef): Promise<EnvelopeStatus>;
  cancelEnvelope(ref: EnvelopeRef): Promise<void>;
  remindRecipient?(ref: EnvelopeRef, recipientExternalId: string): Promise<void>;
  downloadExecutedDocuments(ref: EnvelopeRef): Promise<ExecutedArtifact[]>;
  downloadCertificate(ref: EnvelopeRef): Promise<ExecutedArtifact | null>;
  parseWebhook(payload: unknown, headers: Record<string, string>): Promise<NormalizedSignatureEvent[]>;
};
