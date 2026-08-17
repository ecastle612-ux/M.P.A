import { beforeEach, describe, expect, it, vi } from "vitest";

const state = {
  user: { id: "user_1", email: "buyer@example.com" } as { id: string; email: string } | null,
  operator: false,
  commerce: { kind: "none" } as
    | { kind: "none" }
    | { kind: "unresolved" }
    | { kind: "resolved"; productSku: string; organizationId: string | null },
  createdSku: null as string | null,
  insertedOrg: false
};

vi.mock("../../../lib/auth/server", () => ({
  createAuthServerClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: state.user } })
    },
    from: (table: string) => {
      if (table === "organizations") {
        return {
          insert: () => ({
            select: () => ({
              single: async () => {
                state.insertedOrg = true;
                return {
                  data: { id: "org_new", name: "Acme Group", slug: "acme-group" },
                  error: null
                };
              }
            })
          })
        };
      }
      return {
        insert: async () => ({ data: { id: "mem_1" }, error: null })
      };
    }
  })
}));

vi.mock("../../../lib/commercial/server", () => ({
  isPlatformOperatorUser: async () => state.operator,
  assignOrganizationSubscription: async (input: { sku: string }) => {
    state.createdSku = input.sku;
    return { error: null };
  }
}));

vi.mock("../../../lib/organization/server", () => ({
  getOrganizationsForUser: async () => []
}));

vi.mock("../../../lib/organization/resolve-commerce-org-create", () => ({
  resolveCommerceOrgCreateContext: async () => state.commerce
}));

import { POST } from "./route";

describe("POST /api/organizations P1-05 SKU safety", () => {
  beforeEach(() => {
    state.user = { id: "user_1", email: "buyer@example.com" };
    state.operator = false;
    state.commerce = { kind: "none" };
    state.createdSku = null;
    state.insertedOrg = false;
  });

  it("retains Facility Operations and Complete commerce SKUs", async () => {
    for (const sku of ["mpa_facility_operations", "mpa_complete_platform"] as const) {
      state.createdSku = null;
      state.insertedOrg = false;
      state.commerce = { kind: "resolved", productSku: sku, organizationId: null };
      const response = await POST(
        new Request("http://localhost/api/organizations", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name: "Acme Group" })
        })
      );
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.subscription.productSku).toBe(sku);
      expect(state.createdSku).toBe(sku);
    }
  });

  it("does not silently create a Property Manager organization from unresolved commerce", async () => {
    state.commerce = { kind: "unresolved" };
    const response = await POST(
      new Request("http://localhost/api/organizations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Acme Group" })
      })
    );
    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.code).toBe("commerce_state_unresolved");
    expect(body.error).toMatch(/Check your email/i);
    expect(state.insertedOrg).toBe(false);
    expect(state.createdSku).toBeNull();
  });

  it("refuses a second create when commerce already provisioned an organization", async () => {
    state.commerce = {
      kind: "resolved",
      productSku: "mpa_complete_platform",
      organizationId: "org_existing"
    };
    const response = await POST(
      new Request("http://localhost/api/organizations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Acme Group" })
      })
    );
    expect(response.status).toBe(409);
    expect(state.insertedOrg).toBe(false);
  });
});
