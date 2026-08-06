import { describe, expect, it } from "vitest";
import {
  LEASE_AUDIT_CATALOG,
  LEASE_EVENT_CATALOG,
  createLeaseInputSchema
} from "./index";
import {
  buildLeaseReadyAssistantCopy,
  buildMissionControlNextAction
} from "../property/journey";

describe("LAUNCH-001 J4 leasing domain", () => {
  it("accepts launch-critical lease create input", () => {
    const parsed = createLeaseInputSchema.parse({
      residentId: "00000000-0000-4000-8000-000000000001",
      rentAmount: 1500,
      dayOfMonth: 1,
      requireManagerSignature: true,
      managerName: "Pat Manager",
      managerEmail: "pat@example.com"
    });
    expect(parsed.rentAmount).toBe(1500);
    expect(parsed.currency).toBe("USD");
  });

  it("registers lease event and audit catalogs", () => {
    expect(LEASE_EVENT_CATALOG.some((item) => item.type === "lease.activated")).toBe(true);
    expect(LEASE_AUDIT_CATALOG.some((item) => item.action === "lease.signed")).toBe(true);
  });

  it("progresses Mission Control from first lease to collect rent", () => {
    const before = buildMissionControlNextAction({
      setupComplete: true,
      propertyCount: 1,
      teamReady: true,
      residentReady: true,
      leaseReady: false
    });
    expect(before.id).toBe("create_first_lease");

    const after = buildMissionControlNextAction({
      setupComplete: true,
      propertyCount: 1,
      teamReady: true,
      residentReady: true,
      leaseReady: true
    });
    expect(after.id).toBe("collect_first_rent");
    expect(after.href).toBe("/pm/financial-operations");
    expect(after.assistantRecommendation).toBe("Collect your first rent.");
    expect(buildLeaseReadyAssistantCopy("Ada Lovelace")).toContain("Collect your first rent");
  });
});
