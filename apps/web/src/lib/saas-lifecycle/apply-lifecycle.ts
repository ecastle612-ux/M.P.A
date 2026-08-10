import {
  COM_002_FLAGS,
  customerLifecyclePhase,
  daysIntoGrace,
  dunningEmailKindForDay,
  hasLifecycleModuleAccess,
  limitsForPlanTier,
  mapStripeSubscriptionStatus,
  toPlanTierLabel,
  transitionLifecycle,
  type LifecycleSubscription,
  type SubscriptionPlatformStatus
} from "@mpa/shared";
import { serverEnv } from "../env/server-env";
import { getSaasPurchaseBySessionId, listSaasPurchases } from "../saas-stripe/purchase-store";
import { sendLifecycleEmail, type LifecycleEmailKind } from "./emails";
import {
  getLifecycleByOrganizationId,
  getLifecycleByStripeSubscriptionId,
  listLifecycleSubscriptions,
  saveLifecycleSubscription
} from "./lifecycle-store";

function billingUrl(): string {
  return `${serverEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/billing`;
}

function planLabel(sub: LifecycleSubscription): string {
  return `Property Manager ${toPlanTierLabel(sub.planTier)}`;
}

async function tryServiceRole() {
  try {
    if (process.env["VITEST"]) return null;
    if (!serverEnv.SUPABASE_SERVICE_ROLE_KEY) return null;
    const { createServiceRoleClient } = await import("../supabase/service-role");
    return createServiceRoleClient();
  } catch {
    return null;
  }
}

async function persistToDb(sub: LifecycleSubscription): Promise<void> {
  const supabase = await tryServiceRole();
  if (!supabase || !sub.organizationId) return;
  await supabase.from("organization_subscriptions").upsert(
    {
      organization_id: sub.organizationId,
      sku_code: sub.productSku,
      status: sub.status === "pending" ? "incomplete" : sub.status,
      stripe_subscription_id: sub.stripeSubscriptionId,
      stripe_customer_id: sub.stripeCustomerId,
      plan_tier: sub.planTier,
      billing_cycle: sub.billingCycle,
      cancel_at_period_end: sub.cancelAtPeriodEnd,
      current_period_end: sub.currentPeriodEnd,
      grace_started_at: sub.graceStartedAt,
      seat_limit: sub.seatLimit,
      property_limit: sub.propertyLimit,
      pending_plan_tier: sub.pendingPlanTier,
      sca_required: sub.scaRequired,
      lifecycle_audit: sub.audit,
      lifecycle_emails_sent: sub.emailsSent,
      payment_history: sub.paymentHistory,
      updated_at: sub.updatedAt
    },
    { onConflict: "organization_id" }
  );
}

async function notify(
  sub: LifecycleSubscription,
  kind: LifecycleEmailKind,
  emailKey: string,
  ownerEmail: string | null
): Promise<LifecycleSubscription> {
  if (!ownerEmail || sub.emailsSent.includes(emailKey)) {
    return sub;
  }
  const sent = await sendLifecycleEmail({
    kind,
    to: ownerEmail,
    billingUrl: billingUrl(),
    planLabel: planLabel(sub)
  });
  if (!sent.ok) return sub;
  // Vitest may stub delivery offline (stubbed: true). Production never stubs success.
  // emailsSent tracks lifecycle notification attempts for idempotency — not a user-facing "sent" toast.
  return saveLifecycleSubscription({
    ...sub,
    emailsSent: [...sub.emailsSent, emailKey],
    updatedAt: new Date().toISOString()
  });
}

function findOwnerEmail(sub: LifecycleSubscription): string | null {
  const purchases = listSaasPurchases();
  const match = purchases.find(
    (p) =>
      p.stripeSubscriptionId === sub.stripeSubscriptionId ||
      (sub.organizationId && p.organizationId === sub.organizationId)
  );
  return match?.customerEmail ?? null;
}

