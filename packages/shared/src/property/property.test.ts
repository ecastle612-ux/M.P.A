import { describe, expect, it } from "vitest";
import {
  PROPERTY_AUDIT_CATALOG,
  PROPERTY_EVENT_CATALOG,
  buildMissionControlNextAction,
  buildPropertyReadyAssistantCopy,
  createPortfolioPropertyInputSchema,
  unitLabelsForCount
} from "./index";

describe("LAUNCH-001 J1 property domain", () => {
  it("accepts launch-critical create input", () => {
    const parsed = createPortfolioPropertyInputSchema.parse({ name: "Oak Street", unitCount: 3 });
    expect(parsed.name).toBe("Oak Street");
    expect(parsed.unitCount).toBe(3);
    expect(unitLabelsForCount(3)).toEqual(["1", "2", "3"]);
  });

  it("defaults unit count to 1", () => {
    const parsed = createPortfolioPropertyInputSchema.parse({ name: "Pine Court" });
    expect(parsed.unitCount).toBe(1);
  });

  it("registers property event and audit catalogs", () => {
    expect(PROPERTY_EVENT_CATALOG.some((item) => item.type === "property.created")).toBe(true);
    expect(PROPERTY_AUDIT_CATALOG.some((item) => item.action === "property.created")).toBe(true);
  });

  it("progresses Mission Control from first property to invite team", () => {
    const before = buildMissionControlNextAction({ setupComplete: true, propertyCount: 0 });
    expect(before.id).toBe("add_first_property");
    expect(before.href).toContain("/pm/properties");

    const after = buildMissionControlNextAction({
      setupComplete: true,
      propertyCount: 1,
      firstPropertyId: "00000000-0000-4000-8000-000000000001"
    });
    expect(after.id).toBe("invite_team");
    expect(after.assistantRecommendation).toBe("Invite your team.");
    expect(buildPropertyReadyAssistantCopy("Oak Street")).toContain("Invite your team");
  });
});
