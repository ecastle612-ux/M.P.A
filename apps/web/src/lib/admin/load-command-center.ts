import {
  isBillingCycle,
  isProductSku,
  isResendDeliveryConfigured,
  type BillingCycle,
  type ProductSku
} from "@mpa/shared";
import { createAuthServerClient } from "../auth/server";
import { serverEnv } from "../env/server-env";
import { listDemoSessionDiagnostics } from "../demo/session-store";
import { listProvisioningJobsFromDb } from "../saas-provisioning/jobs-store";
import { listLifecycleSubscriptions } from "../saas-lifecycle/lifecycle-store";
import { isSaasCheckoutReady, isSaasStripeConfigured } from "../saas-stripe/client";
import {
  listSaasPurchases,
  listSaasWebhookEvents,
  type StoredSaasPurchase,
  type StoredSaasWebhookEvent
} from "../saas-stripe/purchase-store";
import { loadPublicCatalogPrices } from "../saas-stripe/public-prices-server";
import { listRecentPlatformErrorEvents } from "../observability/durable-errors";
import { getSentryDsn } from "../observability/sentry-sink";
import {
  buildCommandCenterSnapshot,
  offerPriceKey,
  type CommandCenterActivityItem,
  type CommandCenterSnapshot,
  type OrgMetricRow,
  type PriceLookup
} from "./command-center-metrics";

type CheckoutSessionRow = {
  stripe_checkout_session_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  catalog_offer_id: string;
  product_sku: string;
  plan_tier: string;
  billing_cycle: string;
  status: string;
  customer_email: string | null;
  idempotency_key: string | null;
  demo_session_id: string | null;
  metadata: Record<string, string> | null;
  provisioned: boolean;
  organization_id: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
};

type WebhookEventRow = {
  stripe_event_id: string;
  event_type: string;
  payload: unknown;
  processed_at: string | null;
  checkout_session_id: string | null;
  created_at: string;
};

type SubscriptionRow = {
  organization_id: string;
  sku_code: string;
  status: string;
  plan_tier: string | null;
  billing_cycle: string | null;
};

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

