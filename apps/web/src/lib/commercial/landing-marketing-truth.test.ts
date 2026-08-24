import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ONLINE_RENT_COLLECTION_HEADLINE,
  ONLINE_RENT_COLLECTION_PREFERRED,
  PUBLIC_PRICING_MODEL_COPY,
  SKU_SUMMARIES
} from "@mpa/shared";
import { MARKETING_MODULE_COPY } from "../../components/marketing/marketing-module-copy";

const landing = readFileSync(
  join(process.cwd(), "src/components/marketing/public-landing-page.tsx"),
  "utf8"
);
const modulesPage = readFileSync(
  join(process.cwd(), "src/components/marketing/modules-page.tsx"),
  "utf8"
);
const marketingSurfaces = [
  landing,
  modulesPage,
  Object.values(SKU_SUMMARIES)
    .map((entry) => entry.description)
    .join("\n"),
  Object.values(MARKETING_MODULE_COPY).join("\n")
].join("\n");

const OVERCLAIM_PATTERNS = [
  /Download from the App Store/i,
  /Download from Google Play/i,
  /native (ios|android) app/i,
  /delinquency automation/i,
  /payment arrangements automation/i,
  /\bRLS\b/,
  /\bRBAC\b/,
  /\bADR-\d+/,
  /capability keys/i,
  /operating_scope/,
  /service_role/
];

describe("public landing marketing truth", () => {
  it("keeps live catalog prices on the landing page", () => {
    expect(landing).toContain("pricing.pmHeadline");
    expect(landing).toContain("pricing.foHeadlineMonthly");
    expect(landing).toContain("pricing.completeHeadlineMonthly");
    expect(PUBLIC_PRICING_MODEL_COPY.pmHeadline).toBe("$59/month");
    expect(PUBLIC_PRICING_MODEL_COPY.foHeadlineMonthly).toBe("$59/month");
    expect(PUBLIC_PRICING_MODEL_COPY.completeHeadlineMonthly).toBe("$109/month");
  });

  it("explains the three products and Complete as one organization", () => {
    expect(landing).toMatch(/Property Operations/);
    expect(landing).toMatch(/Facility Operations/);
    expect(landing).toMatch(/one organization and one subscription/i);
    expect(SKU_SUMMARIES.mpa_complete_platform.description).toMatch(/one organization/i);
    expect(SKU_SUMMARIES.mpa_complete_platform.description).not.toMatch(/two subscriptions/i);
    expect(modulesPage).toMatch(/one organization and one subscription/i);
  });

  it("mentions Tenant Portal without native-app store claims", () => {
    expect(landing).toMatch(/Tenant Portal/);
    expect(landing).toMatch(/works in the browser/i);
    expect(landing).toMatch(/Add to Home Screen/);
    expect(landing).not.toMatch(/Download from the App Store/);
    expect(landing).not.toMatch(/Download from Google Play/);
  });

  it("does not overclaim finance, push, or engineering terms", () => {
    expect(MARKETING_MODULE_COPY["financial_operations"]).toMatch(/Collect rent online with Stripe/);
    expect(MARKETING_MODULE_COPY["financial_operations"]).not.toMatch(/automated collections/i);
    expect(landing).toContain("ONLINE_RENT_COLLECTION_HEADLINE");
    expect(landing).toContain('id="online-rent"');
    expect(ONLINE_RENT_COLLECTION_HEADLINE).toBe("Collect rent online, your way.");
    expect(ONLINE_RENT_COLLECTION_PREFERRED).toContain("Choose bank payments, cards, or both");
    expect(landing).toContain("ONLINE_RENT_COLLECTION_FAQS");
    expect(landing).toMatch(/does not include automated late fees/i);
    expect(landing).toMatch(/Phone push notifications are not available/i);
    expect(landing).not.toMatch(/free processing/i);
    expect(landing).not.toMatch(/instant ACH/i);
    expect(landing).not.toMatch(/admin-enrolled AutoPay/i);
    for (const pattern of OVERCLAIM_PATTERNS) {
      expect(marketingSurfaces).not.toMatch(pattern);
    }
    expect(landing).not.toMatch(/RLS|RBAC|operating_scope|service_role|capability keys/);
  });

  it("advertises rent collection on Property Operations only", () => {
    expect(SKU_SUMMARIES.mpa_property_manager.description).toMatch(/Collect rent online/);
    expect(SKU_SUMMARIES.mpa_complete_platform.description).toMatch(/online rent collection/);
    expect(SKU_SUMMARIES.mpa_complete_platform.description).toMatch(
      /Facility Operations does not collect residential rent/
    );
    expect(SKU_SUMMARIES.mpa_facility_operations.description).not.toMatch(/rent collection|AutoPay|ACH/i);
    expect(PUBLIC_PRICING_MODEL_COPY.pmIncludes).toMatch(/Online rent collection/);
    expect(PUBLIC_PRICING_MODEL_COPY.completeIncludes).toMatch(/Online rent collection/);
    expect(PUBLIC_PRICING_MODEL_COPY.foIncludes).not.toMatch(/rent collection|AutoPay|ACH/i);
    expect(PUBLIC_PRICING_MODEL_COPY.pmHeadline).toBe("$59/month");
    expect(PUBLIC_PRICING_MODEL_COPY.completeHeadlineMonthly).toBe("$109/month");
  });

  it("keeps the commercial CTA path", () => {
    expect(landing).toMatch(/Get Started/);
    expect(landing).toMatch(/#choose-platform/);
    expect(landing).toMatch(/See which plan is for me/);
  });
});
