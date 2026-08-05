import { describe, expect, it } from "vitest";
import type { OwnerPortalDashboardModel } from "./dashboard";
import { buildOwnerUniversalDashboardViewModel } from "./ux016-view-model";

function baseModel(overrides: Partial<OwnerPortalDashboardModel> = {}): OwnerPortalDashboardModel {
  return {
    welcomeName: "Jordan",
    propertyCount: 3,
    scopeMode: "organization_role_interim",
    ownerPropertyAccessTableMissing: false,
    propertyCountWidget: { status: "ready", value: "3", href: "/portal/owner/properties" },
    occupancy: { status: "ready", value: "92%", detail: "11 of 12 units occupied" },
    revenue: { status: "ready", value: "$12,400" },
    expenses: { status: "ready", value: "$3,100" },
    outstanding: { status: "ready", value: "$800", href: "/portal/owner/financials" },
    latestStatement: { status: "empty", message: "No statement yet" },
    recentVendorExpenses: { status: "empty", message: "No vendor expenses" },
    pendingPayout: { status: "ready", value: "$2,200", href: "/portal/owner/financials" },
    recentMessages: { status: "empty", message: "No messages" },
    recentDocuments: { status: "empty", message: "No documents" },
    recentReports: { status: "empty", message: "No reports" },
    notifications: { status: "empty", message: "No notifications" },
    attentionItems: [
      {
        id: "att-1",
        title: "Insurance expiring",
        subtitle: "Property A · 12 days",
        href: "/portal/owner/documents"
      }
    ],
    ...overrides
  };
}

describe("buildOwnerUniversalDashboardViewModel (STD-001)", () => {
  it("mounts Owner Home with attention before Insights KPIs", () => {
    const model = buildOwnerUniversalDashboardViewModel({
      model: baseModel(),
      organizationName: "Jordan Holdings",
      timeGreeting: "Good morning",
      dateLabel: "Wednesday, August 5, 2026"
    });

    expect(model.greeting.surfaceLabel).toBe("Owner Home");
    expect(model.attention[0]?.id).toBe("att-1");
    expect(model.insights.some((row) => /occupancy|properties|collections/i.test(row.label))).toBe(true);
    expect(model.assistant.headline).toMatch(/operational briefing/i);
  });

  it("surfaces outstanding balance in Immediate Attention when present", () => {
    const model = buildOwnerUniversalDashboardViewModel({
      model: baseModel({ attentionItems: [] }),
      timeGreeting: "Good afternoon",
      dateLabel: "Wednesday, August 5, 2026"
    });

    expect(model.attention.some((item) => item.id === "owner-outstanding")).toBe(true);
  });
});
