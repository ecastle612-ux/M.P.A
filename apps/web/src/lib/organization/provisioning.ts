/**
 * AUTH-001 Slice B — idempotent organization provisioning saga.
 * Consumes BILL-001 / Level-0 activation inputs.
 * Slice C: welcome credential delivery after ledger completion (secret-free events).
 *
 * Remediation (R1/R2):
 * - OPS correlation_id accepts opaque external ids (Stripe evt_…, idempotency keys).
 * - Ledger is marked completed before event emit; emit is best-effort / retryable.
 * - Retries reconcile ledger + activation refs before creating a new org.
 */
import { randomUUID } from "crypto";
import type { SaasPlanCode } from "../integrations/saas-billing/contracts";
import { provisionOrgAdminPrincipal } from "../auth/identity";
import { bindEntitlementSnapshot } from "../auth/entitlements";
import { commercialStatusForPlan } from "../auth/capability-matrix";
import { createServiceRoleServerClient } from "../auth/server";
import { emitOpsDomainEvent } from "../ops/emit";
import { deliverOrgAdminWelcome } from "../auth/credentials/delivery";
import { createOrganizationSlugFromName } from "./contracts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

export type OrganizationProvisionActivation = {
  /** Stable key — BILL-001 webhook event id, subscription id, or Level-0 key. */
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
  billingCustomerId?: string | null;
  /** External workflow id (UUID, Stripe evt_…, or idempotency key). Stored on OPS correlation_id. */
  correlationId?: string | null;
};

export type OrganizationProvisionResult = {
  organizationId: string;
  orgAdminUserId: string;
  orgAdminUsername: string;
  planCode: SaasPlanCode;
  commercialStatus: "trial" | "pending_setup";
  idempotentReplay: boolean;
};

type LedgerRow = {
  status: string;
  organization_id: string | null;
  org_admin_user_id: string | null;
  plan_code: string | null;
  commercial_status: string | null;
};

function serviceClient(): AnyClient {
  const client = createServiceRoleServerClient();
  if (!client) throw new Error("Organization provisioning requires SUPABASE_SERVICE_ROLE_KEY");
  return client;
}

function resolveCorrelationId(activation: OrganizationProvisionActivation, key: string): string {
  const candidate = activation.correlationId?.trim() || key;
  return candidate.length > 0 ? candidate : randomUUID();
}

async function uniqueSlug(admin: AnyClient, name: string): Promise<string> {
  const base = createOrganizationSlugFromName(name).slice(0, 60) || "organization";
  for (let i = 0; i < 50; i += 1) {
    const slug = i === 0 ? base : `${base}-${i + 1}`;
    const { data } = await admin.from("organizations").select("id").eq("slug", slug).maybeSingle();
    if (!data) return slug;
  }
  return `${base}-${randomUUID().slice(0, 8)}`;
}

async function usernameForAdmin(admin: AnyClient, orgAdminUserId: string): Promise<string> {
  const { data: principal } = await admin
    .from("identity_principals")
    .select("username")
    .eq("auth_provider_subject", orgAdminUserId)
    .maybeSingle();
  return String(principal?.username ?? "");
}

async function markLedgerCompleted(
  admin: AnyClient,
  input: {
    key: string;
    organizationId: string;
    orgAdminUserId: string;
    planCode: SaasPlanCode;
    commercialStatus: "trial" | "pending_setup";
    activationRef: Record<string, unknown>;
  }
): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await admin.from("organization_provision_requests").upsert(
    {
      idempotency_key: input.key,
      status: "completed",
      organization_id: input.organizationId,
      org_admin_user_id: input.orgAdminUserId,
      plan_code: input.planCode,
      commercial_status: input.commercialStatus,
      failure_reason: null,
      activation_ref: input.activationRef,
      completed_at: now,
      updated_at: now
    },
    { onConflict: "idempotency_key" }
  );
  if (error) throw new Error(error.message);
}

/**
 * Emit provision event if missing for this idempotency key.
 * Best-effort: never throws after ledger completion (R2).
 */
