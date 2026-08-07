import { describe, expect, it } from "vitest";
import {
  buildFacilityMissionControlNextAction,
  buildFacilitySetupIncompleteAttention,
  rankFacilityAttention
} from "./attention";

describe("facility mission control attention (E.1)", () => {
  it("surfaces setup_incomplete when no sites exist", () => {
    const items = buildFacilitySetupIncompleteAttention({
      activeSiteCount: 0,
      draftSiteCount: 0
    });
    expect(items).toHaveLength(1);
    expect(items[0]?.severity).toBe("setup_incomplete");
    expect(items[0]?.href).toContain("/facility/sites");
  });

  it("clears setup_incomplete when an active site exists", () => {
    const items = buildFacilitySetupIncompleteAttention({
      activeSiteCount: 1,
      draftSiteCount: 0
    });
    expect(items).toHaveLength(0);
  });

  it("recommends activating a draft site", () => {
    const next = buildFacilityMissionControlNextAction({
      setupComplete: true,
      activeSiteCount: 0,
      draftSiteCount: 1
    });
    expect(next.id).toBe("activate_first_site");
    expect(next.assistantRecommendation).toMatch(/Activate/i);
  });

  it("ranks higher priority attention first", () => {
    const ranked = rankFacilityAttention([
      {
        id: "a",
        severity: "setup_incomplete",
        priority: 1,
        title: "Setup",
        detail: "x",
        href: "/facility/sites",
        aggregateType: null,
        aggregateId: null,
        siteId: null
      },
      {
        id: "b",
        severity: "system_down",
        priority: 5,
        title: "Down",
        detail: "x",
        href: "/facility/building-systems",
        aggregateType: null,
        aggregateId: null,
        siteId: null
      }
    ]);
    expect(ranked[0]?.id).toBe("b");
  });
});
