import { describe, expect, it } from "vitest";
import { FO_DEMO_SNAPSHOT } from "./snapshots/fo";
import { PM_DEMO_SNAPSHOT } from "./snapshots/pm";
import {
  buildCompleteDemoShowcase,
  buildFoDemoShowcase,
  buildPmDemoShowcase
} from "./snapshot-metrics";

describe("demo snapshot metrics", () => {
  it("derives PM KPIs only from existing snapshot fields", () => {
    const showcase = buildPmDemoShowcase(PM_DEMO_SNAPSHOT);
    expect(showcase.kpis.find((kpi) => kpi.id === "properties")?.value).toBe("3");
    expect(showcase.occupancyBars).toHaveLength(3);
    expect(showcase.financial.monthlyRentRoll).toBe(1650 + 2100 + 1425);
    expect(showcase.financial.outstandingBalance).toBe(1850 + 120);
    expect(showcase.queue.length).toBe(PM_DEMO_SNAPSHOT.attention.length);
  });

  it("derives FO KPIs only from existing snapshot fields", () => {
    const showcase = buildFoDemoShowcase(FO_DEMO_SNAPSHOT);
    expect(showcase.kpis.find((kpi) => kpi.id === "sites")?.value).toBe("2");
    expect(showcase.assetHealth.some((asset) => asset.status === "attention")).toBe(true);
    expect(showcase.compliance).toHaveLength(FO_DEMO_SNAPSHOT.complianceItems.length);
    expect(showcase.corrective).toHaveLength(FO_DEMO_SNAPSHOT.correctiveWork.length);
  });

  it("builds Complete executive summary from both halves", () => {
    const showcase = buildCompleteDemoShowcase(
      "Summit Portfolio & Facilities (Demo)",
      PM_DEMO_SNAPSHOT,
      FO_DEMO_SNAPSHOT
    );
    expect(showcase.executiveKpis.length).toBeGreaterThanOrEqual(4);
    expect(showcase.pm.organizationName).toContain("Demo");
    expect(showcase.fo.organizationName).toContain("Demo");
  });
});
