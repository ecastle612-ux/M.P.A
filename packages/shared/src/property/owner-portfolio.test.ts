import { describe, expect, it } from "vitest";
import {
  buildMissionControlNextAction,
  buildOwnerPortfolioAssistantSummary,
  buildOwnerPortfolioReadyAssistantCopy
} from "./journey";

describe("LAUNCH-001 J8 owner portfolio journey", () => {
  it("summarizes operational portfolio health without accounting language", () => {
    const summary = buildOwnerPortfolioAssistantSummary({
      propertyCount: 2,
      unitsOccupied: 8,
      unitsTotal: 10,
      occupancyRate: 80,
      currentMonthIncome: 12000,
      outstandingRent: 1500,
      vendorPayments: 800,
      openMaintenanceCount: 2,
      activeLeaseCount: 8,
      recentPaymentCount: 3
    });
    expect(summary).toContain("2 properties");
    expect(summary).toContain("80% occupied");
    expect(summary).toContain("outstanding");
    expect(summary).toContain("open maintenance");
    expect(summary.toLowerCase()).not.toContain("roi");
    expect(summary.toLowerCase()).not.toContain("accounting");
  });

  it("progresses from owner portfolio review to customer promise complete", () => {
    const before = buildMissionControlNextAction({
      setupComplete: true,
      propertyCount: 1,
      teamReady: true,
      residentReady: true,
      leaseReady: true,
      rentReady: true,
      maintenanceReady: true,
      dailyOpsReady: true,
      ownerPortfolioReady: false
    });
    expect(before.id).toBe("review_owner_portfolio");
    expect(before.href).toBe("/portal/owner");
    expect(before.assistantRecommendation).toBe("Review your owner's portfolio.");

    const after = buildMissionControlNextAction({
      setupComplete: true,
      propertyCount: 1,
      teamReady: true,
      residentReady: true,
      leaseReady: true,
      rentReady: true,
      maintenanceReady: true,
      dailyOpsReady: true,
      ownerPortfolioReady: true
    });
    expect(after.id).toBe("customer_promise_complete");
    expect(after.href).toBe("/portal/owner");
    expect(after.assistantRecommendation).toBe(
      buildOwnerPortfolioReadyAssistantCopy()
    );
    expect(buildOwnerPortfolioReadyAssistantCopy()).toContain(
      "I can confidently monitor my investment portfolio using M.P.A."
    );
  });
});
