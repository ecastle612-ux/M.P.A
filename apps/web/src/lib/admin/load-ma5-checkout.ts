import {
  isProductSku,
  type ProductSku,
  type ProvisioningJob
} from "@mpa/shared";
import { createAuthServerClient } from "../auth/server";
import { serverEnv } from "../env/server-env";
import { listProvisioningJobsFromDb } from "../saas-provisioning/jobs-store";
import {
  listSaasPurchases,
  type StoredSaasPurchase
} from "../saas-stripe/purchase-store";
import {
  buildCheckoutLifecycle,
  filterCheckoutRows,
  mapCheckoutRow,
  paginateRows,
  paginationMeta,
  parseCheckoutFilters,
  type Ma5CheckoutFilters,
  type Ma5CheckoutRow,
  type Ma5Pagination
} from "./ma5-checkout-webhooks";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = { from: (table: string) => any };

async function tryServiceRole(): Promise<AnyClient | null> {
  try {
    if (process.env["VITEST"]) return null;
    if (!serverEnv.SUPABASE_SERVICE_ROLE_KEY) return null;
    const { createServiceRoleClient } = await import("../supabase/service-role");
    return createServiceRoleClient() as unknown as AnyClient;
  } catch {
    return null;
  }
}

const FETCH_CAP = 300;

export type Ma5CheckoutDirectory = {
  rows: Ma5CheckoutRow[];
  filters: Ma5CheckoutFilters;
  pagination: Ma5Pagination;
  degraded: string[];
  limitations: string[];
  totals: {
    matched: number;
    healthy: number;
    attention: number;
    failed: number;
    unknown: number;
  };
};

async function loadPurchases(
  client: AnyClient,
  degraded: string[]
): Promise<{ purchases: StoredSaasPurchase[]; source: "database" | "memory" }> {
  try {
    const { data, error } = await client
      .from("saas_checkout_sessions")
      .select(
        "stripe_checkout_session_id, stripe_customer_id, stripe_subscription_id, catalog_offer_id, product_sku, plan_tier, billing_cycle, status, customer_email, idempotency_key, demo_session_id, metadata, provisioned, organization_id, user_id, created_at, updated_at"
      )
      .order("created_at", { ascending: false })
      .limit(FETCH_CAP);
    if (error) {
      degraded.push(`Checkout sessions: ${error.message}`);
      return { purchases: listSaasPurchases(), source: "memory" };
    }
    if (!data?.length) {
      const mem = listSaasPurchases();
      if (mem.length) {
        degraded.push("Checkout DB empty — showing process-memory purchases (non-authoritative fallback)");
        return { purchases: mem, source: "memory" };
      }
      return { purchases: [], source: "database" };
    }
    const purchases: StoredSaasPurchase[] = (data as Array<Record<string, unknown>>).map((row) => ({
      id: String(row["stripe_checkout_session_id"]),
      stripeCheckoutSessionId: String(row["stripe_checkout_session_id"]),
      stripeCustomerId: typeof row["stripe_customer_id"] === "string" ? row["stripe_customer_id"] : null,
      stripeSubscriptionId:
        typeof row["stripe_subscription_id"] === "string" ? row["stripe_subscription_id"] : null,
      catalogOfferId: String(row["catalog_offer_id"] ?? ""),
      productSku: (isProductSku(String(row["product_sku"] ?? ""))
        ? String(row["product_sku"])
        : "mpa_property_manager") as ProductSku,
      planTier: (row["plan_tier"] as StoredSaasPurchase["planTier"]) ?? "professional",
      billingCycle: (row["billing_cycle"] as StoredSaasPurchase["billingCycle"]) ?? "monthly",
      status: row["status"] as StoredSaasPurchase["status"],
      customerEmail: typeof row["customer_email"] === "string" ? row["customer_email"] : null,
      idempotencyKey: typeof row["idempotency_key"] === "string" ? row["idempotency_key"] : null,
      demoSessionId: typeof row["demo_session_id"] === "string" ? row["demo_session_id"] : null,
      metadata: (row["metadata"] as Record<string, string>) ?? {},
      provisioned: Boolean(row["provisioned"]),
      organizationId: typeof row["organization_id"] === "string" ? row["organization_id"] : null,
      userId: typeof row["user_id"] === "string" ? row["user_id"] : null,
      createdAt: String(row["created_at"] ?? ""),
      updatedAt: String(row["updated_at"] ?? "")
    }));
    return { purchases, source: "database" };
  } catch (e) {
    degraded.push(e instanceof Error ? e.message : "Checkout load failed");
    return { purchases: listSaasPurchases(), source: "memory" };
  }
}

