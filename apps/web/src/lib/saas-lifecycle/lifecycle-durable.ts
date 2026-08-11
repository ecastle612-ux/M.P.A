/**
 * STAB-005 — durable lifecycle backend.
 * organization_subscriptions is authoritative; process memory is only a cache.
 */

import type { LifecycleSubscription } from "@mpa/shared";
import type { SupabaseClient } from "@supabase/supabase-js";
import { serverEnv } from "../env/server-env";
import {
  ORGANIZATION_SUBSCRIPTION_SELECT,
  lifecycleFromOrganizationSubscriptionRow,
  organizationSubscriptionUpsertPayload,
  type OrganizationSubscriptionRow
} from "./lifecycle-row-map";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any>;

export type LifecycleDurableBackend = {
  getByOrganizationId(organizationId: string): Promise<LifecycleSubscription | null>;
  getByStripeSubscriptionId(stripeSubscriptionId: string): Promise<LifecycleSubscription | null>;
  findByStripeCustomerId(stripeCustomerId: string): Promise<LifecycleSubscription | null>;
  upsert(sub: LifecycleSubscription): Promise<void>;
  list(limit?: number): Promise<LifecycleSubscription[]>;
  clear(): void;
};

function cloneSub(sub: LifecycleSubscription): LifecycleSubscription {
  return structuredClone(sub);
}

/** Process-independent durable Map for tests / no-service-role fallback. */
export function createMemoryLifecycleDurableBackend(): LifecycleDurableBackend {
  const byStripe = new Map<string, LifecycleSubscription>();
  const byOrg = new Map<string, string>();

  return {
    async getByOrganizationId(organizationId) {
      const stripeId = byOrg.get(organizationId);
      if (stripeId) {
        const row = byStripe.get(stripeId);
        if (row && row.organizationId === organizationId) return cloneSub(row);
      }
      for (const row of byStripe.values()) {
        if (row.organizationId === organizationId) return cloneSub(row);
      }
      return null;
    },
    async getByStripeSubscriptionId(stripeSubscriptionId) {
      const row = byStripe.get(stripeSubscriptionId);
      return row ? cloneSub(row) : null;
    },
    async findByStripeCustomerId(stripeCustomerId) {
      for (const row of byStripe.values()) {
        if (row.stripeCustomerId === stripeCustomerId) return cloneSub(row);
      }
      return null;
    },
    async upsert(sub) {
      const stored = cloneSub(sub);
      byStripe.set(sub.stripeSubscriptionId, stored);
      if (sub.organizationId) {
        byOrg.set(sub.organizationId, sub.stripeSubscriptionId);
      }
    },
    async list(limit = 200) {
      return [...byStripe.values()]
        .map(cloneSub)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, limit);
    },
    clear() {
      byStripe.clear();
      byOrg.clear();
    }
  };
}

async function tryServiceRoleClient(): Promise<Db | null> {
  try {
    if (process.env["MPA_LIFECYCLE_FORCE_MEMORY"] === "1") return null;
    // Vitest uses the injectable memory durable backend by default.
    if (process.env["VITEST"] && process.env["MPA_LIFECYCLE_USE_SUPABASE"] !== "1") {
      return null;
    }
    if (!serverEnv.SUPABASE_SERVICE_ROLE_KEY) return null;
    const { createServiceRoleClient } = await import("../supabase/service-role");
    return createServiceRoleClient();
  } catch {
    return null;
  }
}

