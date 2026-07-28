/**
 * COM-001 Slice A — activation handoff → AUTH-001 provision (idempotent).
 * Won does not create organizations; only this path (Payment Successful / MA exception) does.
 */
import type { SaasPlanCode } from "../integrations/saas-billing/contracts";
import {
  provisionOrganizationFromActivation,
  type OrganizationProvisionResult
} from "../organization/provisioning";
import { createServiceRoleServerClient } from "../auth/server";
import { emitCommercialOpsEvent } from "./ops-events";
import {
  findOpportunityForActivation,
  linkOpportunityOrganization,
  transitionOpportunityStage,
  createOpportunity,
  getOpportunity
} from "./opportunities";
import type {
  CommercialActivationPacket,
  CommercialOpportunity,
  ImplementationPreference
} from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

function serviceClient(): AnyClient {
  const client = createServiceRoleServerClient();
  if (!client) throw new Error("Commercial activation requires SUPABASE_SERVICE_ROLE_KEY");
  return client;
}

export type CommercialActivationResult = {
  opportunity: CommercialOpportunity;
  organizationId: string;
  orgAdminUsername: string;
  planCode: SaasPlanCode;
  commercialStatus: "trial" | "pending_setup";
  idempotentReplay: boolean;
  activationRequestId: string;
  packet: CommercialActivationPacket;
};

function defaultImplementationPreference(
  value: ImplementationPreference | null | undefined
): ImplementationPreference {
  return value === "professional" ? "professional" : "ai_guided";
}

export function buildActivationPacket(input: {
  opportunity: CommercialOpportunity;
  saasSubscriptionId?: string | null | undefined;
  planCode: SaasPlanCode;
  idempotencyKey: string;
  implementationPreference?: ImplementationPreference | null | undefined;
}): CommercialActivationPacket {
  return {
    saasSubscriptionId: input.saasSubscriptionId ?? null,
    planCode: input.planCode,
    organizationType: input.opportunity.organizationType?.trim() || "property_manager",
    buyerContactEmail: input.opportunity.contactEmail,
    buyerCompanyName: input.opportunity.companyName,
    implementationPreference: defaultImplementationPreference(
      input.implementationPreference ?? input.opportunity.implementationPreference
    ),
    salesOwnerId: input.opportunity.salesOwnerId,
    idempotencyKey: input.idempotencyKey,
    opportunityId: input.opportunity.id,
    buyerLegalName: input.opportunity.contactName
  };
}

/** Secret-free packet snapshot for COM ledger (never passwords / payment secrets). */
function packetSnapshot(packet: CommercialActivationPacket): Record<string, unknown> {
  return {
    saas_subscription_id: packet.saasSubscriptionId,
    plan_code: packet.planCode,
    organization_type: packet.organizationType,
    buyer_contact_email: packet.buyerContactEmail,
    buyer_company_name: packet.buyerCompanyName,
    implementation_preference: packet.implementationPreference,
    sales_owner_id: packet.salesOwnerId,
    idempotency_key: packet.idempotencyKey,
    opportunity_id: packet.opportunityId,
    buyer_legal_name: packet.buyerLegalName
  };
}

async function loadCompletedActivation(
  idempotencyKey: string
): Promise<CommercialActivationResult | null> {
  const admin = serviceClient();
  const { data } = await admin
    .from("commercial_activation_requests")
    .select("*")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();
  if (!data || data.status !== "completed" || !data.organization_id) return null;

  const opportunity = await getOpportunity(String(data.opportunity_id));
  if (!opportunity) return null;

  const packet = data.packet as Record<string, unknown>;
  return {
    opportunity,
    organizationId: String(data.organization_id),
    orgAdminUsername: "",
    planCode: (packet["plan_code"] as SaasPlanCode) || opportunity.planCode || "professional",
    commercialStatus: "pending_setup",
    idempotentReplay: true,
    activationRequestId: String(data.id),
    packet: {
      saasSubscriptionId:
        packet["saas_subscription_id"] != null ? String(packet["saas_subscription_id"]) : null,
      planCode: (packet["plan_code"] as SaasPlanCode) || "professional",
      organizationType: String(packet["organization_type"] ?? "property_manager"),
      buyerContactEmail: String(packet["buyer_contact_email"] ?? opportunity.contactEmail),
      buyerCompanyName: String(packet["buyer_company_name"] ?? opportunity.companyName),
      implementationPreference: defaultImplementationPreference(
        packet["implementation_preference"] as ImplementationPreference | null
      ),
      salesOwnerId:
        packet["sales_owner_id"] != null ? String(packet["sales_owner_id"]) : opportunity.salesOwnerId,
      idempotencyKey,
      opportunityId: opportunity.id,
      buyerLegalName:
        packet["buyer_legal_name"] != null ? String(packet["buyer_legal_name"]) : opportunity.contactName
    }
  };
}