function resolveOrganizationId(stripeSubscriptionId: string, stripeCustomerId: string | null): string | null {
  const existing = getLifecycleByStripeSubscriptionId(stripeSubscriptionId);
  if (existing?.organizationId) return existing.organizationId;
  const purchases = listSaasPurchases();
  const bySub = purchases.find((p) => p.stripeSubscriptionId === stripeSubscriptionId);
  if (bySub?.organizationId) return bySub.organizationId;
  if (stripeCustomerId) {
    const byCust = purchases.find((p) => p.stripeCustomerId === stripeCustomerId);
    if (byCust?.organizationId) return byCust.organizationId;
  }
  return null;
}

function ensureSubscription(input: {
  stripeSubscriptionId: string;
  stripeCustomerId: string | null;
  planTier?: "professional" | "business";
  billingCycle?: "monthly" | "annual";
  status: SubscriptionPlatformStatus;
  cancelAtPeriodEnd?: boolean;
  currentPeriodEnd?: string | null;
  organizationId?: string | null;
  source: string;
  eventId?: string;
}): LifecycleSubscription {
  const existing = getLifecycleByStripeSubscriptionId(input.stripeSubscriptionId);
  const orgId =
    input.organizationId ??
    existing?.organizationId ??
    resolveOrganizationId(input.stripeSubscriptionId, input.stripeCustomerId);
  const planTier = input.planTier ?? existing?.planTier ?? "professional";
  const billingCycle = input.billingCycle ?? existing?.billingCycle ?? "monthly";
  const limits = limitsForPlanTier(planTier);
  const now = new Date().toISOString();

  if (!existing) {
    const created: LifecycleSubscription = {
      id: crypto.randomUUID(),
      organizationId: orgId,
      stripeSubscriptionId: input.stripeSubscriptionId,
      stripeCustomerId: input.stripeCustomerId,
      productSku: "mpa_property_manager",
      planTier,
      billingCycle,
      status: input.status,
      cancelAtPeriodEnd: input.cancelAtPeriodEnd ?? false,
      currentPeriodEnd: input.currentPeriodEnd ?? null,
      graceStartedAt: null,
      seatLimit: limits.seatLimit,
      propertyLimit: limits.propertyLimit,
      pendingPlanTier: null,
      lastInvoiceStatus: null,
      scaRequired: false,
      emailsSent: [],
      audit: [
        {
          at: now,
          from: "none",
          to: input.status,
          reason: "subscription_ensured",
          source: input.source,
          ...(input.eventId ? { eventId: input.eventId } : {})
        }
      ],
      paymentHistory: [],
      createdAt: now,
      updatedAt: now
    };
    return saveLifecycleSubscription(created);
  }

  let next: LifecycleSubscription = {
    ...existing,
    organizationId: orgId ?? existing.organizationId,
    stripeCustomerId: input.stripeCustomerId ?? existing.stripeCustomerId,
    planTier,
    billingCycle,
    seatLimit: limits.seatLimit,
    propertyLimit: limits.propertyLimit,
    cancelAtPeriodEnd: input.cancelAtPeriodEnd ?? existing.cancelAtPeriodEnd,
    currentPeriodEnd:
      input.currentPeriodEnd !== undefined ? input.currentPeriodEnd : existing.currentPeriodEnd,
    updatedAt: now
  };
  if (next.status !== input.status) {
    next = transitionLifecycle(
      next,
      input.status,
      "stripe_sync",
      input.source,
      input.eventId
    );
  }
  return saveLifecycleSubscription(next);
}

