import { createAuthServerClient } from "../auth/server";
import { serverEnv } from "../env/server-env";
import {
  filterSubscriptionRows,
  mapSubscriptionRow,
  MA4_SELECT,
  paginateRows,
  paginationMeta,
  parseSubscriptionFilters,
  buildSubscriptionDetail,
  type Ma4RawSubscription,
  type Ma4SubscriptionFilters,
  type Ma4SubscriptionRow,
  type Ma4Pagination
} from "./ma4-commercial";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- additive ops tables
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

/** Bound how many durable rows we pull before in-memory filter/page (server-side capped). */
const FETCH_CAP = 500;

export type Ma4SubscriptionsDirectory = {
  rows: Ma4SubscriptionRow[];
  filters: Ma4SubscriptionFilters;
  pagination: Ma4Pagination;
  degraded: string[];
  totals: {
    fetched: number;
    matched: number;
    healthy: number;
    attention: number;
    unknown: number;
  };
};

function applyServerFilters(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  q: any,
  filters: Ma4SubscriptionFilters,
  orgIdsFromSearch: string[] | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  let query = q;
  if (filters.organizationId) {
    query = query.eq("organization_id", filters.organizationId);
  } else if (orgIdsFromSearch && orgIdsFromSearch.length > 0) {
    query = query.in("organization_id", orgIdsFromSearch.slice(0, 200));
  }
  if (filters.sku) query = query.eq("sku_code", filters.sku);
  if (filters.billingCycle) query = query.eq("billing_cycle", filters.billingCycle);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.cancelAtPeriodEnd === "yes") query = query.eq("cancel_at_period_end", true);
  if (filters.cancelAtPeriodEnd === "no") query = query.eq("cancel_at_period_end", false);
  if (filters.trial === "active") query = query.eq("status", "trialing");
  return query;
}

