import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";

const {
  requireFinance,
  upsertLateFeePolicy,
  assessLateFees,
  syncDelinquencyCases,
  sendDelinquencyReminder,
  createPaymentArrangement
} = vi.hoisted(() => ({
  requireFinance: vi.fn(),
  upsertLateFeePolicy: vi.fn(),
  assessLateFees: vi.fn(),
  syncDelinquencyCases: vi.fn(),
  sendDelinquencyReminder: vi.fn(),
  createPaymentArrangement: vi.fn()
}));

vi.mock("../../../../lib/finance/authz", () => ({
  requireFinancePermission: (...args: unknown[]) => requireFinance(...args)
}));

vi.mock("../../../../lib/finance/collections-service", () => ({
  upsertLateFeePolicy,
  assessLateFees,
  syncDelinquencyCases,
  sendDelinquencyReminder,
  createPaymentArrangement,
  getCollectionsSnapshot: vi.fn()
}));

import { POST } from "./route";
import { FINANCE_M5_COLLECTION_KINDS } from "../../../../lib/finance/m5-hard-stop";

describe("POST /api/finance/collections M5 hard-stop", () => {
  beforeEach(() => {
    requireFinance.mockReset();
    upsertLateFeePolicy.mockReset();
    assessLateFees.mockReset();
    syncDelinquencyCases.mockReset();
    sendDelinquencyReminder.mockReset();
    createPaymentArrangement.mockReset();
  });

  it("unauthorized callers fail authorization and never reach M5 services", async () => {
    requireFinance.mockResolvedValue({
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 })
    });

    const response = await POST(
      new Request("http://localhost/api/finance/collections", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind: "assess_late_fees" })
      })
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "Forbidden" });
    expect(assessLateFees).not.toHaveBeenCalled();
  });

  it.each([...FINANCE_M5_COLLECTION_KINDS])(
    "authorized %s returns finance_m5_not_authorized and does not mutate",
    async (kind) => {
      requireFinance.mockResolvedValue({
        supabase: {},
        organizationId: "org_1",
        user: { id: "erick" }
      });

      const response = await POST(
        new Request("http://localhost/api/finance/collections", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ kind })
        })
      );

      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({ error: "finance_m5_not_authorized" });
      expect(upsertLateFeePolicy).not.toHaveBeenCalled();
      expect(assessLateFees).not.toHaveBeenCalled();
      expect(syncDelinquencyCases).not.toHaveBeenCalled();
      expect(sendDelinquencyReminder).not.toHaveBeenCalled();
      expect(createPaymentArrangement).not.toHaveBeenCalled();
    }
  );
});
