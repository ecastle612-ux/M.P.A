/**
 * COM-001 Slice A — opportunity pipeline (Won ↛ organization).
 */
import { createServiceRoleServerClient } from "../auth/server";
import type { SaasPlanCode } from "../integrations/saas-billing/contracts";
import { emitCommercialOpsEvent } from "./ops-events";
import {
  COMMERCIAL_PIPELINE_STAGES,
  STAGE_DEFAULT_PROBABILITY,
  STAGES_FORBIDDEN_FOR_ORG_CREATE,
  isCommercialPipelineStage,
  type CommercialOpportunity,
  type CommercialPipelineStage,
  type ImplementationPreference
} from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

function serviceClient(): AnyClient {
  const client = createServiceRoleServerClient();
  if (!client) throw new Error("Commercial opportunities require SUPABASE_SERVICE_ROLE_KEY");
  return client;
}

function mapRow(row: Record<string, unknown>): CommercialOpportunity {
  const stageRaw = String(row["stage"] ?? "lead");
  const stage = isCommercialPipelineStage(stageRaw) ? stageRaw : "lead";
  return {
    id: String(row["id"]),
    stage,
    companyName: String(row["company_name"] ?? ""),
    contactEmail: String(row["contact_email"] ?? ""),
    contactName: row["contact_name"] != null ? String(row["contact_name"]) : null,
    source: String(row["source"] ?? "unknown"),
    salesOwnerId: row["sales_owner_id"] != null ? String(row["sales_owner_id"]) : null,
    expectedClose: row["expected_close"] != null ? String(row["expected_close"]) : null,
    probability: Number(row["probability"] ?? STAGE_DEFAULT_PROBABILITY[stage]),
    lostReason: row["lost_reason"] != null ? String(row["lost_reason"]) : null,
    acquisitionCostCents:
      row["acquisition_cost_cents"] != null ? Number(row["acquisition_cost_cents"]) : null,
    referralSource: row["referral_source"] != null ? String(row["referral_source"]) : null,
    demoCompletedAt: row["demo_completed_at"] != null ? String(row["demo_completed_at"]) : null,
    planCode: (row["plan_code"] as SaasPlanCode | null) ?? null,
    organizationType: row["organization_type"] != null ? String(row["organization_type"]) : null,
    implementationPreference:
      (row["implementation_preference"] as ImplementationPreference | null) ?? null,
    organizationId: row["organization_id"] != null ? String(row["organization_id"]) : null,
    externalCrmOpportunityId:
      row["external_crm_opportunity_id"] != null
        ? String(row["external_crm_opportunity_id"])
        : null,
    notes: row["notes"] != null ? String(row["notes"]) : null,
    createdBy: row["created_by"] != null ? String(row["created_by"]) : null,
    createdAt: String(row["created_at"] ?? ""),
    updatedAt: String(row["updated_at"] ?? "")
  };
}

export type CreateOpportunityInput = {
  companyName: string;
  contactEmail: string;
  contactName?: string | null | undefined;
  source?: string | undefined;
  salesOwnerId?: string | null | undefined;
  expectedClose?: string | null | undefined;
  probability?: number | null | undefined;
  acquisitionCostCents?: number | null | undefined;
  referralSource?: string | null | undefined;
  demoCompletedAt?: string | null | undefined;
  planCode?: SaasPlanCode | null | undefined;
  organizationType?: string | null | undefined;
  implementationPreference?: ImplementationPreference | null | undefined;
  externalCrmOpportunityId?: string | null | undefined;
  notes?: string | null | undefined;
  stage?: CommercialPipelineStage | undefined;
  actorUserId?: string | null | undefined;
};

export type UpdateOpportunityInput = {
  companyName?: string;
  contactEmail?: string;
  contactName?: string | null;
  source?: string;
  salesOwnerId?: string | null;
  expectedClose?: string | null;
  probability?: number | null;
  acquisitionCostCents?: number | null;
  referralSource?: string | null;
  demoCompletedAt?: string | null;
  planCode?: SaasPlanCode | null;
  organizationType?: string | null;
  implementationPreference?: ImplementationPreference | null;
  externalCrmOpportunityId?: string | null;
  notes?: string | null;
};

/** Pure stage-transition rules (CA-01 · CA-03 · SP). Exported for unit tests. */
export function assertValidStageTransition(input: {
  from: CommercialPipelineStage;
  to: CommercialPipelineStage;
  lostReason?: string | null | undefined;
}): void {
  if (input.from === input.to) return;
  if (input.from === "lost") {
    throw new Error("Cannot transition out of Lost");
  }
  if (input.to === "lost") {
    if (!input.lostReason?.trim()) {
      throw new Error("Lost Reason is required when stage is Lost");
    }
    return;
  }
  if (input.from === "customer_active") {
    throw new Error("Customer Active is terminal for Slice A (except Lost)");
  }
  const fromIdx = COMMERCIAL_PIPELINE_STAGES.indexOf(input.from);
  const toIdx = COMMERCIAL_PIPELINE_STAGES.indexOf(input.to);
  if (fromIdx < 0 || toIdx < 0) throw new Error("Invalid pipeline stage");
  if (toIdx < fromIdx) {
    // Allow limited rollback before subscription_purchased.
    const postPurchase = new Set<CommercialPipelineStage>([
      "subscription_purchased",
      "organization_created",
      "customer_active"
    ]);
    if (postPurchase.has(input.from) || postPurchase.has(input.to)) {
      throw new Error("Cannot move backward after Subscription Purchased");
    }
  }
}

