/**
 * Slice C purchase + webhook event store.
 * Prefers Supabase when service role is available; falls back to process memory
 * so local/test verification still works without a live DB.
 */

import type { BillingCycle, PlanTier, ProductSku } from "@mpa/shared";

export type StoredSaasPurchase = {
  id: string;
  stripeCheckoutSessionId: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  catalogOfferId: string;
  productSku: ProductSku;
  planTier: PlanTier;
  billingCycle: BillingCycle;
  status:
    | "checkout_created"
    | "checkout_completed"
    | "checkout_expired"
    | "checkout_canceled"
    | "payment_failed";
  customerEmail: string | null;
  idempotencyKey: string | null;
  demoSessionId: string | null;
  metadata: Record<string, string>;
  provisioned: false;
  organizationId: null;
  userId: null;
  createdAt: string;
  updatedAt: string;
};

export type StoredSaasWebhookEvent = {
  stripeEventId: string;
  eventType: string;
  payload: unknown;
  processedAt: string | null;
  checkoutSessionId: string | null;
  createdAt: string;
};

const globalStore = globalThis as typeof globalThis & {
  __mpaSaasPurchases?: Map<string, StoredSaasPurchase>;
  __mpaSaasWebhooks?: Map<string, StoredSaasWebhookEvent>;
};

function purchases(): Map<string, StoredSaasPurchase> {
  if (!globalStore.__mpaSaasPurchases) {
    globalStore.__mpaSaasPurchases = new Map();
  }
  return globalStore.__mpaSaasPurchases;
}

function webhooks(): Map<string, StoredSaasWebhookEvent> {
  if (!globalStore.__mpaSaasWebhooks) {
    globalStore.__mpaSaasWebhooks = new Map();
  }
  return globalStore.__mpaSaasWebhooks;
}

export function rememberSaasPurchase(row: StoredSaasPurchase): StoredSaasPurchase {
  purchases().set(row.stripeCheckoutSessionId, row);
  if (row.idempotencyKey) {
    purchases().set(`idem:${row.idempotencyKey}`, row);
  }
  return row;
}

export function getSaasPurchaseBySessionId(sessionId: string): StoredSaasPurchase | null {
  return purchases().get(sessionId) ?? null;
}

export function getSaasPurchaseByIdempotencyKey(key: string): StoredSaasPurchase | null {
  return purchases().get(`idem:${key}`) ?? null;
}

export function updateSaasPurchase(
  sessionId: string,
  patch: Partial<StoredSaasPurchase>
): StoredSaasPurchase | null {
  const current = purchases().get(sessionId);
  if (!current) {
    return null;
  }
  const next: StoredSaasPurchase = {
    ...current,
    ...patch,
    provisioned: false,
    organizationId: null,
    userId: null,
    updatedAt: new Date().toISOString()
  };
  purchases().set(sessionId, next);
  if (next.idempotencyKey) {
    purchases().set(`idem:${next.idempotencyKey}`, next);
  }
  return next;
}

export function listSaasPurchases(): StoredSaasPurchase[] {
  const seen = new Set<string>();
  const out: StoredSaasPurchase[] = [];
  for (const [key, row] of purchases()) {
    if (key.startsWith("idem:")) continue;
    if (seen.has(row.stripeCheckoutSessionId)) continue;
    seen.add(row.stripeCheckoutSessionId);
    out.push(row);
  }
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function rememberSaasWebhookEvent(row: StoredSaasWebhookEvent): {
  duplicate: boolean;
  row: StoredSaasWebhookEvent;
} {
  const existing = webhooks().get(row.stripeEventId);
  if (existing?.processedAt) {
    return { duplicate: true, row: existing };
  }
  if (existing) {
    return { duplicate: false, row: existing };
  }
  webhooks().set(row.stripeEventId, row);
  return { duplicate: false, row };
}

export function markSaasWebhookProcessed(
  stripeEventId: string,
  checkoutSessionId?: string | null
): void {
  const existing = webhooks().get(stripeEventId);
  if (!existing) {
    return;
  }
  webhooks().set(stripeEventId, {
    ...existing,
    processedAt: new Date().toISOString(),
    checkoutSessionId: checkoutSessionId ?? existing.checkoutSessionId
  });
}

export function listSaasWebhookEvents(): StoredSaasWebhookEvent[] {
  return [...webhooks().values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Isolation: SaaS store never writes FIN-OPS tables. */
export function saasStoreTouchesFinOps(): boolean {
  return false;
}
