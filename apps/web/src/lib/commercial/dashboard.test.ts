import { describe, expect, it } from "vitest";
import { ENGAGEMENT_PATHS, PROVIDER_TYPES, ENGAGEMENT_STATUSES } from "./marketplace-types";
import { isOpsSliceAEventType } from "../ops/catalog";

describe("COM-001 Slice E marketplace model", () => {
  it("supports ai_guided and professional paths", () => {
    expect(ENGAGEMENT_PATHS).toEqual(["ai_guided", "professional"]);
  });

  it("supports mpa_internal and certified_partner providers", () => {
    expect(PROVIDER_TYPES).toContain("mpa_internal");
    expect(PROVIDER_TYPES).toContain("certified_partner");
  });

  it("includes full engagement status lifecycle", () => {
    expect(ENGAGEMENT_STATUSES).toEqual([
      "requested",
      "matched",
      "in_progress",
      "complete",
      "cancelled"
    ]);
  });
});

describe("COM-001 Slice E OPS catalog", () => {
  it("registers secret-free dashboard and engagement events", () => {
    expect(isOpsSliceAEventType("commercial.dashboard.opened")).toBe(true);
    expect(isOpsSliceAEventType("commercial.engagement.created")).toBe(true);
    expect(isOpsSliceAEventType("commercial.engagement.status_changed")).toBe(true);
  });
});
