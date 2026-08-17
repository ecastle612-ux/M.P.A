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
    expect(before.href).toBe("/pm/financial-operations#record");
    expect(before.assistantRecommendation).toBe("Record your first payment.");

    const after = buildMissionControlNextAction({
      setupComplete: true,
      propertyCount: 1,
      teamReady: true,
      residentReady: true,
      leaseReady: true,
      rentReady: true,
      maintenanceReady: false
    });
    expect(after.id).toBe("review_maintenance_queue");
    expect(after.href).toBe("/pm/maintenance");
    expect(after.assistantRecommendation).toBe("Review your maintenance queue.");
    expect(buildRentReadyAssistantCopy()).toContain("First payment recorded");
  });
});