async function loadCheckoutSessionsFromDb(): Promise<StoredSaasPurchase[]> {
  const service = await tryServiceRole();
  if (!service) return listSaasPurchases();
  // Table exists in migrations; generated Database types lag Slice C/D.
  const { data, error } = await (service as unknown as {
    from: (table: string) => {
      select: (cols: string) => {
        order: (
          col: string,
          opts: { ascending: boolean }
        ) => { limit: (n: number) => Promise<{ data: CheckoutSessionRow[] | null; error: { message: string } | null }> };
      };
    };
  })
    .from("saas_checkout_sessions")
    .select(
      "stripe_checkout_session_id, stripe_customer_id, stripe_subscription_id, catalog_offer_id, product_sku, plan_tier, billing_cycle, status, customer_email, idempotency_key, demo_session_id, metadata, provisioned, organization_id, user_id, created_at, updated_at"
    )
    .order("created_at", { ascending: false })
    .limit(40);
  if (error || !data?.length) return listSaasPurchases();
  return data.map((row) => ({
    id: row.stripe_checkout_session_id,
    stripeCheckoutSessionId: row.stripe_checkout_session_id,
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    catalogOfferId: row.catalog_offer_id,
    productSku: (isProductSku(row.product_sku) ? row.product_sku : "mpa_property_manager") as ProductSku,
    planTier: row.plan_tier as StoredSaasPurchase["planTier"],
    billingCycle: row.billing_cycle as BillingCycle,
    status: row.status as StoredSaasPurchase["status"],
    customerEmail: row.customer_email,
    idempotencyKey: row.idempotency_key,
    demoSessionId: row.demo_session_id,
    metadata: (row.metadata ?? {}) as Record<string, string>,
    provisioned: Boolean(row.provisioned),
    organizationId: row.organization_id,
    userId: row.user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

async function loadWebhookEventsFromDb(): Promise<StoredSaasWebhookEvent[]> {
  const service = await tryServiceRole();
  if (!service) return listSaasWebhookEvents();
  const { data, error } = await (service as unknown as {
    from: (table: string) => {
      select: (cols: string) => {
        order: (
          col: string,
          opts: { ascending: boolean }
        ) => { limit: (n: number) => Promise<{ data: WebhookEventRow[] | null; error: { message: string } | null }> };
      };
    };
  })
    .from("saas_stripe_webhook_events")
    .select("stripe_event_id, event_type, payload, processed_at, checkout_session_id, created_at")
    .order("created_at", { ascending: false })
    .limit(40);
  if (error || !data?.length) return listSaasWebhookEvents();
  return data.map((row) => ({
    stripeEventId: row.stripe_event_id,
    eventType: row.event_type,
    payload: row.payload,
    processedAt: row.processed_at,
    checkoutSessionId: row.checkout_session_id,
    createdAt: row.created_at
  }));
}

async function buildPriceLookup(): Promise<PriceLookup> {
  const unitAmountByOfferKey: Record<string, number> = {};
  const catalog = await loadPublicCatalogPrices();
  for (const price of catalog.prices) {
    const key = offerPriceKey(price.productSku, "professional", price.billingCycle);
    if (key) unitAmountByOfferKey[key] = price.unitAmount;
  }
  return { unitAmountByOfferKey };
}

export async function loadCommandCenterSnapshot(): Promise<CommandCenterSnapshot> {
  const supabase = await createAuthServerClient();
  const service = await tryServiceRole();
  const db = service ?? supabase;

  let supabaseOk = true;
  let supabaseDetail = "Organizations query healthy";

  const { data: organizations, error: orgError } = await db
    .from("organizations")
    .select("id, name, slug, created_at")
    .order("created_at", { ascending: false });

  if (orgError) {
    supabaseOk = false;
    supabaseDetail = orgError.message;
  }

  const orgIds = (organizations ?? []).map((organization) => organization.id);

  const subscriptionsQuery = orgIds.length
    ? (db as unknown as {
        from: (table: string) => {
          select: (cols: string) => {
            in: (
              col: string,
              vals: string[]
            ) => Promise<{ data: SubscriptionRow[] | null; error: { message: string } | null }>;
          };
        };
      })
        .from("organization_subscriptions")
        .select("organization_id, sku_code, status, plan_tier, billing_cycle")
        .in("organization_id", orgIds)
    : null;
  const setupsQuery = orgIds.length
    ? db.from("organization_setup_state").select("organization_id, completed_at").in("organization_id", orgIds)
    : null;

  const [{ data: subscriptions }, { data: setups }, { data: memberships }, { data: operators }] =
    await Promise.all([
      subscriptionsQuery ?? Promise.resolve({ data: [] as SubscriptionRow[] }),
      setupsQuery ?? Promise.resolve({ data: [] as Array<{ organization_id: string; completed_at: string | null }> }),
      db.from("organization_memberships").select("roles, status"),
      db.from("platform_operators").select("user_id, status")
    ]);

  const subscriptionByOrg = new Map(
    ((subscriptions ?? []) as SubscriptionRow[]).map((row) => [row.organization_id, row] as const)
  );
  const setupCompleteByOrg = new Map(
    ((setups ?? []) as Array<{ organization_id: string; completed_at: string | null }>).map((row) => [
      row.organization_id,
      Boolean(row.completed_at)
    ] as const)
  );

  const orgRows: OrgMetricRow[] = (organizations ?? []).map((organization) => {
    const subscription = subscriptionByOrg.get(organization.id);
    const skuRaw = subscription?.sku_code ?? "";
    const cycleRaw = subscription?.billing_cycle ?? "";
    return {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      createdAt: organization.created_at,
      subscriptionStatus: subscription?.status ?? null,
      setupComplete: setupCompleteByOrg.get(organization.id) ?? false,
      productSku: isProductSku(skuRaw) ? skuRaw : null,
      planTier: subscription?.plan_tier ?? "professional",
      billingCycle: isBillingCycle(cycleRaw) ? cycleRaw : null
    };
  });

  const [provisioningJobs, purchases, webhookEvents, priceLookup] = await Promise.all([
    listProvisioningJobsFromDb(60),
    loadCheckoutSessionsFromDb(),
    loadWebhookEventsFromDb(),
    buildPriceLookup()
  ]);

  const demoSessions = listDemoSessionDiagnostics();
  const operatorCount = ((operators ?? []) as Array<{ status: string | null }>).filter(
    (row) => row.status === "active"
  ).length;

  const errorRows = await listRecentPlatformErrorEvents(20);
  const criticalErrors: CommandCenterActivityItem[] = errorRows.map((row) => ({
    id: `err-${row.id}`,
    at: row.created_at,
    title: `[${row.severity}] ${row.message}`,
    detail: [row.route, row.request_id ? `req ${row.request_id}` : null, row.organization_id]
      .filter(Boolean)
      .join(" · "),
    href: "/admin#critical-errors"
  }));

  return buildCommandCenterSnapshot({
    organizations: orgRows,
    memberships: ((memberships ?? []) as Array<{ roles: unknown; status: string | null }>).map((row) => ({
      roles: Array.isArray(row.roles) ? (row.roles as string[]) : [],
      status: row.status
    })),
    operatorCount,
    provisioningJobs,
    purchases,
    webhookEvents,
    lifecycle: await listLifecycleSubscriptions(),
    priceLookup,
    criticalErrors,
    sentryConfigured: Boolean(getSentryDsn()),
    system: {
      stripeConfigured: isSaasStripeConfigured(),
      stripeCheckoutReady: isSaasCheckoutReady(),
      supabaseOk,
      supabaseDetail,
      emailConfigured: isResendDeliveryConfigured(),
      demoSessions: demoSessions.length,
      demoOk: true
    }
  });
}
