export type SignatureRequestStatus =
  | "pending"
  | "sent"
  | "viewed"
  | "signed"
  | "declined"
  | "expired"
  | "cancelled";

export type SignatureRequestType = "lease_agreement" | "application_consent" | "addendum" | "other";

export type SignatureRequestRecord = {
  id: string;
  organizationId: string;
  applicantId: string;
  requestNumber: string;
  provider: string;
  requestType: SignatureRequestType;
  status: SignatureRequestStatus;
  externalReference: string | null;
  signedAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type CreateSignatureRequestInput = {
  applicantId: string;
  requestType?: SignatureRequestType;
  provider?: string;
};

export type SignatureProviderResult = {
  externalReference: string;
  status: SignatureRequestStatus;
};

export type SignatureProvider = {
  id: string;
  createSignatureRequest(input: {
    organizationId: string;
    applicantId: string;
    requestNumber: string;
    requestType: SignatureRequestType;
  }): Promise<SignatureProviderResult>;
};
