import { describe, expect, it } from "vitest";
import {
  CAMERON_OPTION_B_UNIT_ID,
  M2D_APPROVED_MAP,
  M2D_EXPECTED_MONEY,
  M2D_PROPERTIES,
  assertM2dMapIntegrity
} from "./docs-152-m2d-map";

describe("docs/152 M2D approved map", () => {
  it("has eight distinct Owner-approved targets and excludes Cameron", () => {
    expect(() => assertM2dMapIntegrity()).not.toThrow();
    expect(M2D_APPROVED_MAP).toHaveLength(8);
    expect(M2D_APPROVED_MAP.map((row) => row.resident).sort()).toEqual([
      "Casey Garcia",
      "Dakota Martin",
      "Hayden Ibrahim",
      "Jordan Chen",
      "Parker Johnson",
      "Reese Kim",
      "Riley Foster",
      "Taylor Diaz"
    ]);
    expect(M2D_APPROVED_MAP.some((row) => row.newUnitId === CAMERON_OPTION_B_UNIT_ID)).toBe(false);
  });

  it("keeps each row on its authoritative property", () => {
    expect(M2D_APPROVED_MAP.find((row) => row.resident === "Reese Kim")?.propertyId).toBe(
      M2D_PROPERTIES.mapleCourt
    );
    expect(
      M2D_APPROVED_MAP.filter((row) =>
        ["Riley Foster", "Jordan Chen", "Hayden Ibrahim"].includes(row.resident)
      ).every((row) => row.propertyId === M2D_PROPERTIES.harborView)
    ).toBe(true);
    expect(
      M2D_APPROVED_MAP.filter((row) =>
        ["Dakota Martin", "Taylor Diaz", "Parker Johnson", "Casey Garcia"].includes(row.resident)
      ).every((row) => row.propertyId === M2D_PROPERTIES.summit)
    ).toBe(true);
  });

  it("does not change certified Development money", () => {
    expect(M2D_EXPECTED_MONEY).toEqual({
      charges: 12,
      gross: 18240,
      paid: 8960,
      payments: 8,
      outstanding: 9280
    });
  });
});
