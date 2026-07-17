import { describe, expect, it } from "vitest";
import { parseCsvContent } from "./importers/csv";
import { parseXlsxBuffer } from "./importers/xlsx";
import {
  detectFileType,
  parseColumnMaps,
  parseCreateMigrationJobInput,
  parseMigrationReviewAction,
  parseUpdateMigrationJobInput
} from "./contracts";
import { applyColumnMapping, detectColumnMapping, findDuplicateIndices, normalizeHeader } from "./mapping";

describe("parseCreateMigrationJobInput", () => {
  it("accepts valid job payload", () => {
    const input = parseCreateMigrationJobInput({ name: "Portfolio import", sourceSoftware: "appfolio" });
    expect(input).toEqual({ name: "Portfolio import", sourceSoftware: "appfolio" });
  });

  it("rejects short names", () => {
    expect(parseCreateMigrationJobInput({ name: "A" })).toBeNull();
  });
});

describe("parseUpdateMigrationJobInput", () => {
  it("parses column maps by entity type", () => {
    const input = parseUpdateMigrationJobInput({
      columnMaps: {
        property: { name: "Property Name", city: "City" }
      }
    });
    expect(input?.columnMaps?.property).toEqual({ name: "Property Name", city: "City" });
  });
});

describe("parseMigrationReviewAction", () => {
  it("parses merge action", () => {
    expect(
      parseMigrationReviewAction({
        action: "merge",
        targetId: "550e8400-e29b-41d4-a716-446655440000"
      })
    ).toEqual({ action: "merge", targetId: "550e8400-e29b-41d4-a716-446655440000" });
  });

  it("parses skip action", () => {
    expect(parseMigrationReviewAction({ action: "skip" })).toEqual({ action: "skip" });
  });
});

describe("detectFileType", () => {
  it("detects csv and xlsx extensions", () => {
    expect(detectFileType("export.csv")).toBe("csv");
    expect(detectFileType("units.xlsx")).toBe("xlsx");
    expect(detectFileType("bundle.zip")).toBe("zip");
  });
});

describe("parseCsvContent", () => {
  it("parses quoted csv rows", () => {
    const parsed = parseCsvContent("Name,City\n\"Oak Apts\",\"Austin\"\n");
    expect(parsed.headers).toEqual(["Name", "City"]);
    expect(parsed.rows[0]).toEqual({ Name: "Oak Apts", City: "Austin" });
  });
});

describe("parseXlsxBuffer", () => {
  it("returns empty file for invalid buffer", () => {
    const parsed = parseXlsxBuffer(new ArrayBuffer(8));
    expect(parsed.headers).toEqual([]);
    expect(parsed.rows).toEqual([]);
  });
});

describe("detectColumnMapping", () => {
  it("maps AppFolio property headers", () => {
    const result = detectColumnMapping(
      ["Property Name", "Street Address 1", "City", "State", "Zip"],
      "property",
      "appfolio"
    );
    expect(result.columnMap["name"]).toBe("Property Name");
    expect(result.columnMap["addressLine1"]).toBe("Street Address 1");
    expect(result.confidence).toBeGreaterThan(0);
  });

  it("applyColumnMapping extracts mapped values", () => {
    const mapped = applyColumnMapping(
      { "Property Name": "Sunset", City: "Denver" },
      { name: "Property Name", city: "City" }
    );
    expect(mapped).toEqual({ name: "Sunset", city: "Denver" });
  });
});

describe("duplicate detection", () => {
  it("finds duplicate tenant emails", () => {
    const duplicates = findDuplicateIndices(
      [
        { email: "a@example.com", firstName: "A", lastName: "One" },
        { email: "a@example.com", firstName: "A", lastName: "One" }
      ],
      "tenant"
    );
    expect(duplicates).toEqual([1]);
  });

  it("normalizes headers consistently", () => {
    expect(normalizeHeader(" Property Name ")).toBe("property_name");
  });
});

describe("parseColumnMaps", () => {
  it("ignores invalid entity keys", () => {
    expect(parseColumnMaps({ property: { name: "Name" }, invalid: { x: "y" } }).property).toEqual({
      name: "Name"
    });
  });
});
