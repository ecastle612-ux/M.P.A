/**
 * PAY-001 Slice 1 — Settlement funding contracts.
 * Destination routing + readiness + mapping only. No transfers / refunds automation.
 */

export type FundingMode = "destination" | "legacy_platform";

export type OrgSettlementFundingSettings = {
  organizationId: string;
  destinationEnrolled: boolean;
  fundingEnabled: boolean;
  feeBps: number;
  feeFlatCents: number;
  metadata: Record<string, unknown>;
};

export type SettlementReadinessCheckId =
  | "S1"
  | "S2"
  | "S3"
  | "S4"
  | "S5"
  | "S6"
  | "S7"
  | "S8";

export type SettlementReadinessCheck = {
  id: SettlementReadinessCheckId;
  label: string;
  pass: boolean;
  detail?: string;
};

export type SettlementReadinessResult = {
  ready: boolean;
  checks: SettlementReadinessCheck[];
  settlementExternalAccountId: string | null;
  connectAccountId: string | null;
};

export type DestinationRoutingInput = {
  settlementAccountId: string;
  applicationFeeAmountCents: number;
  fundingMode: "destination";
  propertyId?: string | null;
  paymentAttemptId: string;
};

export type SettlementFundingDecision =
  | {
      kind: "legacy_platform";
      fundingMode: "legacy_platform";
      reason: "not_enrolled";
    }
  | {
      kind: "destination";
      fundingMode: "destination";
      settlementExternalAccountId: string;
      connectAccountId: string | null;
      applicationFeeAmountCents: number;
      readiness: SettlementReadinessResult;
    }
  | {
      kind: "blocked";
      code:
        | "funding_env_disabled"
        | "funding_org_disabled"
        | "settlement_not_ready"
        | "cross_org_destination_forbidden"
        | "destination_provider_incapable";
      message: string;
      readiness: SettlementReadinessResult;
    };

export type PaymentSettlementMappingInput = {
  organizationId: string;
  propertyId?: string | null;
  paymentAttemptId: string;
  provider: string;
  settlementExternalAccountId: string;
  connectAccountId?: string | null;
  externalPaymentIntentId?: string | null;
  externalCheckoutSessionId?: string | null;
  fundingMode: FundingMode;
  applicationFeeAmountCents: number;
  chargeAmountCents: number;
  currency?: string;
  metadata?: Record<string, unknown>;
};

export type PaymentSettlementMappingRecord = PaymentSettlementMappingInput & {
  id: string;
  status: "created" | "confirmed" | "failed" | "canceled";
  createdAt: string;
  confirmedAt: string | null;
};
