import { describe, expect, it } from "vitest";
import { fuzzyFilter, fuzzyScore } from "./fuzzy";

describe("fuzzyScore", () => {
  it("scores exact matches highest", () => {
    expect(fuzzyScore("harbor", "PMX Harbor Residences")).toBeGreaterThan(fuzzyScore("hrbr", "PMX Harbor Residences"));
  });

  it("supports subsequence matching", () => {
    expect(fuzzyScore("phr", "PMX Harbor Residences")).toBeGreaterThan(0);
  });

  it("returns zero when characters are missing", () => {
    expect(fuzzyScore("zzzz", "PMX Harbor Residences")).toBe(0);
  });
});

describe("fuzzyFilter", () => {
  it("returns all items for empty query up to limit", () => {
    const results = fuzzyFilter("", [{ name: "Alpha" }, { name: "Beta" }], (item) => [item.name], 1);
    expect(results).toHaveLength(1);
  });

  it("ranks prefix matches ahead of distant subsequence matches", () => {
    const results = fuzzyFilter(
      "uni",
      [{ name: "Sunset" }, { name: "Unit 101" }],
      (item) => [item.name],
      2
    );
    expect(results[0]?.item.name).toBe("Unit 101");
  });
});
