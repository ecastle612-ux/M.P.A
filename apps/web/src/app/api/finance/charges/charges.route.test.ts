import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";

const { requireFinance, createOneTimeCharge } = vi.hoisted(() => ({
  requireFinance: vi.fn(),
  createOneTimeCharge: vi.fn()
}));

vi.mock("../../../../lib/finance/authz", () => ({
  requireFinancePermission: (...args: unknown[]) => requireFinance(...args)
}));

vi.mock("../../../../lib/finance/billing-service", () => ({
  createOneTimeCharge,
  createRecurringScheduleAndCharge: vi.fn(),
  voidCharge: vi.fn()
}));

import { POST } from "./route";

const chargePayload = {
  kind: "one_time",
  leaseId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  amount: 25,
  dueAt: "2026-08-20",
  label: "UAT charge"
};

describe("POST /api/finance/charges write-guard vs authorization", () => {
  beforeEach(() => {
    requireFinance.mockReset();
    createOneTimeCharge.mockReset();
  });

  it("unauthorized requests fail authorization and never mutate", async () => {
    requireFinance.mockResolvedValue({
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 })
    });

    const response = await POST(
      new Request("http://localhost/api/finance/charges", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(chargePayload)
      })
    );

    expect(requireFinance).toHaveBeenCalledWith("pm.finance:charge.write");
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "Forbidden" });
    expect(createOneTimeCharge).not.toHaveBeenCalled();
  });

  it("authorized writes reach the service and surface finance_ops_writes_frozen", async () => {
    requireFinance.mockResolvedValue({
      supabase: { from: vi.fn() },
      organizationId: "org_clinic",
      user: { id: "erick" }
    });
    createOneTimeCharge.mockRejectedValue(new Error("finance_ops_writes_frozen"));

    const response = await POST(
      new Request("http://localhost/api/finance/charges", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(chargePayload)
      })
    );

    expect(createOneTimeCharge).toHaveBeenCalled();
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "finance_ops_writes_frozen" });
  });
});
