/**
 * SubscriptionService — sole domain entry for BILL-001 SaaS Stripe Billing.
 * Never call SaasBillingProvider from UI or other business modules.
 * Never write to payments / Connect money tables from this module.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@mpa/supabase";
import { createAuthServerComponentClient, createServiceRoleServerClient } from "../auth/server";
import type {
  NormalizedSaasInvoice,
  NormalizedSubscription,
  SaasBillingInterval,
  SaasPlanCode
} from "../integrations/saas-billing/contracts";
import { listConfiguredPlanPrices, resolvePriceId } from "../integrations/saas-billing/plan-catalog";
import {
  getSaasBillingProvider,
  resolveDefaultSaasBillingProviderId
} from "../integrations/saas-billing/registry";
import {
  isOpenSubscriptionStatus,
  type SaasCustomerRecord,
  type SaasInvoiceRecord,
  type SaasOrgSubscriptionSnapshot,
  type SaasSubscriptionRecord
} from "./contracts";

// saas_* tables may not yet be in generated Database types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SaasClient = any;

async function resolveClient(client?: SupabaseClient<Database>): Promise<SaasClient> {
  return client ?? (await createAuthServerComponentClient());
}

async function adminClient(): Promise<SaasClient> {
  return createServiceRoleServerClient() as SaasClient;
}

function fromCents(cents: number): number {
  return Math.round(cents) / 100;
}

function mapCustomer(row: Record<string, unknown>): SaasCustomerRecord {
  return {
    id: String(row["id"]),
    organizationId: String(row["organization_id"]),
    provider: String(row["provider"]),
    externalCustomerId: String(row["external_customer_id"]),
    email: typeof row["email"] === "string" ? row["email"] : null
  };
}

function mapSubscription(row: Record<string, unknown>): SaasSubscriptionRecord {
  return {
    id: String(row["id"]),
    organizationId: String(row["organization_id"]),
    saasCustomerId: String(row["saas_customer_id"]),
    provider: String(row["provider"]),
    externalSubscriptionId: String(row["external_subscription_id"]),
    externalPriceId: typeof row["external_price_id"] === "string" ? row["external_price_id"] : null,
    planCode: row["plan_code"] as SaasPlanCode,
    billingInterval: (row["billing_interval"] as SaasBillingInterval | null) ?? null,
    status: row["status"] as SaasSubscriptionRecord["status"],
    trialEndsAt: typeof row["trial_ends_at"] === "string" ? row["trial_ends_at"] : null,
    currentPeriodStart:
      typeof row["current_period_start"] === "string" ? row["current_period_start"] : null,
    currentPeriodEnd: typeof row["current_period_end"] === "string" ? row["current_period_end"] : null,
    cancelAtPeriodEnd: Boolean(row["cancel_at_period_end"]),
    canceledAt: typeof row["canceled_at"] === "string" ? row["canceled_at"] : null,
    endedAt: typeof row["ended_at"] === "string" ? row["ended_at"] : null
  };
}

function mapInvoice(row: Record<string, unknown>): SaasInvoiceRecord {
  return {
    id: String(row["id"]),
    organizationId: String(row["organization_id"]),
    saasSubscriptionId:
      typeof row["saas_subscription_id"] === "string" ? row["saas_subscription_id"] : null,
    provider: String(row["provider"]),
    externalInvoiceId: String(row["external_invoice_id"]),
    status: String(row["status"]),
    currency: String(row["currency"] ?? "usd"),
    amountDue: Number(row["amount_due"] ?? 0),
    amountPaid: Number(row["amount_paid"] ?? 0),
    hostedInvoiceUrl:
      typeof row["hosted_invoice_url"] === "string" ? row["hosted_invoice_url"] : null,
    invoicePdf: typeof row["invoice_pdf"] === "string" ? row["invoice_pdf"] : null,
    periodStart: typeof row["period_start"] === "string" ? row["period_start"] : null,
    periodEnd: typeof row["period_end"] === "string" ? row["period_end"] : null,
    paidAt: typeof row["paid_at"] === "string" ? row["paid_at"] : null
  };
}

async function writeAudit(
  organizationId: string,
  entityType: string,
  entityId: string | null,
  eventType: string,
  summary: string,
  actorUserId: string | null,
  payload: Record<string, unknown>,
  client: SaasClient
) {
  await client.from("saas_audit_events").insert({
    organization_id: organizationId,
    entity_type: entityType,
    entity_id: entityId,
    event_type: eventType,
    summary,
    actor_user_id: actorUserId,
    payload: payload as Json
  });
}

export async function getOrgSaasSnapshot(
  organizationId: string,
  client?: SupabaseClient<Database>
): Promise<SaasOrgSubscriptionSnapshot> {
  const db = await resolveClient(client);
  const { data: customerRow } = await db
    .from("saas_customers")
    .select("*")
    .eq("organization_id", organizationId)
    .maybeSingle();

  const { data: subRows } = await db
    .from("saas_subscriptions")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(5);

  const open = (subRows ?? []).find((row: Record<string, unknown>) =>
    isOpenSubscriptionStatus(String(row["status"]))
  );
  const subscription = open
    ? mapSubscription(open)
    : subRows?.[0]
      ? mapSubscription(subRows[0] as Record<string, unknown>)
      : null;

  const { data: invoiceRows } = await db
    .from("saas_invoices")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(25);

  return {
    customer: customerRow ? mapCustomer(customerRow as Record<string, unknown>) : null,
    subscription,
    invoices: (invoiceRows ?? []).map((row: Record<string, unknown>) => mapInvoice(row)),
    catalog: listConfiguredPlanPrices()
  };
}

export async function ensureSaasCustomer(
  organizationId: string,
  actorUserId: string,
  input: { email?: string | null; name?: string | null },
  client?: SupabaseClient<Database>
): Promise<SaasCustomerRecord> {
  const db = await resolveClient(client);
  const provider = getSaasBillingProvider();
  const { data: existing } = await db
    .from("saas_customers")
    .select("*")
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (existing) return mapCustomer(existing as Record<string, unknown>);

  const ref = await provider.ensureCustomer({
    organizationId,
    ...(input.email !== undefined ? { email: input.email } : {}),
    ...(input.name !== undefined ? { name: input.name } : {}),
    metadata: { mpa_rail: "saas" }
  });

  const { data: inserted, error } = await db
    .from("saas_customers")
    .insert({
      organization_id: organizationId,
      provider: provider.id,
      external_customer_id: ref.externalCustomerId,
      email: input.email ?? null,
      metadata: { mpa_rail: "saas" }
    })
    .select("*")
    .single();

  if (error || !inserted) {
    throw new Error(error?.message ?? "Failed to create saas_customers row");
  }

  await writeAudit(
    organizationId,
    "saas_customer",
    String(inserted["id"]),
    "saas.customer.created",
    "SaaS Stripe customer ensured",
    actorUserId,
    { externalCustomerId: ref.externalCustomerId, provider: provider.id },
    db
  );

  return mapCustomer(inserted as Record<string, unknown>);
}

export async function createSaasCheckoutSession(
  organizationId: string,
  actorUserId: string,
  input: {
    planCode: SaasPlanCode;
    billingInterval: SaasBillingInterval;
    successUrl: string;
    cancelUrl: string;
    email?: string | null;
    name?: string | null;
    withTrial?: boolean;
  },
  client?: SupabaseClient<Database>
) {
  const db = await resolveClient(client);
  const snapshot = await getOrgSaasSnapshot(organizationId, db);
  if (snapshot.subscription && isOpenSubscriptionStatus(snapshot.subscription.status)) {
    throw new Error("Organization already has an open SaaS subscription");
  }

  const planCode: SaasPlanCode = input.withTrial ? "trial" : input.planCode;
  const priceRef = resolvePriceId(planCode === "trial" ? "trial" : input.planCode, input.billingInterval);
  if (!priceRef) {
    throw new Error(`No Stripe price configured for ${input.planCode}/${input.billingInterval}`);
  }

  const customer = await ensureSaasCustomer(
    organizationId,
    actorUserId,
    {
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.name !== undefined ? { name: input.name } : {})
    },
    db
  );

  const provider = getSaasBillingProvider(customer.provider);
  const session = await provider.createCheckoutSession({
    organizationId,
    externalCustomerId: customer.externalCustomerId,
    priceId: priceRef.priceId,
    planCode: planCode === "trial" ? "professional" : input.planCode,
    billingInterval: input.billingInterval,
    successUrl: input.successUrl,
    cancelUrl: input.cancelUrl,
    trialPeriodDays: input.withTrial || planCode === "trial" ? priceRef.trialPeriodDays ?? 14 : null
  });

  await writeAudit(
    organizationId,
    "saas_checkout",
    null,
    "saas.checkout.created",
    `Checkout started for ${input.planCode}/${input.billingInterval}`,
    actorUserId,
    {
      sessionId: session.sessionId,
      planCode: input.planCode,
      billingInterval: input.billingInterval,
      withTrial: Boolean(input.withTrial),
      provider: provider.id
    },
    db
  );

  return session;
}

export async function createSaasPortalSession(
  organizationId: string,
  actorUserId: string,
  returnUrl: string,
  client?: SupabaseClient<Database>
) {
  const db = await resolveClient(client);
  const snapshot = await getOrgSaasSnapshot(organizationId, db);
  if (!snapshot.customer) {
    throw new Error("No SaaS customer for organization");
  }
  const provider = getSaasBillingProvider(snapshot.customer.provider);
  const portal = await provider.createPortalSession({
    externalCustomerId: snapshot.customer.externalCustomerId,
    returnUrl
  });

  await writeAudit(
    organizationId,
    "saas_portal",
    snapshot.customer.id,
    "saas.portal.created",
    "Customer Portal session created",
    actorUserId,
    { provider: provider.id },
    db
  );

  return portal;
}

async function resolveOrgIdForCustomer(
  admin: SaasClient,
  providerId: string,
  externalCustomerId: string | null | undefined,
  hintedOrgId?: string | null
): Promise<string | null> {
  if (hintedOrgId) return hintedOrgId;
  if (!externalCustomerId) return null;
  const { data } = await admin
    .from("saas_customers")
    .select("organization_id")
    .eq("provider", providerId)
    .eq("external_customer_id", externalCustomerId)
    .maybeSingle();
  return data ? String(data["organization_id"]) : null;
}

async function upsertMirroredSubscription(
  admin: SaasClient,
  providerId: string,
  organizationId: string,
  subscription: NormalizedSubscription
): Promise<SaasSubscriptionRecord> {
  const { data: customer } = await admin
    .from("saas_customers")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("provider", providerId)
    .maybeSingle();

  let customerId = customer ? String(customer["id"]) : null;
  if (!customerId) {
    const { data: created, error } = await admin
      .from("saas_customers")
      .insert({
        organization_id: organizationId,
        provider: providerId,
        external_customer_id: subscription.externalCustomerId,
        metadata: { mpa_rail: "saas", mirrored: true }
      })
      .select("*")
      .single();
    if (error || !created) throw new Error(error?.message ?? "mirror customer failed");
    customerId = String(created["id"]);
  } else if (
    customer &&
    String(customer["external_customer_id"]) !== subscription.externalCustomerId &&
    subscription.externalCustomerId
  ) {
    await admin
      .from("saas_customers")
      .update({
        external_customer_id: subscription.externalCustomerId,
        updated_at: new Date().toISOString()
      })
      .eq("id", customerId);
  }

  const planCode: SaasPlanCode = subscription.planCode ?? "professional";
  const payload = {
    organization_id: organizationId,
    saas_customer_id: customerId,
    provider: providerId,
    external_subscription_id: subscription.externalSubscriptionId,
    external_price_id: subscription.externalPriceId,
    plan_code: planCode,
    billing_interval: subscription.billingInterval,
    status: subscription.status,
    trial_ends_at: subscription.trialEndsAt,
    current_period_start: subscription.currentPeriodStart,
    current_period_end: subscription.currentPeriodEnd,
    cancel_at_period_end: subscription.cancelAtPeriodEnd,
    canceled_at: subscription.canceledAt,
    ended_at: subscription.endedAt,
    updated_at: new Date().toISOString(),
    metadata: { mpa_rail: "saas" }
  };

  const { data: existing } = await admin
    .from("saas_subscriptions")
    .select("id")
    .eq("provider", providerId)
    .eq("external_subscription_id", subscription.externalSubscriptionId)
    .maybeSingle();

  let row: Record<string, unknown>;
  if (existing) {
    const { data: updated, error } = await admin
      .from("saas_subscriptions")
      .update(payload)
      .eq("id", existing["id"])
      .select("*")
      .single();
    if (error || !updated) throw new Error(error?.message ?? "subscription update failed");
    row = updated as Record<string, unknown>;
  } else {
    const { data: inserted, error } = await admin
      .from("saas_subscriptions")
      .insert(payload)
      .select("*")
      .single();
    if (error || !inserted) throw new Error(error?.message ?? "subscription insert failed");
    row = inserted as Record<string, unknown>;
  }

  await admin.from("saas_entitlement_snapshots").upsert(
    {
      organization_id: organizationId,
      plan_code: planCode,
      features: {},
      limits: {},
      source_subscription_id: row["id"],
      computed_at: new Date().toISOString()
    },
    { onConflict: "organization_id" }
  );

  return mapSubscription(row);
}

async function upsertMirroredInvoice(
  admin: SaasClient,
  providerId: string,
  organizationId: string,
  invoice: NormalizedSaasInvoice
): Promise<void> {
  let subscriptionId: string | null = null;
  if (invoice.externalSubscriptionId) {
    const { data: sub } = await admin
      .from("saas_subscriptions")
      .select("id")
      .eq("provider", providerId)
      .eq("external_subscription_id", invoice.externalSubscriptionId)
      .maybeSingle();
    subscriptionId = sub ? String(sub["id"]) : null;
  }

  const payload = {
    organization_id: organizationId,
    saas_subscription_id: subscriptionId,
    provider: providerId,
    external_invoice_id: invoice.externalInvoiceId,
    status: invoice.status,
    currency: invoice.currency,
    amount_due: fromCents(invoice.amountDueCents),
    amount_paid: fromCents(invoice.amountPaidCents),
    hosted_invoice_url: invoice.hostedInvoiceUrl,
    invoice_pdf: invoice.invoicePdf,
    period_start: invoice.periodStart,
    period_end: invoice.periodEnd,
    paid_at: invoice.paidAt,
    updated_at: new Date().toISOString(),
    metadata: { mpa_rail: "saas" }
  };

  const { data: existing } = await admin
    .from("saas_invoices")
    .select("id")
    .eq("provider", providerId)
    .eq("external_invoice_id", invoice.externalInvoiceId)
    .maybeSingle();

  if (existing) {
    await admin.from("saas_invoices").update(payload).eq("id", existing["id"]);
  } else {
    await admin.from("saas_invoices").insert(payload);
  }
}

/**
 * Apply SaaS Billing webhooks. Isolated from payments/Connect apply paths.
 */