/** CA-03 / SP-04 — stage transitions never create organizations. */
export function stageTransitionCreatesOrganization(_stage: CommercialPipelineStage): false {
  return false;
}

export async function createOpportunity(
  input: CreateOpportunityInput
): Promise<CommercialOpportunity> {
  const companyName = input.companyName.trim();
  const contactEmail = input.contactEmail.trim().toLowerCase();
  if (!companyName || !contactEmail) {
    throw new Error("companyName and contactEmail are required");
  }
  const stage: CommercialPipelineStage = input.stage ?? "lead";
  if (STAGES_FORBIDDEN_FOR_ORG_CREATE.has(stage) === false && stage !== "lost") {
    // Creating directly past Won is allowed only for reconciliation (subscription+); still no org create here.
  }
  if (stage === "organization_created" || stage === "customer_active") {
    throw new Error("Cannot create opportunity already linked to an organization; use activation");
  }

  const admin = serviceClient();
  const probability = input.probability ?? STAGE_DEFAULT_PROBABILITY[stage];
  const { data, error } = await admin
    .from("commercial_opportunities")
    .insert({
      stage,
      company_name: companyName,
      contact_email: contactEmail,
      contact_name: input.contactName?.trim() || null,
      source: input.source?.trim() || "unknown",
      sales_owner_id: input.salesOwnerId ?? null,
      expected_close: input.expectedClose ?? null,
      probability,
      acquisition_cost_cents: input.acquisitionCostCents ?? null,
      referral_source: input.referralSource?.trim() || null,
      demo_completed_at: input.demoCompletedAt ?? null,
      plan_code: input.planCode ?? null,
      organization_type: input.organizationType?.trim() || "property_manager",
      implementation_preference: input.implementationPreference ?? null,
      external_crm_opportunity_id: input.externalCrmOpportunityId?.trim() || null,
      notes: input.notes?.trim() || null,
      created_by: input.actorUserId ?? null
    })
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to create opportunity");
  const opportunity = mapRow(data as Record<string, unknown>);

  await emitCommercialOpsEvent({
    eventType: "commercial.opportunity.created",
    organizationId: null,
    subjectType: "commercial_opportunity",
    subjectId: opportunity.id,
    actorUserId: input.actorUserId,
    summary: `Opportunity created at ${opportunity.stage}`,
    payload: {
      opportunityId: opportunity.id,
      stage: opportunity.stage,
      source: opportunity.source,
      planCode: opportunity.planCode
    }
  });

  return opportunity;
}

export async function getOpportunity(id: string): Promise<CommercialOpportunity | null> {
  const admin = serviceClient();
  const { data, error } = await admin
    .from("commercial_opportunities")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapRow(data as Record<string, unknown>) : null;
}

export async function listOpportunities(input?: {
  stage?: CommercialPipelineStage | undefined;
  limit?: number | undefined;
}): Promise<CommercialOpportunity[]> {
  const admin = serviceClient();
  let query = admin
    .from("commercial_opportunities")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(input?.limit ?? 100);
  if (input?.stage) query = query.eq("stage", input.stage);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return ((data ?? []) as Record<string, unknown>[]).map(mapRow);
}

export async function updateOpportunity(
  id: string,
  input: UpdateOpportunityInput
): Promise<CommercialOpportunity> {
  const admin = serviceClient();
  const patch: Record<string, unknown> = {};
  if (input.companyName !== undefined) patch["company_name"] = input.companyName.trim();
  if (input.contactEmail !== undefined) {
    patch["contact_email"] = input.contactEmail.trim().toLowerCase();
  }
  if (input.contactName !== undefined) patch["contact_name"] = input.contactName?.trim() || null;
  if (input.source !== undefined) patch["source"] = input.source.trim() || "unknown";
  if (input.salesOwnerId !== undefined) patch["sales_owner_id"] = input.salesOwnerId;
  if (input.expectedClose !== undefined) patch["expected_close"] = input.expectedClose;
  if (input.probability !== undefined) patch["probability"] = input.probability;
  if (input.acquisitionCostCents !== undefined) {
    patch["acquisition_cost_cents"] = input.acquisitionCostCents;
  }
  if (input.referralSource !== undefined) {
    patch["referral_source"] = input.referralSource?.trim() || null;
  }
  if (input.demoCompletedAt !== undefined) patch["demo_completed_at"] = input.demoCompletedAt;
  if (input.planCode !== undefined) patch["plan_code"] = input.planCode;
  if (input.organizationType !== undefined) {
    patch["organization_type"] = input.organizationType?.trim() || "property_manager";
  }
  if (input.implementationPreference !== undefined) {
    patch["implementation_preference"] = input.implementationPreference;
  }
  if (input.externalCrmOpportunityId !== undefined) {
    patch["external_crm_opportunity_id"] = input.externalCrmOpportunityId?.trim() || null;
  }
  if (input.notes !== undefined) patch["notes"] = input.notes?.trim() || null;

  const { data, error } = await admin
    .from("commercial_opportunities")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to update opportunity");
  return mapRow(data as Record<string, unknown>);
}

