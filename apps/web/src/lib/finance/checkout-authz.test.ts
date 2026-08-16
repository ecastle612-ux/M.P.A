import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";

const state = {
  userId: "user_1" as string | null,
  orgId: "org_clinic" as string | null,
  membership: { id: "mem_1", status: "active", roles: ["organization_admin"] } as
    | { id: string; status: string; roles: string[]; operating_scope?: string | null }
    | null,
  sku: "mpa_complete_platform" as string | null,
  subscriptionStatus: "active" as string,
  permissions: ["pm.finance:read", "pm.finance:charge.write"] as string[]
};

vi.mock("../auth/server", () => ({
  createAuthServerClient: async () => ({
    auth: {
      getUser: async () => ({
        data: { user: state.userId ? { id: state.userId } : null }
      })
    },
    from: (table: string) => {
      const builder = {
        select: () => builder,
        eq: () => builder,
        maybeSingle: async () => {
          if (table === "organization_memberships") {
            return { data: state.membership, error: null };
          }
          if (table === "organization_subscriptions") {
            return {
              data: state.sku ? { sku_code: state.sku, status: state.subscriptionStatus } : null,
              error: null
            };
          }
          return { data: null, error: null };
        }
      };
      return builder;
    }
  })
}));

vi.mock("../organization/server", () => ({
  getActiveOrganizationIdFromCookie: async () => state.orgId
}));

vi.mock("../auth/authorization", () => ({
  resolveAuthorizationContext: async () => ({
    permissions: state.permissions,
    roles: state.membership?.roles ?? [],
    organizationId: state.orgId,
    userId: state.userId
  }),
  evaluatePermission: (_ctx: unknown, capability: string) => state.permissions.includes(capability)
}));

import {
  authorizeFinanceCheckout,
  orgSkuAllowsResidentialFinance,
  stripePaymentExecutionEnabled
} from "./checkout-authz";

describe("docs/161 checkout staff authorization (member-effective)", () => {
  beforeEach(() => {
    state.userId = "user_1";
    state.orgId = "org_clinic";
    state.subscriptionStatus = "active";
    state.permissions = ["pm.finance:read", "pm.finance:charge.write"];
  });

  it("allows a resident lease-self caller without staff finance keys", async () => {
    state.userId = "tenant_1";
    state.membership = { id: "mem_tenant", status: "active", roles: ["tenant"] };
    state.permissions = [];
    const result = await authorizeFinanceCheckout({
      residentLinkId: "resident_1",
      leaseOrganizationId: "org_clinic"
    });
    expect("actor" in result && result.actor.kind === "resident").toBe(true);
  });

  it("Erick / Complete + BOTH is allowed by capability on the staff branch", async () => {
    state.sku = "mpa_complete_platform";
    state.membership = {
      id: "mem_erick",
      status: "active",
      roles: ["organization_admin"],
      operating_scope: "both"
    };
    const result = await authorizeFinanceCheckout({
      residentLinkId: null,
      leaseOrganizationId: "org_clinic"
    });
    expect("actor" in result && result.actor.kind === "staff").toBe(true);
  });

  it("Sarah / Complete + PROPERTY is allowed by capability on the staff branch", async () => {
    state.sku = "mpa_complete_platform";
    state.membership = {
      id: "mem_sarah",
      status: "active",
      roles: ["property_manager"],
      operating_scope: "property_operations"
    };
    const result = await authorizeFinanceCheckout({
      residentLinkId: null,
      leaseOrganizationId: "org_clinic"
    });
    expect("actor" in result && result.actor.kind === "staff").toBe(true);
  });

  it("Mike / Complete + FACILITY is denied before any trusted mutation", async () => {
    state.sku = "mpa_complete_platform";
    state.membership = {
      id: "mem_mike",
      status: "active",
      roles: ["property_manager"],
      operating_scope: "facility_operations"
    };
    state.permissions = ["pm.finance:read", "pm.finance:charge.write"];
    const result = await authorizeFinanceCheckout({
      residentLinkId: null,
      leaseOrganizationId: "org_clinic"
    });
    expect("error" in result && result.error.status === 403).toBe(true);
  });

  it("PM SKU authorized manager is allowed", async () => {
    state.sku = "mpa_property_manager";
    state.membership = {
      id: "mem_pm",
      status: "active",
      roles: ["property_manager"],
      operating_scope: "property_operations"
    };
    const result = await authorizeFinanceCheckout({
      residentLinkId: null,
      leaseOrganizationId: "org_pm"
    });
    expect("actor" in result && result.actor.kind === "staff").toBe(true);
  });

  it("FO SKU is denied even with property_manager and finance grants", async () => {
    state.sku = "mpa_facility_operations";
    state.membership = {
      id: "mem_fo",
      status: "active",
      roles: ["property_manager", "organization_admin"],
      operating_scope: "facility_operations"
    };
    state.permissions = ["pm.finance:read", "pm.finance:charge.write"];
    const result = await authorizeFinanceCheckout({
      residentLinkId: null,
      leaseOrganizationId: "org_fo"
    });
    expect("error" in result && result.error.status === 403).toBe(true);
  });

  it("tenant cannot obtain staff finance authority", async () => {
    state.sku = "mpa_complete_platform";
    state.membership = { id: "mem_tenant", status: "active", roles: ["tenant"] };
    state.permissions = [];
    const result = await authorizeFinanceCheckout({
      residentLinkId: null,
      leaseOrganizationId: "org_clinic"
    });
    expect("error" in result && result.error.status === 403).toBe(true);
  });

  it("vendor cannot obtain staff finance authority", async () => {
    state.sku = "mpa_complete_platform";
    state.membership = { id: "mem_vendor", status: "active", roles: ["vendor"] };
    state.permissions = [];
    const result = await authorizeFinanceCheckout({
      residentLinkId: null,
      leaseOrganizationId: "org_clinic"
    });
    expect("error" in result && result.error.status === 403).toBe(true);
  });

  it("non-member is denied", async () => {
    state.membership = null;
    const result = await authorizeFinanceCheckout({
      residentLinkId: null,
      leaseOrganizationId: "org_clinic"
    });
    expect("error" in result && result.error.status === 403).toBe(true);
  });

  it("does not treat role-only property_manager as sufficient without residential scope", async () => {
    state.sku = "mpa_complete_platform";
    state.membership = {
      id: "mem_mike",
      status: "active",
      roles: ["property_manager", "organization_admin"],
      operating_scope: "facility_operations"
    };
    const result = await authorizeFinanceCheckout({
      residentLinkId: null,
      leaseOrganizationId: "org_clinic"
    });
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toBeInstanceOf(NextResponse);
      expect(result.error.status).toBe(403);
    }
  });
});

describe("docs/161 checkout SKU and execution flag helpers", () => {
  it("allows only residential SKUs", () => {
    expect(orgSkuAllowsResidentialFinance("mpa_property_manager")).toBe(true);
    expect(orgSkuAllowsResidentialFinance("mpa_complete_platform")).toBe(true);
    expect(orgSkuAllowsResidentialFinance("mpa_facility_operations")).toBe(false);
    expect(orgSkuAllowsResidentialFinance(null)).toBe(false);
    expect(orgSkuAllowsResidentialFinance("not_a_sku")).toBe(false);
  });

  it("requires the execution flag to be explicitly true", () => {
    expect(stripePaymentExecutionEnabled({ stripe_payment_execution_enabled: true })).toBe(true);
    expect(stripePaymentExecutionEnabled({ stripe_payment_execution_enabled: false })).toBe(false);
    expect(stripePaymentExecutionEnabled(null)).toBe(false);
  });
});
