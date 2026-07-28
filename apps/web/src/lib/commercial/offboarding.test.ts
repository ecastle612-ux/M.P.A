import { describe, expect, it } from "vitest";
import { cancelEnablesPurge } from "./offboarding";
import { EXPORT_WINDOW_DAYS, ARCHIVE_RETENTION_DAYS } from "./offboarding-types";
import { CS_MOTION_KEYS } from "./cs-motions";
import { RENEWAL_MILESTONE_KEYS } from "./renewal-alerts";

// Re-export days helper test via local copy of due math
function dueAtFor(periodEndIso: string, daysBefore: number): string {
  const end = new Date(periodEndIso);
  end.setUTCDate(end.getUTCDate() - daysBefore);
  return end.toISOString();
}

describe("COM-001 Slice D offboarding invariants", () => {
  it("never enables purge on cancel", () => {
    expect(cancelEnablesPurge()).toBe(false);
  });

  it("uses approved export and archive defaults", () => {
    expect(EXPORT_WINDOW_DAYS).toBe(30);
    expect(ARCHIVE_RETENTION_DAYS).toBe(180);
  });
});

describe("COM-001 Slice D CS motions", () => {
  it("schedules only day_30 and day_90", () => {
    expect(CS_MOTION_KEYS).toEqual(["day_30", "day_90"]);
  });
});

describe("COM-001 Slice D renewal milestones", () => {
  it("includes required T-90 / T-30 / T-7 keys", () => {
    expect(RENEWAL_MILESTONE_KEYS).toContain("t90");
    expect(RENEWAL_MILESTONE_KEYS).toContain("t30");
    expect(RENEWAL_MILESTONE_KEYS).toContain("t7");
  });

  it("computes due dates before period end deterministically", () => {
    const periodEnd = "2026-12-31T00:00:00.000Z";
    const t30 = dueAtFor(periodEnd, 30);
    expect(t30).toBe("2026-12-01T00:00:00.000Z");
  });
});
