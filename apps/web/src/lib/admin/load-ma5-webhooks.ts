import { createAuthServerClient } from "../auth/server";
import { serverEnv } from "../env/server-env";
import {
  listSaasWebhookEvents,
  type StoredSaasWebhookEvent
} from "../saas-stripe/purchase-store";
import {
  detectDuplicateWebhookProcessing,
  filterWebhookRows,
  mapSignWellWebhookRow,
  mapStripeWebhookRow,
  paginateRows,
  paginationMeta,
  parseWebhookFilters,
  type Ma5Anomaly,
  type Ma5Pagination,
  type Ma5WebhookFilters,
  type Ma5WebhookRow
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

export type Ma5WebhookDirectory = {
  rows: Ma5WebhookRow[];
  filters: Ma5WebhookFilters;
  pagination: Ma5Pagination;
  degraded: string[];
  limitations: string[];
  duplicates: Ma5Anomaly[];
  totals: {
    matched: number;
    stripe: number;
    signwell: number;
    unresolved: number;
    attention: number;
    failed: number;
  };
};

export async function loadMa5WebhookDirectory(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined> = {}
): Promise<Ma5WebhookDirectory> {
  const degraded: string[] = [];
  const limitations = [
    "Stripe SaaS webhook table has no explicit failure column — unresolved = processed_at null.",
    "SignWell signature rejects never write rows — failure count unavailable.",
    "Webhook replay is not available in MA-5 (read-only)."
  ];
  const filters = parseWebhookFilters(searchParams);
  const service = await tryServiceRole();
  const client = (service ?? ((await createAuthServerClient()) as unknown as AnyClient)) as AnyClient;

  const orgNameById = new Map<string, string>();
  try {
    const { data } = await client.from("organizations").select("id, name").limit(2000);
    for (const o of (data ?? []) as Array<{ id: string; name: string }>) {
      orgNameById.set(o.id, o.name);
    }
  } catch {
    // optional
  }

  let stripeEvents: StoredSaasWebhookEvent[] = [];
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q: any = client
      .from("saas_stripe_webhook_events")
      .select("stripe_event_id, event_type, payload, processed_at, checkout_session_id, created_at")
      .order("created_at", { ascending: false })
      .limit(FETCH_CAP);
    if (filters.since) q = q.gte("created_at", filters.since);
    const { data, error } = await q;
    if (error) {
      degraded.push(`Stripe webhooks: ${error.message}`);
      stripeEvents = listSaasWebhookEvents();
    } else if (!data?.length) {
      const mem = listSaasWebhookEvents();
      if (mem.length) {
        degraded.push("Stripe webhook DB empty — showing process-memory events (fallback)");
        stripeEvents = mem;
      }
    } else {
      stripeEvents = (data as Array<Record<string, unknown>>).map((row) => ({
        stripeEventId: String(row["stripe_event_id"]),
        eventType: String(row["event_type"] ?? ""),
        payload: row["payload"],
        processedAt: typeof row["processed_at"] === "string" ? row["processed_at"] : null,
        checkoutSessionId:
          typeof row["checkout_session_id"] === "string" ? row["checkout_session_id"] : null,
        createdAt: String(row["created_at"] ?? "")
      }));
    }
  } catch (e) {
    degraded.push(e instanceof Error ? e.message : "Stripe webhook load failed");
    stripeEvents = listSaasWebhookEvents();
  }

  // Resolve org/subscription via checkout sessions when possible
  const sessionIds = [
    ...new Set(stripeEvents.map((e) => e.checkoutSessionId).filter((v): v is string => Boolean(v)))
  ];
  const sessionOrg = new Map<string, { organizationId: string | null; subscriptionId: string | null }>();
  if (sessionIds.length) {
    try {
      const { data } = await client
        .from("saas_checkout_sessions")
        .select("stripe_checkout_session_id, organization_id, stripe_subscription_id")
        .in("stripe_checkout_session_id", sessionIds.slice(0, 200));
      for (const r of (data ?? []) as Array<Record<string, unknown>>) {
        sessionOrg.set(String(r["stripe_checkout_session_id"]), {
          organizationId: typeof r["organization_id"] === "string" ? r["organization_id"] : null,
          subscriptionId:
            typeof r["stripe_subscription_id"] === "string" ? r["stripe_subscription_id"] : null
        });
      }
    } catch {
      // optional
    }
  }

  const stripeRows = stripeEvents.map((e) => {
    const link = e.checkoutSessionId ? sessionOrg.get(e.checkoutSessionId) : undefined;
    const mapped = mapStripeWebhookRow(
      e,
      link?.organizationId ? orgNameById.get(link.organizationId) ?? null : null,
      link?.subscriptionId ?? null
    );
    if (link?.organizationId) mapped.organizationId = link.organizationId;
    if (!mapped.organizationId && e.checkoutSessionId && link && link.organizationId == null) {
      mapped.health = mapped.processingStatus === "unresolved" ? "attention" : mapped.health;
      mapped.failureReason =
        mapped.failureReason ?? "Organization not resolvable from checkout linkage.";
    }
    return mapped;
  });

  const signwellRows: Ma5WebhookRow[] = [];
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q: any = client
      .from("signwell_webhook_events")
      .select("id, event_id, event_type, processed_at, organization_id, document_id, payload")
      .order("processed_at", { ascending: false })
      .limit(FETCH_CAP);
    if (filters.since) q = q.gte("processed_at", filters.since);
    if (filters.organizationId) q = q.eq("organization_id", filters.organizationId);
    const { data, error } = await q;
    if (error) degraded.push(`SignWell webhooks: ${error.message}`);
    else {
      for (const r of (data ?? []) as Array<Record<string, unknown>>) {
        const orgId = typeof r["organization_id"] === "string" ? r["organization_id"] : null;
        signwellRows.push(
          mapSignWellWebhookRow({
            id: String(r["id"]),
            event_id: typeof r["event_id"] === "string" ? r["event_id"] : null,
            event_type: String(r["event_type"] ?? ""),
            processed_at: String(r["processed_at"] ?? ""),
            organization_id: orgId,
            document_id: typeof r["document_id"] === "string" ? r["document_id"] : null,
            payload: r["payload"],
            organizationName: orgId ? orgNameById.get(orgId) ?? null : null
          })
        );
      }
    }
  } catch (e) {
    degraded.push(e instanceof Error ? e.message : "SignWell webhook load failed");
  }

  if (!service) degraded.push("Service role unavailable — webhook directory may be incomplete under RLS");

  const all = [...stripeRows, ...signwellRows].sort((a, b) =>
    b.receivedAt.localeCompare(a.receivedAt)
  );
  const duplicates = detectDuplicateWebhookProcessing(all);
  const matched = filterWebhookRows(all, filters);
  const rows = paginateRows(matched, filters.page, filters.pageSize);
  const pagination = paginationMeta(matched.length, filters.page, filters.pageSize);

  return {
    rows,
    filters,
    pagination,
    degraded,
    limitations,
    duplicates,
    totals: {
      matched: matched.length,
      stripe: matched.filter((r) => r.provider === "stripe").length,
      signwell: matched.filter((r) => r.provider === "signwell").length,
      unresolved: matched.filter((r) => r.processingStatus === "unresolved").length,
      attention: matched.filter((r) => r.health === "attention").length,
      failed: matched.filter((r) => r.health === "failed").length
    }
  };
}

export async function loadMa5WebhookDetail(eventId: string): Promise<{
  event: Ma5WebhookRow | null;
  degraded: string[];
  limitations: string[];
}> {
  const directory = await loadMa5WebhookDirectory({ q: eventId, range: "30d", page: "1", pageSize: "100" });
  const event =
    directory.rows.find((r) => r.eventId === eventId || r.id === eventId) ?? directory.rows[0] ?? null;
  return {
    event,
    degraded: directory.degraded,
    limitations: directory.limitations
  };
}
