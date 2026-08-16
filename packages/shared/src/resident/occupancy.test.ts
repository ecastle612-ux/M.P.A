import { describe, expect, it } from "vitest";
import {
  deriveOccupancyAccess,
  financeChargeVisibleToOccupancy,
  occupancyIsCurrent,
  resolveFinanceChargeDate
} from "./occupancy";

const occupying = {
  occupancyStatus: "occupying" as const,
  occupyFrom: "2026-01-01",
  occupyTo: null
};

describe("docs/166 occupancy access", () => {
  it("keeps access through the inclusive UTC move-out date", () => {
    const row = { occupancyStatus: "occupying" as const, occupyFrom: "2026-01-01", occupyTo: "2026-08-16" };
    expect(deriveOccupancyAccess(row, "2026-08-16")).toBe("active");
    expect(deriveOccupancyAccess(row, "2026-08-17")).toBe("moved_out");
  });

  it("treats occupy_from after today as future", () => {
    expect(
      deriveOccupancyAccess(
        { occupancyStatus: "scheduled", occupyFrom: "2026-09-01", occupyTo: null },
        "2026-08-16"
      )
    ).toBe("future");
  });

  it("does not treat membership-less dates as current without a window", () => {
    expect(occupancyIsCurrent(occupying, "2026-08-16")).toBe(true);
    expect(
      occupancyIsCurrent(
        { occupancyStatus: "moved_out", occupyFrom: "2025-01-01", occupyTo: "2026-01-31" },
        "2026-08-16"
      )
    ).toBe(false);
  });

  it("hides later occupant charges from a former tenant", () => {
    const former = {
      occupancyStatus: "moved_out" as const,
      occupyFrom: "2026-01-01",
      occupyTo: "2026-06-30"
    };
    expect(financeChargeVisibleToOccupancy(former, "2026-06-01", "2026-08-16")).toBe(true);
    expect(financeChargeVisibleToOccupancy(former, "2026-07-15", "2026-08-16")).toBe(false);
    expect(financeChargeVisibleToOccupancy(occupying, "2026-07-15", "2026-08-16")).toBe(true);
  });

  it("resolves charge dates without inventing money", () => {
    expect(resolveFinanceChargeDate({ periodStart: "2026-07-01", dueAt: "2026-07-05" })).toBe("2026-07-01");
    expect(resolveFinanceChargeDate({ dueAt: "2026-07-05", createdAt: "2026-07-06T12:00:00Z" })).toBe(
      "2026-07-05"
    );
  });
});
