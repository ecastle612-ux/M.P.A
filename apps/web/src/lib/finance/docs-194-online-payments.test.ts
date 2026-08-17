import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ORGANIZATION_DISABLED_ONLINE_PAYMENTS,
  assertNoStripeAccountId,
  chargeIsAutopayEligible,
  chargeIsImmutableAmount,
  connectAccountReady,
  customerSafeOnlinePayments,
  entitlementsForMember,
  publicConnectView,
  tenantOnlinePayAvailable
} from "@mpa/shared";
import { orgSkuAllowsResidentialFinance, stripePaymentExecutionEnabled } from "./checkout-authz";
import { isFinanceM5Authorized } from "./m5-hard-stop";
import { tenantConsentAccepted } from "./autopay-service";

const repoRoot = resolve(process.cwd(), "../..");
const PROPERTY_DEMO_ORG = "a11ce002-0001-4000-8000-0000000000c2";

function readRepo(path: string) {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("docs/194 customer activation certification", () => {
  it("allows PM and Complete residential SKUs and denies FO-only", () => {
    expect(orgSkuAllowsResidentialFinance("mpa_property_manager")).toBe(true);
    expect(orgSkuAllowsResidentialFinance("mpa_complete_platform")).toBe(true);
    expect(orgSkuAllowsResidentialFinance("mpa_facility_operations")).toBe(false);
    expect(
      entitlementsForMember({
        sku: "mpa_complete_platform",
        roles: ["property_manager"],
        storedScope: "property_operations"
      })
    ).toContain("pm.financial_operations");
    expect(
      entitlementsForMember({
        sku: "mpa_complete_platform",
        roles: ["property_manager"],
        storedScope: "facility_operations"
      })
    ).not.toContain("pm.financial_operations");
  });

  it("requires both execution and Connect ready on every tenant money path", () => {
    const checkout = readRepo("apps/web/src/app/api/finance/checkout/route.ts");
    const residentAutopay = readRepo("apps/web/src/app/api/finance/resident/autopay/route.ts");
    const runner = readRepo("apps/web/src/app/api/finance/autopay/run/route.ts");
    const service = readRepo("apps/web/src/lib/finance/autopay-service.ts");
    expect(checkout).toContain("gate.executionEnabled");
    expect(checkout).toContain("connectAccountReady");
    expect(checkout).toContain("connectedRequestOptions");
    expect(residentAutopay).toContain("gate.executionEnabled");
    expect(residentAutopay).toContain("connectAccountReady");
    expect(runner).toContain("stripePaymentExecutionEnabled");
    expect(runner).toContain("connectAccountReady");
    expect(service).toContain("stripe_payment_execution_disabled");
    expect(service).toContain("connectAccountReady");
    expect(
      tenantOnlinePayAvailable({
        stripePaymentExecutionEnabled: true,
        occupancyAccess: "active",
        connectReady: true
      })
    ).toBe(true);
    expect(
      tenantOnlinePayAvailable({
        stripePaymentExecutionEnabled: true,
        occupancyAccess: "active",
        connectReady: false
      })
    ).toBe(false);
    expect(stripePaymentExecutionEnabled({ stripe_payment_execution_enabled: false })).toBe(false);
  });

  it("does not expose stripe_account_id on customer Connect or Online Payments APIs", () => {
    const online = readRepo("apps/web/src/app/api/finance/online-payments/route.ts");
    const connect = readRepo("apps/web/src/app/api/finance/connect/route.ts");
    expect(online).toContain("assertNoStripeAccountId");
    expect(connect).toContain("publicConnectView");
    expect(connect).toContain("assertNoStripeAccountId");
    expect(online).not.toMatch(/return NextResponse\.json\(\{[\s\S]*account,/);
    const payload = customerSafeOnlinePayments({
      executionEnabled: true,
      connect: publicConnectView({
        stripe_account_id: "acct_secret",
        status: "ready",
        charges_enabled: true
      })
    });
    expect(assertNoStripeAccountId(payload)).toBe(true);
  });

  it("enable is explicit and Connect-not-ready is denied", () => {
    const service = readRepo("apps/web/src/lib/finance/online-payments-service.ts");
    const route = readRepo("apps/web/src/app/api/finance/online-payments/route.ts");
    expect(service).toContain("connect_not_ready");
    expect(service).toContain("writeExecutionFlag");
    expect(service).not.toContain(PROPERTY_DEMO_ORG);
    expect(route).toContain('action === "enable"');
    expect(route).toContain("connect_not_ready");
    expect(route).not.toContain("stripe_payment_execution_enabled = true");
    expect(connectAccountReady({ stripe_account_id: "acct_1", charges_enabled: false, status: "ready" })).toBe(
      false
    );
  });

  it("disable pauses AutoPay without revoking consent", () => {
    const service = readRepo("apps/web/src/lib/finance/online-payments-service.ts");
    expect(service).toContain(`paused_reason: ORGANIZATION_DISABLED_ONLINE_PAYMENTS`);
    expect(service).toContain('status: "paused"');
    expect(service).not.toMatch(/status:\s*"revoked"/);
    expect(ORGANIZATION_DISABLED_ONLINE_PAYMENTS).toBe("organization_disabled_online_payments");
    expect(readRepo("supabase/migrations/20260817220000_docs_194_online_payments_activation.sql")).toContain(
      "paused_reason"
    );
  });

  it("account.updated fail-closed resolves org by stripe_account_id", () => {
    const webhook = readRepo("apps/web/src/app/api/finance/webhooks/stripe/route.ts");
    expect(webhook).toContain("loadConnectAccountByStripeAccountId");
    expect(webhook).toContain("account.updated");
    expect(webhook).not.toMatch(/stripe_payment_execution_enabled:\s*false/);
  });

  it("keeps tenant consent, admin-enroll denial, former-tenant denial, and exclusions", () => {
    expect(
      tenantConsentAccepted(
        "I authorize M.P.A. to automatically charge the payment method I save for posted recurring rent and AutoPay-eligible recurring fees."
      )
    ).toBe(true);
    expect(tenantConsentAccepted("admin can enroll this tenant")).toBe(false);
    const autopayRoute = readRepo("apps/web/src/app/api/finance/resident/autopay/route.ts");
    expect(autopayRoute).toContain("occupyingResident");
    expect(readRepo("apps/web/src/app/api/finance/autopay/run/route.ts")).not.toContain("confirmAutopayEnrollment");
    expect(
      chargeIsAutopayEligible({
        charge_type: "one_time",
        autopay_eligible: true,
        fee_category: "deposit"
      })
    ).toBe(false);
    expect(
      chargeIsAutopayEligible({
        charge_type: "late_fee",
        autopay_eligible: true,
        fee_category: "late_fee"
      })
    ).toBe(false);
    expect(chargeIsImmutableAmount("paid")).toBe(true);
    expect(isFinanceM5Authorized()).toBe(false);
  });

  it("uses Connect destination checkout only and keeps SaaS Checkout isolated", () => {
    const checkout = readRepo("apps/web/src/app/api/finance/checkout/route.ts");
    const saasWebhook = readRepo("apps/web/src/lib/saas-stripe/webhook.ts");
    expect(checkout).toContain("connectedRequestOptions(connect.stripe_account_id");
    expect(checkout).toContain('domain: "tenant_property"');
    expect(checkout).not.toContain("STRIPE_SAAS_WEBHOOK_SECRET");
    expect(saasWebhook).toContain("STRIPE_SAAS_WEBHOOK_SECRET");
    expect(readRepo("apps/web/src/lib/finance/verify-finance-stripe-webhook.ts")).toContain(
      "Never uses STRIPE_SAAS_WEBHOOK_SECRET"
    );
    expect(readRepo("apps/web/src/lib/finance/verify-finance-stripe-webhook.ts")).not.toMatch(
      /serverEnv\.STRIPE_SAAS_WEBHOOK_SECRET/
    );
  });

  it("does not flip Property Demo or any org execution from this package", () => {
    const migration = readRepo("supabase/migrations/20260817220000_docs_194_online_payments_activation.sql");
    expect(migration).not.toMatch(/stripe_payment_execution_enabled\s*=/);
    expect(migration).not.toMatch(/update\s+public\.financial_module_settings/i);
    expect(migration).not.toContain(PROPERTY_DEMO_ORG);
    expect(readRepo("apps/web/src/lib/finance/online-payments-service.ts")).toContain(
      ".eq(\"organization_id\", organizationId)"
    );
  });

  it("ships truthful public copy without ACH, M5, or admin-enrolled AutoPay", () => {
    const landing = readRepo("apps/web/src/components/marketing/public-landing-page.tsx");
    const legal = readRepo("apps/web/src/lib/legal/public-legal-copy.ts");
    const pricing = readRepo("packages/shared/src/commercial/pricing-display.ts");
    expect(landing).toContain("Take rent online with Stripe");
    expect(landing).toContain("authorize AutoPay");
    expect(landing).not.toMatch(/admin can enroll/i);
    expect(landing).toContain("It does not include automated late fees, automated collections, instant bank settlement");
    expect(legal).toContain("enables Online Payments");
    expect(legal).toContain("does not automatically assess late fees or run collections");
    expect(pricing).toContain("Take rent online with Stripe");
    expect(pricing).toContain("foIncludes: `Up to ${UNIT_BLOCK_SIZE} managed units`");
    expect(readRepo("apps/web/src/components/finance/finance-desk.tsx")).not.toMatch(/Collect rent/);
    expect(readRepo("apps/web/src/components/finance/online-payments-settings.tsx")).toContain(
      "Enable Online Payments"
    );
  });
});
