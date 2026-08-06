import { describe, expect, it } from "vitest";
import {
  buildMaintenanceReadyAssistantCopy,
  buildMissionControlNextAction
} from "../property/journey";

describe("LAUNCH-001 J6 maintenance journey", () => {
  it("progresses Mission Control from first maintenance to daily operations", () => {
    const before = buildMissionControlNextAction({
      setupComplete: true,
      propertyCount: 1,
      teamReady: true,
      residentReady: true,
      leaseReady: true,
      rentReady: true,
      maintenanceReady: false
    });
    expect(before.id).toBe("submit_first_maintenance");
    expect(before.href).toBe("/pm/maintenance");
    expect(before.assistantRecommendation).toBe("Submit your first maintenance request.");

    const after = buildMissionControlNextAction({
      setupComplete: true,
      propertyCount: 1,
      teamReady: true,
      residentReady: true,
      leaseReady: true,
      rentReady: true,
      maintenanceReady: true
    });
    expect(after.id).toBe("review_daily_operations");
    expect(after.href).toBe("/pm/mission-control");
    expect(after.assistantRecommendation).toBe("Review your daily operations.");
    expect(after.title).toBe("Review today's operations.");
    expect(buildMaintenanceReadyAssistantCopy()).toContain("My maintenance operation is working");
  });
});