export async function applySaasProviderWebhook(
  providerId: string,
  payload: unknown,
  headers: Record<string, string>
) {
  const provider = getSaasBillingProvider(providerId);
  const events = await provider.parseWebhook(payload, headers);
  const admin = await adminClient();
  const results = [];

  for (const event of events) {
    const { data: existing } = await admin
      .from("saas_webhook_events")
      .select("id")
      .eq("provider", provider.id)
      .eq("external_event_id", event.externalEventId)
      .maybeSingle();
    if (existing) {
      results.push({ externalEventId: event.externalEventId, ignored: true, reason: "duplicate" });
      continue;
    }

    await admin.from("saas_webhook_events").insert({
      provider: provider.id,
      external_event_id: event.externalEventId,
      event_type: event.type,
      payload: {
        type: event.type,
        externalSubscriptionId: event.externalSubscriptionId,
        externalCustomerId: event.externalCustomerId
      } as Json,
      status: "received"
    });

    try {
      if (event.type === "ignored") {
        await admin
          .from("saas_webhook_events")
          .update({ status: "ignored", processed_at: new Date().toISOString() })
          .eq("provider", provider.id)
          .eq("external_event_id", event.externalEventId);
        results.push({ externalEventId: event.externalEventId, ignored: true, reason: event.message });
        continue;
      }

      if (event.type === "checkout_completed") {
        if (event.externalSubscriptionId) {
          const sub = await provider.getSubscription(event.externalSubscriptionId);
          const orgId = await resolveOrgIdForCustomer(
            admin,
            provider.id,
            sub.externalCustomerId || event.externalCustomerId,
            event.organizationId
          );
          if (!orgId) {
            results.push({
              externalEventId: event.externalEventId,
              ignored: true,
              reason: "org not found for checkout"
            });
            continue;
          }
          await upsertMirroredSubscription(admin, provider.id, orgId, sub);
          await writeAudit(
            orgId,
            "saas_subscription",
            null,
            "saas.checkout.completed",
            "Checkout completed; subscription mirrored",
            null,
            { externalSubscriptionId: sub.externalSubscriptionId },
            admin
          );
          await admin
            .from("saas_webhook_events")
            .update({
              status: "processed",
              organization_id: orgId,
              processed_at: new Date().toISOString()
            })
            .eq("provider", provider.id)
            .eq("external_event_id", event.externalEventId);
          results.push({ externalEventId: event.externalEventId, applied: true, type: event.type });
          continue;
        }
        results.push({
          externalEventId: event.externalEventId,
          ignored: true,
          reason: "checkout without subscription"
        });
        continue;
      }

      if (
        (event.type === "subscription_upsert" || event.type === "subscription_deleted") &&
        event.subscription
      ) {
        const orgId = await resolveOrgIdForCustomer(
          admin,
          provider.id,
          event.subscription.externalCustomerId || event.externalCustomerId,
          event.organizationId
        );
        if (!orgId) {
          results.push({
            externalEventId: event.externalEventId,
            ignored: true,
            reason: "org not found for subscription"
          });
          continue;
        }
        const mirrored = await upsertMirroredSubscription(
          admin,
          provider.id,
          orgId,
          event.subscription
        );
        await writeAudit(
          orgId,
          "saas_subscription",
          mirrored.id,
          event.type === "subscription_deleted" ? "saas.subscription.deleted" : "saas.subscription.upserted",
          `Subscription ${event.subscription.status}`,
          null,
          { externalSubscriptionId: mirrored.externalSubscriptionId, status: mirrored.status },
          admin
        );
        await admin
          .from("saas_webhook_events")
          .update({
            status: "processed",
            organization_id: orgId,
            processed_at: new Date().toISOString()
          })
          .eq("provider", provider.id)
          .eq("external_event_id", event.externalEventId);
        results.push({ externalEventId: event.externalEventId, applied: true, type: event.type });
        continue;
      }

      if (
        (event.type === "invoice_upsert" || event.type === "invoice_payment_failed") &&
        event.invoice
      ) {
        const orgId = await resolveOrgIdForCustomer(
          admin,
          provider.id,
          event.invoice.externalCustomerId || event.externalCustomerId,
          event.organizationId
        );
        if (!orgId) {
          await admin
            .from("saas_webhook_events")
            .update({
              status: "failed",
              processed_at: new Date().toISOString()
            })
            .eq("provider", provider.id)
            .eq("external_event_id", event.externalEventId);
          results.push({
            externalEventId: event.externalEventId,
            failed: true,
            reason: "org not found for invoice"
          });
          continue;
        }
        await upsertMirroredInvoice(admin, provider.id, orgId, event.invoice);

        if (event.type === "invoice_payment_failed" && event.externalSubscriptionId) {
          await admin
            .from("saas_subscriptions")
            .update({ status: "past_due", updated_at: new Date().toISOString() })
            .eq("provider", provider.id)
            .eq("external_subscription_id", event.externalSubscriptionId);
        }

        await writeAudit(
          orgId,
          "saas_invoice",
          null,
          event.type === "invoice_payment_failed" ? "saas.invoice.payment_failed" : "saas.invoice.upserted",
          `Invoice ${event.invoice.externalInvoiceId} ${event.invoice.status}`,
          null,
          { externalInvoiceId: event.invoice.externalInvoiceId },
          admin
        );

        await admin
          .from("saas_webhook_events")
          .update({
            status: "processed",
            organization_id: orgId,
            processed_at: new Date().toISOString()
          })
          .eq("provider", provider.id)
          .eq("external_event_id", event.externalEventId);
        results.push({ externalEventId: event.externalEventId, applied: true, type: event.type });
        continue;
      }

      await admin
        .from("saas_webhook_events")
        .update({ status: "ignored", processed_at: new Date().toISOString() })
        .eq("provider", provider.id)
        .eq("external_event_id", event.externalEventId);
      results.push({ externalEventId: event.externalEventId, ignored: true, reason: "unhandled" });
    } catch (err) {
      await admin
        .from("saas_webhook_events")
        .update({ status: "failed", processed_at: new Date().toISOString() })
        .eq("provider", provider.id)
        .eq("external_event_id", event.externalEventId);
      results.push({
        externalEventId: event.externalEventId,
        failed: true,
        error: err instanceof Error ? err.message : "apply failed"
      });
    }
  }

  return { results, provider: resolveDefaultSaasBillingProviderId() };
}

