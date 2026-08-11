/**
 * STAB-005 — lifecycle store.
 * Process memory is an optional cache. organization_subscriptions (via durable
 * backend) is the authoritative source. Cache misses and cold starts load from DB.
 */

import type { LifecycleSubscription } from "@mpa/shared";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createDefaultLifecycleDurableBackend,
  createMemoryLifecycleDurableBackend,
  loadLifecycleViaClient,
  type LifecycleDurableBackend
} from "./lifecycle-durable";

const globalStore = globalThis as typeof globalThis & {
  __mpaLifecycleSubs?: Map<string, LifecycleSubscription>;
  __mpaLifecycleByOrg?: Map<string, string>;
  __mpaLifecycleDurable?: LifecycleDurableBackend;
  __mpaLifecycleMemoryDurable?: LifecycleDurableBackend;
};

function byStripeId(): Map<string, LifecycleSubscription> {
  if (!globalStore.__mpaLifecycleSubs) {
    globalStore.__mpaLifecycleSubs = new Map();
  }
  return globalStore.__mpaLifecycleSubs;
}

function byOrg(): Map<string, string> {
  if (!globalStore.__mpaLifecycleByOrg) {
    globalStore.__mpaLifecycleByOrg = new Map();
  }
  return globalStore.__mpaLifecycleByOrg;
}

function memoryDurable(): LifecycleDurableBackend {
  if (!globalStore.__mpaLifecycleMemoryDurable) {
    globalStore.__mpaLifecycleMemoryDurable = createMemoryLifecycleDurableBackend();
  }
  return globalStore.__mpaLifecycleMemoryDurable;
}

function durable(): LifecycleDurableBackend {
  if (!globalStore.__mpaLifecycleDurable) {
    globalStore.__mpaLifecycleDurable = createDefaultLifecycleDurableBackend(memoryDurable());
  }
  return globalStore.__mpaLifecycleDurable;
}

function putCache(row: LifecycleSubscription): void {
  byStripeId().set(row.stripeSubscriptionId, row);
  if (row.organizationId) {
    byOrg().set(row.organizationId, row.stripeSubscriptionId);
  }
}

function cacheByStripeId(stripeSubscriptionId: string): LifecycleSubscription | null {
  return byStripeId().get(stripeSubscriptionId) ?? null;
}

function cacheByOrganizationId(organizationId: string): LifecycleSubscription | null {
  const stripeId = byOrg().get(organizationId);
  if (!stripeId) {
    for (const row of byStripeId().values()) {
      if (row.organizationId === organizationId) return row;
    }
    return null;
  }
  return byStripeId().get(stripeId) ?? null;
}

/** Clear process cache only — simulates serverless cold start / new instance. */
export function simulateColdStartForTests(): void {
  globalStore.__mpaLifecycleSubs = new Map();
  globalStore.__mpaLifecycleByOrg = new Map();
}

/**
 * Replace the durable backend (shared "database") for cross-instance tests.
 * Does not clear the provided backend contents.
 */
export function setLifecycleDurableBackendForTests(backend: LifecycleDurableBackend): void {
  globalStore.__mpaLifecycleDurable = backend;
  globalStore.__mpaLifecycleMemoryDurable = backend;
  simulateColdStartForTests();
}

export function createSharedDurableBackendForTests(): LifecycleDurableBackend {
  return createMemoryLifecycleDurableBackend();
}

/** Clear cache + durable test backend (full reset). */
export function clearLifecycleStoreForTests(): void {
  simulateColdStartForTests();
  memoryDurable().clear();
  globalStore.__mpaLifecycleDurable = createDefaultLifecycleDurableBackend(memoryDurable());
}

/**
 * Authoritative organization-scoped load.
 * Cache hit validated against org id; miss loads from durable DB.
 */
export async function getLifecycleByOrganizationId(
  organizationId: string
): Promise<LifecycleSubscription | null> {
  const cached = cacheByOrganizationId(organizationId);
  if (cached) {
    if (cached.organizationId !== organizationId) {
      return null;
    }
    return cached;
  }

  const fromDb = await durable().getByOrganizationId(organizationId);
  if (!fromDb) {
    return null;
  }
  if (fromDb.organizationId !== organizationId) {
    return null;
  }
  putCache(fromDb);
  return fromDb;
}

export async function getLifecycleByStripeSubscriptionId(
  stripeSubscriptionId: string
): Promise<LifecycleSubscription | null> {
  const cached = cacheByStripeId(stripeSubscriptionId);
  if (cached) {
    return cached;
  }
  const fromDb = await durable().getByStripeSubscriptionId(stripeSubscriptionId);
  if (!fromDb) {
    return null;
  }
  putCache(fromDb);
  return fromDb;
}

export async function findLifecycleByStripeCustomerId(
  stripeCustomerId: string
): Promise<LifecycleSubscription | null> {
  for (const row of byStripeId().values()) {
    if (row.stripeCustomerId === stripeCustomerId) return row;
  }
  const fromDb = await durable().findByStripeCustomerId(stripeCustomerId);
  if (!fromDb) return null;
  putCache(fromDb);
  return fromDb;
}

/** Write-through: update cache and durable authoritative store. */
export async function saveLifecycleSubscription(
  row: LifecycleSubscription
): Promise<LifecycleSubscription> {
  putCache(row);
  await durable().upsert(row);
  return row;
}

export async function listLifecycleSubscriptions(
  limit = 200
): Promise<LifecycleSubscription[]> {
  const fromDb = await durable().list(limit);
  for (const row of fromDb) {
    putCache(row);
  }
  if (fromDb.length > 0) {
    return fromDb;
  }
  return [...byStripeId().values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/**
 * Resolve org lifecycle with optional authenticated client fallback
 * (RLS) when service-role durable read is empty.
 */
export async function resolveLifecycleForOrganization(
  organizationId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase?: SupabaseClient<any> | null
): Promise<LifecycleSubscription | null> {
  const primary = await getLifecycleByOrganizationId(organizationId);
  if (primary) {
    if (primary.organizationId !== organizationId) return null;
    return primary;
  }
  if (!supabase) {
    return null;
  }
  const viaClient = await loadLifecycleViaClient(supabase, organizationId);
  if (!viaClient || viaClient.organizationId !== organizationId) {
    return null;
  }
  return saveLifecycleSubscription(viaClient);
}
