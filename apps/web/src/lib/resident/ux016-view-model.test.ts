import { describe, expect, it } from "vitest";
import { buildResidentUniversalDashboardViewModel } from "./ux016-view-model";

describe("buildResidentUniversalDashboardViewModel (STD-001)", () => {
  it("mounts calm Resident Home with UDF sections", () => {
    const model = buildResidentUniversalDashboardViewModel({
      firstName: "Alex",
      propertyName: "Oak Court",
      unitNumber: "12B",
      hasLinkedTenant: true,
      attentionItems: [
        {
          id: "announcement-1",
          title: "Water shutoff Tuesday",
          body: "Building notice",
          href: "/portal/tenant/announcements/1",
          critical: false,
          unread: true,
          timeSensitive: true,
          createdAt: "2026-08-05T12:00:00.000Z",
          kind: "announcement"
        }
      ],
      todayCards: [
        {
          id: "rent-due",
          title: "Rent due",
          description: "$1,200 ready when you are.",
          href: "/portal/tenant/payments"
        }
      ],
      timeGreeting: "Good morning",
      dateLabel: "Wednesday, August 5, 2026"
    });

    expect(model.greeting.surfaceLabel).toBe("Resident Home");
    expect(model.greeting.supportingLine.toLowerCase()).toContain("calm");
    expect(model.assistant.headline).toMatch(/operational briefing/i);
    expect(model.attention.some((item) => item.href.includes("payments") || item.id.includes("rent"))).toBe(
      true
    );
    expect(model.quickActions[0]?.id).toBe("qa-pay");
    expect(model.greeting.placeLabel).toContain("Oak Court");
  });

  it("stays calm when there is nothing waiting", () => {
    const model = buildResidentUniversalDashboardViewModel({
      firstName: "Alex",
      propertyName: null,
      unitNumber: null,
      hasLinkedTenant: true,
      attentionItems: [],
      todayCards: [],
      timeGreeting: "Good evening",
      dateLabel: "Wednesday, August 5, 2026"
    });

    expect(model.attention).toHaveLength(0);
    expect(model.greeting.statusSummary.toLowerCase()).toMatch(/clear|caught|today/);
  });
});