/** Phase A helper: mirror a noop/stripe sandbox subscription without Checkout (tests/ops). */
export async function mirrorSandboxSubscription(
  organizationId: string,
  actorUserId: string,
  input?: { planCode?: SaasPlanCode; status?: "active" | "trialing" }
) {
  const provider = getSaasBillingProvider();
  const admin = await adminClient();
  const customer = await ensureSaasCustomer(organizationId, actorUserId, {}, admin);
  const externalSubscriptionId = `${provider.id}_sub_${organizationId.slice(0, 8)}_${Date.now()}`;
  const now = new Date();
  const status = input?.status ?? "active";
  const mirrored = await upsertMirroredSubscription(admin, provider.id, organizationId, {
    externalSubscriptionId,
    externalCustomerId: customer.externalCustomerId,
    externalPriceId: `price_saas_sandbox_${input?.planCode ?? "professional"}_month`,
    status,
    planCode: input?.planCode ?? "professional",
    billingInterval: "month",
    trialEndsAt: status === "trialing" ? new Date(now.getTime() + 14 * 86400000).toISOString() : null,
    currentPeriodStart: now.toISOString(),
    currentPeriodEnd: new Date(now.getTime() + 30 * 86400000).toISOString(),
    cancelAtPeriodEnd: false,
    canceledAt: null,
    endedAt: null
  });
  await writeAudit(
    organizationId,
    "saas_subscription",
    mirrored.id,
    "saas.subscription.sandbox_mirrored",
    "Sandbox subscription mirrored",
    actorUserId,
    { externalSubscriptionId, status },
    admin
  );
  return mirrored;
}