/**
 * Run activation handoff: COM ledger → AUTH-001 provision → org↔opportunity link.
 * Idempotent on `idempotencyKey` (COM) and AUTH ledger key derived from it.
 */
export async function activateOpportunityFromPayment(input: {
  idempotencyKey: string;
  planCode: SaasPlanCode;
  buyerCompanyName: string;
  buyerContactEmail: string;
  buyerLegalName?: string | null;
  organizationType?: string | null;
  saasSubscriptionId?: string | null;
  externalCustomerId?: string | null;
  externalSubscriptionId?: string | null;
  provider?: string | null;
  correlationId?: string | null;
  opportunityId?: string | null;
  salesOwnerId?: string | null;
  implementationPreference?: ImplementationPreference | null;
  actorUserId?: string | null;
  /** Level-0 / Master Admin commercial exception (still emits activation trail). */
  masterAdminException?: boolean;
}): Promise<CommercialActivationResult> {
  const key = input.idempotencyKey.trim();
  if (!key) throw new Error("idempotencyKey is required");

  const existing = await loadCompletedActivation(key);
  if (existing) return existing;

  let opportunity = await findOpportunityForActivation({
    opportunityId: input.opportunityId,
    contactEmail: input.buyerContactEmail,
    companyName: input.buyerCompanyName
  });

  if (!opportunity) {
    opportunity = await createOpportunity({
      companyName: input.buyerCompanyName,
      contactEmail: input.buyerContactEmail,
      contactName: input.buyerLegalName ?? null,
      source: input.masterAdminException ? "master_admin_exception" : "checkout",
      salesOwnerId: input.salesOwnerId ?? input.actorUserId ?? null,
      planCode: input.planCode,
      organizationType: input.organizationType ?? "property_manager",
      implementationPreference: defaultImplementationPreference(input.implementationPreference),
      stage: "won",
      actorUserId: input.actorUserId
    });
  }

  if (opportunity.organizationId) {
    // Already linked — treat as idempotent success for same org path.
    return {
      opportunity,
      organizationId: opportunity.organizationId,
      orgAdminUsername: "",
      planCode: input.planCode,
      commercialStatus: "pending_setup",
      idempotentReplay: true,
      activationRequestId: "",
      packet: buildActivationPacket({
        opportunity,
        saasSubscriptionId: input.saasSubscriptionId,
        planCode: input.planCode,
        idempotencyKey: key,
        implementationPreference: input.implementationPreference
      })
    };
  }

  // Advance commercial stages toward Subscription Purchased (never creates org).
  if (
    opportunity.stage !== "subscription_purchased" &&
    opportunity.stage !== "organization_created" &&
    opportunity.stage !== "customer_active" &&
    opportunity.stage !== "lost"
  ) {
    if (opportunity.stage !== "won") {
      opportunity = await transitionOpportunityStage({
        opportunityId: opportunity.id,
        toStage: "won",
        actorUserId: input.actorUserId
      });
    }
    opportunity = await transitionOpportunityStage({
      opportunityId: opportunity.id,
      toStage: "subscription_purchased",
      actorUserId: input.actorUserId
    });
  }

  const packet = buildActivationPacket({
    opportunity,
    saasSubscriptionId: input.saasSubscriptionId ?? input.externalSubscriptionId ?? null,
    planCode: input.planCode,
    idempotencyKey: key,
    implementationPreference: input.implementationPreference
  });

  const authIdempotencyKey = `com:${key}`;
  const admin = serviceClient();

  const { data: ledgerRow, error: ledgerError } = await admin
    .from("commercial_activation_requests")
    .upsert(
      {
        idempotency_key: key,
        opportunity_id: opportunity.id,
        status: "pending",
        auth_idempotency_key: authIdempotencyKey,
        packet: packetSnapshot(packet),
        created_by: input.actorUserId ?? null,
        failure_reason: null
      },
      { onConflict: "idempotency_key" }
    )
    .select("*")
    .single();

  if (ledgerError || !ledgerRow) {
    const raced = await loadCompletedActivation(key);
    if (raced) return raced;
    throw new Error(ledgerError?.message ?? "Failed to record activation request");
  }

  if (ledgerRow.status === "completed" && ledgerRow.organization_id) {
    const raced = await loadCompletedActivation(key);
    if (raced) return raced;
  }

  await emitCommercialOpsEvent({
    eventType: "commercial.activation.requested",
    organizationId: null,
    subjectType: "commercial_activation_request",
    subjectId: String(ledgerRow.id),
    actorUserId: input.actorUserId,
    summary: input.masterAdminException
      ? "Master Admin commercial activation requested"
      : "Commercial activation requested",
    correlationId: input.correlationId ?? undefined,
    payload: {
      opportunityId: opportunity.id,
      planCode: packet.planCode,
      masterAdminException: Boolean(input.masterAdminException),
      implementationPreference: packet.implementationPreference
    }
  });

  let provisioned: OrganizationProvisionResult;
  try {
    provisioned = await provisionOrganizationFromActivation({
      idempotencyKey: authIdempotencyKey,
      planCode: packet.planCode,
      buyerCompanyName: packet.buyerCompanyName,
      buyerContactEmail: packet.buyerContactEmail,
      buyerLegalName: packet.buyerLegalName,
      organizationType: packet.organizationType,
      saasSubscriptionId: packet.saasSubscriptionId,
      externalCustomerId: input.externalCustomerId ?? null,
      externalSubscriptionId: input.externalSubscriptionId ?? null,
      provider: input.provider ?? null,
      correlationId: input.correlationId ?? key
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AUTH provision failed";
    await admin
      .from("commercial_activation_requests")
      .update({
        status: "failed",
        failure_reason: message,
        completed_at: new Date().toISOString()
      })
      .eq("id", ledgerRow.id);

    await emitCommercialOpsEvent({
      eventType: "commercial.activation.failed",
      organizationId: null,
      subjectType: "commercial_activation_request",
      subjectId: String(ledgerRow.id),
      actorUserId: input.actorUserId,
      summary: "Commercial activation failed",
      correlationId: input.correlationId ?? undefined,
      payload: {
        opportunityId: opportunity.id,
        reasonCode: "auth_provision_failed"
      }
    });
    throw err;
  }

  opportunity = await linkOpportunityOrganization({
    opportunityId: opportunity.id,
    organizationId: provisioned.organizationId,
    actorUserId: input.actorUserId
  });

  await admin
    .from("commercial_activation_requests")
    .update({
      status: "completed",
      organization_id: provisioned.organizationId,
      failure_reason: null,
      completed_at: new Date().toISOString(),
      packet: {
        ...packetSnapshot(packet),
        organization_id: provisioned.organizationId,
        org_admin_user_id: provisioned.orgAdminUserId
      }
    })
    .eq("id", ledgerRow.id);

  await emitCommercialOpsEvent({
    eventType: "commercial.activation.completed",
    organizationId: provisioned.organizationId,
    subjectType: "commercial_activation_request",
    subjectId: String(ledgerRow.id),
    actorUserId: input.actorUserId,
    summary: "Commercial activation completed",
    correlationId: input.correlationId ?? undefined,
    payload: {
      opportunityId: opportunity.id,
      organizationId: provisioned.organizationId,
      planCode: provisioned.planCode,
      idempotentReplay: provisioned.idempotentReplay,
      masterAdminException: Boolean(input.masterAdminException)
    }
  });

  return {
    opportunity,
    organizationId: provisioned.organizationId,
    orgAdminUsername: provisioned.orgAdminUsername,
    planCode: provisioned.planCode,
    commercialStatus: provisioned.commercialStatus,
    idempotentReplay: provisioned.idempotentReplay,
    activationRequestId: String(ledgerRow.id),
    packet
  };
}
