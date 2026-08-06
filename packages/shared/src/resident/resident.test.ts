import { describe, expect, it } from "vitest";
import {
  RESIDENT_AUDIT_CATALOG,
  RESIDENT_EVENT_CATALOG,
  RESIDENT_STATUS_LABELS,
  createResidentInputSchema,
  residentDisplayName
} from "./index";
import {
  buildMissionControlNextAction,
  buildResidentReadyAssistantCopy
} from "../property/journey";

describe("LAUNCH-001 J3 resident domain", () => {
  it("accepts launch-critical create input", () => {
    const parsed = createResidentInputSchema.parse({
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      propertyId: "00000000-0000-4000-8000-000000000001",
      unitId: "00000000-0000-4000-8000-000000000002"
    });
    expect(parsed.firstName).toBe("Ada");
    expect(residentDisplayName(parsed.firstName, parsed.lastName)).toBe("Ada Lovelace");
  });

  it("rejects missing property or unit", () => {
    expect(() =>
      createResidentInputSchema.parse({
        firstName: "Ada",
        lastName: "Lovelace",
        email: "ada@example.com"
      })
    ).toThrow();
  });

  it("registers resident event and audit catalogs", () => {
    expect(RESIDENT_EVENT_CATALOG.some((item) => item.type === "resident.created")).toBe(true);
    expect(RESIDENT_AUDIT_CATALOG.some((item) => item.action === "resident.unit_assigned")).toBe(
      true
    );
    expect(RESIDENT_STATUS_LABELS.pending_lease).toBe("Pending Lease");
  });

  it("progresses Mission Control from first resident to create first lease", () => {
    const before = buildMissionControlNextAction({
      setupComplete: true,
      propertyCount: 1,
      teamReady: true,
      residentReady: false
    });
    expect(before.id).toBe("add_first_resident");
    expect(before.assistantRecommendation).toBe("Add your first resident.");

    const after = buildMissionControlNextAction({
      setupComplete: true,
      propertyCount: 1,
      teamReady: true,
      residentReady: true,
      leaseReady: false
    });
    expect(after.id).toBe("create_first_lease");
    expect(after.href).toBe("/pm/leasing?new=1");
    expect(after.assistantRecommendation).toBe("Create your first lease.");
    expect(buildResidentReadyAssistantCopy("Ada Lovelace")).toContain("Create your first lease");
  });
});
