import { describe, expect, it } from "vitest";
import {
  facilityMissionControlErrorMessage,
  facilityMissionControlGlanceMetrics,
  facilityMissionControlLoadView
} from "./mission-control-presentation";

describe("facilityMissionControlLoadView (PPS1-003)", () => {
  it("shows loading skeletons only while loading", () => {
    expect(
      facilityMissionControlLoadView({ loading: true, error: null, hasSnapshot: false })
    ).toBe("loading");
    expect(
      facilityMissionControlLoadView({ loading: true, error: "x", hasSnapshot: false })
    ).toBe("loading");
  });

  it("shows error without skeleton when load failed", () => {
    expect(
      facilityMissionControlLoadView({ loading: false, error: "failed", hasSnapshot: false })
    ).toBe("error");
    expect(
      facilityMissionControlLoadView({ loading: false, error: "failed", hasSnapshot: true })
    ).toBe("error");
  });

  it("shows ready dashboard after successful load", () => {
    expect(
      facilityMissionControlLoadView({ loading: false, error: null, hasSnapshot: true })
    ).toBe("ready");
  });
});

describe("facilityMissionControlGlanceMetrics (PPS1-003)", () => {
  it("maps distinct snapshot fields to distinct cards — no duplicated values under different labels", () => {
    const metrics = facilityMissionControlGlanceMetrics({
      todayOpen: 1,
      emergency: 2,
      open: 5,
      overdue: 1,
      waitingOnTechnician: 3,
      waitingOnVendor: 4,
      completedRecently: 7
    });

    const byId = Object.fromEntries(metrics.map((metric) => [metric.id, metric]));
    expect(byId["waiting_technician"]?.value).toBe(3);
    expect(byId["waiting_vendor"]?.value).toBe(4);
    expect(byId["waiting_technician"]?.label).not.toBe(byId["waiting_vendor"]?.label);

    const waitingLabels = metrics.filter((metric) =>
      /waiting|assigned/i.test(metric.label)
    );
    const values = waitingLabels.map((metric) => metric.value);
    expect(new Set(values).size).toBe(values.length);
  });
});

describe("facilityMissionControlErrorMessage", () => {
  it("does not expose implementation details", () => {
    expect(facilityMissionControlErrorMessage(new Error("relation does not exist"))).not.toMatch(
      /relation|sql|postgres/i
    );
    expect(facilityMissionControlErrorMessage(new Error("Failed to load"))).toMatch(
      /try again/i
    );
  });
});
