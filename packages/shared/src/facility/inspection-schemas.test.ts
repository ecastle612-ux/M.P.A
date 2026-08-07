import { describe, expect, it } from "vitest";
import {
  createInspectionProgramInputSchema,
  deriveInspectionRunOutcome
} from "./inspection-schemas";

describe("inspection schemas", () => {
  it("requires asset for asset-scoped programs", () => {
    const parsed = createInspectionProgramInputSchema.safeParse({
      siteId: "11111111-1111-1111-1111-111111111111",
      name: "Roof inspection",
      scopeType: "asset",
      checklistTemplate: [{ key: "1", label: "Check seams", required: true }]
    });
    expect(parsed.success).toBe(false);
  });

  it("derives fail outcome when any item fails", () => {
    expect(
      deriveInspectionRunOutcome([
        { key: "1", label: "A", outcome: "pass", spawnWorkOrder: false },
        { key: "2", label: "B", outcome: "fail", spawnWorkOrder: true }
      ])
    ).toBe("completed_fail");
  });
});
