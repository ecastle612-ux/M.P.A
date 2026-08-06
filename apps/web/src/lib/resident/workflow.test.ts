import { describe, expect, it } from "vitest";
import {
  canTransitionResidentWorkflow,
  evaluateResidentAdvanceGates,
  legacyLifecycleStatusToWorkflowStage,
  primaryNextResidentStage,
  RESIDENT_WORKFLOW_STAGES,
  RESIDENT_WORKFLOW_TRANSITIONS,
  workflowStageToLegacyLifecycleStatus
} from "./workflow";

describe("CORE-004 Phase 4 resident workflow", () => {
  it("defines the full authorized lifecycle order", () => {
    expect([...RESIDENT_WORKFLOW_STAGES]).toEqual([
      "applicant",
      "approved",
      "lease_signed",
      "move_in_scheduled",
      "move_in_complete",
      "active_resident",
      "community_participation",
      "maintenance",
      "payments",
      "renewal",
      "move_out_scheduled",
      "former_resident",
      "archive"
    ]);
  });

  it("allows the happy path through active residency", () => {
    let stage: (typeof RESIDENT_WORKFLOW_STAGES)[number] = "applicant";
    const path: Array<(typeof RESIDENT_WORKFLOW_STAGES)[number]> = [stage];
    while (true) {
      const next: (typeof RESIDENT_WORKFLOW_STAGES)[number] | null = primaryNextResidentStage(stage);
      if (!next) break;
      expect(canTransitionResidentWorkflow(stage, next)).toBe(true);
      stage = next;
      path.push(stage);
      if (stage === "active_resident") break;
    }
    expect(path).toContain("lease_signed");
    expect(path).toContain("move_in_complete");
    expect(canTransitionResidentWorkflow("active_resident", "maintenance")).toBe(true);
    expect(canTransitionResidentWorkflow("maintenance", "active_resident")).toBe(true);
    expect(canTransitionResidentWorkflow("active_resident", "payments")).toBe(true);
    expect(canTransitionResidentWorkflow("renewal", "move_out_scheduled")).toBe(true);
    expect(canTransitionResidentWorkflow("move_out_scheduled", "former_resident")).toBe(true);
    expect(canTransitionResidentWorkflow("former_resident", "archive")).toBe(true);
  });

  it("forbids undocumented side transitions", () => {
    expect(canTransitionResidentWorkflow("applicant", "active_resident")).toBe(false);
    expect(canTransitionResidentWorkflow("archive", "active_resident")).toBe(false);
    expect(RESIDENT_WORKFLOW_TRANSITIONS.archive).toEqual([]);
  });

  it("syncs legacy lifecycle statuses", () => {
    expect(workflowStageToLegacyLifecycleStatus("active_resident")).toBe("active");
    expect(legacyLifecycleStatusToWorkflowStage("awaiting_signature")).toBe("lease_signed");
    expect(legacyLifecycleStatusToWorkflowStage("moving_out")).toBe("move_out_scheduled");
  });

  it("enforces advance gates", () => {
    const base = {
      hasProperty: true,
      hasUnit: true,
      leaseSigned: false,
      moveInDateSet: false,
      moveInAcknowledged: false,
      hasOpenMaintenance: false,
      hasPaymentAttention: false
    };
    expect(evaluateResidentAdvanceGates("lease_signed", base).ok).toBe(false);
    expect(evaluateResidentAdvanceGates("lease_signed", { ...base, leaseSigned: true }).ok).toBe(true);
    expect(evaluateResidentAdvanceGates("maintenance", base).ok).toBe(false);
    expect(
      evaluateResidentAdvanceGates("maintenance", { ...base, hasOpenMaintenance: true }).ok
    ).toBe(true);
  });
});
