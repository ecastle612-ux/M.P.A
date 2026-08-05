import { describe, expect, it } from "vitest";
import {
  ACQ_DEFAULT_BILLING_INTERVAL,
  ACQ_FOUNDER_PUBLIC,
  ACQ_POST_SUCCESS_AUTO_LOGIN,
  ACQ_PUBLIC_SELF_SERVE_PLANS,
  ACQ_TRIAL_ENABLED,
  isPublicSelfServePlan,
  isSalesAssistedPlan
} from "./decisions";
import {
  buildPlanComparisonRows,
  buildPublicPlanCards,
  checkoutStartHref,
  formatListPrice,
  TOUR_STEPS
} from "./catalog";
import {
  isAcqModuleSelection,
  modulesPricingHref,
  parseAcqModuleSelection
} from "./modules";

describe("UX-013 Slice A decisions", () => {
  it("locks self-serve without public Trial", () => {
    expect(ACQ_TRIAL_ENABLED).toBe(false);
    expect(ACQ_FOUNDER_PUBLIC).toBe(false);
    expect(ACQ_POST_SUCCESS_AUTO_LOGIN).toBe(false);
    expect(ACQ_DEFAULT_BILLING_INTERVAL).toBe("month");
    expect(ACQ_PUBLIC_SELF_SERVE_PLANS).toEqual(["professional", "business"]);
    expect(isPublicSelfServePlan("professional")).toBe(true);
    expect(isPublicSelfServePlan("trial")).toBe(false);
    expect(isPublicSelfServePlan("enterprise")).toBe(false);
    expect(isSalesAssistedPlan("enterprise")).toBe(true);
  });
});

describe("UX-013 module selection", () => {
  it("parses module selection ids", () => {
    expect(isAcqModuleSelection("property_ops")).toBe(true);
    expect(parseAcqModuleSelection("facility_ops")).toBe("facility_ops");
    expect(parseAcqModuleSelection("trial")).toBeNull();
    expect(modulesPricingHref("both")).toBe("/pricing?modules=both");
  });
});

describe("UX-013 public catalog", () => {
  it("builds public cards without Trial or Founder", () => {
    const cards = buildPublicPlanCards("month", "property_ops");
    expect(cards.some((card) => card.planCode === ("founder" as string))).toBe(false);
    expect(cards.some((card) => card.planCode === ("trial" as string))).toBe(false);
    expect(cards.find((card) => card.planCode === "enterprise")?.ctaHref).toBe("/contact-sales");
    expect(cards.find((card) => card.planCode === "professional")?.ctaHref).toContain(
      "modules=property_ops"
    );
    expect(cards.find((card) => card.planCode === "professional")?.features.join(" ")).toMatch(
      /Property Operations/i
    );
  });

  it("adapts facility-only comparison rows", () => {
    const rows = buildPlanComparisonRows("facility_ops");
    expect(rows.some((row) => row.label === "Facility operations")).toBe(true);
    expect(rows.some((row) => row.label === "Property operations")).toBe(false);
  });

  it("formats prices and checkout hrefs with modules", () => {
    expect(formatListPrice(99, "month")).toBe("$99/month");
    expect(checkoutStartHref("business", "year", "both")).toBe(
      "/acquire/start?plan=business&interval=year&modules=both"
    );
  });

  it("prices both modules higher than one module and below 2×", () => {
    const one = buildPublicPlanCards("month", "property_ops").find(
      (card) => card.planCode === "professional"
    );
    const both = buildPublicPlanCards("month", "both").find(
      (card) => card.planCode === "professional"
    );
    expect(one?.name).toBe("Essentials");
    expect(one?.listPriceMonthly).toBe(99);
    expect(both?.name).toBe("Professional");
    expect(both?.listPriceMonthly).toBe(149);
    expect(both?.listPriceMonthly).toBeGreaterThan(one?.listPriceMonthly ?? 0);
    expect(both?.compareAtMonthly).toBe(198);
    expect(both?.bundleSavingsMonthly).toBe(49);
    expect(both?.listPriceMonthly).toBeLessThan(both?.compareAtMonthly ?? 0);
  });

  it("keeps tour within six steps", () => {
    expect(TOUR_STEPS.length).toBeLessThanOrEqual(6);
    expect(TOUR_STEPS.length).toBeGreaterThan(0);
  });
});
