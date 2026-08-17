import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { isFinanceM5Authorized } from "../finance/m5-hard-stop";

const webRoot = join(process.cwd(), "src");

function read(rel: string): string {
  return readFileSync(join(webRoot, rel), "utf8");
}

describe("P1-01 tenant Pay once presentation", () => {
  it("hides Pay once unless occupancy, Connect, and org execution all allow it", () => {
    const portal = read("components/finance/resident-billing-portal.tsx");
    expect(portal).toMatch(/account\.canPay !== false/);
    expect(portal).toMatch(/account\.onlinePaymentsEnabled \?\? onlinePaymentsEnabled/);
    expect(portal).toMatch(/Online payment is not available here/);
    expect(portal).not.toMatch(/isn.t configured yet/);
    expect(portal).not.toMatch(/isStripeConfigured/);
  });

  it("does not derive tenant Pay once from STRIPE_SECRET_KEY", () => {
    const route = read("app/api/finance/resident/billing/route.ts");
    expect(route).not.toMatch(/isStripeConfigured/);
    expect(route).toMatch(/stripePaymentExecutionEnabled/);
    expect(route).toMatch(/residentOnlinePayAvailable/);
    expect(route).toMatch(/onlinePaymentsEnabled: false/);
  });
});

describe("P1-02 staff finance terminology", () => {
  it("has no customer-facing Collect rent on affected surfaces", () => {
    const files = [
      "components/finance/financial-operations-command-center.tsx",
      "components/finance/finance-desk.tsx",
      "components/leasing/lease-command-center.tsx"
    ];
    for (const file of files) {
      const source = read(file);
      expect(source).not.toMatch(/Collect rent/);
      expect(source).not.toMatch(/Collect your first rent/);
    }
    expect(read("components/finance/financial-operations-command-center.tsx")).toMatch(
      /Record payment/
    );
    expect(read("components/finance/finance-desk.tsx")).not.toMatch(/Billing → Pay now/);
    expect(read("components/finance/finance-desk.tsx")).toMatch(/Record manual payment/);
  });
});

describe("P1-03 Collections while M5 unauthorized", () => {
  it("keeps M5 unauthorized and hides mutation controls", () => {
    expect(isFinanceM5Authorized()).toBe(false);
    const desk = read("components/finance/collections-desk.tsx");
    expect(desk).toMatch(/isFinanceM5Authorized/);
    expect(desk).toMatch(/m5Authorized \?/);
    expect(desk).toMatch(/Automated collections actions are not available/);
    expect(desk).toMatch(/kind: "assess_late_fees"/);
    expect(desk).toMatch(/kind: "sync_delinquency"/);
  });
});

describe("P1-04 SaaS claim UX", () => {
  it("tells the purchaser to check email after successful checkout", () => {
    const success = read("components/marketing/checkout-success-page.tsx");
    expect(success).toMatch(/Check your email to finish setting up your M\.P\.A\. account/);
    expect(success).not.toMatch(/Continue to claim workspace/);
    expect(success).not.toMatch(/bind_token=/);
  });

  it("does not put a bind token on an insecure continue CTA", () => {
    const continuePage = read("components/marketing/commerce-continue-page.tsx");
    expect(continuePage).toMatch(/Check your email to finish setting up your M\.P\.A\. account/);
    expect(continuePage).toMatch(/hasBindToken/);
    expect(read("components/shell/login-form.tsx")).toMatch(
      /friendlyCommerceClaimError/
    );
  });
});

describe("P1-07 billing honesty", () => {
  it("does not claim unsupported Customer Portal or plan-change behavior", () => {
    const billing = read("components/commercial/billing-plan-page.tsx");
    const cancel = read("components/marketing/checkout-cancel-page.tsx");
    expect(billing).toMatch(/not self-service/);
    expect(billing).toMatch(/contact support if you need a plan change/i);
    expect(billing).not.toMatch(/Customer Portal/i);
    expect(billing).not.toMatch(/manage payment method/i);
    expect(cancel).not.toMatch(/Duplicate subscriptions are prevented/);
    expect(cancel).not.toMatch(/Customer Portal/i);
  });
});
