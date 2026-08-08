import { describe, expect, it } from "vitest";
import {
  acquisitionHref,
  commercialContinueHref,
  marketingModulesForSku,
  parseAcquisitionSku,
  skuComparisonRows
} from "./acquisition";

describe("commercial acquisition helpers", () => {
  it("parses valid SKU intents only", () => {
    expect(parseAcquisitionSku("mpa_property_manager")).toBe("mpa_property_manager");
    expect(parseAcquisitionSku("not-a-sku")).toBeNull();
    expect(parseAcquisitionSku(null)).toBeNull();
  });

  it("builds public funnel hrefs without auth", () => {
    expect(acquisitionHref("modules")).toBe("/modules");
    expect(acquisitionHref("pricing", "mpa_property_manager")).toBe(
      "/pricing?intent=mpa_property_manager"
    );
    expect(
      acquisitionHref("checkout", {
        sku: "mpa_property_manager",
        planTier: "professional",
        billingCycle: "monthly"
      })
    ).toBe("/checkout?intent=mpa_property_manager&plan=professional&cycle=monthly");
    expect(acquisitionHref("signup", "mpa_property_manager")).toBe(
      "/login?mode=sign_up&intent=mpa_property_manager"
    );
  });

  it("routes FO and Complete confirm/signup attempts to Enterprise", () => {
    expect(acquisitionHref("checkout", "mpa_facility_operations")).toBe(
      "/enterprise?intent=mpa_facility_operations"
    );
    expect(acquisitionHref("checkout", "mpa_complete_platform")).toBe(
      "/enterprise?intent=mpa_complete_platform"
    );
    expect(acquisitionHref("signup", "mpa_facility_operations")).toBe(
      "/enterprise?intent=mpa_facility_operations"
    );
    expect(
      commercialContinueHref({
        productSku: "mpa_complete_platform",
        planTier: "professional",
        billingCycle: "monthly"
      })
    ).toBe("/enterprise?intent=mpa_complete_platform");
  });

  it("excludes Capital Projects from marketing catalogs", () => {
    for (const sku of [
      "mpa_property_manager",
      "mpa_facility_operations",
      "mpa_complete_platform"
    ] as const) {
      expect(marketingModulesForSku(sku).some((module) => module.id === "capital_projects")).toBe(
        false
      );
    }
    expect(skuComparisonRows().some((row) => row.id === "capital_projects")).toBe(false);
  });
});
