import { describe, expect, it } from "vitest";
import type { OperationsCenterSnapshot } from "./operations-center";
import { buildMasterAdminUniversalDashboardViewModel } from "./ux016-view-model";

function baseSnapshot(overrides: Partial<OperationsCenterSnapshot> = {}): OperationsCenterSnapshot {
  return {
    greetingName: "Erick",
    activeOrganizationId: "org-1",
    activeOrganizationName: "Canopy HQ",
    attention: [
      {
        id: "health-properties",
        severity: "critical",
        category: "platform",
        title: "Health check failed for properties",
        context: "timeout",
        href: "/master-admin/health"
      },
      {
        id: "support-messages",
        severity: "warning",
        category: "support",
        title: "2 support conversations waiting",
        context: "Canopy HQ",
        href: "/communications/inbox"
      }
    ],
    kpis: [
      {
        id: "organizations",
        label: "Organizations",
        value: "12",
        href: "/master-admin/impersonation",
        scope: "platform",
        available: true
      },
      {
        id: "users",
        label: "Users",
        value: "40",
        href: "/master-admin/impersonation",
        scope: "platform",
        available: true
      },
      {
        id: "properties",
        label: "Properties",
        value: "8",
        href: "/properties",
        scope: "active_org",
        available: true
      },
      {
        id: "open-work-orders",
        label: "Open Work Orders",
        value: "5",
        href: "/maintenance",
        scope: "active_org",
        available: true
      },
      {
        id: "leases",
        label: "Leases",
        value: "22",
        href: "/leases",
        scope: "active_org",
        available: true
      },
      {
        id: "support",
        label: "Support",
        value: "2",
        href: "/communications/inbox",
        scope: "active_org",
        available: true
      },
      {
        id: "billing",
        label: "Billing",
        value: "$1,200",
        href: "/financials",
        scope: "active_org",
        available: true
      },
      {
        id: "integrations",
        label: "Integrations",
        value: "4/6",
        href: "/settings/integrations",
        scope: "platform",
        available: true
      }
    ],
    generatedAt: "2026-08-05T12:00:00.000Z",
    ...overrides
  };
}

describe("buildMasterAdminUniversalDashboardViewModel (UX-016 Slice B)", () => {
  it("uses Mission Control surface label and platform health place signal", () => {
    const model = buildMasterAdminUniversalDashboardViewModel({
      snapshot: baseSnapshot(),
      timeGreeting: "Good morning",
      dateLabel: "Wednesday, August 5, 2026"
    });

    expect(model.greeting.surfaceLabel).toBe("Mission Control");
    expect(model.greeting.userName).toBe("Erick");
    expect(model.greeting.organizationName).toBe("Canopy HQ");
    expect(model.greeting.placeLabel).toContain("Platform Health");
    expect(model.greeting.statusSummary.toLowerCase()).toContain("attention");
  });

  it("maps Immediate Attention (≤5) and required Insights labels", () => {
    const model = buildMasterAdminUniversalDashboardViewModel({
      snapshot: baseSnapshot(),
      timeGreeting: "Good afternoon",
      dateLabel: "Wednesday, August 5, 2026"
    });

    expect(model.attention.length).toBeLessThanOrEqual(5);
    expect(model.attention[0]?.severity).toBe("critical");
    expect(model.mission.length).toBeGreaterThan(0);
    expect(model.quickActions.length).toBeGreaterThan(0);
    expect(model.quickActions.length).toBeLessThanOrEqual(6);

    const insightLabels = model.insights.map((item) => item.label);
    for (const label of [
      "Organizations",
      "Users",
      "Properties",
      "Open Work Orders",
      "Leases",
      "Support",
      "Billing",
      "Integrations",
      "Platform Health"
    ]) {
      expect(insightLabels).toContain(label);
    }
  });

  it("stays calm when attention is empty", () => {
    const model = buildMasterAdminUniversalDashboardViewModel({
      snapshot: baseSnapshot({ attention: [] }),
      timeGreeting: "Good evening",
      dateLabel: "Wednesday, August 5, 2026"
    });

    expect(model.attention).toEqual([]);
    expect(model.greeting.placeLabel).toBe("Platform Health · All clear");
    expect(model.greeting.statusSummary.toLowerCase()).toContain("clear");
    expect(model.mission.length).toBeGreaterThan(0);
  });
});
