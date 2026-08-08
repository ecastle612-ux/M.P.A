/** In-memory saas_customers mirror for offline / test environments. */

export type StoredSaasCustomer = {
  id: string;
  stripeCustomerId: string;
  email: string;
  checkoutSessionId: string;
  organizationId: string | null;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
};

const globalStore = globalThis as typeof globalThis & {
  __mpaSaasCustomers?: Map<string, StoredSaasCustomer>;
};

function customers(): Map<string, StoredSaasCustomer> {
  if (!globalStore.__mpaSaasCustomers) {
    globalStore.__mpaSaasCustomers = new Map();
  }
  return globalStore.__mpaSaasCustomers;
}

export function upsertSaasCustomer(input: {
  stripeCustomerId: string;
  email: string;
  checkoutSessionId: string;
  organizationId?: string | null;
  userId?: string | null;
}): StoredSaasCustomer {
  const existing = customers().get(input.stripeCustomerId);
  const now = new Date().toISOString();
  const row: StoredSaasCustomer = {
    id: existing?.id ?? crypto.randomUUID(),
    stripeCustomerId: input.stripeCustomerId,
    email: input.email.toLowerCase(),
    checkoutSessionId: input.checkoutSessionId,
    organizationId: input.organizationId ?? existing?.organizationId ?? null,
    userId: input.userId ?? existing?.userId ?? null,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  };
  customers().set(input.stripeCustomerId, row);
  return row;
}

export function getSaasCustomerByCheckoutSession(
  checkoutSessionId: string
): StoredSaasCustomer | null {
  for (const row of customers().values()) {
    if (row.checkoutSessionId === checkoutSessionId) return row;
  }
  return null;
}

export function listSaasCustomers(): StoredSaasCustomer[] {
  return [...customers().values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
