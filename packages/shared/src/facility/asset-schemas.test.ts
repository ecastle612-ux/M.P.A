import { describe, expect, it } from "vitest";
import {
  canTransitionFacilityAssetStatus,
  relocateFacilityAssetInputSchema,
  updateFacilityAssetInputSchema
} from "./asset-schemas";

describe("facility asset schemas (P1 relocate)", () => {
  it("accepts relocate with nullable location and optional reason", () => {
    const parsed = relocateFacilityAssetInputSchema.safeParse({
      locationId: "22222222-2222-4222-8222-222222222222",
      reason: "Moved to mechanical room B"
    });
    expect(parsed.success).toBe(true);
  });

  it("accepts clearing location via relocate", () => {
    const parsed = relocateFacilityAssetInputSchema.safeParse({
      locationId: null
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects relocate without locationId key", () => {
    const parsed = relocateFacilityAssetInputSchema.safeParse({
      reason: "missing location"
    });
    expect(parsed.success).toBe(false);
  });

  it("keeps update schema for non-location fields", () => {
    const parsed = updateFacilityAssetInputSchema.safeParse({
      name: "Boiler 1",
      notes: "Retagged"
    });
    expect(parsed.success).toBe(true);
  });

  it("preserves lifecycle transitions", () => {
    expect(canTransitionFacilityAssetStatus("active", "in_repair")).toBe(true);
    expect(canTransitionFacilityAssetStatus("decommissioned", "active")).toBe(false);
  });
});
