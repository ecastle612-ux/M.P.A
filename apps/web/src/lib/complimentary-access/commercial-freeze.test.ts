import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  COMPLETE_BASE_MONTHLY_USD,
  FO_MONTHLY_USD,
  PM_BASE_MONTHLY_USD
} from "@mpa/shared";

describe("docs/185 does not mutate paid commercial surfaces", () => {
  it("leaves public catalog prices unchanged", () => {
    expect(PM_BASE_MONTHLY_USD).toBe(59);
    expect(FO_MONTHLY_USD).toBe(59);
    expect(COMPLETE_BASE_MONTHLY_USD).toBe(109);
  });

  it("does not write Stripe subscription IDs on complimentary assign", () => {
    const runtime = readFileSync(new URL("./runtime.ts", import.meta.url), "utf8");
    expect(runtime).toMatch(/organization_subscriptions/);
    expect(runtime).not.toMatch(/stripe_subscription_id:/);
    expect(runtime).not.toMatch(/cs_live_|price_/);
  });

  it("does not reopen July, tenant Stripe execution, or M5", () => {
    const service = readFileSync(new URL("./service.ts", import.meta.url), "utf8");
    expect(service).not.toMatch(/july|tenant stripe execution|m5/i);
    expect(service).not.toMatch(/checkout\.sessions\.create/);
  });
});
