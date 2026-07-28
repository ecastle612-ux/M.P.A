import type { SaasPlanCode } from "../integrations/saas-billing/contracts";

/** COM-001 Slice A pipeline stages ([17]). */
export const COMMERCIAL_PIPELINE_STAGES = [
  "lead",
  "mql",
  "sql",
  "discovery",
  "demo",
  "proposal",
  "negotiation",
  "won",
  "subscription_purchased",
  "organization_created",
  "customer_active",
  "lost"
] as const;

export type CommercialPipelineStage = (typeof COMMERCIAL_PIPELINE_STAGES)[number];

export const STAGE_DEFAULT_PROBABILITY: Record<CommercialPipelineStage, number> = {
  lead: 5,
  mql: 10,
  sql: 20,
  discovery: 30,
  demo: 45,
  proposal: 60,
  negotiation: 75,
  won: 90,
  subscription_purchased: 100,
  organization_created: 100,
  customer_active: 100,
  lost: 0
};

/** Stages that must never create an organization (CA-03 / SP-04). */
export const STAGES_FORBIDDEN_FOR_ORG_CREATE: ReadonlySet<CommercialPipelineStage> = new Set([
  "lead",
  "mql",
  "sql",
  "discovery",
  "demo",
  "proposal",
  "negotiation",
  "won",
  "lost"
]);

export type ImplementationPreference = "professional" | "ai_guided";

export type CommercialOpportunity = {
  id: string;
  stage: CommercialPipelineStage;
  companyName: string;
  contactEmail: string;
  contactName: string | null;
  source: string;
  salesOwnerId: string | null;
  expectedClose: string | null;
  probability: number;
  lostReason: string | null;
  acquisitionCostCents: number | null;
  referralSource: string | null;
  demoCompletedAt: string | null;
  planCode: SaasPlanCode | null;
  organizationType: string | null;
  implementationPreference: ImplementationPreference | null;
  organizationId: string | null;
  externalCrmOpportunityId: string | null;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Activation handoff packet (COM-001 §02 / AUTH-001 §05). Secret-free. */
export type CommercialActivationPacket = {
  saasSubscriptionId: string | null;
  planCode: SaasPlanCode;
  organizationType: string;
  buyerContactEmail: string;
  buyerCompanyName: string;
  implementationPreference: ImplementationPreference;
  salesOwnerId: string | null;
  idempotencyKey: string;
  opportunityId: string;
  buyerLegalName: string | null;
};

export function isCommercialPipelineStage(value: string): value is CommercialPipelineStage {
  return (COMMERCIAL_PIPELINE_STAGES as readonly string[]).includes(value);
}
