import {
  COM_002_FLAGS,
  defaultOrganizationName,
  isProvisioningCheckpoint,
  markProvisioningRetry,
  nextProvisioningCheckpoint,
  resumeFromRetryable,
  transitionProvisioning,
  type ProvisioningCheckpoint,
  type ProvisioningJob
} from "@mpa/shared";
import { createOrganizationSlugFromName } from "../organization/contracts";
import { serverEnv } from "../env/server-env";
import {
  getSaasPurchaseBySessionId,
  updateSaasPurchase,
  type StoredSaasPurchase
} from "../saas-stripe/purchase-store";
import { upsertSaasCustomer } from "./customers-store";
import { sendProvisioningEmail } from "./emails";
import {
  createProvisioningJob,
  getProvisioningJob,
  loadProvisioningJobFromDb,
  saveProvisioningJob
} from "./jobs-store";
import { recordOnboardingLifecycleEvent } from "./lifecycle-events";
import { issueBindToken } from "./tokens";
import { ensurePurchaseFromStripeSession } from "../saas-stripe/ensure-purchase-from-stripe";

function continueUrl(sessionId: string, token?: string): string {
  const base = `${serverEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/commerce/continue?session_id=${encodeURIComponent(sessionId)}`;
  return token ? `${base}&bind_token=${encodeURIComponent(token)}` : base;
}

async function tryServiceRole() {
  try {
    // Unit/integration tests use in-memory synthetic identity/org paths.
    if (process.env["VITEST"]) return null;
    if (!serverEnv.SUPABASE_SERVICE_ROLE_KEY) return null;
    const { createServiceRoleClient } = await import("../supabase/service-role");
    return createServiceRoleClient();
  } catch {
    return null;
  }
}

function createHash(value: string): string {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) h = (h * 31 + value.charCodeAt(i)) >>> 0;
  return h.toString(16);
}

async function ensureAuthUser(
  email: string
): Promise<{ userId: string; created: boolean } | { error: string }> {
  const supabase = await tryServiceRole();
  if (!supabase) {
    return { userId: `pending_user_${createHash(email)}`, created: true };
  }
  const listed = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
  const existing = listed.data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (existing) {
    return { userId: existing.id, created: false };
  }
  const created = await supabase.auth.admin.createUser({
    email,
    email_confirm: false,
    user_metadata: { mpa_provisioning: true }
  });
  if (created.error || !created.data.user) {
    return { error: created.error?.message ?? "auth_user_create_failed" };
  }
  return { userId: created.data.user.id, created: true };
}

async function linkSaasCustomer(input: {
  stripeCustomerId: string | null;
  email: string;
  checkoutSessionId: string;
  userId: string;
  organizationId?: string | null;
}): Promise<void> {
  const stripeCustomerId =
    input.stripeCustomerId && input.stripeCustomerId.length > 0
      ? input.stripeCustomerId
      : `pending_${input.checkoutSessionId}`;
  const userId = input.userId.startsWith("pending_user_") ? null : input.userId;
  const organizationId =
    input.organizationId && !input.organizationId.startsWith("org_")
      ? input.organizationId
      : null;
  upsertSaasCustomer({
    stripeCustomerId,
    email: input.email,
    checkoutSessionId: input.checkoutSessionId,
    userId,
    organizationId
  });
  const supabase = await tryServiceRole();
  if (!supabase) return;
  await supabase.from("saas_customers").upsert(
    {
      stripe_customer_id: stripeCustomerId,
      email: input.email.toLowerCase(),
      checkout_session_id: input.checkoutSessionId,
      user_id: userId,
      organization_id: organizationId,
      updated_at: new Date().toISOString()
    },
    { onConflict: "stripe_customer_id" }
  );
}

async function ensureOrganization(input: {
  name: string;
  ownerUserId: string;
  checkoutSessionId: string;
}): Promise<{ organizationId: string } | { error: string }> {
  const supabase = await tryServiceRole();
  const slug = `${createOrganizationSlugFromName(input.name)}-${input.checkoutSessionId.slice(-8)}`;
  if (!supabase) {
    return { organizationId: `org_${createHash(input.checkoutSessionId)}` };
  }
  const { data: existing } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (existing?.id) {
    return { organizationId: existing.id };
  }
  const { data, error } = await supabase
    .from("organizations")
    .insert({
      name: input.name,
      slug,
      created_by: input.ownerUserId
    })
    .select("id")
    .single();
  if (error || !data) {
    return { error: error?.message ?? "org_create_failed" };
  }
  return { organizationId: data.id };
}

