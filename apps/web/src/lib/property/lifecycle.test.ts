import { describe, expect, it } from "vitest";
import {
  PROPERTY_LIFECYCLE_STAGES,
  PROPERTY_LIFECYCLE_TRANSITIONS,
  PROPERTY_LIFECYCLE_DEFINITIONS,
  canTransitionLifecycle,
  evaluateAdvanceGates,
  lifecycleStageToLegacyStatus,
  primaryNextStage
} from "./lifecycle";

describe("CORE-004 Phase 1 property lifecycle", () => {
  it("defines all eleven stages with complete metadata", () => {
    expect(PROPERTY_LIFECYCLE_STAGES).toHaveLength(11);
    for (const stage of PROPERTY_LIFECYCLE_STAGES) {
      const def = PROPERTY_LIFECYCLE_DEFINITIONS[stage];
      expect(def.entryCriteria.length).toBeGreaterThan(0);
      expect(def.exitCriteria.length).toBeGreaterThan(0);
      expect(def.requiredData.length).toBeGreaterThan(0);
      expect(def.responsibleRoles.length).toBeGreaterThan(0);
      expect(def.auditEvents.length).toBeGreaterThan(0);
      expect(def.assistantRecommendations.length).toBeGreaterThan(0);
    }
  });

  it("enforces documented transitions only", () => {
    expect(canTransitionLifecycle("prospect", "acquisition")).toBe(true);
    expect(canTransitionLifecycle("prospect", "operational")).toBe(false);
    expect(canTransitionLifecycle("activation", "operational")).toBe(true);
    expect(canTransitionLifecycle("operational", "turnover")).toBe(true);
    expect(canTransitionLifecycle("disposition", "archived")).toBe(true);
    expect(canTransitionLifecycle("archived", "operational")).toBe(true);
    expect(canTransitionLifecycle("archived", "prospect")).toBe(false);
  });

  it("keeps every transition edge inside the stage set", () => {
    for (const [from, tos] of Object.entries(PROPERTY_LIFECYCLE_TRANSITIONS)) {
      expect(PROPERTY_LIFECYCLE_STAGES).toContain(from);
      for (const to of tos) {
        expect(PROPERTY_LIFECYCLE_STAGES).toContain(to);
      }
    }
  });

  it("gates activation on units and address", () => {
    expect(
      evaluateAdvanceGates("operational", {
        unitCount: 0,
        hasOwnerContact: true,
        addressComplete: true
      }).ok
    ).toBe(false);
    expect(
      evaluateAdvanceGates("operational", {
        unitCount: 1,
        hasOwnerContact: true,
        addressComplete: true
      }).ok
    ).toBe(true);
  });

  it("maps lifecycle stages to legacy status", () => {
    expect(lifecycleStageToLegacyStatus("prospect")).toBe("draft");
    expect(lifecycleStageToLegacyStatus("operational")).toBe("active");
    expect(lifecycleStageToLegacyStatus("disposition")).toBe("inactive");
    expect(lifecycleStageToLegacyStatus("archived")).toBe("archived");
  });

  it("suggests a primary next stage for assistant CTAs", () => {
    expect(primaryNextStage("prospect")).toBe("acquisition");
    expect(primaryNextStage("activation")).toBe("operational");
    expect(primaryNextStage("archived")).toBeNull();
  });
});
