/**
 * ACQ-001 Slice B — public self-serve Checkout (pre-organization).
 * Reuses BILL-001 provider + COM activation; does not create org until payment success.
 */
import { createServiceRoleServerClient } from "../auth/server";
import {
  isPublicSelfServePlan,
  isSalesAssistedPlan,
  type AcqSelfServePlan
} from "../acquire/decisions";
import {
  createOpportunity,
  findOpportunityForActivation,
  updateOpportunity
} from "../commercial/opportunities";
import { activateOpportunityFromPayment } from "../commercial/activation";
import type { SaasBillingInterval, SaasPlanCode } from "../integrations/saas-billing/contracts";
import { resolvePriceId } from "../integrations/saas-billing/plan-catalog";
import {
  getSaasBillingProvider,
  resolveDefaultSaasBillingProviderId
} from "../integrations/saas-billing/registry";
import { isOpenSubscriptionStatus } from "./contracts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

function serviceClient(client?: AnyClient): AnyClient {
  if (client) return client;
  const created = createServiceRoleServerClient();
  if (!created) throw new Error("Public Checkout requires SUPABASE_SERVICE_ROLE_KEY");
  return created;
}

export class PublicCheckoutError extends Error {
  constructor(
    public readonly code:
      | "INVALID_PLAN"
      | "INVALID_INTERVAL"
      | "INVALID_INPUT"
      | "SUBSCRIPTION_EXISTS"
      | "PRICE_NOT_CONFIGURED"
      | "CHECKOUT_FAILED",
    message: string,
    public readonly httpStatus: 400 | 402 | 403 | 409 = 400
  ) {
    super(message);
    this.name = "PublicCheckoutError";
  }
}

export type PublicCheckoutInput = {
  planCode: string;
  billingInterval: SaasBillingInterval;
  companyName: string;
  workEmail: string;
  successUrl: string;
  cancelUrl: string;
};

export type PublicCheckoutResult = {
  sessionId: string;
  url: string;
  opportunityId: string;
  planCode: AcqSelfServePlan;
  billingInterval: SaasBillingInterval;
  sandbox: boolean;
};

function appIsSandbox(): boolean {
  const mode = process.env["STRIPE_MODE"]?.trim();
  return (
    mode === "sandbox" ||
    mode === "test" ||
    !process.env["STRIPE_SECRET_KEY"]?.trim() ||
    resolveDefaultSaasBillingProviderId() === "noop"
  );
}

export async function findOpenSubscriptionForEmail(
  email: string,
  client?: AnyClient
): Promise<{ organizationId: string; status: string } | null> {
  const db = serviceClient(client);
  const normalized = email.trim().toLowerCase();
  const { data: customers } = await db
    .from("saas_customers")
    .select("id, organization_id, email")
    .ilike("email", normalized)
    .limit(20);
  if (!customers?.length) return null;

  for (const customer of customers as Array<{ id: string; organization_id: string }>) {
    const { data: subs } = await db
      .from("saas_subscriptions")
      .select("status, organization_id")
      .eq("saas_customer_id", customer.id)
      .order("updated_at", { ascending: false })
      .limit(5);
    const open = (subs ?? []).find((row: { status?: string }) =>
      isOpenSubscriptionStatus(String(row["status"] ?? ""))
    );
    if (open) {
      return {
        organizationId: String(open["organization_id"] ?? customer.organization_id),
        status: String(open["status"])
      };
    }
  }
  return null;
}

async function ensureSelfServeOpportunity(input: {
  companyName: string;
  workEmail: string;
  planCode: AcqSelfServePlan;
}): Promise<{ id: string }> {
  const existing = await findOpportunityForActivation({
    contactEmail: input.workEmail,
    companyName: input.companyName
  });
  if (existing) {
    await updateOpportunity(existing.id, {
      companyName: input.companyName,
      contactEmail: input.workEmail,
      planCode: input.planCode === "trial" ? "professional" : input.planCode,
      source: "public_self_serve",
      notes: existing.notes
        ? `${existing.notes}\n[ACQ] Resume self-serve ${input.planCode}`
        : `[ACQ] Self-serve checkout ${input.planCode}`
    });
    return { id: existing.id };
  }
  const created = await createOpportunity({
    companyName: input.companyName,
    contactEmail: input.workEmail,
    source: "public_self_serve",
    planCode: input.planCode === "trial" ? "professional" : input.planCode,
    organizationType: "property_manager",
    implementationPreference: "ai_guided",
    stage: "proposal",
    notes: `[ACQ] Public self-serve checkout intent (${input.planCode})`
  });
  return { id: created.id };
}

