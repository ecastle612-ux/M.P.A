import { describe, expect, it } from "vitest";
import {
  compareTasksByPriorityThenDue,
  mapWorkOrderPriorityToOps,
  maxPriority,
  opsPriorityToNotifyPriority,
  resolveOpsPriority
} from "./priority-engine";

describe("OPS-001 Slice C priority-engine", () => {
  it("maps WO emergency to critical", () => {
    expect(mapWorkOrderPriorityToOps("emergency")).toBe("critical");
    expect(mapWorkOrderPriorityToOps("high")).toBe("high");
    expect(mapWorkOrderPriorityToOps("medium")).toBe("medium");
    expect(mapWorkOrderPriorityToOps("low")).toBe("low");
  });

  it("forces critical on safety keywords", () => {
    expect(
      resolveOpsPriority({
        domainPriority: "low",
        safetyText: "Suspected gas leak in unit"
      })
    ).toBe("critical");
  });

  it("takes max of inherited and domain", () => {
    expect(
      resolveOpsPriority({
        domainPriority: "medium",
        inherited: "high",
        eventType: "maintenance.request.created"
      })
    ).toBe("high");
    expect(maxPriority("low", "medium", "critical")).toBe("critical");
  });

  it("maps notify urgency slots", () => {
    expect(opsPriorityToNotifyPriority("critical")).toBe("emergency");
    expect(opsPriorityToNotifyPriority("high")).toBe("high");
  });

  it("orders tasks by priority then due", () => {
    const rows = [
      { priority: "medium" as const, dueAt: "2026-07-28T00:00:00Z" },
      { priority: "critical" as const, dueAt: "2026-07-30T00:00:00Z" },
      { priority: "high" as const, dueAt: null }
    ];
    const sorted = [...rows].sort(compareTasksByPriorityThenDue);
    expect(sorted[0]?.priority).toBe("critical");
    expect(sorted[1]?.priority).toBe("high");
    expect(sorted[2]?.priority).toBe("medium");
  });
});
