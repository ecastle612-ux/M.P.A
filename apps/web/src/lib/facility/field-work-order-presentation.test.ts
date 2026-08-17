import { describe, expect, it } from "vitest";
import {
  fieldActionVariant,
  fieldAssignmentLabel,
  fieldLocationLabel,
  fieldPrimaryAction,
  fieldWorkOrderScanLines,
  formatFacilityAssignmentNotice,
  formatFacilityLifecycleNotice,
  resolveCancelNote,
  resolveProgressNote,
  vendorPortalScopeCopy
} from "./field-work-order-presentation";

describe("FO field work-order presentation (PPS1-008)", () => {
  it("picks a clear primary next action by status", () => {
    expect(fieldPrimaryAction("assigned")).toBe("start");
    expect(fieldPrimaryAction("in_progress")).toBe("complete");
    expect(fieldPrimaryAction("closed")).toBeNull();
    expect(fieldActionVariant("start", "start")).toBe("primary");
    expect(fieldActionVariant("progress", "start")).toBe("secondary");
    expect(fieldActionVariant("complete", "complete")).toBe("primary");
    expect(fieldActionVariant("cancel", "complete")).toBe("secondary");
  });

  it("builds scannable location and assignment context without inventing SLA data", () => {
    expect(
      fieldLocationLabel({
        propertyName: "Main Campus",
        unitLabel: "A2",
        assetLabel: "Boiler"
      })
    ).toBe("Main Campus · Unit A2 · Boiler");

    expect(
      fieldAssignmentLabel({
        assigneeType: "vendor",
        vendorName: "Acme HVAC"
      })
    ).toBe("Vendor · Acme HVAC");

    const lines = fieldWorkOrderScanLines({
      title: "Leak",
      description: "Basement leak",
      status: "assigned",
      priority: "high",
      category: "plumbing",
      propertyName: "Main Campus",
      unitLabel: "B1",
      assigneeType: "technician",
      technicianLabel: "Jordan Tech",
      submittedAt: "2026-08-01T12:00:00.000Z"
    });

    expect(lines.find((line) => line.id === "location")?.value).toMatch(/Main Campus/);
    expect(lines.find((line) => line.id === "assignment")?.value).toMatch(/Jordan Tech/);
    expect(lines.map((line) => line.label).join(" ")).not.toMatch(/SLA|urgency score/i);
  });

  it("keeps progress and cancel notes separate with honest defaults", () => {
    expect(resolveProgressNote("", "start")).toBe("Work started.");
    expect(resolveProgressNote("On site", "progress")).toBe("On site");
    expect(resolveCancelNote("")).toBe("Cancelled from Facility Operations");
    expect(resolveCancelNote("Duplicate ticket")).toBe("Duplicate ticket");
  });

  it("formats clear assignment and lifecycle success notices", () => {
    expect(
      formatFacilityAssignmentNotice({
        assigneeType: "vendor",
        assigneeName: "UAT Fix-It Vendor",
        status: "assigned"
      })
    ).toBe("Vendor assigned: UAT Fix-It Vendor. Status is now Assigned.");
    expect(
      formatFacilityAssignmentNotice({
        assigneeType: "technician",
        assigneeName: "Jordan Tech",
        status: "assigned"
      })
    ).toBe("Technician assigned: Jordan Tech. Status is now Assigned.");
    expect(formatFacilityLifecycleNotice("start", "in_progress")).toBe(
      "Work started. Status is now In progress."
    );
    expect(formatFacilityLifecycleNotice("complete")).toBe("Work completed and closed.");
    expect(formatFacilityLifecycleNotice("progress", "in_progress")).toBe(
      "Progress saved. Status remains In progress."
    );
  });
});

describe("Vendor portal trust copy (PPS1-009)", () => {
  it("avoids unfinished developer language", () => {
    const copy = vendorPortalScopeCopy();
    expect(copy).not.toMatch(/not part of this portal yet/i);
    expect(copy).not.toMatch(/coming soon/i);
    expect(copy).toMatch(/vendor account/i);
  });
});
