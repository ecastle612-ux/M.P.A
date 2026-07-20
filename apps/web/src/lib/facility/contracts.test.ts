import { describe, expect, it } from "vitest";
import {
  eventMatchesFilter,
  parseCorrectFacilityRecordInput,
  timelineTitleForCategory
} from "./contracts";

describe("facility contracts", () => {
  it("requires a correction reason", () => {
    expect(parseCorrectFacilityRecordInput({ issue: "Leak" })).toBeNull();
    expect(parseCorrectFacilityRecordInput({ reason: "  Typo fix  " })).toEqual({
      reason: "Typo fix"
    });
  });

  it("maps category titles for repair timeline events", () => {
    expect(timelineTitleForCategory("hvac", "AC failed")).toBe("HVAC Repair Completed");
    expect(timelineTitleForCategory("plumbing", "Kitchen leak")).toBe("Leak Repaired");
    expect(timelineTitleForCategory("electrical", "Smoke detector")).toBe("Smoke Detector Installed");
    expect(timelineTitleForCategory("general", "Door sticky")).toBe("Repair Completed");
  });

  it("filters timeline event types by pillar", () => {
    expect(eventMatchesFilter("facility.repair_completed", "repairs")).toBe(true);
    expect(eventMatchesFilter("resident.moved_in", "residents")).toBe(true);
    expect(eventMatchesFilter("lease.renewed", "leases")).toBe(true);
    expect(eventMatchesFilter("financial.major_expense", "financial")).toBe(true);
    expect(eventMatchesFilter("facility.asset_installed", "future")).toBe(true);
    expect(eventMatchesFilter("facility.repair_completed", "residents")).toBe(false);
  });
});
