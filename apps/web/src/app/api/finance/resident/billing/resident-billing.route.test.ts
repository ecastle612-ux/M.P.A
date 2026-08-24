import { beforeEach, describe, expect, it, vi } from "vitest";

const state = {
  userId: "tenant_1" as string | null,
  residents: [] as Array<Record<string, unknown>>,
  settings: [] as Array<{ organization_id: string; stripe_payment_execution_enabled: boolean }>
};

function thenable<T>(data: T) {
  const builder: Record<string, unknown> = {
    select: () => builder,
    eq: () => builder,
    in: () => builder,
    order: () => builder,
    maybeSingle: async () => ({ data: null, error: null }),
    then: (resolve: (value: { data: T; error: null }) => unknown) =>
      resolve({ data, error: null })
  };
  return builder;
}

vi.mock("../../../../../lib/auth/server", () => ({
  createAuthServerClient: async () => ({
    auth: {
      getUser: async () => ({
        data: { user: state.userId ? { id: state.userId } : null }
      })
    },
    from: (table: string) => {
      if (table === "lease_residents") {
        return thenable(state.residents);
      }
      if (table === "financial_module_settings") {
        return thenable(state.settings);
      }
      return thenable([]);
    }
  })
}));

vi.mock("../../../../../lib/finance/billing-service", () => ({
  getLeaseLedger: async () => ({
    balance: { openBalance: 100, hasPastDue: false, status: "current" },
    charges: [],
    payments: [],
    ledger: []
  })
}));

vi.mock("../../../../../lib/supabase/service-role", () => ({
  createServiceRoleClient: () => ({
    from: (table: string) => {
      if (table === "financial_module_settings") {
        return thenable(state.settings);
      }
      return thenable([]);
    }
  })
}));

vi.mock("../../../../../lib/finance/stripe", () => ({
  isStripeConfigured: () => true
}));

import { GET } from "./route";

describe("GET /api/finance/resident/billing P1-01", () => {
  beforeEach(() => {
    state.userId = "tenant_1";
    state.residents = [];
    state.settings = [];
  });

  it("never enables Pay now from Stripe key presence when unlinked", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.linked).toBe(false);
    expect(body.onlinePaymentsEnabled).toBe(false);
    expect(body.accounts).toEqual([]);
  });

  it("hides online pay when stripe_payment_execution_enabled is false", async () => {
    state.residents = [
      {
        id: "res_1",
        lease_id: "lease_1",
        organization_id: "org_1",
        display_name: "Ada",
        financial_status: "current",
        occupancy_status: "occupying",
        occupy_from: "2020-01-01",
        occupy_to: null
      }
    ];
    state.settings = [{ organization_id: "org_1", stripe_payment_execution_enabled: false }];

    const response = await GET();
    const body = await response.json();
    expect(body.linked).toBe(true);
    expect(body.onlinePaymentsEnabled).toBe(false);
    expect(body.accounts[0].canPay).toBe(true);
    expect(body.accounts[0].onlinePaymentsEnabled).toBe(false);
  });

  it("keeps Pay once hidden when execution is on but Connect is not ready", async () => {
    state.residents = [
      {
        id: "res_1",
        lease_id: "lease_1",
        organization_id: "org_1",
        display_name: "Ada",
        financial_status: "current",
        occupancy_status: "occupying",
        occupy_from: "2020-01-01",
        occupy_to: null
      }
    ];
    state.settings = [{ organization_id: "org_1", stripe_payment_execution_enabled: true }];

    const response = await GET();
    const body = await response.json();
    expect(body.onlinePaymentsEnabled).toBe(false);
    expect(body.accounts[0].onlinePaymentsEnabled).toBe(false);
    expect(body.accounts[0].canPay).toBe(true);
  });
});
