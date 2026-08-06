import { describe, expect, it } from "vitest";
import {
  buildCommandCenterAssistantRecommendation,
  buildOwnerAssistantRecommendation,
  currentMonthBounds,
  netOperationalCash,
  occupancyRate,
  ownerSummaryToCsvRows,
  toCsv,
  OWNER_SUMMARY_CSV_COLUMNS,
  type OwnerFinancialSummary
} from "./reporting";

describe("FIN-OPS-001 S3 reporting helpers", () => {
  it("computes month bounds, net cash, and occupancy", () => {
    const bounds = currentMonthBounds(new Date("2026-08-15T12:00:00.000Z"));
    expect(bounds.monthStart).toBe("2026-08-01");
    expect(bounds.monthEnd).toBe("2026-08-31");
    expect(netOperationalCash(1000, 250)).toBe(750);
    expect(occupancyRate(3, 4)).toBe(75);
    expect(occupancyRate(0, 0)).toBe(0);
  });

  it("builds actionable assistant copy without accounting jargon", () => {
    const command = buildCommandCenterAssistantRecommendation({
      expectedRentThisMonth: 5000,
      rentCollectedThisMonth: 2000,
      outstandingRent: 1500,
      delinquencyCount: 2,
      vendorInvoicesAwaitingApproval: 0,
      vendorPaymentsDue: 0
    });
    expect(command).toMatch(/past due/i);

    const owner = buildOwnerAssistantRecommendation({
      monthLabel: "August 2026",
      currentMonthIncome: 4000,
      currentMonthExpenses: 500,
      outstandingRent: 800,
      vendorPayments: 500,
      netOperationalCash: 3500,
      occupancy: { unitsTotal: 10, unitsOccupied: 9, occupancyRate: 90 },
      properties: [],
      alerts: []
    });
    expect(owner).toMatch(/outstanding rent/i);
  });

  it("exports owner summary CSV", () => {
    const summary: OwnerFinancialSummary = {
      monthLabel: "August 2026",
      currentMonthIncome: 1000,
      currentMonthExpenses: 200,
      outstandingRent: 100,
      vendorPayments: 200,
      netOperationalCash: 800,
      occupancy: { unitsTotal: 2, unitsOccupied: 2, occupancyRate: 100 },
      properties: [
        {
          propertyId: "p1",
          propertyName: "Oak Street",
          expectedRentThisMonth: 1000,
          rentCollectedThisMonth: 1000,
          outstandingRent: 100,
          outstandingBalance: 100,
          delinquencyCount: 0,
          totalDelinquency: 0,
          vendorPayablesOpen: 0,
          vendorPaidThisMonth: 200,
          netOperationalCash: 800,
          unitsTotal: 2,
          unitsOccupied: 2,
          occupancyRate: 100,
          upcomingChargesCount: 0,
          alerts: []
        }
      ],
      alerts: []
    };
    const csv = toCsv(ownerSummaryToCsvRows(summary), OWNER_SUMMARY_CSV_COLUMNS);
    expect(csv).toContain("Property");
    expect(csv).toContain("Oak Street");
    expect(csv).toContain("1000");
  });
});
