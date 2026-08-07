import { describe, expect, it } from "vitest";
import {
  buildFacilityCriticalAssetAttention,
  buildFacilityMissionControlNextAction,
  buildFacilityOpenCriticalWorkAttention,
  buildFacilityPmDueAttention,
  buildFacilityPmOverdueAttention,
  buildFacilitySetupIncompleteAttention,
  buildFacilitySystemDownAttention,
  buildFacilityWorkOrderEmergencyAttention,
  rankFacilityAttention
} from "./attention";

describe("facility mission control attention (E.1–E.4)", () => {
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

  it("surfaces emergency facility work orders", () => {
    const items = buildFacilityWorkOrderEmergencyAttention([
      {
        id: "wo1",
        title: "Chiller failure",
        siteId: "site-1",
        priority: "emergency",
        status: "submitted",
        productContext: "facility"
      },
      {
        id: "wo2",
        title: "Resident leak",
        siteId: null,
        priority: "emergency",
        status: "submitted",
        productContext: "property_manager"
      }
    ]);
    expect(items).toHaveLength(1);
    expect(items[0]?.severity).toBe("wo_emergency");
    expect(items[0]?.href).toContain("/facility/operations");
  });

  it("surfaces open critical facility work", () => {
    const items = buildFacilityOpenCriticalWorkAttention([
      {
        id: "wo3",
        title: "Boiler valve",
        siteId: "site-1",
        priority: "normal",
        status: "assigned",
        productContext: "facility",
        assetCriticality: "critical"
      }
    ]);
    expect(items).toHaveLength(1);
    expect(items[0]?.severity).toBe("wo_open_critical");
  });

  it("recommends advancing open facility work", () => {
    const next = buildFacilityMissionControlNextAction({
      setupComplete: true,
      activeSiteCount: 1,
      draftSiteCount: 0,
      activeAssetCount: 2,
      openFacilityWorkCount: 3,
      firstOpenWorkOrderId: "wo-9"
    });
    expect(next.id).toBe("advance_facility_work");
    expect(next.href).toContain("wo-9");
  });

  it("surfaces PM due and overdue attention", () => {
    const due = buildFacilityPmDueAttention(
      [
        {
          id: "pm1",
          name: "Filter change",
          siteId: "site-1",
          status: "active",
          nextDueOn: "2026-08-07",
          criticality: "medium"
        }
      ],
      "2026-08-07"
    );
    expect(due).toHaveLength(1);
    expect(due[0]?.severity).toBe("pm_due");

    const overdue = buildFacilityPmOverdueAttention(
      [
        {
          id: "pm2",
          name: "Chiller inspection",
          siteId: "site-1",
          status: "active",
          nextDueOn: "2026-08-01",
          criticality: "critical"
        }
      ],
      "2026-08-07"
    );
    expect(overdue).toHaveLength(1);
    expect(overdue[0]?.severity).toBe("pm_overdue");
    expect(overdue[0]?.detail).toMatch(/6 days overdue/);
  });

  it("prioritizes overdue PM in next action", () => {
    const next = buildFacilityMissionControlNextAction({
      setupComplete: true,
      activeSiteCount: 1,
      draftSiteCount: 0,
      activeAssetCount: 2,
      overduePmCount: 2,
      firstPmScheduleId: "pm-9"
    });
    expect(next.id).toBe("catch_up_pm");
    expect(next.href).toContain("pm-9");
  });
});
