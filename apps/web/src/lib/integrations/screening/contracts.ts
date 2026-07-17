export type ScreeningCaseStatus = "pending" | "in_progress" | "completed" | "failed" | "cancelled";

export type ScreeningCaseRecord = {
  id: string;
  organizationId: string;
  applicantId: string;
  caseNumber: string;
  provider: string;
  status: ScreeningCaseStatus;
  externalReference: string | null;
  resultSummary: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type CreateScreeningCaseInput = {
  applicantId: string;
  provider?: string;
};

export type ScreeningProviderResult = {
  externalReference: string;
  status: ScreeningCaseStatus;
  resultSummary: string;
};

export type ScreeningProvider = {
  id: string;
  initiateScreening(input: {
    organizationId: string;
    applicantId: string;
    caseNumber: string;
  }): Promise<ScreeningProviderResult>;
};
