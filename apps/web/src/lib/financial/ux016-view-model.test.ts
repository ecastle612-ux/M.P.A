import { describe, expect, it } from "vitest";
import type { FinancialActivityRecord } from "./contracts";
import type { FinancialDashboardMetrics } from "./server";
import { buildFinancialUniversalDashboardViewModel } from "./ux016-view-model";

const metrics = {
  rentDueToday: 2,
  lateRentCount: 3,
  outstandingBalancesTotal: 4500,
  recentPayments: [{ id: "p1" }],
  recentExpenses: [{ id: "e1" }],
  ownerStatementStatusCounts: { draft: 1, generated: 2, sent: 0, archived: 0 }
} as unknown as FinancialDashboardMetrics;

function activity(type: FinancialActivityRecord["activityType"], id: string): FinancialActivityRecord {
  return {
    id,
    organizationId: "org-1",
    activityType: type,
    entityType: "charge",
    entityId: "c1",
    leaseId: null,
    propertyId: null,
    tenantId: null,
    amount: 100,
    balanceAfter: null,
    summary: type.replaceAll("_", " "),
    payload: {},
    createdBy: "u1",
    createdAt: "2026-08-05T12:00:00.000Z"
  };
}

describe("buildFinancialUniversalDashboardViewModel (STD-001)", () => {
  it("mounts Financial Operations surface with UDF sections", () => {
    const model = buildFinancialUniversalDashboardViewModel({
      metrics,
      activity: [activity("payment_received", "a1")],
      canCreate: true,
      userName: "Erick",
      organizationName: "Canopy HQ",
      timeGreeting: "Good morning",
      dateLabel: "Wednesday, August 5, 2026"
    });

    expect(model.greeting.surfaceLabel).toBe("Financial Operations");
    expect(model.assistant.headline).toMatch(/operational briefing/i);
    expect(model.mission.some((row) => /accounts receivable/i.test(row.label))).toBe(true);
    expect(model.insights.some((row) => /outstanding/i.test(row.label))).toBe(true);
    expect(model.quickActions[0]?.id).toBe("qa-create-charge");
  });

  it("prioritizes financial risk (failed payments / late AR) in Immediate Attention", () => {
    const model = buildFinancialUniversalDashboardViewModel({
      metrics,
      activity: [activity("payment_failed", "fail-1"), activity("payment_failed", "fail-2")],
      canCreate: false,
      timeGreeting: "Good evening",
      dateLabel: "Wednesday, August 5, 2026"
    });

    expect(model.attention[0]?.id).toBe("fin-failed-payments");
    expect(model.attention[0]?.severity).toBe("critical");
    expect(model.attention.some((item) => item.id === "fin-late-rent")).toBe(true);
    expect(model.greeting.placeLabel.toLowerCase()).toContain("risk");
  });
});