export async function transitionOpportunityStage(input: {
  opportunityId: string;
  toStage: CommercialPipelineStage;
  lostReason?: string | null | undefined;
  actorUserId?: string | null | undefined;
  /** Explicitly forbidden: callers must not pass createOrganization. */
  createOrganization?: never;
}): Promise<CommercialOpportunity> {
  if (input.createOrganization !== undefined) {
    throw new Error("Won does not create organizations (CA-03 / SP-04)");
  }

  const current = await getOpportunity(input.opportunityId);
  if (!current) throw new Error("Opportunity not found");

  assertValidStageTransition({
    from: current.stage,
    to: input.toStage,
    lostReason: input.lostReason ?? null
  });

  // Hard guard: stage transition never provisions.
  void stageTransitionCreatesOrganization(input.toStage);

  const admin = serviceClient();
  const probability = STAGE_DEFAULT_PROBABILITY[input.toStage];
  const { data, error } = await admin
    .from("commercial_opportunities")
    .update({
      stage: input.toStage,
      probability,
      lost_reason: input.toStage === "lost" ? input.lostReason?.trim() || null : current.lostReason,
      demo_completed_at:
        input.toStage === "demo" && !current.demoCompletedAt
          ? new Date().toISOString()
          : current.demoCompletedAt
    })
    .eq("id", input.opportunityId)
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to transition stage");
  const opportunity = mapRow(data as Record<string, unknown>);

  await emitCommercialOpsEvent({
    eventType: "commercial.opportunity.stage_changed",
    organizationId: opportunity.organizationId,
    subjectType: "commercial_opportunity",
    subjectId: opportunity.id,
    actorUserId: input.actorUserId,
    summary: `Stage ${current.stage} → ${opportunity.stage}`,
    payload: {
      opportunityId: opportunity.id,
      fromStage: current.stage,
      toStage: opportunity.stage,
      organizationId: opportunity.organizationId
    }
  });

  return opportunity;
}

export async function linkOpportunityOrganization(input: {
  opportunityId: string;
  organizationId: string;
  actorUserId?: string | null | undefined;
}): Promise<CommercialOpportunity> {
  const current = await getOpportunity(input.opportunityId);
  if (!current) throw new Error("Opportunity not found");
  if (current.organizationId && current.organizationId !== input.organizationId) {
    throw new Error("Opportunity already linked to a different organization");
  }
  if (current.organizationId === input.organizationId) {
    return current;
  }

  const admin = serviceClient();
  const nextStage: CommercialPipelineStage =
    current.stage === "customer_active" ? "customer_active" : "organization_created";

  const { data, error } = await admin
    .from("commercial_opportunities")
    .update({
      organization_id: input.organizationId,
      stage: nextStage,
      probability: STAGE_DEFAULT_PROBABILITY[nextStage]
    })
    .eq("id", input.opportunityId)
    .select("*")
    .single();

  if (error || !data) {
    if (String(error?.message ?? "").includes("commercial_opportunities_organization_id_key")) {
      throw new Error("Organization already linked to another opportunity");
    }
    throw new Error(error?.message ?? "Failed to link organization");
  }

  const opportunity = mapRow(data as Record<string, unknown>);
  await emitCommercialOpsEvent({
    eventType: "commercial.opportunity.stage_changed",
    organizationId: opportunity.organizationId,
    subjectType: "commercial_opportunity",
    subjectId: opportunity.id,
    actorUserId: input.actorUserId,
    summary: `Linked organization; stage → ${opportunity.stage}`,
    payload: {
      opportunityId: opportunity.id,
      organizationId: opportunity.organizationId,
      toStage: opportunity.stage
    }
  });
  return opportunity;
}

export async function findOpportunityForActivation(input: {
  opportunityId?: string | null | undefined;
  contactEmail?: string | null | undefined;
  companyName?: string | null | undefined;
}): Promise<CommercialOpportunity | null> {
  if (input.opportunityId) {
    return getOpportunity(input.opportunityId);
  }
  const admin = serviceClient();
  const email = input.contactEmail?.trim().toLowerCase();
  if (email) {
    const { data } = await admin
      .from("commercial_opportunities")
      .select("*")
      .eq("contact_email", email)
      .is("organization_id", null)
      .neq("stage", "lost")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) return mapRow(data as Record<string, unknown>);
  }
  return null;
}
