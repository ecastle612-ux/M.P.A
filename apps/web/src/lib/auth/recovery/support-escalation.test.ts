import { describe, expect, it } from "vitest";
import {
  firstOwnerLevel,
  nextEscalationLevel,
  requiresMasterAdminForCredentialIssue
} from "./support-escalation";

describe("AUTH-001 Slice E support escalation routing", () => {
  it("routes auth issue classes to first-owner levels", () => {
    expect(firstOwnerLevel("login_help")).toBe("L0");
    expect(firstOwnerLevel("subaccount_password")).toBe("L1");
    expect(firstOwnerLevel("org_admin_lockout")).toBe("L2");
    expect(firstOwnerLevel("ownership_dispute")).toBe("L3");
  });

  it("escalates L0→L1→L2→L3", () => {
    expect(nextEscalationLevel("L0")).toBe("L1");
    expect(nextEscalationLevel("L1")).toBe("L2");
    expect(nextEscalationLevel("L2")).toBe("L3");
    expect(nextEscalationLevel("L3")).toBeNull();
  });

  it("requires Master Admin for Org Admin credential re-issue classes", () => {
    expect(requiresMasterAdminForCredentialIssue("org_admin_lockout")).toBe(true);
    expect(requiresMasterAdminForCredentialIssue("ownership_dispute")).toBe(true);
    expect(requiresMasterAdminForCredentialIssue("subaccount_password")).toBe(false);
  });
});
