import { describe, expect, it } from "vitest";
import {
  isWorkflowAdvanceEvent,
  isWorkflowTriggerEvent,
  MAINTENANCE_STANDARD_DEFINITION,
  MAINTENANCE_STANDARD_TEMPLATE_ID
} from "./workflows/maintenance-standard";

describe("OPS-001 Slice C maintenance.standard pilot", () => {
  it("defines maintenance.standard.v1 template id", () => {
    expect(MAINTENANCE_STANDARD_TEMPLATE_ID).toBe("maintenance.standard.v1");
  });

  it("starts on request.created and advances on vendor/WO catalog events", () => {
    expect(isWorkflowTriggerEvent("maintenance.request.created")).toBe(true);
    expect(isWorkflowAdvanceEvent("maintenance.vendor.assigned")).toBe(true);
    expect(isWorkflowAdvanceEvent("maintenance.vendor.declined")).toBe(true);
    expect(isWorkflowAdvanceEvent("maintenance.technician.arrived")).toBe(true);
    expect(isWorkflowAdvanceEvent("maintenance.work.completed")).toBe(true);
    expect(isWorkflowAdvanceEvent("maintenance.request.created")).toBe(false);
  });

  it("sequences assign → accept → on_site → complete", () => {
    const steps = MAINTENANCE_STANDARD_DEFINITION.steps.map((s) => s.id);
    expect(steps).toEqual([
      "assign_vendor",
      "vendor_accepted",
      "on_site",
      "repair_complete"
    ]);
    expect(MAINTENANCE_STANDARD_DEFINITION.startStep).toBe("assign_vendor");
    const terminal = MAINTENANCE_STANDARD_DEFINITION.transitions.find((t) => t.terminal);
    expect(terminal?.to).toBe("repair_complete");
    expect(terminal?.on).toBe("maintenance.work.completed");
  });
});