async function activateSubscription(input: {
  organizationId: string;
  sku: string;
  ownerUserId: string;
}): Promise<{ error: string | null }> {
  const supabase = await tryServiceRole();
  if (!supabase) {
    return { error: null };
  }
  const { error } = await supabase.from("organization_subscriptions").upsert(
    {
      organization_id: input.organizationId,
      sku_code: input.sku,
      status: "active",
      assigned_by: input.ownerUserId
    },
    { onConflict: "organization_id" }
  );
  if (error) return { error: error.message };
  const { error: setupError } = await supabase.from("organization_setup_state").upsert(
    {
      organization_id: input.organizationId,
      product_confirmed: true,
      checklist: {
        product_selected: true,
        billing_acknowledged: true,
        modules_reviewed: false,
        home_selected: false,
        next_step_acknowledged: false
      }
    },
    { onConflict: "organization_id" }
  );
  return { error: setupError?.message ?? null };
}

async function assignAdminMembership(input: {
  organizationId: string;
  ownerUserId: string;
}): Promise<{ error: string | null }> {
  const supabase = await tryServiceRole();
  if (!supabase) return { error: null };
  if (input.ownerUserId.startsWith("pending_user_")) return { error: null };
  const { error } = await supabase.from("organization_memberships").upsert(
    {
      organization_id: input.organizationId,
      user_id: input.ownerUserId,
      roles: ["organization_admin", "property_manager"],
      status: "active"
    },
    { onConflict: "organization_id,user_id" }
  );
  return { error: error?.message ?? null };
}

async function persistJobRow(job: ProvisioningJob): Promise<void> {
  const supabase = await tryServiceRole();
  if (!supabase) return;
  await supabase.from("provisioning_jobs").upsert(
    {
      id: job.id,
      checkout_session_id: job.checkoutSessionId,
      idempotency_key: job.idempotencyKey,
      checkpoint: job.checkpoint,
      stripe_customer_id: job.stripeCustomerId,
      stripe_subscription_id: job.stripeSubscriptionId,
      catalog_offer_id: job.catalogOfferId,
      product_sku: job.productSku,
      plan_tier: job.planTier,
      billing_cycle: job.billingCycle,
      owner_email: job.ownerEmail,
      owner_user_id: job.ownerUserId?.startsWith("pending_user_") ? null : job.ownerUserId,
      organization_id: job.organizationId?.startsWith("org_") ? null : job.organizationId,
      organization_name: job.organizationName,
      bind_token_hash: job.bindTokenHash,
      bind_expires_at: job.bindExpiresAt,
      attempt_count: job.attemptCount,
      last_error: job.lastError,
      audit: job.audit,
      emails_sent: job.emailsSent,
      updated_at: job.updatedAt
    },
    { onConflict: "checkout_session_id" }
  );
}

async function saveJob(job: ProvisioningJob): Promise<ProvisioningJob> {
  const saved = saveProvisioningJob(job);
  await persistJobRow(saved);
  return saved;
}

async function resolveJob(checkoutSessionId: string): Promise<ProvisioningJob | null> {
  return getProvisioningJob(checkoutSessionId) ?? (await loadProvisioningJobFromDb(checkoutSessionId));
}

/**
 * Starts or advances provisioning for a paid Checkout Session.
 * Idempotent on checkout_session_id.
 */