export async function applySubscriptionCreatedOrUpdated(input: {
  stripeSubscriptionId: string;
  stripeCustomerId: string | null;
  stripeStatus: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  planTier?: "professional" | "business";
  billingCycle?: "monthly" | "annual";
  eventId: string;
  eventType: string;
}): Promise<LifecycleSubscription | null> {
  if (!COM_002_FLAGS.sliceE_subscriptionLifecycle) return null;
  const status = mapStripeSubscriptionStatus(input.stripeStatus);
  let sub = ensureSubscription({
    stripeSubscriptionId: input.stripeSubscriptionId,
    stripeCustomerId: input.stripeCustomerId,
    ...(input.planTier ? { planTier: input.planTier } : {}),
    ...(input.billingCycle ? { billingCycle: input.billingCycle } : {}),
    status,
    cancelAtPeriodEnd: input.cancelAtPeriodEnd,
    currentPeriodEnd: input.currentPeriodEnd,
    source: input.eventType,
    eventId: input.eventId
  });

  if (status === "canceled" && !input.cancelAtPeriodEnd) {
    sub = transitionLifecycle(sub, "canceled", "subscription_deleted_or_canceled", input.eventType, input.eventId);
    sub = await notify(sub, "subscription_canceled", `canceled:${input.eventId}`, findOwnerEmail(sub));
  }

  await persistToDb(sub);
  return sub;
}

export async function applyInvoicePaid(input: {
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
  amountCents?: number;
  eventId: string;
}): Promise<LifecycleSubscription | null> {
  if (!COM_002_FLAGS.sliceE_subscriptionLifecycle || !input.stripeSubscriptionId) return null;
  let sub =
    getLifecycleByStripeSubscriptionId(input.stripeSubscriptionId) ??
    ensureSubscription({
      stripeSubscriptionId: input.stripeSubscriptionId,
      stripeCustomerId: input.stripeCustomerId,
      status: "active",
      source: "invoice.paid",
      eventId: input.eventId
    });

  const wasPastDue = sub.status === "past_due" || sub.status === "unpaid" || sub.status === "expired";
  sub = {
    ...sub,
    graceStartedAt: null,
    scaRequired: false,
    lastInvoiceStatus: "paid",
    paymentHistory: [
      ...sub.paymentHistory,
      {
        at: new Date().toISOString(),
        kind: "paid",
        ...(typeof input.amountCents === "number" ? { amountCents: input.amountCents } : {}),
        note: "Renewal payment succeeded"
      }
    ]
  };
  if (sub.status !== "active") {
    sub = transitionLifecycle(
      sub,
      "active",
      wasPastDue ? "reactivated" : "invoice_paid",
      "invoice.paid",
      input.eventId
    );
  }
  sub = saveLifecycleSubscription(sub);
  if (wasPastDue) {
    sub = await notify(sub, "subscription_restored", `restored:${input.eventId}`, findOwnerEmail(sub));
  } else {
    sub = await notify(sub, "renewal_success", `renewal:${input.eventId}`, findOwnerEmail(sub));
  }
  await persistToDb(sub);
  return sub;
}

export async function applyInvoicePaymentFailed(input: {
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
  amountCents?: number;
  eventId: string;
}): Promise<LifecycleSubscription | null> {
  if (!COM_002_FLAGS.sliceE_subscriptionLifecycle || !input.stripeSubscriptionId) return null;
  let sub =
    getLifecycleByStripeSubscriptionId(input.stripeSubscriptionId) ??
    ensureSubscription({
      stripeSubscriptionId: input.stripeSubscriptionId,
      stripeCustomerId: input.stripeCustomerId,
      status: "past_due",
      source: "invoice.payment_failed",
      eventId: input.eventId
    });

  const graceStartedAt = sub.graceStartedAt ?? new Date().toISOString();
  sub = {
    ...sub,
    graceStartedAt,
    lastInvoiceStatus: "failed",
    paymentHistory: [
      ...sub.paymentHistory,
      {
        at: new Date().toISOString(),
        kind: "failed",
        ...(typeof input.amountCents === "number" ? { amountCents: input.amountCents } : {}),
        note: "Renewal payment failed"
      }
    ]
  };
  if (sub.status !== "past_due") {
    sub = transitionLifecycle(sub, "past_due", "invoice_payment_failed", "invoice.payment_failed", input.eventId);
  } else {
    sub = saveLifecycleSubscription(sub);
  }

  const day = daysIntoGrace(sub.graceStartedAt) ?? 0;
  const kind = dunningEmailKindForDay(day);
  if (kind === "payment_failed" || kind === "grace_warning") {
    sub = await notify(sub, kind, `dunning:${day}:${sub.graceStartedAt}`, findOwnerEmail(sub));
  }
  await persistToDb(sub);
  return sub;
}