async function ensureWelcomeDelivered(input: {
  organizationId: string;
  orgAdminUserId: string;
  contactEmail: string;
  organizationName: string;
}): Promise<void> {
  try {
    await deliverOrgAdminWelcome({
      organizationId: input.organizationId,
      orgAdminUserId: input.orgAdminUserId,
      contactEmail: input.contactEmail,
      organizationName: input.organizationName
    });
  } catch {
    // Welcome delivery is best-effort after ledger completion; retry on next provision call.
  }
}

async function ensureProvisionEventEmitted(
  admin: AnyClient,
  input: {
    organizationId: string;
    key: string;
    correlationId: string;
    planCode: SaasPlanCode;
    commercialStatus: "trial" | "pending_setup";
    orgAdminUsername: string;
    organizationType: string;
  }
): Promise<void> {
  try {
    const { data: existing } = await admin
      .from("event_domain_events")
      .select("event_id")
      .eq("organization_id", input.organizationId)
      .eq("event_type", "auth.organization.provisioned")
      .filter("payload->>idempotencyKey", "eq", input.key)
      .limit(1)
      .maybeSingle();

    if (existing?.event_id) return;

    await emitOpsDomainEvent(
      admin,
      {
        eventType: "auth.organization.provisioned",
        organizationId: input.organizationId,
        subject: { type: "organization", id: input.organizationId },
        actor: { actor_type: "system", label: "AUTH-001 provision" },
        correlationId: input.correlationId,
        summary: "Organization provisioned",
        payload: {
          planCode: input.planCode,
          commercialStatus: input.commercialStatus,
          orgAdminUsername: input.orgAdminUsername,
          organizationType: input.organizationType,
          idempotencyKey: input.key,
          externalCorrelationId: input.correlationId
        },
        visibility: "staff_only",
        sensitivity: "normal"
      },
      { dispatchNow: true }
    );
  } catch {
    // Ledger remains completed; next retry re-attempts emit only.
  }
}

async function resultFromIds(
  admin: AnyClient,
  input: {
    organizationId: string;
    orgAdminUserId: string;
    planCode: SaasPlanCode;
    commercialStatus: "trial" | "pending_setup";
    idempotentReplay: boolean;
  }
): Promise<OrganizationProvisionResult> {
  return {
    organizationId: input.organizationId,
    orgAdminUserId: input.orgAdminUserId,
    orgAdminUsername: await usernameForAdmin(admin, input.orgAdminUserId),
    planCode: input.planCode,
    commercialStatus: input.commercialStatus,
    idempotentReplay: input.idempotentReplay
  };
}

/** Reconcile org already bound via BILL-001 customer / subscription stubs. */
async function reconcileFromActivationRefs(
  admin: AnyClient,
  activation: OrganizationProvisionActivation
): Promise<{ organizationId: string; orgAdminUserId: string } | null> {
  if (activation.externalCustomerId && activation.provider) {
    const { data: customer } = await admin
      .from("saas_customers")
      .select("organization_id")
      .eq("provider", activation.provider)
      .eq("external_customer_id", activation.externalCustomerId)
      .maybeSingle();

    if (customer?.organization_id) {
      const organizationId = String(customer.organization_id);
      const { data: owner } = await admin
        .from("organization_memberships")
        .select("user_id")
        .eq("organization_id", organizationId)
        .eq("is_owner", true)
        .maybeSingle();
      if (owner?.user_id) {
        return { organizationId, orgAdminUserId: String(owner.user_id) };
      }
    }
  }

  if (activation.externalSubscriptionId && activation.provider) {
    const { data: sub } = await admin
      .from("saas_subscriptions")
      .select("organization_id")
      .eq("provider", activation.provider)
      .eq("external_subscription_id", activation.externalSubscriptionId)
      .maybeSingle();

    if (sub?.organization_id) {
      const organizationId = String(sub.organization_id);
      const { data: owner } = await admin
        .from("organization_memberships")
        .select("user_id")
        .eq("organization_id", organizationId)
        .eq("is_owner", true)
        .maybeSingle();
      if (owner?.user_id) {
        return { organizationId, orgAdminUserId: String(owner.user_id) };
      }
    }
  }

  return null;
}

/**
 * Provision org + plan bind + Org Admin principal + ownership membership.
 * Idempotent on activation.idempotencyKey.
 */