export async function startOrAdvanceProvisioningFromPurchase(
  purchase: StoredSaasPurchase
): Promise<ProvisioningJob | null> {
  if (!COM_002_FLAGS.sliceD_automaticProvisioning) {
    return null;
  }
  if (purchase.status !== "checkout_completed") {
    return null;
  }
  const email = purchase.customerEmail;
  if (!email) {
    const job = createProvisioningJob({
      checkoutSessionId: purchase.stripeCheckoutSessionId,
      stripeCustomerId: purchase.stripeCustomerId,
      stripeSubscriptionId: purchase.stripeSubscriptionId,
      catalogOfferId: purchase.catalogOfferId,
      productSku: purchase.productSku,
      planTier: purchase.planTier,
      billingCycle: purchase.billingCycle,
      ownerEmail: "unknown@invalid"
    });
    return await saveJob(transitionProvisioning(job, "failed_dead", "missing_customer_email"));
  }

  let job =
    (await resolveJob(purchase.stripeCheckoutSessionId)) ??
    createProvisioningJob({
      checkoutSessionId: purchase.stripeCheckoutSessionId,
      stripeCustomerId: purchase.stripeCustomerId,
      stripeSubscriptionId: purchase.stripeSubscriptionId,
      catalogOfferId: purchase.catalogOfferId,
      productSku: purchase.productSku,
      planTier: purchase.planTier,
      billingCycle: purchase.billingCycle,
      ownerEmail: email,
      organizationName: defaultOrganizationName(email)
    });
  job = await saveJob(job);

  if (job.checkpoint === "failed_retryable") {
    job = resumeFromRetryable(job);
    job = await saveJob(job);
  }
  if (job.checkpoint === "ready" || job.checkpoint === "failed_dead") {
    return job;
  }

  await recordOnboardingLifecycleEvent({
    checkoutSessionId: purchase.stripeCheckoutSessionId,
    eventType: "purchase_completed",
    stripeSubscriptionId: purchase.stripeSubscriptionId,
    organizationId: job.organizationId,
    summary: "Stripe Checkout payment completed"
  });

  // Advance automatically through owner_pending (identity bind waits for user).
  while (isProvisioningCheckpoint(job.checkpoint) && job.checkpoint !== "owner_pending") {
    const before: ProvisioningCheckpoint = job.checkpoint;
    const advanced = await advanceOneCheckpoint(job);
    job = advanced;
    // Stop on claim wait, terminal/non-checkpoint statuses, or a no-op stall.
    if (
      job.checkpoint === "owner_pending" ||
      job.checkpoint === before ||
      !isProvisioningCheckpoint(job.checkpoint)
    ) {
      break;
    }
  }

  if (job.checkpoint === "owner_pending") {
    await ensureClaimEmail(job);
    await recordOnboardingLifecycleEvent({
      checkoutSessionId: job.checkoutSessionId,
      eventType: "owner_pending",
      stripeSubscriptionId: job.stripeSubscriptionId,
      organizationId: job.organizationId,
      summary: "Awaiting owner claim / email verification"
    });
  }

  if (job.checkpoint === "failed_retryable") {
    await sendProvisioningEmail({
      kind: "failure_recovery",
      to: job.ownerEmail,
      continueUrl: continueUrl(job.checkoutSessionId),
      organizationName: job.organizationName
    });
  }

  return getProvisioningJob(purchase.stripeCheckoutSessionId);
}

async function ensureClaimEmail(job: ProvisioningJob): Promise<void> {
  if (job.emailsSent.includes("verification")) {
    return;
  }
  // Always mint a fresh bind token for the claim email so the continue link includes it.
  // (entitled → owner_pending already hashes a token, but the plaintext is not retained.)
  const issued = issueBindToken();
  const withToken = await saveJob({
    ...job,
    bindTokenHash: issued.hash,
    bindExpiresAt: issued.expiresAt,
    updatedAt: new Date().toISOString()
  });
  const sent = await sendProvisioningEmail({
    kind: "verification",
    to: withToken.ownerEmail,
    continueUrl: continueUrl(withToken.checkoutSessionId, issued.token),
    organizationName: withToken.organizationName
  });
  if (sent.ok) {
    await saveJob({
      ...withToken,
      emailsSent: [...withToken.emailsSent, "verification"],
      updatedAt: new Date().toISOString()
    });
  }
}