export async function applyInvoicePaymentActionRequired(input: {
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
  eventId: string;
}): Promise<LifecycleSubscription | null> {
  if (!COM_002_FLAGS.sliceE_subscriptionLifecycle || !input.stripeSubscriptionId) return null;
  let sub =
    getLifecycleByStripeSubscriptionId(input.stripeSubscriptionId) ??
    ensureSubscription({
      stripeSubscriptionId: input.stripeSubscriptionId,
      stripeCustomerId: input.stripeCustomerId,
      status: "incomplete",
      source: "invoice.payment_action_required",
      eventId: input.eventId
    });
  sub = {
    ...sub,
    scaRequired: true,
    lastInvoiceStatus: "action_required",
    paymentHistory: [
      ...sub.paymentHistory,
      {
        at: new Date().toISOString(),
        kind: "action_required",
        note: "Additional authentication required for payment"
      }
    ]
  };
  if (sub.status === "active") {
    // Keep access; surface SCA banner via scaRequired.
    sub = saveLifecycleSubscription(sub);
  } else if (sub.status !== "incomplete") {
    sub = transitionLifecycle(sub, "incomplete", "sca_required", "invoice.payment_action_required", input.eventId);
  } else {
    sub = saveLifecycleSubscription(sub);
  }
  await persistToDb(sub);
  return sub;
}

export async function applyDisputeCreated(input: {
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
  eventId: string;
}): Promise<LifecycleSubscription | null> {
  if (!COM_002_FLAGS.sliceE_subscriptionLifecycle) return null;
  let sub = input.stripeSubscriptionId
    ? getLifecycleByStripeSubscriptionId(input.stripeSubscriptionId)
    : null;
  if (!sub && input.stripeCustomerId) {
    sub =
      listLifecycleSubscriptions().find((row) => row.stripeCustomerId === input.stripeCustomerId) ??
      null;
  }
  if (!sub && input.stripeSubscriptionId) {
    sub = ensureSubscription({
      stripeSubscriptionId: input.stripeSubscriptionId,
      stripeCustomerId: input.stripeCustomerId,
      status: "dispute_hold",
      source: "charge.dispute.created",
      eventId: input.eventId
    });
  }
  if (!sub) return null;
  sub = transitionLifecycle(sub, "dispute_hold", "dispute_created", "charge.dispute.created", input.eventId);
  await persistToDb(sub);
  return sub;
}

export async function applyDisputeClosed(input: {
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
  won: boolean;
  eventId: string;
}): Promise<LifecycleSubscription | null> {
  if (!COM_002_FLAGS.sliceE_subscriptionLifecycle) return null;
  let sub = input.stripeSubscriptionId
    ? getLifecycleByStripeSubscriptionId(input.stripeSubscriptionId)
    : null;
  if (!sub && input.stripeCustomerId) {
    sub =
      listLifecycleSubscriptions().find((row) => row.stripeCustomerId === input.stripeCustomerId) ??
      null;
  }
  if (!sub) return null;
  sub = transitionLifecycle(
    sub,
    input.won ? "active" : "canceled",
    input.won ? "dispute_won_restored" : "dispute_lost_canceled",
    "charge.dispute.closed",
    input.eventId
  );
  if (input.won) {
    sub = await notify(sub, "subscription_restored", `dispute_restored:${input.eventId}`, findOwnerEmail(sub));
  } else {
    sub = await notify(sub, "subscription_canceled", `dispute_lost:${input.eventId}`, findOwnerEmail(sub));
  }
  await persistToDb(sub);
  return sub;
}

