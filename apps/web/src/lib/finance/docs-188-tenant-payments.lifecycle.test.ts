import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  AUTOPAY_CONSENT_TEXT,
  chargeIsAutopayEligible,
  chargeIsImmutableAmount,
  connectAccountReady,
  entitlementsForMember,
  nextSchedulePeriod,
  refundReopenPaid,
  resolveCheckoutAmount,
  tenantOnlinePayAvailable
} from "@mpa/shared";
import { tenantConsentAccepted } from "./autopay-service";
import { orgSkuAllowsResidentialFinance } from "./checkout-authz";
import { isFinanceM5Authorized, isFinanceM5CollectionKind } from "./m5-hard-stop";
import {
  resolveCheckoutFailure,
  resolveCheckoutSessionCompleted,
  resolvePaymentIntentSucceeded
} from "./finops-stripe-webhook";

const repoRoot = resolve(process.cwd(), "../..");

function readRepo(path: string) {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("docs/188 payment lifecycle rules", () => {
  it("Pay Once success applies only a pending row", () => {
    const pending = {
      id: "pay_1",
      organization_id: "org_1",
      lease_id: "lease_1",
      amount: 100,
      status: "pending",
      stripe_checkout_session_id: "cs_1"
    };
    expect(
      resolveCheckoutSessionCompleted({
        payment: pending,
        organizationId: "org_1",
        leaseId: "lease_1",
        checkoutSessionId: "cs_1",
        amountTotalCents: 10000
      })
    ).toEqual({ action: "apply", paymentId: "pay_1", amount: 100 });
  });

  it("decline / cancel marks pending failed and does not apply", () => {
    const pending = {
      id: "pay_1",
      organization_id: "org_1",
      lease_id: "lease_1",
      amount: 100,
      status: "pending"
    };
    expect(
      resolveCheckoutFailure({
        paymentId: "pay_1",
        organizationId: "org_1",
        payment: pending
      })
    ).toEqual({ action: "mark_failed", paymentId: "pay_1" });
    expect(
      resolveCheckoutSessionCompleted({
        payment: { ...pending, status: "failed", stripe_checkout_session_id: "cs_1" },
        organizationId: "org_1",
        leaseId: "lease_1",
        checkoutSessionId: "cs_1",
        amountTotalCents: 10000
      }).action
    ).toBe("refuse");
  });

  it("duplicate webhook is already_succeeded", () => {
    expect(
      resolveCheckoutSessionCompleted({
        payment: {
          id: "pay_1",
          organization_id: "org_1",
          lease_id: "lease_1",
          amount: 100,
          status: "succeeded",
          stripe_checkout_session_id: "cs_1"
        },
        organizationId: "org_1",
        leaseId: "lease_1",
        checkoutSessionId: "cs_1",
        amountTotalCents: 10000
      })
    ).toEqual({ action: "already_succeeded", paymentId: "pay_1" });
  });

  it("partial payment is allowed and overpay is refused", () => {
    expect(resolveCheckoutAmount({ remaining: 250, requestedAmount: 40 })).toEqual({
      ok: true,
      amount: 40
    });
    expect(resolveCheckoutAmount({ remaining: 250, requestedAmount: 251 }).ok).toBe(false);
  });

  it("former tenant, FO, and incomplete Connect cannot pay online", () => {
    expect(
      tenantOnlinePayAvailable({
        stripePaymentExecutionEnabled: true,
        occupancyAccess: "historical",
        connectReady: true
      })
    ).toBe(false);
    expect(connectAccountReady({ stripe_account_id: "acct", charges_enabled: false, status: "pending" })).toBe(
      false
    );
  });

  it("AutoPay consent is required and admin-set rent is not consent", () => {
    expect(tenantConsentAccepted(AUTOPAY_CONSENT_TEXT)).toBe(true);
    expect(tenantConsentAccepted("Admin set rent to $1500")).toBe(false);
    expect(tenantConsentAccepted("admin can enroll this tenant")).toBe(false);
  });

  it("AutoPay excludes one-time non-eligible fees", () => {
    expect(
      chargeIsAutopayEligible({
        charge_type: "one_time",
        autopay_eligible: true,
        fee_category: "damage"
      })
    ).toBe(false);
    expect(
      chargeIsAutopayEligible({ charge_type: "rent", autopay_eligible: true, schedule_id: "s" })
    ).toBe(true);
  });

  it("historical charge amounts stay immutable", () => {
    expect(chargeIsImmutableAmount("paid")).toBe(true);
    expect(chargeIsImmutableAmount("partially_paid")).toBe(true);
  });

  it("M5 remains hard-stopped", () => {
    expect(isFinanceM5Authorized()).toBe(false);
    expect(isFinanceM5CollectionKind("assess_late_fees")).toBe(true);
    expect(isFinanceM5CollectionKind("policy")).toBe(true);
  });

  it("keeps SaaS and tenant Stripe domains separate", () => {
    const finance = readRepo("apps/web/src/app/api/finance/webhooks/stripe/route.ts");
    const saas = readRepo("apps/web/src/app/api/commerce/webhooks/stripe/route.ts");
    const checkout = readRepo("apps/web/src/app/api/finance/checkout/route.ts");
    expect(finance).toContain("STRIPE_WEBHOOK_SECRET");
    expect(finance).not.toContain("handleSaasStripeEvent");
    expect(saas).toContain("handleSaasStripeEvent");
    expect(saas).not.toContain("applySucceededPayment");
    expect(checkout).toContain("connectedRequestOptions");
    expect(checkout).toContain("connectUnavailableResponse");
    expect(readRepo("apps/web/src/lib/finance/connect-service.ts")).toContain("stripe_connect_not_ready");
    expect(checkout).not.toMatch(/price_.*pm_base/i);
    expect(checkout).toContain("price_data");
  });

  it("does not write July tables or use Stripe Subscriptions for rent", () => {
    const checkout = readRepo("apps/web/src/app/api/finance/checkout/route.ts");
    const autopay = readRepo("apps/web/src/lib/finance/autopay-service.ts");
    expect(checkout).not.toMatch(/\.from\(["']payments["']\)/);
    expect(checkout).not.toMatch(/\.from\(["']autopay_enrollments["']\)/);
    expect(autopay).toContain("financial_autopay_enrollments");
    expect(autopay).not.toContain("subscriptions.create");
    expect(readRepo("supabase/migrations/20260817193000_docs_188_tenant_stripe_rent_collection.sql")).toContain(
      "Do not apply to Production from this package"
    );
    expect(readRepo("supabase/migrations/20260817193000_docs_188_tenant_stripe_rent_collection.sql")).not.toMatch(
      /stripe_payment_execution_enabled\s*=/
    );
  });

  it("AutoPay off-session uses pending payments and PaymentIntents", () => {
    const autopay = readRepo("apps/web/src/lib/finance/autopay-service.ts");
    expect(autopay).toContain("off_session");
    expect(autopay).toContain("paymentIntents.create");
    expect(autopay).toContain("autopay_disabled");
    expect(autopay).toContain("autopay_declined");
    expect(autopay).toContain("mode: \"setup\"");
    expect(autopay).toContain("checkout.sessions.create");
    expect(autopay).toContain("autopay_occupancy_revoked");
    expect(
      resolvePaymentIntentSucceeded({
        payment: {
          id: "pay_ap",
          organization_id: "org_1",
          lease_id: "lease_1",
          amount: 80,
          status: "pending"
        },
        organizationId: "org_1",
        leaseId: "lease_1",
        amountTotalCents: 8000
      }).action
    ).toBe("apply");
  });

  it("reuses an open Checkout session instead of creating a duplicate pending payment", () => {
    const checkout = readRepo("apps/web/src/app/api/finance/checkout/route.ts");
    expect(checkout).toContain("existingPending");
    expect(checkout).toContain("reused: true");
    expect(checkout).toContain("`checkout:${payment.id}`");
  });

  it("denies FO-only and Complete facility-only rent collection", () => {
    expect(orgSkuAllowsResidentialFinance("mpa_facility_operations")).toBe(false);
    expect(orgSkuAllowsResidentialFinance("mpa_property_manager")).toBe(true);
    expect(orgSkuAllowsResidentialFinance("mpa_complete_platform")).toBe(true);
    expect(
      entitlementsForMember({
        sku: "mpa_complete_platform",
        roles: ["property_manager"],
        storedScope: "facility_operations"
      })
    ).not.toContain("pm.financial_operations");
    const connect = readRepo("apps/web/src/app/api/finance/connect/route.ts");
    const checkout = readRepo("apps/web/src/app/api/finance/checkout/route.ts");
    const autopay = readRepo("apps/web/src/app/api/finance/resident/autopay/route.ts");
    expect(connect).toContain("orgSkuAllowsResidentialFinance");
    expect(checkout).toContain("orgSkuAllowsResidentialFinance");
    expect(autopay).toContain("orgSkuAllowsResidentialFinance");
    expect(readRepo("apps/web/src/app/api/finance/checkout/checkout.route.test.ts")).toContain(
      "denies Mike before createServiceRoleClient"
    );
  });

  it("posts recurring schedules idempotently and does not rewrite historical charges", () => {
    const first = nextSchedulePeriod("2026-09-01", 1);
    const second = nextSchedulePeriod(first.followingRunOn, 1);
    expect(first.periodStart).toBe("2026-09-01");
    expect(second.periodStart).toBe("2026-10-01");
    const billing = readRepo("apps/web/src/lib/finance/billing-service.ts");
    expect(billing).toContain("charge_amount_immutable");
    expect(billing).toContain("historicalChargesUnchanged");
    expect(readRepo("supabase/migrations/20260817193000_docs_188_tenant_stripe_rent_collection.sql")).toContain(
      "financial_charges_schedule_period_uidx"
    );
    expect(billing).toContain("period_start");
    expect(billing).toMatch(/if \(!existing\)/);
  });

  it("records refunds and lost disputes as reversing ledger entries", () => {
    expect(refundReopenPaid({ amount: 250, amount_paid: 250 }, 50)).toEqual({
      amount_paid: 200,
      status: "partially_paid"
    });
    const billing = readRepo("apps/web/src/lib/finance/billing-service.ts");
    expect(billing).toContain("entry_type: \"refund\"");
    expect(billing).toContain("applyPaymentRefund");
    expect(billing).toContain("recordPaymentDispute");
    expect(billing).not.toMatch(/charge\.amount\s*=\s*refund/);
    const webhook = readRepo("apps/web/src/app/api/finance/webhooks/stripe/route.ts");
    expect(webhook).toContain("charge.refunded");
    expect(webhook).toContain("charge.dispute.created");
    expect(webhook).toContain("session.mode === \"setup\"");
  });

  it("admin cannot enroll AutoPay and turning it off preserves balances", () => {
    const autopayRoute = readRepo("apps/web/src/app/api/finance/resident/autopay/route.ts");
    const runRoute = readRepo("apps/web/src/app/api/finance/autopay/run/route.ts");
    expect(autopayRoute).toContain("occupyingResident");
    expect(autopayRoute).toContain("balancesPreserved: true");
    expect(runRoute).not.toContain("startAutopaySetup");
    expect(runRoute).not.toContain("confirmAutopayEnrollment");
    expect(runRoute).toContain("runAutopayForLease");
  });
});