export async function loadMa4SubscriptionsDirectory(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined> = {}
): Promise<Ma4SubscriptionsDirectory> {
  const degraded: string[] = [];
  const filters = parseSubscriptionFilters(searchParams);
  const service = await tryServiceRole();
  const client = (service ?? ((await createAuthServerClient()) as unknown as AnyClient)) as AnyClient;

  const orgNameById = new Map<string, string>();
  let orgIdsFromSearch: string[] | null = null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let orgQ: any = client.from("organizations").select("id, name").limit(2000);
    if (filters.q && !filters.organizationId) {
      const q = filters.q;
      // UUID-ish → exact id; otherwise name ilike
      if (/^[0-9a-f-]{36}$/i.test(q)) {
        orgQ = orgQ.or(`id.eq.${q},name.ilike.%${q}%`);
      } else {
        orgQ = orgQ.ilike("name", `%${q}%`);
      }
    }
    const { data: orgs, error } = await orgQ;
    if (error) degraded.push(`Organizations: ${error.message}`);
    else {
      for (const o of (orgs ?? []) as Array<{ id: string; name: string }>) {
        orgNameById.set(o.id, o.name);
      }
      if (filters.q && !filters.organizationId) {
        orgIdsFromSearch = [...orgNameById.keys()];
        // Also allow matching subscription by org id substring via later filter;
        // if name search returned nothing, still try loading by organization_id eq when q looks like uuid.
        if (orgIdsFromSearch.length === 0 && /^[0-9a-f-]{36}$/i.test(filters.q)) {
          orgIdsFromSearch = [filters.q];
        }
      }
    }
  } catch (e) {
    degraded.push(e instanceof Error ? e.message : "Organization lookup failed");
  }

  // If search yielded zero orgs and q is not empty, return empty rather than full fleet.
  if (filters.q && !filters.organizationId && orgIdsFromSearch && orgIdsFromSearch.length === 0) {
    // Fall through: still attempt subscription id / org id match in DB.
  }

  let raw: Ma4RawSubscription[] = [];
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q: any = client
      .from("organization_subscriptions")
      .select(MA4_SELECT)
      .order("updated_at", { ascending: false })
      .limit(FETCH_CAP);
    q = applyServerFilters(q, filters, orgIdsFromSearch);
    const { data, error } = await q;
    if (error) degraded.push(`Subscriptions: ${error.message}`);
    else {
      raw = ((data ?? []) as Array<Record<string, unknown>>).map((r) => ({
        organization_id: String(r["organization_id"]),
        organization_name: orgNameById.get(String(r["organization_id"])) ?? null,
        sku_code: typeof r["sku_code"] === "string" ? r["sku_code"] : null,
        status: typeof r["status"] === "string" ? r["status"] : null,
        billing_cycle: typeof r["billing_cycle"] === "string" ? r["billing_cycle"] : null,
        cancel_at_period_end:
          typeof r["cancel_at_period_end"] === "boolean" ? r["cancel_at_period_end"] : null,
        current_period_end:
          typeof r["current_period_end"] === "string" ? r["current_period_end"] : null,
        trial_ends_at: typeof r["trial_ends_at"] === "string" ? r["trial_ends_at"] : null,
        managed_unit_count:
          typeof r["managed_unit_count"] === "number" ? r["managed_unit_count"] : null,
        authorized_additional_blocks:
          typeof r["authorized_additional_blocks"] === "number"
            ? r["authorized_additional_blocks"]
            : null,
        authorized_unit_capacity:
          typeof r["authorized_unit_capacity"] === "number"
            ? r["authorized_unit_capacity"]
            : null,
        declared_unit_count:
          typeof r["declared_unit_count"] === "number" ? r["declared_unit_count"] : null,
        pending_additional_blocks:
          typeof r["pending_additional_blocks"] === "number"
            ? r["pending_additional_blocks"]
            : null,
        pending_authorized_unit_capacity:
          typeof r["pending_authorized_unit_capacity"] === "number"
            ? r["pending_authorized_unit_capacity"]
            : null,
        last_capacity_authorized_at:
          typeof r["last_capacity_authorized_at"] === "string"
            ? r["last_capacity_authorized_at"]
            : null,
        stripe_customer_id:
          typeof r["stripe_customer_id"] === "string" ? r["stripe_customer_id"] : null,
        stripe_subscription_id:
          typeof r["stripe_subscription_id"] === "string" ? r["stripe_subscription_id"] : null,
        stripe_base_item_id:
          typeof r["stripe_base_item_id"] === "string" ? r["stripe_base_item_id"] : null,
        stripe_additional_capacity_item_id:
          typeof r["stripe_additional_capacity_item_id"] === "string"
            ? r["stripe_additional_capacity_item_id"]
            : null,
        quote_id: typeof r["quote_id"] === "string" ? r["quote_id"] : null,
        plan_tier: typeof r["plan_tier"] === "string" ? r["plan_tier"] : null,
        sca_required: typeof r["sca_required"] === "boolean" ? r["sca_required"] : null,
        grace_started_at:
          typeof r["grace_started_at"] === "string" ? r["grace_started_at"] : null,
        updated_at: typeof r["updated_at"] === "string" ? r["updated_at"] : null,
        created_at: typeof r["created_at"] === "string" ? r["created_at"] : null
      }));
    }
  } catch (e) {
    degraded.push(e instanceof Error ? e.message : "Subscription load failed");
  }

  if (!service) degraded.push("Service role unavailable — directory may be incomplete under RLS");
  if (raw.length >= FETCH_CAP) {
    degraded.push(`Result capped at ${FETCH_CAP} rows — refine filters for full coverage`);
  }

  // Enrich names for rows not in the name map
  const missingNames = raw
    .map((r) => r.organization_id)
    .filter((id) => !orgNameById.has(id));
  if (missingNames.length) {
    try {
      const { data } = await client
        .from("organizations")
        .select("id, name")
        .in("id", [...new Set(missingNames)].slice(0, 200));
      for (const o of (data ?? []) as Array<{ id: string; name: string }>) {
        orgNameById.set(o.id, o.name);
      }
      for (const r of raw) {
        if (!r.organization_name) r.organization_name = orgNameById.get(r.organization_id) ?? null;
      }
    } catch {
      // optional
    }
  }

  const mapped = raw.map(mapSubscriptionRow);
  // Client-side filters for trial eligible / health (not always DB-filterable without computed cols)
  const matched = filterSubscriptionRows(mapped, filters);
  const pageRows = paginateRows(matched, filters.page, filters.pageSize);
  const pagination = paginationMeta(matched.length, filters.page, filters.pageSize);

  return {
    rows: pageRows,
    filters,
    pagination,
    degraded,
    totals: {
      fetched: mapped.length,
      matched: matched.length,
      healthy: matched.filter((r) => r.health === "healthy").length,
      attention: matched.filter((r) => r.health === "attention").length,
      unknown: matched.filter((r) => r.health === "unknown").length
    }
  };
}

export async function loadMa4SubscriptionDetail(
  organizationId: string
): Promise<{
  detail: ReturnType<typeof buildSubscriptionDetail> | null;
  degraded: string[];
}> {
  const directory = await loadMa4SubscriptionsDirectory({
    organizationId,
    page: "1",
    pageSize: "1"
  });
  const row = directory.rows[0] ?? null;
  if (!row) return { detail: null, degraded: directory.degraded };
  return { detail: buildSubscriptionDetail(row), degraded: directory.degraded };
}

export type Ma4CapacityDirectory = Ma4SubscriptionsDirectory;
