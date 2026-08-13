import { describe, expect, it } from "vitest";
import {
  createPropertyUnitInputSchema,
  suggestNextUnitLabel,
  unitArchiveBlockReason,
  unitImpactCopy,
  unitStatusEditBlockReason,
  updatePropertyUnitInputSchema
} from "./index";

describe("PM unit management completion", () => {
  it("validates create and update unit payloads", () => {
    expect(createPropertyUnitInputSchema.parse({ unitLabel: "4" }).unitLabel).toBe("4");
    expect(updatePropertyUnitInputSchema.parse({ unitLabel: "4A" }).unitLabel).toBe("4A");
    expect(updatePropertyUnitInputSchema.parse({ status: "offline" }).status).toBe("offline");
    expect(() => updatePropertyUnitInputSchema.parse({})).toThrow();
    expect(() => updatePropertyUnitInputSchema.parse({ status: "occupied" })).toThrow();
  });

  it("suggests the next numeric unit label", () => {
    expect(suggestNextUnitLabel(["1", "2", "3"])).toBe("4");
    expect(suggestNextUnitLabel([])).toBe("1");
    expect(suggestNextUnitLabel(["A", "B"])).toBe("3");
  });

  it("blocks archive when resident or lease relationships exist", () => {
    expect(
      unitArchiveBlockReason({
        status: "available",
        hasResident: false,
        hasActiveLease: false
      })
    ).toBeNull();
    expect(
      unitArchiveBlockReason({
        status: "available",
        hasResident: false,
        hasActiveLease: false,
        openMaintenanceCount: 3
      })
    ).toBeNull();
    expect(
      unitArchiveBlockReason({
        status: "occupied",
        hasResident: true,
        hasActiveLease: true
      })
    ).toMatch(/resident\/lease/i);
    expect(
      unitArchiveBlockReason({
        status: "available",
        hasResident: false,
        hasActiveLease: true
      })
    ).toMatch(/resident\/lease/i);
    expect(
      unitArchiveBlockReason({
        status: "offline",
        hasResident: false,
        hasActiveLease: false
      })
    ).toMatch(/already archived/i);
  });

  it("blocks unsafe status edits and keeps occupied lease-driven", () => {
    expect(
      unitStatusEditBlockReason("available", "offline", {
        hasResident: false,
        hasActiveLease: false
      })
    ).toBeNull();
    expect(
      unitStatusEditBlockReason("available", "occupied", {
        hasResident: false,
        hasActiveLease: false
      })
    ).toMatch(/leasing and residents/i);
    expect(
      unitStatusEditBlockReason("occupied", "available", {
        hasResident: true,
        hasActiveLease: true
      })
    ).toMatch(/Clear the resident/i);
  });

  it("explains unit impact on residents, leasing, maintenance, and capacity", () => {
    const copy = unitImpactCopy();
    expect(copy.residents).toMatch(/Residents/i);
    expect(copy.leasing).toMatch(/Leases/i);
    expect(copy.maintenance).toMatch(/maintenance/i);
    expect(copy.capacity).toMatch(/plan capacity/i);
  });
});
