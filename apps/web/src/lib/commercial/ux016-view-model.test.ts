import { describe, expect, it } from "vitest";
import type { CommercialDashboardSnapshot } from "./dashboard-types";
import { buildCommercialUniversalDashboardViewModel } from "./ux016-view-model";

function baseSnapshot(overrides: Partial<CommercialDashboardSnapshot> = {}): CommercialDashboardSnapshot {
  return {
    generatedAt: "2026-08-05T12:00:00.000Z",
    organizations: {
      total: 20,
      trial: 2,
      pendingSetup: 3,
      active: 12,
      cancelled: 1,
      archived: 0,
      unknown: 0
    },
    newCustomersLast30Days: 2,
    trials: {
      commercialTrialStatus: 2,
      saasTrialing: 1,
      endingSoon7Days: 1
    },
    implementation: {
      queueBelow100: 4,
      aiGuidedPath: 1,
      professionalPath: 3,
      stalledBelow50: 1
    },
    health: {
      healthy: 8,
      needsAttention: 2,
      atRisk: 1,
      critical: 1,
      unscored: 0
    },
    billing: {
      activeSubscriptions: 10,
      pastDueSubscriptions: 2,
      openInvoiceCount: 1,
      openInvoiceAmountDue: 450,
      estimatedListMrr: 12000
    },
    renewals: {
      pending: 1,
      dueOrEmitted: 2,
      t90: 1,
      t30: 1,
      t7: 0
    },
    pipeline: { discovery: 2, negotiation: 1 },
    offboarding: {
      inFlight: 1,
      exportWindow: 0,
      frozen: 0,
      archiveScheduled: 0
    },
    discovery: {
      openImpressions: 3,
      accepted: 1
    },
    marketplace: {
      engagementsTotal: 2,
      engagementsOpen: 1,
      partnersStub: 0
    },
    support: {
      available: true,
      openTickets: 2
    },
    ...overrides
  };
}

describe("buildCommercialUniversalDashboardViewModel (STD-001)", () => {
  it("mounts Commercial Operations surface with UDF sections and Assistant", () => {
    const model = buildCommercialUniversalDashboardViewModel({
      snapshot: baseSnapshot(),
      userName: "Erick",
      timeGreeting: "Good morning",
      dateLabel: "Wednesday, August 5, 2026"
    });

    expect(model.greeting.surfaceLabel).toBe("Commercial Operations");
    expect(model.greeting.userName).toBe("Erick");
    expect(model.assistant.headline).toMatch(/operational briefing/i);
    expect(model.attention.length).toBeGreaterThan(0);
    expect(model.attention.length).toBeLessThanOrEqual(5);
    expect(model.mission.length).toBeGreaterThan(0);
    expect(model.quickActions.length).toBeGreaterThan(0);
    expect(model.insights.some((row) => /mrr/i.test(row.label))).toBe(true);
    expect(model.assistant.recommendedActions.length).toBeGreaterThan(0);
  });

  it("prioritizes billing failures and critical health in Immediate Attention", () => {
    const model = buildCommercialUniversalDashboardViewModel({
      snapshot: baseSnapshot(),
      timeGreeting: "Good afternoon",
      dateLabel: "Wednesday, August 5, 2026"
    });

    expect(model.attention[0]?.id).toBe("comm-past-due");
    expect(model.attention[0]?.severity).toBe("critical");
    expect(model.attention.some((item) => item.id === "comm-health-critical")).toBe(true);
    expect(model.assistant.waitingOnMe.some((item) => /billing|activation|health/i.test(item.label))).toBe(
      true
    );
  });
});