async function advanceOneCheckpoint(job: ProvisioningJob): Promise<ProvisioningJob> {
  if (!isProvisioningCheckpoint(job.checkpoint)) {
    return job;
  }
  const current = job.checkpoint;
  try {
    switch (current) {
      case "received": {
        // Validate purchase + create/link identity + saas_customers → customer_linked
        const identity = await ensureAuthUser(job.ownerEmail);
        if ("error" in identity) {
          return await saveJob(markProvisioningRetry(job, identity.error));
        }
        await linkSaasCustomer({
          stripeCustomerId: job.stripeCustomerId,
          email: job.ownerEmail,
          checkoutSessionId: job.checkoutSessionId,
          userId: identity.userId
        });
        const named = job.organizationName ?? defaultOrganizationName(job.ownerEmail);
        return await saveJob(
          transitionProvisioning(
            {
              ...job,
              ownerUserId: identity.userId,
              organizationName: named
            },
            "customer_linked",
            identity.created ? "identity_created" : "identity_linked"
          )
        );
      }
      case "customer_linked": {
        if (!job.ownerUserId) {
          return await saveJob(markProvisioningRetry(job, "missing_owner_user"));
        }
        const named = job.organizationName ?? defaultOrganizationName(job.ownerEmail);
        const org = await ensureOrganization({
          name: named,
          ownerUserId: job.ownerUserId,
          checkoutSessionId: job.checkoutSessionId
        });
        if ("error" in org) {
          // Compensation: keep identity, do not create a second org — retry safely.
          return await saveJob(markProvisioningRetry(job, org.error));
        }
        await linkSaasCustomer({
          stripeCustomerId: job.stripeCustomerId,
          email: job.ownerEmail,
          checkoutSessionId: job.checkoutSessionId,
          userId: job.ownerUserId,
          organizationId: org.organizationId
        });
        const next = transitionProvisioning(
          {
            ...job,
            organizationId: org.organizationId,
            organizationName: named
          },
          "org_created",
          "organization_created"
        );
        await sendProvisioningEmail({
          kind: "progress",
          to: job.ownerEmail,
          continueUrl: continueUrl(job.checkoutSessionId),
          organizationName: named,
          checkpoint: "org_created"
        });
        const savedOrg = await saveJob(next);
        await recordOnboardingLifecycleEvent({
          checkoutSessionId: savedOrg.checkoutSessionId,
          eventType: "provisioned",
          stripeSubscriptionId: savedOrg.stripeSubscriptionId,
          organizationId: savedOrg.organizationId,
          summary: "Organization provisioned"
        });
        return savedOrg;
      }
      case "org_created": {
        if (!job.organizationId || !job.ownerUserId) {
          return await saveJob(markProvisioningRetry(job, "missing_org_or_user"));
        }
        const activated = await activateSubscription({
          organizationId: job.organizationId,
          sku: job.productSku,
          ownerUserId: job.ownerUserId
        });
        if (activated.error) {
          // Compensation: keep org; retry entitle — never second org/subscription invent.
          return await saveJob(markProvisioningRetry(job, activated.error));
        }
        return await saveJob(transitionProvisioning(job, "entitled", "product_activated"));
      }
      case "entitled": {
        const issued = issueBindToken();
        const next = transitionProvisioning(
          {
            ...job,
            bindTokenHash: issued.hash,
            bindExpiresAt: issued.expiresAt
          },
          "owner_pending",
          "awaiting_email_claim"
        );
        return await saveJob(next);
      }
      case "owner_pending":
        return job;
      case "owner_bound": {
        await sendProvisioningEmail({
          kind: "welcome",
          to: job.ownerEmail,
          continueUrl: `${serverEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/setup`,
          organizationName: job.organizationName
        });
        const welcomed = transitionProvisioning(
          { ...job, emailsSent: [...job.emailsSent, "welcome"] },
          "welcome_sent",
          "welcome_email"
        );
        return await saveJob(welcomed);
      }
      case "welcome_sent": {
        const ready = transitionProvisioning(job, "ready", "guided_setup_prepared");
        updateSaasPurchase(job.checkoutSessionId, {
          provisioned: true,
          organizationId: job.organizationId,
          userId: job.ownerUserId
        });
        await sendProvisioningEmail({
          kind: "continue_setup",
          to: job.ownerEmail,
          continueUrl: `${serverEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/setup`,
          organizationName: job.organizationName
        });
        return await saveJob({
          ...ready,
          emailsSent: [...ready.emailsSent, "continue_setup"]
        });
      }
      case "ready":
        return job;
      default: {
        const next = nextProvisioningCheckpoint(current);
        if (!next) return job;
        return await saveJob(transitionProvisioning(job, next));
      }
    }
  } catch (error) {
    return await saveJob(
      markProvisioningRetry(job, error instanceof Error ? error.message : "checkpoint_exception")
    );
  }
}

