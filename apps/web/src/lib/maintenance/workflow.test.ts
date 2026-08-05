import { describe, expect, it } from "vitest";
import {
  MAINTENANCE_WORKFLOW_STAGES,
  MAINTENANCE_WORKFLOW_TRANSITIONS,
  MAINTENANCE_WORKFLOW_DEFINITIONS,
  canTransitionMaintenanceWorkflow,
  evaluateMaintenanceAdvanceGates,
  workflowStageToLegacyStatus,
  primaryNextMaintenanceStage
} from "./workflow";

describe("CORE-004 Phase 2 maintenance workflow", () => {
  it("defines thirteen stages with complete operational metadata", () => {
    expect(MAINTENANCE_WORKFLOW_STAGES).toHaveLength(13);
    for (const stage of MAINTENANCE_WORKFLOW_STAGES) {
      const def = MAINTENANCE_WORKFLOW_DEFINITIONS[stage];
      expect(def.entryCriteria.length).toBeGreaterThan(0);
      expect(def.exitCriteria.length).toBeGreaterThan(0);
      expect(def.requiredRole.length).toBeGreaterThan(0);
      expect(def.auditEvents.length).toBeGreaterThan(0);
      expect(def.assistantRecommendations.length).toBeGreaterThan(0);
    }
  });

  it("enforces one canonical transition graph", () => {
    expect(canTransitionMaintenanceWorkflow("request", "intake")).toBe(true);
    expect(canTransitionMaintenanceWorkflow("request", "completion")).toBe(false);
    expect(canTransitionMaintenanceWorkflow("dispatch", "vendor_escalation")).toBe(true);
    expect(canTransitionMaintenanceWorkflow("quality_review", "resident_confirmation")).toBe(true);
    expect(canTransitionMaintenanceWorkflow("quality_review", "completion")).toBe(true);
    expect(canTransitionMaintenanceWorkflow("completion", "analytics")).toBe(true);
    expect(canTransitionMaintenanceWorkflow("analytics", "request")).toBe(false);
  });

  it("gates dispatch and vendor escalation", () => {
    expect(
      evaluateMaintenanceAdvanceGates("dispatch", {
        hasAssignee: false,
        hasDueDate: true,
        hasVendor: false,
        hasResident: true,
        prioritySet: true
      }).ok
    ).toBe(false);
    expect(
      evaluateMaintenanceAdvanceGates("dispatch", {
        hasAssignee: true,
        hasDueDate: true,
        hasVendor: false,
        hasResident: true,
        prioritySet: true
      }).ok
    ).toBe(true);
    expect(
      evaluateMaintenanceAdvanceGates("vendor_escalation", {
        hasAssignee: false,
        hasDueDate: true,
        hasVendor: false,
        hasResident: false,
        prioritySet: true
      }).ok
    ).toBe(false);
  });

  it("maps workflow stages to legacy statuses", () => {
    expect(workflowStageToLegacyStatus("request")).toBe("submitted");
    expect(workflowStageToLegacyStatus("field_execution")).toBe("in_progress");
    expect(workflowStageToLegacyStatus("resident_confirmation")).toBe("awaiting_approval");
    expect(workflowStageToLegacyStatus("analytics")).toBe("completed");
  });

  it("keeps every edge inside the stage set", () => {
    for (const [from, tos] of Object.entries(MAINTENANCE_WORKFLOW_TRANSITIONS)) {
      expect(MAINTENANCE_WORKFLOW_STAGES).toContain(from);
      for (const to of tos) {
        expect(MAINTENANCE_WORKFLOW_STAGES).toContain(to);
      }
    }
    expect(primaryNextMaintenanceStage("request")).toBe("intake");
  });
});
