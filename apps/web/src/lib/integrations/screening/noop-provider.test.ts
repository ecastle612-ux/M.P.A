import { describe, expect, it } from "vitest";
import { noopScreeningProvider } from "./noop-provider";

describe("noop screening provider", () => {
  it("creates orders and returns clear normalized reports", async () => {
    const order = await noopScreeningProvider.createOrder({
      organizationId: "org",
      screeningCaseId: "case",
      caseNumber: "SCR-00001",
      packageCode: "standard_rental",
      components: ["identity", "credit"],
      consentAttestationId: "consent",
      party: { id: "party-12345678", fullName: "Test Applicant", email: "a@example.com", role: "primary" }
    });
    expect(order.externalReference).toContain("noop-SCR-00001");
    const report = await noopScreeningProvider.fetchNormalizedReport(order);
    expect(report.status).toBe("completed");
    expect(report.components.length).toBeGreaterThan(0);
    expect(report.components.every((c) => c.status === "clear")).toBe(true);
  });
});