/**
 * Claim / bind owner after verified auth for checkout email.
 */
export async function claimProvisioningOwner(input: {
  checkoutSessionId: string;
  userId: string;
  userEmail: string;
  bindToken?: string | null;
}): Promise<{ ok: true; job: ProvisioningJob } | { ok: false; error: string }> {
  let job = await resolveJob(input.checkoutSessionId);
  if (!job) {
    const purchase =
      getSaasPurchaseBySessionId(input.checkoutSessionId) ??
      (await ensurePurchaseFromStripeSession(input.checkoutSessionId));
    if (purchase) {
      job = await startOrAdvanceProvisioningFromPurchase(purchase);
    }
  }
  if (!job) {
    return { ok: false, error: "provisioning_not_found" };
  }
  if (job.ownerEmail.toLowerCase() !== input.userEmail.toLowerCase()) {
    return { ok: false, error: "email_mismatch" };
  }
  if (
    job.checkpoint === "ready" ||
    job.checkpoint === "welcome_sent" ||
    job.checkpoint === "owner_bound"
  ) {
    return { ok: true, job };
  }
  if (job.checkpoint !== "owner_pending" && job.checkpoint !== "failed_retryable") {
    if (isProvisioningCheckpoint(job.checkpoint)) {
      if (["entitled", "org_created", "customer_linked", "received"].includes(job.checkpoint)) {
        const purchase =
          getSaasPurchaseBySessionId(input.checkoutSessionId) ??
          (await ensurePurchaseFromStripeSession(input.checkoutSessionId));
        if (purchase) {
          job = (await startOrAdvanceProvisioningFromPurchase(purchase))!;
        }
      }
    }
  }
  job = (await resolveJob(input.checkoutSessionId))!;
  if (job.checkpoint === "failed_retryable") {
    job = resumeFromRetryable(job);
    await saveJob(job);
    const purchase =
      getSaasPurchaseBySessionId(input.checkoutSessionId) ??
      (await ensurePurchaseFromStripeSession(input.checkoutSessionId));
    if (purchase) {
      job = (await startOrAdvanceProvisioningFromPurchase(purchase))!;
    }
  }
  if (job.checkpoint !== "owner_pending") {
    return { ok: false, error: `invalid_checkpoint:${job.checkpoint}` };
  }

  if (input.bindToken && job.bindTokenHash) {
    const { bindTokenValid } = await import("./tokens");
    if (!bindTokenValid(job, input.bindToken)) {
      return { ok: false, error: "invalid_or_expired_bind_token" };
    }
  }

  if (!job.organizationId) {
    return { ok: false, error: "missing_organization" };
  }

  const membership = await assignAdminMembership({
    organizationId: job.organizationId,
    ownerUserId: input.userId
  });
  if (membership.error) {
    return { ok: false, error: membership.error };
  }

  await linkSaasCustomer({
    stripeCustomerId: job.stripeCustomerId,
    email: job.ownerEmail,
    checkoutSessionId: job.checkoutSessionId,
    userId: input.userId,
    organizationId: job.organizationId
  });

  let next = transitionProvisioning(
    {
      ...job,
      ownerUserId: input.userId,
      bindTokenHash: null,
      bindExpiresAt: null
    },
    "owner_bound",
    "owner_claimed"
  );
  next = await saveJob(next);
  await recordOnboardingLifecycleEvent({
    checkoutSessionId: next.checkoutSessionId,
    eventType: "owner_claimed",
    stripeSubscriptionId: next.stripeSubscriptionId,
    organizationId: next.organizationId,
    summary: "Owner claimed workspace"
  });
  next = await advanceOneCheckpoint(next);
  if (next.checkpoint === "welcome_sent") {
    next = await advanceOneCheckpoint(next);
  }
  const ready = (await resolveJob(input.checkoutSessionId))!;
  if (ready.checkpoint === "ready") {
    await recordOnboardingLifecycleEvent({
      checkoutSessionId: ready.checkoutSessionId,
      eventType: "activated",
      stripeSubscriptionId: ready.stripeSubscriptionId,
      organizationId: ready.organizationId,
      summary: "Workspace activated — Guided Setup ready"
    });
  }
  return { ok: true, job: ready };
}

