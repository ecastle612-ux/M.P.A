/**
 * Sprint 2 — Platform Operations read models (visibility only).
 */

import {
  isBillingCycle,
  isProductSku,
  isProvisioningComplete,
  isTerminalFailure,
  toSkuLabel,
  type BillingCycle,
  type ProductSku,
  type ProvisioningJob
} from "@mpa/shared";
import { createAuthServerClient } from "../auth/server";
import { serverEnv } from "../env/server-env";
import { listDemoSessionDiagnostics } from "../demo/session-store";
import { listProvisioningJobsFromDb } from "../saas-provisioning/jobs-store";
import { listSaasLifecycleEventsFromDb } from "../saas-lifecycle/lifecycle-events-store";
import { isSaasCheckoutReady, isSaasStripeConfigured } from "../saas-stripe/client";
import {
  listSaasPurchases,
  listSaasWebhookEvents,
  type StoredSaasPurchase
} from "../saas-stripe/purchase-store";
import { loadPublicCatalogPrices } from "../saas-stripe/public-prices-server";
import {
  classifyOrganizationBucket,
  formatUsdFromCents,
  monthlyRecurringCents,
  offerPriceKey,
  type HealthTone
} from "./command-center-metrics";

export type OpsOrgRow = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  statusBucket: string;
  subscriptionStatus: string | null;
  productSku: ProductSku | null;
  productLabel: string | null;
  planTier: string | null;
  billingCycle: BillingCycle | null;
  setupComplete: boolean;
  provisioningState: string;
  lastActivityAt: string;
  health: HealthTone;
  memberCount: number;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
};

export type OpsCustomerRow = {
  id: string;
  userId: string;
  organizationId: string;
  organizationName: string;
  roles: string[];
  status: string;
  updatedAt: string;
  pendingSetup: boolean;
  invitationPending: boolean;
};

export type OpsInvitationRow = {
  id: string;
  email: string;
  organizationId: string;
  organizationName: string;
  roles: string[];
  status: string;
  createdAt: string;
};

export type OpsSubscriptionRow = {
  organizationId: string;
  organizationName: string;
  productSku: ProductSku | null;
  productLabel: string | null;
  status: string;
  planTier: string | null;
  billingCycle: BillingCycle | null;
  mrrCents: number;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  provisioningState: string;
};

export type OpsSupportEvent = {
  id: string;
  at: string;
  kind: string;
  title: string;
  detail: string;
  href?: string;
};

export type OpsSystemItem = {
  id: string;
  label: string;
  tone: HealthTone;
  detail: string;
};