export async function applyChargeRefunded(input: {
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
  amountCents?: number;
  eventId: string;
}): Promise<LifecycleSubscription | null> {
  if (!COM_002_FLAGS.sliceE_subscriptionLifecycle || !input.stripeSubscriptionId) return null;
  let sub = getLifecycleByStripeSubscriptionId(input.stripeSubscriptionId);
  if (!sub) return null;
  sub = saveLifecycleSubscription({
    ...sub,
    paymentHistory: [
      ...sub.paymentHistory,
      {
        at: new Date().toISOString(),
        kind: "refunded",
        ...(typeof input.amountCents === "number" ? { amountCents: input.amountCents } : {}),
        note: "Refund recorded"
      }
    ],
    audit: [
      ...sub.audit,
      {
        at: new Date().toISOString(),
        from: sub.status,
        to: sub.status,
        reason: "charge_refunded",
        source: "charge.refunded",
        eventId: input.eventId
      }
    ],
    updatedAt: new Date().toISOString()
  });
  await persistToDb(sub);
  return sub;
}

/** Hourly-style sweeper: end grace → expire access. */
export async function enforceGraceExpirations(nowMs: number = Date.now()): Promise<number> {
  if (!COM_002_FLAGS.sliceE_subscriptionLifecycle) return 0;
  let count = 0;
  for (const row of listLifecycleSubscriptions()) {
    if (row.status !== "past_due" || !row.graceStartedAt) continue;
    if (hasLifecycleModuleAccess(row, nowMs)) continue;
    let next = transitionLifecycle(row, "expired", "grace_expired", "grace_sweeper");
    next = await notify(
      next,
      "subscription_canceled",
      `grace_expired:${row.graceStartedAt}`,
      findOwnerEmail(next)
    );
    await persistToDb(next);
    count += 1;
  }
  return count;
}

export async function cancelAtPeriodEnd(input: {
  organizationId: string;
  source?: string;
}): Promise<LifecycleSubscription | null> {
  let sub = getLifecycleByOrganizationId(input.organizationId);
  if (!sub) return null;
  sub = saveLifecycleSubscription({
    ...sub,
    cancelAtPeriodEnd: true,
    updatedAt: new Date().toISOString(),
    audit: [
      ...sub.audit,
      {
        at: new Date().toISOString(),
        from: sub.status,
        to: sub.status,
        reason: "cancel_at_period_end_requested",
        source: input.source ?? "customer"
      }
    ]
  });

  if (!process.env["VITEST"]) {
    try {
      const { getSaasStripeClient } = await import("../saas-stripe/client");
      const stripe = getSaasStripeClient();
      if (stripe) {
        await stripe.subscriptions.update(sub.stripeSubscriptionId, {
          cancel_at_period_end: true
        });
      }
    } catch {
      // Store remains source for UX; Stripe sync may retry.
    }
  }

  sub = await notify(
    sub,
    "subscription_canceled",
    `cancel_scheduled:${sub.updatedAt}`,
    findOwnerEmail(sub)
  );
  await persistToDb(sub);
  return sub;
}

export async function reactivateSubscription(input: {
  organizationId: string;
}): Promise<LifecycleSubscription | null> {
  let sub = getLifecycleByOrganizationId(input.organizationId);
  if (!sub) return null;

  if (!process.env["VITEST"]) {
    try {
      const { getSaasStripeClient } = await import("../saas-stripe/client");
      const stripe = getSaasStripeClient();
      if (stripe && sub.cancelAtPeriodEnd) {
        await stripe.subscriptions.update(sub.stripeSubscriptionId, {
          cancel_at_period_end: false
        });
      }
    } catch {
      // Continue with local restore for observability.
    }
  }

  sub = transitionLifecycle(
    {
      ...sub,
      cancelAtPeriodEnd: false,
      graceStartedAt: null,
      scaRequired: false
    },
    "active",
    "reactivated",
    "customer"
  );
  sub = await notify(sub, "subscription_restored", `reactivate:${sub.updatedAt}`, findOwnerEmail(sub));
  await persistToDb(sub);
  return sub;
}