export async function retryProvisioningJob(
  checkoutSessionId: string
): Promise<ProvisioningJob | null> {
  const purchase = getSaasPurchaseBySessionId(checkoutSessionId);
  if (!purchase) return getProvisioningJob(checkoutSessionId);
  return startOrAdvanceProvisioningFromPurchase(purchase);
}

/** Owner Operations — mint a fresh claim bind token and resend verification email. */
export async function regenerateClaimLinkForSession(
  checkoutSessionId: string
): Promise<{ ok: true; job: ProvisioningJob; continueUrl: string } | { ok: false; error: string }> {
  const job =
    (await loadProvisioningJobFromDb(checkoutSessionId)) ?? getProvisioningJob(checkoutSessionId);
  if (!job) return { ok: false, error: "Provisioning job not found" };
  if (job.checkpoint === "ready") {
    return { ok: false, error: "Workspace already claimed / ready — claim link not applicable" };
  }

  const issued = issueBindToken();
  const withToken = await saveJob({
    ...job,
    bindTokenHash: issued.hash,
    bindExpiresAt: issued.expiresAt,
    // Allow re-send by removing verification marker if present.
    emailsSent: job.emailsSent.filter((k) => k !== "verification"),
    updatedAt: new Date().toISOString()
  });
  const url = continueUrl(withToken.checkoutSessionId, issued.token);
  const sent = await sendProvisioningEmail({
    kind: "verification",
    to: withToken.ownerEmail,
    continueUrl: url,
    organizationName: withToken.organizationName
  });
  if (!sent.ok) {
    return { ok: false, error: sent.error ?? "Failed to send claim email" };
  }
  const saved = await saveJob({
    ...withToken,
    emailsSent: [...withToken.emailsSent, "verification"],
    updatedAt: new Date().toISOString()
  });
  return { ok: true, job: saved, continueUrl: url };
}

export async function startOrAdvanceProvisioningFromCheckoutSession(session: {
  id: string;
  customer?: string | null;
  subscription?: string | null;
  customer_email?: string | null;
  customer_details?: { email?: string | null } | null;
  metadata?: Record<string, string> | null;
}): Promise<ProvisioningJob | null> {
  const purchase =
    getSaasPurchaseBySessionId(session.id) ??
    ({
      id: crypto.randomUUID(),
      stripeCheckoutSessionId: session.id,
      stripeCustomerId: typeof session.customer === "string" ? session.customer : null,
      stripeSubscriptionId: typeof session.subscription === "string" ? session.subscription : null,
      catalogOfferId: session.metadata?.["mpa_catalog_offer_id"] ?? "unknown",
      productSku: "mpa_property_manager",
      planTier: session.metadata?.["mpa_plan_tier"] === "business" ? "business" : "professional",
      billingCycle: session.metadata?.["mpa_billing_cycle"] === "annual" ? "annual" : "monthly",
      status: "checkout_completed",
      customerEmail: session.customer_details?.email ?? session.customer_email ?? null,
      idempotencyKey: null,
      demoSessionId: null,
      metadata: session.metadata ?? {},
      provisioned: false,
      organizationId: null,
      userId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } satisfies StoredSaasPurchase);

  if (!getSaasPurchaseBySessionId(session.id)) {
    const { rememberSaasPurchase } = await import("../saas-stripe/purchase-store");
    rememberSaasPurchase({ ...purchase, status: "checkout_completed" });
  } else {
    updateSaasPurchase(session.id, { status: "checkout_completed" });
  }
  return startOrAdvanceProvisioningFromPurchase(getSaasPurchaseBySessionId(session.id)!);
}