export type OpsOperatorRow = {
  userId: string;
  status: string;
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

type SubRow = {
  organization_id: string;
  sku_code: string;
  status: string;
  plan_tier: string | null;
  billing_cycle: string | null;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
};

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

type InvitationRow = {
  id: string;
  email: string;
  organization_id: string;
  roles: string[];
  status: string;
  created_at: string;
};

function provisioningLabel(jobs: ProvisioningJob[]): string {
  if (!jobs.length) return "none";
  const latest = [...jobs].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  return latest?.checkpoint ?? "none";
}

function orgHealth(bucket: string, provisioningState: string): HealthTone {
  if (bucket === "suspended" || isTerminalFailure(provisioningState as never)) return "down";
  if (bucket === "pending_provisioning") return "warn";
  if (bucket === "trial") return "info";
  if (bucket === "active") return "ok";
  return "unknown";
}

export async function loadOpsDirectories(): Promise<{
  organizations: OpsOrgRow[];
  customers: OpsCustomerRow[];
  invitations: OpsInvitationRow[];
  subscriptions: OpsSubscriptionRow[];
  purchases: StoredSaasPurchase[];
  provisioningJobs: ProvisioningJob[];
  supportEvents: OpsSupportEvent[];
  system: OpsSystemItem[];
  operators: OpsOperatorRow[];
  commercial: {
    activeSubscriptions: number;
    mrrCents: number;
    arrCents: number;
    mrrFormatted: string;
    arrFormatted: string;
    failedProvisioning: number;
  };
}> {
  const supabase = await createAuthServerClient();
  const service = await tryServiceRole();
  const db = service ?? supabase;

  const { data: organizations } = await db
    .from("organizations")
    .select("id, name, slug, created_at")
    .order("created_at", { ascending: false });

  const orgIds = (organizations ?? []).map((o) => o.id);
  const orgNameById = new Map((organizations ?? []).map((o) => [o.id, o.name] as const));

  const subsQuery = orgIds.length
    ? (db as unknown as {
        from: (t: string) => {
          select: (c: string) => {
            in: (col: string, vals: string[]) => Promise<{ data: SubRow[] | null }>;
          };
        };
      })
        .from("organization_subscriptions")
        .select(
          "organization_id, sku_code, status, plan_tier, billing_cycle, stripe_customer_id, stripe_subscription_id"
        )
        .in("organization_id", orgIds)
    : null;

  const [
    { data: subscriptions },
    { data: setups },
    { data: memberships },
    { data: invitations },
    { data: operators }
  ] = await Promise.all([
    subsQuery ?? Promise.resolve({ data: [] as SubRow[] }),
    orgIds.length
      ? db.from("organization_setup_state").select("organization_id, completed_at").in("organization_id", orgIds)
      : Promise.resolve({ data: [] as Array<{ organization_id: string; completed_at: string | null }> }),
    db.from("organization_memberships").select("id, user_id, organization_id, roles, status, updated_at, created_at"),
    (db as unknown as {
      from: (t: string) => {
        select: (c: string) => Promise<{ data: InvitationRow[] | null }>;
      };
    })
      .from("organization_invitations")
      .select("id, email, organization_id, roles, status, created_at"),
    db.from("platform_operators").select("user_id, status")
  ]);

  const subByOrg = new Map(((subscriptions ?? []) as SubRow[]).map((s) => [s.organization_id, s] as const));
  const setupByOrg = new Map(
    ((setups ?? []) as Array<{ organization_id: string; completed_at: string | null }>).map((s) => [
      s.organization_id,
      Boolean(s.completed_at)
    ] as const)
  );

  const [provisioningJobs, purchases, webhookEvents, lifecycleEvents, priceCatalog] = await Promise.all([
    listProvisioningJobsFromDb(80),
    (async () => {
      const serviceClient = await tryServiceRole();
      if (!serviceClient) return listSaasPurchases();
      const { data, error } = await (serviceClient as unknown as {
        from: (t: string) => {
          select: (c: string) => {
            order: (c2: string, o: { ascending: boolean }) => {
              limit: (n: number) => Promise<{
                data: CheckoutSessionRow[] | null;
                error: unknown;
              }>;
            };
          };
        };
      })
        .from("saas_checkout_sessions")
        .select(
          "stripe_checkout_session_id, stripe_customer_id, stripe_subscription_id, catalog_offer_id, product_sku, plan_tier, billing_cycle, status, customer_email, idempotency_key, demo_session_id, metadata, provisioned, organization_id, user_id, created_at, updated_at"
        )
        .order("created_at", { ascending: false })
        .limit(60);
      if (error || !data?.length) return listSaasPurchases();
      return data.map((row) => ({
        id: row.stripe_checkout_session_id,
        stripeCheckoutSessionId: row.stripe_checkout_session_id,
        stripeCustomerId: row.stripe_customer_id,
        stripeSubscriptionId: row.stripe_subscription_id,
        catalogOfferId: row.catalog_offer_id,
        productSku: (isProductSku(row.product_sku)
          ? row.product_sku
          : "mpa_property_manager") as ProductSku,
        planTier: row.plan_tier as StoredSaasPurchase["planTier"],
        billingCycle: row.billing_cycle as BillingCycle,
        status: row.status as StoredSaasPurchase["status"],
        customerEmail: row.customer_email,
        idempotencyKey: row.idempotency_key,
        demoSessionId: row.demo_session_id,
        metadata: row.metadata ?? {},
        provisioned: Boolean(row.provisioned),
        organizationId: row.organization_id,
        userId: row.user_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    })(),
    listSaasWebhookEvents(),
    listSaasLifecycleEventsFromDb(40),
    loadPublicCatalogPrices()
  ]);

  // Prefer DB webhooks when available
  const serviceClient = await tryServiceRole();
  let webhooks = webhookEvents;
  if (serviceClient) {
    const { data } = await (serviceClient as unknown as {
      from: (t: string) => {
        select: (c: string) => {
          order: (c2: string, o: { ascending: boolean }) => {
            limit: (n: number) => Promise<{ data: WebhookEventRow[] | null }>;
          };
        };
      };
    })
      .from("saas_stripe_webhook_events")
      .select("stripe_event_id, event_type, payload, processed_at, checkout_session_id, created_at")
      .order("created_at", { ascending: false })
      .limit(40);
    if (data?.length) {
      webhooks = data.map((row) => ({
        stripeEventId: row.stripe_event_id,
        eventType: row.event_type,
        payload: row.payload,
        processedAt: row.processed_at,
        checkoutSessionId: row.checkout_session_id,
        createdAt: row.created_at
      }));
    }
  }

  const jobsByOrg = new Map<string, ProvisioningJob[]>();
  for (const job of provisioningJobs) {
    if (!job.organizationId) continue;
    const list = jobsByOrg.get(job.organizationId) ?? [];
    list.push(job);
    jobsByOrg.set(job.organizationId, list);
  }

  const memberCountByOrg = new Map<string, number>();
  for (const m of memberships ?? []) {
    const oid = String(m.organization_id);
    memberCountByOrg.set(oid, (memberCountByOrg.get(oid) ?? 0) + 1);
  }

  const unitAmountByOfferKey: Record<string, number> = {};
  for (const price of priceCatalog.prices) {
    const key = offerPriceKey(price.productSku, "professional", price.billingCycle);
    if (key) unitAmountByOfferKey[key] = price.unitAmount;
  }

  const orgRows: OpsOrgRow[] = (organizations ?? []).map((org) => {
    const sub = subByOrg.get(org.id);
    const skuRaw = sub?.sku_code ?? "";
    const cycleRaw = sub?.billing_cycle ?? "";
    const productSku = isProductSku(skuRaw) ? skuRaw : null;
    const billingCycle = isBillingCycle(cycleRaw) ? cycleRaw : null;
    const setupComplete = setupByOrg.get(org.id) ?? false;
    const jobs = jobsByOrg.get(org.id) ?? [];
    const provisioningState = provisioningLabel(jobs);
    const bucket = classifyOrganizationBucket({
      subscriptionStatus: sub?.status ?? null,
      setupComplete,
      provisioningStatuses: jobs.map((j) => j.checkpoint)
    });
    const lastJob = [...jobs].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
    const lastActivityAt = lastJob?.updatedAt ?? org.created_at;
    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      createdAt: org.created_at,
      statusBucket: bucket,
      subscriptionStatus: sub?.status ?? null,
      productSku,
      productLabel: productSku ? toSkuLabel(productSku) : null,
      planTier: sub?.plan_tier ?? null,
      billingCycle,
      setupComplete,
      provisioningState,
      lastActivityAt,
      health: orgHealth(bucket, provisioningState),
      memberCount: memberCountByOrg.get(org.id) ?? 0,
      stripeCustomerId: sub?.stripe_customer_id ?? null,
      stripeSubscriptionId: sub?.stripe_subscription_id ?? null
    };
  });

  const pendingInviteOrgIds = new Set(
    (invitations ?? [])
      .filter((inv) => inv.status === "pending")
      .map((inv) => inv.organization_id)
  );

  const customerRows: OpsCustomerRow[] = ((memberships ?? []) as Array<{
    id: string;
    user_id: string;
    organization_id: string;
    roles: string[];
    status: string;
    updated_at: string;
  }>).map((m) => ({
    id: m.id,
    userId: m.user_id,
    organizationId: m.organization_id,
    organizationName: orgNameById.get(m.organization_id) ?? m.organization_id,
    roles: Array.isArray(m.roles) ? m.roles : [],
    status: m.status,
    updatedAt: m.updated_at,
    pendingSetup: !(setupByOrg.get(m.organization_id) ?? false),
    invitationPending: pendingInviteOrgIds.has(m.organization_id)
  }));

  const invitationRows: OpsInvitationRow[] = (invitations ?? []).map((inv) => ({
    id: inv.id,
    email: inv.email,
    organizationId: inv.organization_id,
    organizationName: orgNameById.get(inv.organization_id) ?? inv.organization_id,
    roles: Array.isArray(inv.roles) ? inv.roles : [],
    status: inv.status,
    createdAt: inv.created_at
  }));

  let mrrCents = 0;
  let activeSubscriptions = 0;
  const subscriptionRows: OpsSubscriptionRow[] = orgRows
    .filter((o) => o.subscriptionStatus)
    .map((o) => {
      const billable = o.subscriptionStatus === "active" || o.subscriptionStatus === "trialing";
      let rowMrr = 0;
      if (billable && o.productSku && o.billingCycle) {
        activeSubscriptions += 1;
        const key = offerPriceKey(o.productSku, o.planTier, o.billingCycle);
        const unit = key ? (unitAmountByOfferKey[key] ?? null) : null;
        rowMrr = monthlyRecurringCents({ billingCycle: o.billingCycle, unitAmountCents: unit });
        mrrCents += rowMrr;
      }
      return {
        organizationId: o.id,
        organizationName: o.name,
        productSku: o.productSku,
        productLabel: o.productLabel,
        status: o.subscriptionStatus ?? "unknown",
        planTier: o.planTier,
        billingCycle: o.billingCycle,
        mrrCents: rowMrr,
        stripeCustomerId: o.stripeCustomerId,
        stripeSubscriptionId: o.stripeSubscriptionId,
        provisioningState: o.provisioningState
      };
    });

  const failedProvisioning = provisioningJobs.filter((j) => isTerminalFailure(j.checkpoint)).length;

  const supportEvents: OpsSupportEvent[] = [
    ...provisioningJobs
      .filter((j) => isTerminalFailure(j.checkpoint) || !isProvisioningComplete(j.checkpoint))
      .slice(0, 20)
      .map((j) => ({
        id: `prov-${j.id}`,
        at: j.updatedAt,
        kind: isTerminalFailure(j.checkpoint) ? "provisioning_failure" : "provisioning",
        title: `${isProductSku(j.productSku) ? toSkuLabel(j.productSku) : j.productSku} · ${j.checkpoint}`,
        detail: j.lastError ?? j.organizationName ?? j.ownerEmail,
        href: "/admin/commercial/provisioning"
      })),
    ...lifecycleEvents.slice(0, 20).map((e) => ({
      id: `life-${e.stripeEventId}`,
      at: e.processedAt,
      kind: "lifecycle",
      title: e.eventType,
      detail: e.summary ?? e.organizationId ?? e.stripeSubscriptionId ?? "",
      href: "/admin/commercial/lifecycle"
    })),
    ...webhooks
      .filter((w) => !w.processedAt || w.eventType.includes("fail"))
      .slice(0, 15)
      .map((w) => ({
        id: `wh-${w.stripeEventId}`,
        at: w.createdAt,
        kind: "stripe_webhook",
        title: w.eventType,
        detail: w.processedAt ? "Processed" : "Unprocessed",
        href: "/admin/commercial/lifecycle"
      })),
    ...orgRows
      .filter((o) => !o.setupComplete)
      .slice(0, 15)
      .map((o) => ({
        id: `setup-${o.id}`,
        at: o.lastActivityAt,
        kind: "guided_setup",
        title: `${o.name} · Guided Setup incomplete`,
        detail: o.productLabel ?? "No product",
        href: "/admin/platform/organizations"
      }))
  ].sort((a, b) => b.at.localeCompare(a.at));

  const demoSessions = listDemoSessionDiagnostics();
  const system: OpsSystemItem[] = [
    {
      id: "stripe",
      label: "Stripe",
      tone: isSaasStripeConfigured() ? (isSaasCheckoutReady() ? "ok" : "warn") : "down",
      detail: isSaasStripeConfigured()
        ? isSaasCheckoutReady()
          ? "SaaS configured · PM checkout prices ready"
          : "Configured · checkout prices incomplete"
        : "SaaS Stripe not configured"
    },
    {
      id: "supabase",
      label: "Supabase",
      tone: organizations ? "ok" : "down",
      detail: organizations ? `${organizations.length} organizations readable` : "Organizations query failed"
    },
    {
      id: "email",
      label: "Email",
      tone:
        serverEnv.RESEND_API_KEY && serverEnv.RESEND_FROM_EMAIL
          ? "ok"
          : "down",
      detail:
        serverEnv.RESEND_API_KEY && serverEnv.RESEND_FROM_EMAIL
          ? "Resend configured · customer mail delivers"
          : !serverEnv.RESEND_API_KEY && !serverEnv.RESEND_FROM_EMAIL
            ? "Email unavailable · RESEND_API_KEY and RESEND_FROM_EMAIL missing"
            : !serverEnv.RESEND_API_KEY
              ? "Email unavailable · RESEND_API_KEY missing"
              : "Email unavailable · RESEND_FROM_EMAIL missing"
    },
    {
      id: "jobs",
      label: "Background jobs",
      tone: failedProvisioning > 0 ? "warn" : "ok",
      detail: `${provisioningJobs.length} jobs · ${failedProvisioning} terminal failures`
    },
    {
      id: "demo",
      label: "Demo platform",
      tone: "ok",
      detail: `${demoSessions.length} active demo session(s)`
    },
    {
      id: "auth",
      label: "Authentication",
      tone: serverEnv.NEXT_PUBLIC_SUPABASE_URL && serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "ok" : "down",
      detail: "Supabase Auth env present · Master Admin operator-gated"
    },
    {
      id: "environment",
      label: "Environment health",
      tone: serverEnv.NEXT_PUBLIC_APP_URL ? "ok" : "warn",
      detail: `APP_URL ${serverEnv.NEXT_PUBLIC_APP_URL ?? "unset"} · FO_READY gated commercially`
    }
  ];

  return {
    organizations: orgRows,
    customers: customerRows,
    invitations: invitationRows,
    subscriptions: subscriptionRows,
    purchases,
    provisioningJobs,
    supportEvents,
    system,
    operators: ((operators ?? []) as Array<{ user_id: string; status: string }>).map((o) => ({
      userId: o.user_id,
      status: o.status
    })),
    commercial: {
      activeSubscriptions,
      mrrCents,
      arrCents: mrrCents * 12,
      mrrFormatted: formatUsdFromCents(mrrCents),
      arrFormatted: formatUsdFromCents(mrrCents * 12),
      failedProvisioning
    }
  };
}
