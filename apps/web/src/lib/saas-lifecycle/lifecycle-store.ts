import type { LifecycleSubscription } from "@mpa/shared";

const globalStore = globalThis as typeof globalThis & {
  __mpaLifecycleSubs?: Map<string, LifecycleSubscription>;
  __mpaLifecycleByOrg?: Map<string, string>;
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

export function getLifecycleByStripeSubscriptionId(
  stripeSubscriptionId: string
): LifecycleSubscription | null {
  return byStripeId().get(stripeSubscriptionId) ?? null;
}

export function getLifecycleByOrganizationId(
  organizationId: string
): LifecycleSubscription | null {
  const stripeId = byOrg().get(organizationId);
  if (!stripeId) {
    for (const row of byStripeId().values()) {
      if (row.organizationId === organizationId) return row;
    }
    return null;
  }
  return byStripeId().get(stripeId) ?? null;
}

export function saveLifecycleSubscription(row: LifecycleSubscription): LifecycleSubscription {
  byStripeId().set(row.stripeSubscriptionId, row);
  if (row.organizationId) {
    byOrg().set(row.organizationId, row.stripeSubscriptionId);
  }
  return row;
}

export function listLifecycleSubscriptions(): LifecycleSubscription[] {
  return [...byStripeId().values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function clearLifecycleStoreForTests(): void {
  globalStore.__mpaLifecycleSubs = new Map();
  globalStore.__mpaLifecycleByOrg = new Map();
}
