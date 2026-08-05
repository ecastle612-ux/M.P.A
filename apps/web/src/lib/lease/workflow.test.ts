import { describe, expect, it } from "vitest";
import {
  canTransitionLeasingWorkflow,
  evaluateLeasingAdvanceGates,
  LEASING_WORKFLOW_STAGES,
  LEASING_WORKFLOW_TRANSITIONS,
  legacyApplicantStatusToWorkflowStage,
  legacyLeaseStatusToWorkflowStage,
  primaryNextLeasingStage,
  workflowStageToLegacyApplicantStatus,
  workflowStageToLegacyLeaseStatus
} from "./workflow";

describe("CORE-004 Phase 3 leasing workflow", () => {
  it("defines the full authorized lifecycle order", () => {
    expect([...LEASING_WORKFLOW_STAGES]).toEqual([
      "prospect",
      "inquiry",
      "lead_qualification",
      "tour_scheduling",
      "property_showing",
      "application",
      "screening",
      "approval",
      "lease_generation",
      "signwell_signature",
      "move_in_preparation",
      "move_in",
      "resident",
      "renewal",
      "move_out",
      "archive"
    ]);
  });

  it("allows only documented transitions (happy path)", () => {
    let stage: (typeof LEASING_WORKFLOW_STAGES)[number] = "prospect";
    const path: Array<(typeof LEASING_WORKFLOW_STAGES)[number]> = [stage];
    while (true) {
      const next: (typeof LEASING_WORKFLOW_STAGES)[number] | null = primaryNextLeasingStage(stage);
      if (!next) break;
      expect(canTransitionLeasingWorkflow(stage, next)).toBe(true);
      stage = next;
      path.push(stage);
      if (stage === "resident") break;
    }
    expect(path).toContain("signwell_signature");
    expect(path).toContain("move_in");
    expect(canTransitionLeasingWorkflow("resident", "renewal")).toBe(true);
    expect(canTransitionLeasingWorkflow("resident", "move_out")).toBe(true);
    expect(canTransitionLeasingWorkflow("renewal", "resident")).toBe(true);
    expect(canTransitionLeasingWorkflow("move_out", "archive")).toBe(true);
  });

  it("forbids undocumented side transitions", () => {
    expect(canTransitionLeasingWorkflow("prospect", "application")).toBe(false);
    expect(canTransitionLeasingWorkflow("screening", "signwell_signature")).toBe(false);
    expect(canTransitionLeasingWorkflow("archive", "resident")).toBe(false);
    expect(LEASING_WORKFLOW_TRANSITIONS.archive).toEqual([]);
  });

  it("syncs legacy applicant and lease statuses", () => {
    expect(workflowStageToLegacyApplicantStatus("screening")).toBe("screening_in_progress");
    expect(legacyApplicantStatusToWorkflowStage("pending_review")).toBe("approval");
    expect(workflowStageToLegacyLeaseStatus("resident")).toBe("active");
    expect(legacyLeaseStatusToWorkflowStage("signed")).toBe("signwell_signature");
    expect(legacyLeaseStatusToWorkflowStage("active", "pending")).toBe("renewal");
  });

  it("enforces advance gates for SignWell and move-in", () => {
    const base = {
      hasProperty: true,
      hasUnit: true,
      hasApplicantContact: true,
      applicationSubmitted: true,
      screeningComplete: true,
      approved: true,
      leaseId: null as string | null,
      signatureComplete: false,
      moveInDateSet: false
    };
    expect(evaluateLeasingAdvanceGates("signwell_signature", base).ok).toBe(false);
    expect(evaluateLeasingAdvanceGates("signwell_signature", { ...base, leaseId: "lease-1" }).ok).toBe(
      true
    );
    expect(
      evaluateLeasingAdvanceGates("move_in", {
        ...base,
        leaseId: "lease-1",
        signatureComplete: true,
        moveInDateSet: false
      }).ok
    ).toBe(false);
    expect(
      evaluateLeasingAdvanceGates("move_in", {
        ...base,
        leaseId: "lease-1",
        signatureComplete: true,
        moveInDateSet: true
      }).ok
    ).toBe(true);
  });
});
