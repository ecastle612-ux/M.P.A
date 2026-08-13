import { beforeEach, describe, expect, it, vi } from "vitest";

type SubRow = {
  sku_code: string;
  status: string;
  stripe_subscription_id: string | null;
} | null;

type GrantRow = {
  id: string;
  organization_id: string;
  invited_email: string;
  granted_by_user_id: string;
  invitation_id: string | null;
  plan_granted: string;
  status: string;
  start_date: string;
  expiration_date: string | null;
  reason: string;
  notes: string | null;
  activated_at: string | null;
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
      const inFilters: Record<string, string[]> = {};
      const builder = {
        select: () => builder,
        eq: (col: string, value: string) => {
          filters[col] = value;
          return builder;
        },
        in: (col: string, values: string[]) => {
          inFilters[col] = values;
          return builder;
        },
        upsert: async () => ({ error: null }),
        update: () => ({
          eq: () => ({
            in: async () => ({ error: null }),
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
            if (inFilters["status"] && !inFilters["status"].includes(db.grant.status)) {
              return { data: null, error: null };
            }
            return { data: db.grant, error: null };
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

function grantFixture(overrides: Partial<NonNullable<GrantRow>> = {}): NonNullable<GrantRow> {
  return {
    id: "g1",
    organization_id: "org_1",
    invited_email: "tester@example.com",
    granted_by_user_id: "op_1",
    invitation_id: "inv_1",
    plan_granted: "mpa_facility_operations",
    status: "ACTIVE",
    start_date: "2020-01-01T00:00:00.000Z",
    expiration_date: "2099-01-01T00:00:00.000Z",
    reason: "beta",
    notes: null,
    activated_at: "2020-01-02T00:00:00.000Z",
    created_at: "2020-01-01T00:00:00.000Z",
    updated_at: "2020-01-01T00:00:00.000Z",
    revoked_at: null,
    revoked_by_user_id: null,
    ...overrides
  };
}

describe("ADM-001 getOrganizationCommercialState (invitation workflow)", () => {
  beforeEach(() => {
    db.subscription = null;
    db.grant = null;
    db.setup = { product_confirmed: true, completed_at: null };
    process.env["VITEST"] = "1";
  });

  it("Stripe subscription wins over ACTIVE grant", async () => {
    db.subscription = {
      sku_code: "mpa_property_manager",
      status: "active",
      stripe_subscription_id: "sub_123"
    };
    db.grant = grantFixture({ plan_granted: "mpa_complete_platform", status: "ACTIVE" });
    const state = await getOrganizationCommercialState("org_1");
    expect(state.sku).toBe("mpa_property_manager");
    expect(state.entitlementSource).toBe("STRIPE_SUBSCRIPTION");
  });

  it("ACTIVE grant unlocks plan entitlements", async () => {
    db.grant = grantFixture({ status: "ACTIVE" });
    db.setup = { product_confirmed: true, completed_at: "2020-01-02T00:00:00.000Z" };
    const state = await getOrganizationCommercialState("org_1");
    expect(state.sku).toBe("mpa_facility_operations");
    expect(state.entitlementSource).toBe("MASTER_ADMIN_GRANT");
    expect(state.entitlements).toContain("facility.operations");
  });

  it("INVITED grant does not unlock paid features (Guided Setup required)", async () => {
    db.grant = grantFixture({ status: "INVITED", activated_at: null });
    const state = await getOrganizationCommercialState("org_1");
    expect(state.sku).toBeNull();
    expect(state.entitlementSource).toBeNull();
    expect(state.entitlements).toEqual([
      "platform.org",
      "platform.guided_setup",
      "platform.billing_self"
    ]);
  });

  it("expired ACTIVE grant fail-closes", async () => {
    db.grant = grantFixture({
      status: "ACTIVE",
      expiration_date: "2020-02-01T00:00:00.000Z"
    });
    const state = await getOrganizationCommercialState("org_1");
    expect(state.sku).toBeNull();
  });

  it("REVOKED grant fail-closes", async () => {
    db.grant = grantFixture({
      status: "REVOKED",
      revoked_at: "2020-03-01T00:00:00.000Z",
      revoked_by_user_id: "op_1"
    });
    const state = await getOrganizationCommercialState("org_1");
    expect(state.sku).toBeNull();
  });
});
