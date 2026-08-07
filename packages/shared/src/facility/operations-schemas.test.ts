import { describe, expect, it } from "vitest";
import {
  createFacilityWorkOrderInputSchema,
  defaultPriorityFromCriticality
} from "./operations-schemas";

describe("facility operations schemas (E.3)", () => {
  it("requires site and title for facility work create", () => {
    const parsed = createFacilityWorkOrderInputSchema.safeParse({
      siteId: "11111111-1111-4111-8111-111111111111",
      title: "Replace belt",
      description: "Drive belt squealing on AHU-1"
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.category).toBe("general");
    }
  });

  it("defaults priority from asset criticality", () => {
    expect(defaultPriorityFromCriticality("critical")).toBe("high");
    expect(defaultPriorityFromCriticality("low")).toBe("low");
    expect(defaultPriorityFromCriticality(null)).toBe("normal");
  });
});
