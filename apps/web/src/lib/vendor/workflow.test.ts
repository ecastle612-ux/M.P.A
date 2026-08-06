import { describe, expect, it } from "vitest";
import {
  canTransitionVendorWorkflow,
  evaluateVendorAdvanceGates,
  isVendorAssignableStage,
  legacyVendorStatusToWorkflowStage,
  primaryNextVendorStage,
  VENDOR_WORKFLOW_STAGES,
  VENDOR_WORKFLOW_TRANSITIONS,
  workflowStageToLegacyVendorStatus
} from "./workflow";

describe("CORE-004 Phase 5 vendor workflow", () => {
  it("defines the full authorized lifecycle", () => {
    expect([...VENDOR_WORKFLOW_STAGES]).toEqual([
      "prospective_vendor",
      "invited",
      "application_submitted",
      "compliance_review",
      "insurance_verification",
      "approved",
      "available",
      "assigned",
      "work_in_progress",
      "invoice_submitted",
      "payment_pending",
      "paid",
      "performance_review",
      "preferred_vendor",
      "suspended",
      "inactive",
      "archived"
    ]);
  });

  it("allows happy path through available", () => {
    let stage: (typeof VENDOR_WORKFLOW_STAGES)[number] = "prospective_vendor";
    const path: Array<(typeof VENDOR_WORKFLOW_STAGES)[number]> = [stage];
    while (true) {
      const next: (typeof VENDOR_WORKFLOW_STAGES)[number] | null = primaryNextVendorStage(stage);
      if (!next) break;
      expect(canTransitionVendorWorkflow(stage, next)).toBe(true);
      stage = next;
      path.push(stage);
      if (stage === "available") break;
    }
    expect(path).toContain("insurance_verification");
    expect(isVendorAssignableStage("available")).toBe(true);
    expect(isVendorAssignableStage("preferred_vendor")).toBe(true);
    expect(isVendorAssignableStage("suspended")).toBe(false);
    expect(canTransitionVendorWorkflow("available", "assigned")).toBe(true);
    expect(canTransitionVendorWorkflow("paid", "performance_review")).toBe(true);
    expect(canTransitionVendorWorkflow("performance_review", "preferred_vendor")).toBe(true);
    expect(VENDOR_WORKFLOW_TRANSITIONS.archived).toEqual([]);
  });

  it("forbids undocumented transitions", () => {
    expect(canTransitionVendorWorkflow("prospective_vendor", "available")).toBe(false);
    expect(canTransitionVendorWorkflow("archived", "available")).toBe(false);
  });

  it("syncs legacy CRM status", () => {
    expect(workflowStageToLegacyVendorStatus("available")).toBe("active");
    expect(workflowStageToLegacyVendorStatus("suspended")).toBe("inactive");
    expect(legacyVendorStatusToWorkflowStage("active", true)).toBe("preferred_vendor");
    expect(legacyVendorStatusToWorkflowStage("archived")).toBe("archived");
  });

  it("enforces advance gates", () => {
    const base = {
      hasBusinessName: true,
      hasContact: true,
      insuranceOnFile: false,
      insuranceCurrent: false,
      complianceComplete: true,
      hasOpenAssignment: false,
      invoiceSubmitted: false,
      invoiceApproved: false,
      paymentRecorded: false
    };
    expect(evaluateVendorAdvanceGates("approved", base).ok).toBe(false);
    expect(
      evaluateVendorAdvanceGates("approved", { ...base, insuranceOnFile: true, insuranceCurrent: true })
        .ok
    ).toBe(true);
  });
});
