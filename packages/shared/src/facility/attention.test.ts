import { describe, expect, it } from "vitest";
import {
  buildFacilityCriticalAssetAttention,
  buildFacilityMissionControlNextAction,
  buildFacilitySetupIncompleteAttention,
  buildFacilitySystemDownAttention,
  rankFacilityAttention
} from "./attention";

describe("facility mission control attention (E.1–E.2)", () => {
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

  it("recommends registering assets after site is ready", () => {
    const next = buildFacilityMissionControlNextAction({
      setupComplete: true,
      activeSiteCount: 1,
      draftSiteCount: 0,
      activeAssetCount: 0
    });
    expect(next.id).toBe("register_first_asset");
    expect(next.assistantRecommendation).toMatch(/Register your first asset/i);
  });

  it("surfaces system_down attention", () => {
    const items = buildFacilitySystemDownAttention([
      { id: "s1", name: "Chiller plant", siteId: "site-1", status: "down" },
      { id: "s2", name: "HVAC west", siteId: "site-1", status: "active" }
    ]);
    expect(items).toHaveLength(1);
    expect(items[0]?.severity).toBe("system_down");
    expect(items[0]?.href).toContain("/facility/building-systems/s1");
  });

  it("surfaces critical assets in repair", () => {
    const items = buildFacilityCriticalAssetAttention([
      {
        id: "a1",
        name: "Boiler A",
        siteId: "site-1",
        status: "in_repair",
        criticality: "critical"
      },
      {
        id: "a2",
        name: "Pump",
        siteId: "site-1",
        status: "in_repair",
        criticality: "medium"
      }
    ]);
    expect(items).toHaveLength(1);
    expect(items[0]?.href).toContain("/facility/assets/a1");
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
