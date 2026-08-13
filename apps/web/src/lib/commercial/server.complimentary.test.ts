import { beforeEach, describe, expect, it, vi } from "vitest";

type SubRow = {
  sku_code: string;
  status: string;
  stripe_subscription_id: string | null;
} | null;

type GrantRow = {
  id: string;
  organization_id: string;
  granted_by_user_id: string;
  plan_granted: string;
  grant_status: string;
  start_date: string;
  expiration_date: string | null;
  reason: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  revoked_at: string | null;
  revoked_by_user_id: string | null;
} | null;

const db = {
  subscription: null as SubRow,
  grant: null as GrantRow,
  setup: { product_confirmed: true, completed_at: null } as {
    product_confirmed: boolean;
    completed_at: string | null;
  } | null
};

vi.mock("../auth/server", () => ({
  createAuthServerClient: async () => ({
    from: (table: string) => {
      const filters: Record<string, string> = {};
      const builder = {
        select: () => builder,
        eq: (col: string, value: string) => {
          filters[col] = value;
          return builder;
        },
        upsert: async () => ({ error: null }),
        update: () => ({
          eq: () => ({
            eq: async () => ({ error: null }),
            select: () => ({
              single: async () => ({ data: db.grant, error: null })
            })
          })
        }),
        maybeSingle: async () => {
          if (table === "organization_subscriptions") {
            return { data: db.subscription, error: null };
          }
          if (table === "organization_setup_state") {
            return { data: db.setup, error: null };
          }
          if (table === "master_admin_access_grants") {
            if (!db.grant) return { data: null, error: null };
            if (filters["grant_status"] && db.grant.grant_status !== filters["grant_status"]) {
              return { data: null, error: null };
            }
            return { data: db.grant, error: null };
          }
          if (table === "platform_operators") {
            return { data: null, error: null };
          }
          return { data: null, error: null };
        }
      };
      return builder;
    }
  })
}));

vi.mock("../admin/impersonation-service", () => ({
  writeSupportAudit: async () => undefined
}));

import { getOrganizationCommercialState } from "./server";

describe("ADM-001 getOrganizationCommercialState", () => {
  beforeEach(() => {
    db.subscription = null;
    db.grant = null;
    db.setup = { product_confirmed: true, completed_at: null };
    process.env["VITEST"] = "1";
  });

  it("returns Stripe entitlements when Stripe subscription is active", async () => {
    db.subscription = {
      sku_code: "mpa_property_manager",
      status: "active",
      stripe_subscription_id: "sub_123"
    };
    db.grant = {
      id: "g1",
      organization_id: "org_1",
      granted_by_user_id: "op_1",
      plan_granted: "mpa_complete_platform",
      grant_status: "active",
      start_date: "2026-01-01T00:00:00.000Z",
      expiration_date: null,
      reason: "tester",
      notes: null,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
      revoked_at: null,
      revoked_by_user_id: null
    };

    const state = await getOrganizationCommercialState("org_1");
    expect(state.sku).toBe("mpa_property_manager");
    expect(state.entitlementSource).toBe("STRIPE_SUBSCRIPTION");
    expect(state.entitlements).toContain("pm.properties");
    expect(state.entitlements).not.toContain("facility.assets");
  });

  it("returns grant entitlements when no Stripe subscription", async () => {
    db.subscription = null;
    db.grant = {
      id: "g1",
      organization_id: "org_1",
      granted_by_user_id: "op_1",
      plan_granted: "mpa_facility_operations",
      grant_status: "active",
      start_date: "2020-01-01T00:00:00.000Z",
      expiration_date: "2099-01-01T00:00:00.000Z",
      reason: "tester",
      notes: null,
      created_at: "2020-01-01T00:00:00.000Z",
      updated_at: "2020-01-01T00:00:00.000Z",
      revoked_at: null,
      revoked_by_user_id: null
    };

    const state = await getOrganizationCommercialState("org_1");
    expect(state.sku).toBe("mpa_facility_operations");
    expect(state.entitlementSource).toBe("MASTER_ADMIN_GRANT");
    expect(state.entitlements).toContain("facility.operations");
  });

  it("fail-closes when grant is expired", async () => {
    db.subscription = null;
    db.grant = {
      id: "g1",
      organization_id: "org_1",
      granted_by_user_id: "op_1",
      plan_granted: "mpa_facility_operations",
      grant_status: "active",
      start_date: "2020-01-01T00:00:00.000Z",
      expiration_date: "2020-02-01T00:00:00.000Z",
      reason: "tester",
      notes: null,
      created_at: "2020-01-01T00:00:00.000Z",
      updated_at: "2020-01-01T00:00:00.000Z",
      revoked_at: null,
      revoked_by_user_id: null
    };

    const state = await getOrganizationCommercialState("org_1");
    expect(state.sku).toBeNull();
    expect(state.entitlementSource).toBeNull();
    expect(state.entitlements).toEqual([
      "platform.org",
      "platform.guided_setup",
      "platform.billing_self"
    ]);
  });

  it("fail-closes when grant is revoked", async () => {
    db.subscription = null;
    db.grant = {
      id: "g1",
      organization_id: "org_1",
      granted_by_user_id: "op_1",
      plan_granted: "mpa_property_manager",
      grant_status: "revoked",
      start_date: "2020-01-01T00:00:00.000Z",
      expiration_date: null,
      reason: "tester",
      notes: null,
      created_at: "2020-01-01T00:00:00.000Z",
      updated_at: "2020-01-01T00:00:00.000Z",
      revoked_at: "2020-03-01T00:00:00.000Z",
      revoked_by_user_id: "op_1"
    };

    const state = await getOrganizationCommercialState("org_1");
    expect(state.sku).toBeNull();
    expect(state.entitlementSource).toBeNull();
  });

  it("keeps legacy non-Stripe admin assign when no grant", async () => {
    db.subscription = {
      sku_code: "mpa_complete_platform",
      status: "active",
      stripe_subscription_id: null
    };
    db.grant = null;
    const state = await getOrganizationCommercialState("org_1");
    expect(state.sku).toBe("mpa_complete_platform");
    expect(state.entitlementSource).toBe("LEGACY_ADMIN_ASSIGN");
  });
});