export function createSupabaseLifecycleDurableBackend(client: Db): LifecycleDurableBackend {
  return {
    async getByOrganizationId(organizationId) {
      const { data, error } = await client
        .from("organization_subscriptions")
        .select(ORGANIZATION_SUBSCRIPTION_SELECT)
        .eq("organization_id", organizationId)
        .maybeSingle();
      if (error || !data) return null;
      const row = data as unknown as OrganizationSubscriptionRow;
      if (row.organization_id !== organizationId) return null;
      return lifecycleFromOrganizationSubscriptionRow(row);
    },
    async getByStripeSubscriptionId(stripeSubscriptionId) {
      const { data, error } = await client
        .from("organization_subscriptions")
        .select(ORGANIZATION_SUBSCRIPTION_SELECT)
        .eq("stripe_subscription_id", stripeSubscriptionId)
        .maybeSingle();
      if (error || !data) return null;
      return lifecycleFromOrganizationSubscriptionRow(data as unknown as OrganizationSubscriptionRow);
    },
    async findByStripeCustomerId(stripeCustomerId) {
      const { data, error } = await client
        .from("organization_subscriptions")
        .select(ORGANIZATION_SUBSCRIPTION_SELECT)
        .eq("stripe_customer_id", stripeCustomerId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error || !data) return null;
      return lifecycleFromOrganizationSubscriptionRow(data as unknown as OrganizationSubscriptionRow);
    },
    async upsert(sub) {
      const payload = organizationSubscriptionUpsertPayload(sub);
      if (!payload) return;
      await client.from("organization_subscriptions").upsert(payload, {
        onConflict: "organization_id"
      });
    },
    async list(limit = 40) {
      const { data, error } = await client
        .from("organization_subscriptions")
        .select(ORGANIZATION_SUBSCRIPTION_SELECT)
        .not("stripe_subscription_id", "is", null)
        .order("updated_at", { ascending: false })
        .limit(limit);
      if (error || !data) return [];
      return (data as unknown as OrganizationSubscriptionRow[])
        .map((row) => lifecycleFromOrganizationSubscriptionRow(row))
        .filter((row): row is LifecycleSubscription => row != null);
    },
    clear() {
      // Production DB must never be wiped via this API.
    }
  };
}

/**
 * Composite: prefer Supabase when available; otherwise durable memory.
 * Memory here is still durable relative to the process cache — it survives
 * simulateColdStartForTests() and can be shared across simulated instances.
 */
export function createDefaultLifecycleDurableBackend(
  memoryFallback: LifecycleDurableBackend
): LifecycleDurableBackend {
  return {
    async getByOrganizationId(organizationId) {
      const supabase = await tryServiceRoleClient();
      if (supabase) {
        const fromDb = await createSupabaseLifecycleDurableBackend(supabase).getByOrganizationId(
          organizationId
        );
        if (fromDb) return fromDb;
      }
      return memoryFallback.getByOrganizationId(organizationId);
    },
    async getByStripeSubscriptionId(stripeSubscriptionId) {
      const supabase = await tryServiceRoleClient();
      if (supabase) {
        const fromDb = await createSupabaseLifecycleDurableBackend(
          supabase
        ).getByStripeSubscriptionId(stripeSubscriptionId);
        if (fromDb) return fromDb;
      }
      return memoryFallback.getByStripeSubscriptionId(stripeSubscriptionId);
    },
    async findByStripeCustomerId(stripeCustomerId) {
      const supabase = await tryServiceRoleClient();
      if (supabase) {
        const fromDb = await createSupabaseLifecycleDurableBackend(supabase).findByStripeCustomerId(
          stripeCustomerId
        );
        if (fromDb) return fromDb;
      }
      return memoryFallback.findByStripeCustomerId(stripeCustomerId);
    },
    async upsert(sub) {
      await memoryFallback.upsert(sub);
      const supabase = await tryServiceRoleClient();
      if (supabase) {
        await createSupabaseLifecycleDurableBackend(supabase).upsert(sub);
      }
    },
    async list(limit) {
      const supabase = await tryServiceRoleClient();
      if (supabase) {
        const fromDb = await createSupabaseLifecycleDurableBackend(supabase).list(limit);
        if (fromDb.length > 0) return fromDb;
      }
      return memoryFallback.list(limit);
    },
    clear() {
      memoryFallback.clear();
    }
  };
}

/** Load via an authenticated (RLS) client when service role is unavailable. */
export async function loadLifecycleViaClient(
  client: Db,
  organizationId: string
): Promise<LifecycleSubscription | null> {
  const { data, error } = await client
    .from("organization_subscriptions")
    .select(ORGANIZATION_SUBSCRIPTION_SELECT)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as unknown as OrganizationSubscriptionRow;
  if (row.organization_id !== organizationId) return null;
  return lifecycleFromOrganizationSubscriptionRow(row);
}