export async function provisionOrganizationFromActivation(
  activation: OrganizationProvisionActivation
): Promise<OrganizationProvisionResult> {
  const admin = serviceClient();
  const key = activation.idempotencyKey.trim();
  if (!key) throw new Error("idempotencyKey is required");

  const companyName = activation.buyerCompanyName.trim();
  const contactEmail = activation.buyerContactEmail.trim().toLowerCase();
  if (companyName.length < 2) throw new Error("buyerCompanyName is required");
  if (!contactEmail.includes("@")) throw new Error("buyerContactEmail is required");

  const commercialStatus = commercialStatusForPlan(activation.planCode);
  const correlationId = resolveCorrelationId(activation, key);
  const activationRef = {
    saasSubscriptionId: activation.saasSubscriptionId ?? null,
    externalCustomerId: activation.externalCustomerId ?? null,
    externalSubscriptionId: activation.externalSubscriptionId ?? null,
    provider: activation.provider ?? null,
    billingCustomerId: activation.billingCustomerId ?? null,
    planCode: activation.planCode,
    organizationType: activation.organizationType ?? "property_manager",
    correlationId
  };
  const organizationType = String(activationRef.organizationType);

  const { data: existing } = await admin
    .from("organization_provision_requests")
    .select("status, organization_id, org_admin_user_id, plan_code, commercial_status")
    .eq("idempotency_key", key)
    .maybeSingle();

  const ledger = existing as LedgerRow | null;

  // Resume any ledger row that already captured org + admin (completed or failed-after-create).
  if (ledger?.organization_id && ledger?.org_admin_user_id) {
    const organizationId = String(ledger.organization_id);
    const orgAdminUserId = String(ledger.org_admin_user_id);
    const planCode = (ledger.plan_code as SaasPlanCode) || activation.planCode;
    const status =
      (ledger.commercial_status as "trial" | "pending_setup") || commercialStatus;

    await markLedgerCompleted(admin, {
      key,
      organizationId,
      orgAdminUserId,
      planCode,
      commercialStatus: status,
      activationRef
    });

    const orgAdminUsername = await usernameForAdmin(admin, orgAdminUserId);
    await ensureProvisionEventEmitted(admin, {
      organizationId,
      key,
      correlationId,
      planCode,
      commercialStatus: status,
      orgAdminUsername,
      organizationType
    });

    await ensureWelcomeDelivered({
      organizationId,
      orgAdminUserId,
      contactEmail,
      organizationName: companyName
    });

    return resultFromIds(admin, {
      organizationId,
      orgAdminUserId,
      planCode,
      commercialStatus: status,
      idempotentReplay: true
    });
  }

  // Reconcile BILL-001 stubs before creating a second org.
  const reconciled = await reconcileFromActivationRefs(admin, activation);
  if (reconciled) {
    await markLedgerCompleted(admin, {
      key,
      organizationId: reconciled.organizationId,
      orgAdminUserId: reconciled.orgAdminUserId,
      planCode: activation.planCode,
      commercialStatus,
      activationRef
    });

    const orgAdminUsername = await usernameForAdmin(admin, reconciled.orgAdminUserId);
    await ensureProvisionEventEmitted(admin, {
      organizationId: reconciled.organizationId,
      key,
      correlationId,
      planCode: activation.planCode,
      commercialStatus,
      orgAdminUsername,
      organizationType
    });

    await ensureWelcomeDelivered({
      organizationId: reconciled.organizationId,
      orgAdminUserId: reconciled.orgAdminUserId,
      contactEmail,
      organizationName: companyName
    });

    return resultFromIds(admin, {
      organizationId: reconciled.organizationId,
      orgAdminUserId: reconciled.orgAdminUserId,
      planCode: activation.planCode,
      commercialStatus,
      idempotentReplay: true
    });
  }

  let organizationId: string | null = null;
  let orgAdminUserId: string | null = null;
  let orgAdminUsername = "";
  let ledgerCompleted = false;

  try {
    const orgAdmin = await provisionOrgAdminPrincipal({
      contactEmail,
      displayName: activation.buyerLegalName?.trim() || companyName,
      usernameSeed: companyName
    });
    orgAdminUserId = orgAdmin.authUserId;
    orgAdminUsername = orgAdmin.principal.username;

    const slug = await uniqueSlug(admin, companyName);
    const { data: org, error: orgError } = await admin
      .from("organizations")
      .insert({
        name: companyName,
        slug,
        created_by: orgAdmin.authUserId,
        commercial_status: commercialStatus,
        organization_type: activation.organizationType?.trim() || "property_manager"
      })
      .select("id")
      .single();

    if (orgError || !org) {
      throw new Error(orgError?.message ?? "Failed to create organization");
    }

    organizationId = String(org["id"]);

    const { error: membershipError } = await admin.from("organization_memberships").insert({
      organization_id: organizationId,
      user_id: orgAdmin.authUserId,
      roles: ["organization_admin"],
      status: "active",
      is_owner: true
    });

    if (membershipError) {
      throw new Error(membershipError.message);
    }

    // Bind SaaS customer stub when external customer known (preserves BILL-001 mirror path).
    let sourceSubscriptionId: string | null = activation.saasSubscriptionId ?? null;
    if (activation.externalCustomerId && activation.provider) {
      const { data: customer, error: customerError } = await admin
        .from("saas_customers")
        .upsert(
          {
            organization_id: organizationId,
            provider: activation.provider,
            external_customer_id: activation.externalCustomerId,
            email: contactEmail,
            metadata: { mpa_rail: "saas", provisioned_by: "auth001_slice_b" }
          },
          { onConflict: "provider,external_customer_id" }
        )
        .select("id")
        .maybeSingle();

      if (!customerError && customer && activation.externalSubscriptionId) {
        const { data: sub } = await admin
          .from("saas_subscriptions")
          .upsert(
            {
              organization_id: organizationId,
              saas_customer_id: customer["id"],
              provider: activation.provider,
              external_subscription_id: activation.externalSubscriptionId,
              plan_code: activation.planCode,
              status: activation.planCode === "trial" ? "trialing" : "active",
              metadata: { mpa_rail: "saas", provisioned_by: "auth001_slice_b" },
              updated_at: new Date().toISOString()
            },
            { onConflict: "provider,external_subscription_id" }
          )
          .select("id")
          .maybeSingle();
        if (sub) sourceSubscriptionId = String(sub["id"]);
      }
    }

    await bindEntitlementSnapshot({
      organizationId,
      planCode: activation.planCode,
      sourceSubscriptionId,
      client: admin
    });

    // R2: complete ledger BEFORE emit so retries never re-create org/admin.
    await markLedgerCompleted(admin, {
      key,
      organizationId,
      orgAdminUserId,
      planCode: activation.planCode,
      commercialStatus,
      activationRef
    });
    ledgerCompleted = true;

    await ensureProvisionEventEmitted(admin, {
      organizationId,
      key,
      correlationId,
      planCode: activation.planCode,
      commercialStatus,
      orgAdminUsername,
      organizationType
    });

    // AUTH-001 Slice C — welcome credential delivery (idempotent; secret-free events).
    await ensureWelcomeDelivered({
      organizationId,
      orgAdminUserId,
      contactEmail,
      organizationName: companyName
    });

    return {
      organizationId,
      orgAdminUserId,
      orgAdminUsername,
      planCode: activation.planCode,
      commercialStatus,
      idempotentReplay: false
    };
  } catch (err) {
    // Never downgrade a completed ledger after org/admin succeeded (R2).
    if (ledgerCompleted && organizationId && orgAdminUserId) {
      throw err;
    }

    const message = err instanceof Error ? err.message : "Provisioning failed";
    const safeReason = message.slice(0, 500).replace(/password[=:].*/gi, "[redacted]");

    await admin.from("organization_provision_requests").upsert(
      {
        idempotency_key: key,
        status: "failed",
        // Preserve partial success so retry can resume instead of duplicating.
        organization_id: organizationId,
        org_admin_user_id: orgAdminUserId,
        plan_code: activation.planCode,
        commercial_status: commercialStatus,
        failure_reason: safeReason,
        activation_ref: activationRef,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      { onConflict: "idempotency_key" }
    );

    throw err;
  }
}