export async function loadMa5CheckoutDirectory(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined> = {}
): Promise<Ma5CheckoutDirectory> {
  const degraded: string[] = [];
  const limitations = [
    "Questionnaire / Confirm Plan stages are not durable — shown as UNKNOWN / DATA UNAVAILABLE.",
    "Quoted checkout amounts are shown only when present on persisted metadata — not recalculated.",
    "saas_checkout_sessions may be empty if writers used process memory only — fallback is labeled."
  ];
  const filters = parseCheckoutFilters(searchParams);
  const service = await tryServiceRole();
  const client = (service ?? ((await createAuthServerClient()) as unknown as AnyClient)) as AnyClient;

  const { purchases, source } = await loadPurchases(client, degraded);
  const jobs = await listProvisioningJobsFromDb(FETCH_CAP);
  const jobBySession = new Map<string, ProvisioningJob>();
  for (const j of jobs) {
    if (j.checkoutSessionId) jobBySession.set(j.checkoutSessionId, j);
  }

  const orgIds = [
    ...new Set(
      purchases
        .map((p) => p.organizationId)
        .concat(jobs.map((j) => j.organizationId))
        .filter((v): v is string => Boolean(v))
    )
  ];
  const orgNameById = new Map<string, string>();
  if (orgIds.length) {
    try {
      const { data } = await client.from("organizations").select("id, name").in("id", orgIds.slice(0, 300));
      for (const o of (data ?? []) as Array<{ id: string; name: string }>) {
        orgNameById.set(o.id, o.name);
      }
    } catch {
      // optional
    }
  }

  const subOrgIds = orgIds.slice(0, 300);
  const subExists = new Set<string>();
  if (subOrgIds.length) {
    try {
      const { data } = await client
        .from("organization_subscriptions")
        .select("organization_id, stripe_subscription_id")
        .in("organization_id", subOrgIds);
      for (const r of (data ?? []) as Array<{ organization_id: string }>) {
        subExists.add(r.organization_id);
      }
    } catch {
      // optional — subscriptionExists stays null when lookup fails
    }
  }

  const mapped = purchases.map((p) => {
    const job = jobBySession.get(p.stripeCheckoutSessionId) ?? null;
    const orgId = p.organizationId ?? job?.organizationId ?? null;
    const subKnown = orgId ? subExists.has(orgId) : null;
    return mapCheckoutRow({
      purchase: p,
      job,
      organizationName: orgId ? orgNameById.get(orgId) ?? null : null,
      subscriptionExists: orgId ? (subOrgIds.length ? subKnown : null) : null,
      source
    });
  });

  if (!service) degraded.push("Service role unavailable — checkout/provisioning may be incomplete under RLS");
  if (purchases.length >= FETCH_CAP) {
    degraded.push(`Checkout result capped at ${FETCH_CAP} — refine filters`);
  }

  const matched = filterCheckoutRows(mapped, filters);
  const rows = paginateRows(matched, filters.page, filters.pageSize);
  const pagination = paginationMeta(matched.length, filters.page, filters.pageSize);

  const toneOf = (r: Ma5CheckoutRow) =>
    r.checkoutHealth === "failed" || r.provisioningHealth === "failed"
      ? "failed"
      : r.checkoutHealth === "attention" || r.provisioningHealth === "attention"
        ? "attention"
        : r.checkoutHealth === "unknown" && r.provisioningHealth === "unknown"
          ? "unknown"
          : "healthy";

  return {
    rows,
    filters,
    pagination,
    degraded,
    limitations,
    totals: {
      matched: matched.length,
      healthy: matched.filter((r) => toneOf(r) === "healthy").length,
      attention: matched.filter((r) => toneOf(r) === "attention").length,
      failed: matched.filter((r) => toneOf(r) === "failed").length,
      unknown: matched.filter((r) => toneOf(r) === "unknown").length
    }
  };
}

export async function loadMa5CheckoutDetail(sessionId: string): Promise<{
  row: Ma5CheckoutRow | null;
  lifecycle: ReturnType<typeof buildCheckoutLifecycle>;
  job: ProvisioningJob | null;
  degraded: string[];
  limitations: string[];
}> {
  const directory = await loadMa5CheckoutDirectory({ q: sessionId, page: "1", pageSize: "50" });
  const row =
    directory.rows.find((r) => r.stripeCheckoutSessionId === sessionId) ??
    directory.rows[0] ??
    null;
  const jobs = await listProvisioningJobsFromDb(200);
  const job = row
    ? jobs.find((j) => j.checkoutSessionId === row.stripeCheckoutSessionId) ?? null
    : null;
  return {
    row,
    lifecycle: row ? buildCheckoutLifecycle(row, job) : [],
    job,
    degraded: directory.degraded,
    limitations: directory.limitations
  };
}
