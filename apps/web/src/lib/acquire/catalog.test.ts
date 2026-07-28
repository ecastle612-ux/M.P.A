import { describe, expect, it } from "vitest";
import {
  ACQ_DEFAULT_BILLING_INTERVAL,
  ACQ_FOUNDER_PUBLIC,
  ACQ_POST_SUCCESS_AUTO_LOGIN,
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

describe("ACQ-001 Slice A decisions", () => {
  it("locks self-serve and sales-assisted plans", () => {
    expect(ACQ_TRIAL_ENABLED).toBe(true);
    expect(ACQ_FOUNDER_PUBLIC).toBe(false);
    expect(ACQ_POST_SUCCESS_AUTO_LOGIN).toBe(false);
    expect(ACQ_DEFAULT_BILLING_INTERVAL).toBe("month");
    expect(isPublicSelfServePlan("professional")).toBe(true);
    expect(isPublicSelfServePlan("enterprise")).toBe(false);
    expect(isSalesAssistedPlan("enterprise")).toBe(true);
  });
});

describe("ACQ-001 public catalog", () => {
  it("builds public cards without Founder and with Enterprise sales CTA", () => {
    const cards = buildPublicPlanCards("month");
    expect(cards.some((card) => card.planCode === ("founder" as string))).toBe(false);
    expect(cards.find((card) => card.planCode === "trial")?.selfServe).toBe(true);
    expect(cards.find((card) => card.planCode === "enterprise")?.ctaHref).toBe("/contact-sales");
    expect(cards.find((card) => card.planCode === "professional")?.ctaHref).toContain(
      "/acquire/start?plan=professional"
    );
  });

  it("builds comparison rows from capability matrix", () => {
    const rows = buildPlanComparisonRows();
    expect(rows.some((row) => row.label === "Max properties")).toBe(true);
    expect(rows.some((row) => row.label === "Marketplace")).toBe(true);
  });

  it("formats prices and checkout hrefs", () => {
    expect(formatListPrice(0, "month")).toBe("Free during trial");
    expect(formatListPrice(99, "month")).toBe("$99/month");
    expect(checkoutStartHref("business", "year")).toBe("/acquire/start?plan=business&interval=year");
  });

  it("keeps tour within six steps", () => {
    expect(TOUR_STEPS.length).toBeLessThanOrEqual(6);
    expect(TOUR_STEPS.length).toBeGreaterThan(0);
  });
});
