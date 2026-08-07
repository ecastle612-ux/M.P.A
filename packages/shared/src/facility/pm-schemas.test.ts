import { describe, expect, it } from "vitest";
import {
  advancePmDueDate,
  createPmScheduleInputSchema,
  daysBetweenUtcDates
} from "./pm-schemas";

describe("facility PM schemas (E.4)", () => {
  it("requires asset or system assignment", () => {
    const parsed = createPmScheduleInputSchema.safeParse({
      siteId: "11111111-1111-4111-8111-111111111111",
      name: "Quarterly filter",
      titleTemplate: "Replace HVAC filters"
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts schedule with asset target", () => {
    const parsed = createPmScheduleInputSchema.safeParse({
      siteId: "11111111-1111-4111-8111-111111111111",
      assetId: "22222222-2222-4222-8222-222222222222",
      name: "Quarterly filter",
      titleTemplate: "Replace HVAC filters",
      cadenceUnit: "month",
      cadenceInterval: 3
    });
    expect(parsed.success).toBe(true);
  });

  it("advances due dates by cadence", () => {
    expect(advancePmDueDate("2026-01-15", "month", 1)).toBe("2026-02-15");
    expect(advancePmDueDate("2026-01-15", "week", 2)).toBe("2026-01-29");
    expect(daysBetweenUtcDates("2026-01-01", "2026-01-10")).toBe(9);
  });
});