export async function createPublicSaasCheckoutSession(
  input: PublicCheckoutInput
): Promise<PublicCheckoutResult> {
  const planRaw = input.planCode.trim().toLowerCase();
  if (isSalesAssistedPlan(planRaw) || planRaw === "founder") {
    throw new PublicCheckoutError(
      "INVALID_PLAN",
      planRaw === "founder"
        ? "Founder pricing is invite-only and cannot be purchased publicly."
        : "Enterprise plans require Contact Sales — public Checkout is not available.",
      403
    );
  }
  if (!isPublicSelfServePlan(planRaw)) {
    throw new PublicCheckoutError("INVALID_PLAN", "Plan is not available for public Checkout.", 403);
  }
  const planCode = planRaw as AcqSelfServePlan;
  if (input.billingInterval !== "month" && input.billingInterval !== "year") {
    throw new PublicCheckoutError("INVALID_INTERVAL", "billingInterval must be month or year.");
  }

  const companyName = input.companyName.trim();
  const workEmail = input.workEmail.trim().toLowerCase();
  if (!companyName || !workEmail.includes("@")) {
    throw new PublicCheckoutError(
      "INVALID_INPUT",
      "Company name and a valid work email are required."
    );
  }

  const existingSub = await findOpenSubscriptionForEmail(workEmail);
  if (existingSub) {
    throw new PublicCheckoutError(
      "SUBSCRIPTION_EXISTS",
      "An open M.P.A. subscription already exists for this email. Sign in and manage billing from Settings.",
      409
    );
  }

  const withTrial = planCode === "trial";
  const pricedPlan: SaasPlanCode = withTrial ? "trial" : planCode;
  const priceRef = resolvePriceId(pricedPlan, input.billingInterval);
  if (!priceRef) {
    throw new PublicCheckoutError(
      "PRICE_NOT_CONFIGURED",
      `No Stripe price configured for ${planCode}/${input.billingInterval}.`,
      400
    );
  }

  const opportunity = await ensureSelfServeOpportunity({
    companyName,
    workEmail,
    planCode
  });

  const provider = getSaasBillingProvider();
  const checkoutPlan: SaasPlanCode = withTrial ? "professional" : planCode;

  try {
    const session = await provider.createCheckoutSession({
      customerEmail: workEmail,
      priceId: priceRef.priceId,
      planCode: checkoutPlan,
      billingInterval: input.billingInterval,
      successUrl: input.successUrl,
      cancelUrl: input.cancelUrl,
      trialPeriodDays: withTrial ? priceRef.trialPeriodDays ?? 14 : null,
      metadata: {
        buyer_company_name: companyName,
        buyer_contact_email: workEmail,
        plan_code: withTrial ? "trial" : checkoutPlan,
        billing_interval: input.billingInterval,
        opportunity_id: opportunity.id,
        organization_type: "property_manager",
        implementation_preference: "ai_guided",
        mpa_acq: "public",
        with_trial: withTrial ? "true" : "false"
      }
    });

    return {
      sessionId: session.sessionId,
      url: session.url,
      opportunityId: opportunity.id,
      planCode,
      billingInterval: input.billingInterval,
      sandbox: appIsSandbox()
    };
  } catch (err) {
    if (err instanceof PublicCheckoutError) throw err;
    throw new PublicCheckoutError(
      "CHECKOUT_FAILED",
      err instanceof Error ? err.message : "Unable to start Checkout"
    );
  }
}

export type AcquireProvisionStatus = {
  status: "pending" | "ready" | "not_found";
  organizationId?: string;
  message: string;
};

export async function getAcquireProvisionStatus(input: {
  workEmail: string;
  companyName?: string | null;
}): Promise<AcquireProvisionStatus> {
  const email = input.workEmail.trim().toLowerCase();
  if (!email.includes("@")) {
    return { status: "not_found", message: "Valid work email is required." };
  }

  const opportunity = await findOpportunityForActivation({
    contactEmail: email,
    companyName: input.companyName
  });

  if (opportunity?.organizationId) {
    return {
      status: "ready",
      organizationId: opportunity.organizationId,
      message: "Your workspace is ready. Check your email for login credentials, then sign in."
    };
  }

  const db = serviceClient();
  const { data: linked } = await db
    .from("commercial_opportunities")
    .select("organization_id, contact_email, stage")
    .eq("contact_email", email)
    .not("organization_id", "is", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (linked?.organization_id) {
    return {
      status: "ready",
      organizationId: String(linked.organization_id),
      message: "Your workspace is ready. Check your email for login credentials, then sign in."
    };
  }

  return {
    status: "pending",
    message:
      "Payment received — we are preparing your workspace. This usually takes under a minute. Refresh if needed."
  };
}

/**
 * Sandbox / noop only — simulates webhook activation so local ACQ can be certified without Stripe.
 */
export async function simulatePublicCheckoutProvision(input: {
  sessionId: string;
  companyName: string;
  workEmail: string;
  planCode: AcqSelfServePlan;
}): Promise<{ organizationId: string }> {
  if (!appIsSandbox()) {
    throw new PublicCheckoutError(
      "CHECKOUT_FAILED",
      "Sandbox provision simulation is disabled outside sandbox/noop mode.",
      403
    );
  }
  if (
    !input.sessionId.startsWith("cs_saas_sandbox_") &&
    !input.sessionId.startsWith("noop_cs_")
  ) {
    throw new PublicCheckoutError(
      "INVALID_INPUT",
      "Only sandbox/noop Checkout sessions can be simulated."
    );
  }

  const planCode: SaasPlanCode =
    input.planCode === "trial" ? "trial" : (input.planCode as SaasPlanCode);
  const activated = await activateOpportunityFromPayment({
    idempotencyKey: `saas:sandbox:checkout:${input.sessionId}`,
    planCode,
    buyerCompanyName: input.companyName,
    buyerContactEmail: input.workEmail,
    organizationType: "property_manager",
    saasSubscriptionId: `sub_sandbox_${input.sessionId}`,
    externalCustomerId: `cus_sandbox_${input.sessionId.slice(-8)}`,
    externalSubscriptionId: `sub_sandbox_${input.sessionId}`,
    provider: resolveDefaultSaasBillingProviderId(),
    correlationId: input.sessionId,
    implementationPreference: "ai_guided"
  });

  return { organizationId: activated.organizationId };
}
