import { describe, expect, it } from "vitest";
import {
  assertModuleEntitled,
  assertWithinLimit,
  commercialStatusForPlan,
  resolveEntitlementsForPlan
} from "./capability-matrix";

describe("AUTH-001 Slice B capability matrix", () => {
  it("resolves modules and limits per plan", () => {
    const trial = resolveEntitlementsForPlan("trial");
    expect(trial.limits.maxUsers).toBe(5);
    expect(trial.features["marketplace"]).toBe(false);
    expect(trial.modules).toContain("property_operations");
    expect(trial.modules).toContain("facility_operations");
    expect(trial.features["property_operations"]).toBe(true);

    const business = resolveEntitlementsForPlan("business");
    expect(business.limits.maxProperties).toBeGreaterThan(trial.limits.maxProperties);
    expect(business.features["marketplace"]).toBe(true);
  });

  it("asserts module entitlement fail-closed", () => {
    const trial = resolveEntitlementsForPlan("trial");
    expect(assertModuleEntitled(trial, "maintenance").ok).toBe(true);
    expect(assertModuleEntitled(trial, "marketplace").ok).toBe(false);
    expect(assertModuleEntitled(null, "maintenance").ok).toBe(false);
  });

  it("asserts numeric limits", () => {
    const trial = resolveEntitlementsForPlan("trial");
    expect(assertWithinLimit(trial, "maxProperties", 2).ok).toBe(true);
    expect(assertWithinLimit(trial, "maxProperties", 3).ok).toBe(false);
  });

  it("maps commercial status for Slice B states only", () => {
    expect(commercialStatusForPlan("trial")).toBe("trial");
    expect(commercialStatusForPlan("professional")).toBe("pending_setup");
  });
});
