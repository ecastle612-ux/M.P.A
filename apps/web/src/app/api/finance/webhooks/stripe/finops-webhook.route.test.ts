import { beforeEach, describe, expect, it, vi } from "vitest";

const { applySucceededPayment, markPaymentFailed, constructEvent, from } = vi.hoisted(() => ({
  applySucceededPayment: vi.fn(),
  markPaymentFailed: vi.fn(),
  constructEvent: vi.fn(),
  from: vi.fn()
}));

vi.mock("../../../../../lib/finance/billing-service", () => ({
  applySucceededPayment,
  markPaymentFailed
}));

vi.mock("../../../../../lib/finance/stripe", () => ({
  getStripeClient: () => ({
    webhooks: { constructEvent }
  })
}));

vi.mock("../../../../../lib/supabase/service-role", () => ({
  createServiceRoleClient: () => ({ from })
}));

vi.mock("../../../../../lib/env/server-env", () => ({
  serverEnv: { STRIPE_WEBHOOK_SECRET: "whsec_test" }
}));

import { POST } from "./route";

function builder(result: { data: unknown; error: null }) {
  const query = {
    select: () => query,
    eq: () => query,
    maybeSingle: async () => result,
    insert: async () => result,
    update: () => query
  };
  return query;
}

describe("POST /api/finance/webhooks/stripe pending-row contract", () => {
  beforeEach(() => {
    applySucceededPayment.mockReset();
    markPaymentFailed.mockReset();
    constructEvent.mockReset();
    from.mockReset();
  });

  it("does not invent a payment when the pending row is missing", async () => {
    constructEvent.mockReturnValue({
      id: "evt_1",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_1",
          metadata: {
            payment_id: "pay_missing",
            organization_id: "org_1",
            lease_id: "lease_1"
          },
          amount_total: 10000,
          currency: "usd"
        }
      }
    });

    const updates: Array<Record<string, unknown>> = [];
    from.mockImplementation((table: string) => {
      if (table === "financial_stripe_webhook_events") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null, error: null })
            })
          }),
          insert: async () => ({ data: { id: "evt_row" }, error: null }),
          update: (payload: Record<string, unknown>) => {
            updates.push(payload);
            return { eq: async () => ({ data: null, error: null }) };
          }
        };
      }
      if (table === "financial_payments") {
        return builder({ data: null, error: null });
      }
      return builder({ data: null, error: null });
    });

    const response = await POST(
      new Request("http://localhost/api/finance/webhooks/stripe", {
        method: "POST",
        headers: { "stripe-signature": "sig_test" },
        body: "{}"
      })
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "pending_payment_missing" });
    expect(applySucceededPayment).not.toHaveBeenCalled();
    expect(updates.some((row) => row["error"] === "pending_payment_missing")).toBe(true);
  });
});