export async function changePlanTier(input: {
  organizationId: string;
  planTier: "professional" | "business";
  billingCycle?: "monthly" | "annual";
}): Promise<{ ok: true; sub: LifecycleSubscription } | { ok: false; error: string }> {
  let sub = getLifecycleByOrganizationId(input.organizationId);
  if (!sub) return { ok: false, error: "subscription_not_found" };
  if (sub.productSku !== "mpa_property_manager") {
    return { ok: false, error: "not_self_serve" };
  }

  const upgrading =
    (sub.planTier === "professional" && input.planTier === "business") ||
    (sub.billingCycle === "monthly" && input.billingCycle === "annual");
  const downgrading = sub.planTier === "business" && input.planTier === "professional";

  if (!process.env["VITEST"]) {
    try {
      const { getSaasStripeClient, resolveSaasPriceId } = await import("../saas-stripe/client");
      const stripe = getSaasStripeClient();
      const cycle = input.billingCycle ?? sub.billingCycle;
      const offerId = `mpa_property_manager__${input.planTier}__${cycle}`;
      const priceId = resolveSaasPriceId(offerId);
      if (stripe && priceId) {
        const remote = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId);
        const itemId = remote.items.data[0]?.id;
        if (itemId) {
          if (upgrading || (!downgrading && input.planTier !== sub.planTier)) {
            await stripe.subscriptions.update(sub.stripeSubscriptionId, {
              items: [{ id: itemId, price: priceId }],
              proration_behavior: "create_prorations"
            });
          } else if (downgrading) {
            // Period-end downgrade: schedule pending tier locally; Stripe schedule optional.
            sub = saveLifecycleSubscription({
              ...sub,
              pendingPlanTier: input.planTier,
              billingCycle: cycle,
              updatedAt: new Date().toISOString(),
              audit: [
                ...sub.audit,
                {
                  at: new Date().toISOString(),
                  from: sub.status,
                  to: sub.status,
                  reason: "downgrade_scheduled_period_end",
                  source: "customer"
                }
              ]
            });
            await persistToDb(sub);
            return { ok: true, sub };
          }
        }
      }
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "stripe_plan_change_failed"
      };
    }
  }

  if (downgrading) {
    sub = saveLifecycleSubscription({
      ...sub,
      pendingPlanTier: input.planTier,
      updatedAt: new Date().toISOString(),
      audit: [
        ...sub.audit,
        {
          at: new Date().toISOString(),
          from: sub.status,
          to: sub.status,
          reason: "downgrade_scheduled_period_end",
          source: "customer"
        }
      ]
    });
  } else {
    const limits = limitsForPlanTier(input.planTier);
    sub = saveLifecycleSubscription({
      ...sub,
      planTier: input.planTier,
      billingCycle: input.billingCycle ?? sub.billingCycle,
      seatLimit: limits.seatLimit,
      propertyLimit: limits.propertyLimit,
      pendingPlanTier: null,
      updatedAt: new Date().toISOString(),
      audit: [
        ...sub.audit,
        {
          at: new Date().toISOString(),
          from: sub.status,
          to: sub.status,
          reason: "plan_upgraded_immediate",
          source: "customer"
        }
      ]
    });
  }
  await persistToDb(sub);
  return { ok: true, sub };
}

export function lifecycleViewForOrganization(organizationId: string) {
  const sub = getLifecycleByOrganizationId(organizationId);
  if (!sub) return null;
  const phase = customerLifecyclePhase(sub);
  return {
    ...sub,
    phase,
    moduleAccess: hasLifecycleModuleAccess(sub),
    ownerEmail: findOwnerEmail(sub)
  };
}

export function seedLifecycleFromPurchase(sessionId: string): LifecycleSubscription | null {
  const purchase = getSaasPurchaseBySessionId(sessionId);
  if (!purchase?.stripeSubscriptionId || purchase.planTier === "enterprise") return null;
  const planTier = purchase.planTier === "business" ? "business" : "professional";
  return ensureSubscription({
    stripeSubscriptionId: purchase.stripeSubscriptionId,
    stripeCustomerId: purchase.stripeCustomerId,
    planTier,
    billingCycle: purchase.billingCycle,
    status: "active",
    organizationId: purchase.organizationId,
    source: "seed_from_purchase"
  });
}
