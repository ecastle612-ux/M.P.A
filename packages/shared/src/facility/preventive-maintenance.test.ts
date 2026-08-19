import { describe, expect, it } from "vitest";
import {
  addCalendarMonthsAnchored,
  advanceUntilOnOrAfter,
  createPmPlanInputSchema,
  dueAtTimestamp,
  memberCanAdministerPreventiveMaintenance,
  nextOccurrenceDueOn,
  recurrenceLabel,
  isPlanDueSoon,
  isPlanOverdue,
  shouldGenerateOccurrence,
  workOrderOriginLabel,
  workOrderOriginSource
} from "./preventive-maintenance";

describe("FO-EFF Slice 5 — recurrence and due dates", () => {
  it("uses human recurrence copy", () => {
    expect(recurrenceLabel("quarterly")).toBe("Every 3 months");
    expect(recurrenceLabel("every_n_months", 3)).toBe("Every 3 months");
    expect(recurrenceLabel("weekly")).toBe("Every week");
    expect(recurrenceLabel("annual")).toBe("Every year");
  });

  it("keeps Jan 31 monthly on month-end", () => {
    expect(addCalendarMonthsAnchored("2026-01-31", 1, 31)).toBe("2026-02-28");
    expect(addCalendarMonthsAnchored("2026-02-28", 1, 31)).toBe("2026-03-31");
    expect(nextOccurrenceDueOn({ fromDueOn: "2026-01-31", kind: "monthly", anchorDayOfMonth: 31 })).toBe(
      "2026-02-28"
    );
  });

  it("handles leap year annual Feb 29", () => {
    expect(addCalendarMonthsAnchored("2024-02-29", 12, 29)).toBe("2025-02-28");
    expect(addCalendarMonthsAnchored("2025-02-28", 12, 29)).toBe("2026-02-28");
    expect(addCalendarMonthsAnchored("2027-02-28", 12, 29)).toBe("2028-02-29");
  });

  it("advances quarterly, weekly, and semiannual from a known date", () => {
    expect(nextOccurrenceDueOn({ fromDueOn: "2026-01-15", kind: "quarterly" })).toBe("2026-04-15");
    expect(nextOccurrenceDueOn({ fromDueOn: "2026-01-15", kind: "weekly" })).toBe("2026-01-22");
    expect(nextOccurrenceDueOn({ fromDueOn: "2026-01-15", kind: "every_n_weeks", intervalN: 2 })).toBe(
      "2026-01-29"
    );
    expect(nextOccurrenceDueOn({ fromDueOn: "2026-01-15", kind: "semiannual", anchorDayOfMonth: 15 })).toBe(
      "2026-07-15"
    );
  });

  it("classifies due soon and overdue from calendar dates", () => {
    expect(isPlanDueSoon("2026-11-16", "2026-11-09")).toBe(true);
    expect(isPlanDueSoon("2026-11-16", "2026-11-08")).toBe(false);
    expect(isPlanOverdue("2026-11-08", "2026-11-09")).toBe(true);
    expect(isPlanOverdue("2026-11-09", "2026-11-09")).toBe(false);
  });

  it("generates when today is inside the lead window", () => {
    expect(
      shouldGenerateOccurrence({ nextDueOn: "2026-11-16", generateDaysBefore: 7, today: "2026-11-09" })
    ).toBe(true);
    expect(
      shouldGenerateOccurrence({ nextDueOn: "2026-11-16", generateDaysBefore: 7, today: "2026-11-08" })
    ).toBe(false);
    expect(
      shouldGenerateOccurrence({ nextDueOn: "2026-11-16", generateDaysBefore: 0, today: "2026-11-16" })
    ).toBe(true);
  });

  it("skips past due dates on resume without inventing completion", () => {
    const advanced = advanceUntilOnOrAfter({
      fromDueOn: "2026-01-01",
      kind: "monthly",
      anchorDayOfMonth: 1,
      onOrAfter: "2026-04-01"
    });
    expect(advanced.nextDueOn).toBe("2026-04-01");
    expect(advanced.skipped).toBe(3);
  });

  it("stores due_at as UTC from the calendar date", () => {
    expect(dueAtTimestamp("2026-11-16", "09:30")).toBe("2026-11-16T09:30:00.000Z");
    expect(dueAtTimestamp("2026-11-16")).toBe("2026-11-16T12:00:00.000Z");
  });
});

describe("FO-EFF Slice 5 — source and admin", () => {
  it("labels generated, public, and manual work without overloading intake", () => {
    expect(workOrderOriginLabel({ originSource: "preventive", intakeChannel: "internal" })).toBe(
      "Preventive Maintenance"
    );
    expect(workOrderOriginLabel({ intakeChannel: "qr" })).toBe("QR / Share Link");
    expect(workOrderOriginLabel({ intakeChannel: "internal" })).toBe("Manual");
    expect(workOrderOriginSource({ originSource: "preventive", intakeChannel: "internal" })).toBe(
      "preventive"
    );
  });

  it("restricts plan administration to managers", () => {
    expect(memberCanAdministerPreventiveMaintenance(["property_manager"])).toBe(true);
    expect(memberCanAdministerPreventiveMaintenance(["organization_admin"])).toBe(true);
    expect(memberCanAdministerPreventiveMaintenance(["maintenance_technician"])).toBe(false);
    expect(memberCanAdministerPreventiveMaintenance(["tenant"])).toBe(false);
  });

  it("requires asset or building according to target kind", () => {
    expect(
      createPmPlanInputSchema.safeParse({
        name: "Inspect roof",
        targetKind: "location",
        propertyId: "a11ce001-0001-4000-8000-00000000c11c",
        recurrenceKind: "annual",
        nextDueOn: "2026-11-16"
      }).success
    ).toBe(true);
    expect(
      createPmPlanInputSchema.safeParse({
        name: "Chair inspection",
        targetKind: "asset",
        recurrenceKind: "quarterly",
        nextDueOn: "2026-11-16"
      }).success
    ).toBe(false);
  });
});
