import { describe, expect, it } from "vitest";
import {
  buildMissionControlNextAction,
  buildRentReadyAssistantCopy
} from "../property/journey";

describe("LAUNCH-001 J5 rent collection journey", () => {
  it("progresses Mission Control from first rent to maintenance", () => {
    const before = buildMissionControlNextAction({
      setupComplete: true,
      propertyCount: 1,
      teamReady: true,
      residentReady: true,
      leaseReady: true,
      rentReady: false
    });
    expect(before.id).toBe("collect_first_rent");
    expect(before.href).toBe("/pm/financial-operations#collect");
    expect(before.assistantRecommendation).toBe("Collect your first rent.");

    const after = buildMissionControlNextAction({
      setupComplete: true,
      propertyCount: 1,
      teamReady: true,
      residentReady: true,
      leaseReady: true,
      rentReady: true
    });
    expect(after.id).toBe("submit_first_maintenance");
    expect(after.href).toBe("/pm/maintenance");
    expect(after.assistantRecommendation).toBe("Submit your first maintenance request.");
    expect(buildRentReadyAssistantCopy()).toContain("My first rent has been collected");
  });
});
