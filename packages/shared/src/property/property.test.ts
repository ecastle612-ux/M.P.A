import { describe, expect, it } from "vitest";
import {
  PROPERTY_AUDIT_CATALOG,
  PROPERTY_EVENT_CATALOG,
  buildMissionControlNextAction,
  buildPropertyReadyAssistantCopy,
  buildTeamReadyAssistantCopy,
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

  it("progresses Mission Control from first property to invite team to resident", () => {
    const before = buildMissionControlNextAction({ setupComplete: true, propertyCount: 0 });
    expect(before.id).toBe("add_first_property");

    const invite = buildMissionControlNextAction({
      setupComplete: true,
      propertyCount: 1,
      firstPropertyId: "00000000-0000-4000-8000-000000000001",
      teamReady: false
    });
    expect(invite.id).toBe("invite_team");
    expect(invite.href).toBe("/settings/team");
    expect(invite.assistantRecommendation).toBe("Invite your team.");

    const afterTeam = buildMissionControlNextAction({
      setupComplete: true,
      propertyCount: 1,
      teamReady: true
    });
    expect(afterTeam.id).toBe("add_first_resident");
    expect(afterTeam.assistantRecommendation).toBe("Add your first resident.");
    expect(buildPropertyReadyAssistantCopy("Oak Street")).toContain("Invite your team");
    expect(buildTeamReadyAssistantCopy()).toContain("Add your first resident");
  });
});
