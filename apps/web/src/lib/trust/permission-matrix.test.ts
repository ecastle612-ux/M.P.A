import { describe, expect, it } from "vitest";
import { auditRoleGrants, FIXTURE_ROLE_GRANTS, ROLE_CAPABILITY_EXPECTATIONS } from "./permission-matrix";

describe("PT-001 permission matrix", () => {
  it("covers every product role", () => {
    expect(Object.keys(ROLE_CAPABILITY_EXPECTATIONS).sort()).toEqual(
      ["administrator", "leasing_agent", "maintenance", "owner", "property_manager", "tenant", "vendor"].sort()
    );
  });

  it("fixture grants satisfy mustAllow / mustDeny for each role", () => {
    for (const role of Object.keys(ROLE_CAPABILITY_EXPECTATIONS)) {
      const result = auditRoleGrants(role, FIXTURE_ROLE_GRANTS[role] ?? []);
      expect(result.ok, result.violations.join("; ")).toBe(true);
    }
  });

  it("detects privilege escalation on tenant fixture", () => {
    const tenantGrants = FIXTURE_ROLE_GRANTS["tenant"] ?? [];
    const result = auditRoleGrants("tenant", [...tenantGrants, "financial:admin"]);
    expect(result.ok).toBe(false);
    expect(result.violations.some((v) => v.includes("financial:admin"))).toBe(true);
  });
});
