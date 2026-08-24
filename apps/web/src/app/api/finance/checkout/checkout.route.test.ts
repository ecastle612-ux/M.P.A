import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";

const { serviceRole, authorize } = vi.hoisted(() => ({
  serviceRole: vi.fn(),
  authorize: vi.fn()
}));

vi.mock("../../../../lib/finance/checkout-authz", async () => {
  const actual = (await vi.importActual("../../../../lib/finance/checkout-authz")) as Record<
    string,
    unknown
  >;
  return {
    ...actual,
    authorizeFinanceCheckout: (...args: unknown[]) => authorize(...args)
  };
});

vi.mock("../../../../lib/supabase/service-role", () => ({
  createServiceRoleClient: () => serviceRole()
}));

vi.mock("../../../../lib/auth/server", () => ({
  createAuthServerClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: { id: "user_mike" } } })
    },
    from: (table: string) => {
      const builder = {
        select: () => builder,
        eq: () => builder,
        in: () => builder,
        maybeSingle: async () => {
          if (table === "lease_agreements") {
            return {
              data: { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", property_id: "prop_1", organization_id: "org_clinic" },
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

vi.mock("../../../../lib/finance/stripe", () => ({
  isStripeConfigured: () => true,
  getStripeClient: () => ({ checkout: { sessions: { create: vi.fn() } } }),
  randomIntegrationSuffix: () => "test"
}));

import { POST } from "./route";

describe("POST /api/finance/checkout M4 authorization boundary", () => {
  beforeEach(() => {
    authorize.mockReset();
    serviceRole.mockReset();
  });

  it("denies Mike before createServiceRoleClient", async () => {
    authorize.mockResolvedValue({
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 })
    });

    const response = await POST(
      new Request("http://localhost/api/finance/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          leaseId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          paymentMethodType: "card"
        })
      })
    );

    expect(response.status).toBe(403);
    expect(serviceRole).not.toHaveBeenCalled();
    expect(authorize).toHaveBeenCalledWith({
      residentLinkId: null,
      leaseOrganizationId: "org_clinic"
    });
  });
});
