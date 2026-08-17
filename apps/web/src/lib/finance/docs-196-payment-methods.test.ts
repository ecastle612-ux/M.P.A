import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ORGANIZATION_DISABLED_ACCEPTED_PAYMENT_METHOD,
  assertAcceptedMethodsWhileActive,
  offeredTenantPaymentMethods,
  paymentMethodOfferedForOrganization,
  tenantPayOnceLabel
} from "@mpa/shared";
import { tenantConsentAccepted } from "./autopay-service";
import { isFinanceM5Authorized } from "./m5-hard-stop";
import {
  resolveCheckoutFailure,
  resolveCheckoutSessionLifecycle,
  resolvePaymentIntentSucceeded
} from "./finops-stripe-webhook";

const repoRoot = resolve(process.cwd(), "../..");

function readRepo(path: string) {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

const pending = {
  id: "pay_1",
  organization_id: "org_1",
  lease_id: "lease_1",
  amount: 100,
  status: "pending",
  stripe_checkout_session_id: "cs_1"
};

describe("docs/196 payment-method amendment", () => {
  it("supports ACH only, cards only, and both", () => {
    const supported = { achSupported: true, cardSupported: true };
    expect(offeredTenantPaymentMethods({ achEnabled: true, cardEnabled: false }, supported)).toEqual([
      "us_bank_account"
    ]);
    expect(offeredTenantPaymentMethods({ achEnabled: false, cardEnabled: true }, supported)).toEqual([
      "card"
    ]);
    expect(offeredTenantPaymentMethods({ achEnabled: true, cardEnabled: true }, supported)).toEqual([
      "card",
      "us_bank_account"
    ]);
    expect(tenantPayOnceLabel(["us_bank_account"])).toBe("Pay from Bank Account");
    expect(tenantPayOnceLabel(["card"])).toBe("Pay by Card");
  });

  it("cannot disable the final offered method while Online Payments is active", () => {
    expect(
      assertAcceptedMethodsWhileActive({
        executionEnabled: true,
        accepted: { achEnabled: false, cardEnabled: false },
        supported: { achSupported: true, cardSupported: true }
      }).ok
    ).toBe(false);
    expect(readRepo("apps/web/src/app/api/finance/online-payments/route.ts")).toContain(
      "update_methods"
    );
    expect(readRepo("apps/web/src/lib/finance/online-payments-service.ts")).toContain(
      "accepted_payment_method_required"
    );
  });

  it("rejects a disabled payment method server-side", () => {
    expect(
      paymentMethodOfferedForOrganization({
        paymentMethodType: "card",
        accepted: { achEnabled: true, cardEnabled: false },
        supported: { achSupported: true, cardSupported: true }
      })
    ).toBe(false);
    expect(
      paymentMethodOfferedForOrganization({
        paymentMethodType: "us_bank_account",
        accepted: { achEnabled: false, cardEnabled: true },
        supported: { achSupported: true, cardSupported: true }
      })
    ).toBe(false);
    const checkout = readRepo("apps/web/src/app/api/finance/checkout/route.ts");
    const autopay = readRepo("apps/web/src/lib/finance/autopay-service.ts");
    expect(checkout).toContain("acceptedPaymentMethodDeniedResponse");
    expect(checkout).toContain("stripeHostedPaymentMethodConfig");
    expect(autopay).toContain("accepted_payment_method_disabled");
    expect(readRepo("packages/shared/src/finance/accepted-payment-methods.ts")).toContain(
      "payment_method_types"
    );
  });

  it("keeps ACH Pay Once in processing until success or failure", () => {
    expect(
      resolveCheckoutSessionLifecycle({
        payment: pending,
        organizationId: "org_1",
        leaseId: "lease_1",
        checkoutSessionId: "cs_1",
        amountTotalCents: 10000,
        paymentStatus: "unpaid"
      })
    ).toEqual({ action: "mark_processing", paymentId: "pay_1" });
    expect(
      resolvePaymentIntentSucceeded({
        payment: { ...pending, status: "processing" },
        organizationId: "org_1",
        leaseId: "lease_1",
        amountTotalCents: 10000
      })
    ).toEqual({ action: "apply", paymentId: "pay_1", amount: 100 });
    expect(
      resolveCheckoutFailure({
        paymentId: "pay_1",
        organizationId: "org_1",
        payment: { ...pending, status: "processing" }
      })
    ).toEqual({ action: "mark_failed", paymentId: "pay_1" });
    expect(
      resolveCheckoutFailure({
        paymentId: "pay_1",
        organizationId: "org_1",
        payment: { ...pending, status: "succeeded" }
      }).action
    ).toBe("ignore");
    const webhook = readRepo("apps/web/src/app/api/finance/webhooks/stripe/route.ts");
    expect(webhook).toContain("payment_intent.processing");
    expect(webhook).toContain("charge.failed");
    expect(webhook).toContain("insufficient_funds");
    expect(webhook).toContain("invalid_or_closed_account");
    expect(webhook).toContain("duplicate");
    expect(readRepo("apps/web/src/lib/finance/billing-service.ts")).toContain("entry_type: \"refund\"");
  });

  it("requires ACH AutoPay consent and pauses instead of substituting methods", () => {
    expect(
      tenantConsentAccepted(
        "I authorize M.P.A. to automatically debit the US bank account I save using ACH for posted recurring rent and AutoPay-eligible recurring fees.",
        "us_bank_account"
      )
    ).toBe(true);
    expect(
      tenantConsentAccepted(
        "I authorize M.P.A. to automatically charge the payment method I save for posted recurring rent and AutoPay-eligible recurring fees.",
        "us_bank_account"
      )
    ).toBe(false);
    expect(
      tenantConsentAccepted(
        "I authorize M.P.A. to automatically charge the payment method I save for posted recurring rent and AutoPay-eligible recurring fees.",
        "card"
      )
    ).toBe(true);
    const service = readRepo("apps/web/src/lib/finance/online-payments-service.ts");
    const autopay = readRepo("apps/web/src/lib/finance/autopay-service.ts");
    expect(service).toContain("ORGANIZATION_DISABLED_ACCEPTED_PAYMENT_METHOD");
    expect(service).toContain("noSilentSubstitution");
    expect(autopay).toContain("off_session: true");
    expect(autopay).toContain("pauseAutopayForDisabledMethod");
    expect(ORGANIZATION_DISABLED_ACCEPTED_PAYMENT_METHOD).toBe(
      "organization_disabled_accepted_payment_method"
    );
  });

  it("preserves card Pay Once and card AutoPay on the connected account", () => {
    expect(
      resolveCheckoutSessionLifecycle({
        payment: pending,
        organizationId: "org_1",
        leaseId: "lease_1",
        checkoutSessionId: "cs_1",
        amountTotalCents: 10000,
        paymentStatus: "paid"
      })
    ).toEqual({ action: "apply", paymentId: "pay_1", amount: 100 });
    const checkout = readRepo("apps/web/src/app/api/finance/checkout/route.ts");
    const autopay = readRepo("apps/web/src/lib/finance/autopay-service.ts");
    expect(checkout).toContain("connectedRequestOptions(connect.stripe_account_id");
    expect(checkout).toContain("stripeHostedPaymentMethodConfig");
    expect(autopay).toContain("intent.status === \"succeeded\"");
    expect(autopay).toContain("intent.status === \"processing\"");
  });

  it("keeps former-tenant, FO, Complete facility, Connect, and execution denials", () => {
    const checkout = readRepo("apps/web/src/app/api/finance/checkout/route.ts");
    const resident = readRepo("apps/web/src/app/api/finance/resident/autopay/route.ts");
    expect(checkout).toContain("occupancyIsCurrent");
    expect(checkout).toContain("orgSkuAllowsResidentialFinance");
    expect(checkout).toContain("connectAccountReady");
    expect(checkout).toContain("gate.executionEnabled");
    expect(resident).toContain("occupyingResident");
    expect(resident).toContain("acceptedPaymentMethodDeniedResponse");
  });

  it("does not store raw bank numbers or create another Connect account", () => {
    const checkout = readRepo("apps/web/src/app/api/finance/checkout/route.ts");
    const connect = readRepo("apps/web/src/lib/finance/connect-service.ts");
    expect(checkout).not.toMatch(/routing[_-]?number/i);
    expect(checkout).not.toMatch(/account_number/);
    expect(connect).toContain("us_bank_account_ach_payments");
    expect(connect).toContain("accounts.update");
    expect(connect).toContain("type: \"express\"");
  });

  it("keeps SaaS isolation, M5 off, and July unchanged", () => {
    expect(isFinanceM5Authorized()).toBe(false);
    expect(readRepo("apps/web/src/lib/finance/verify-finance-stripe-webhook.ts")).toContain(
      "Never uses STRIPE_SAAS_WEBHOOK_SECRET"
    );
    expect(readRepo("apps/web/src/app/api/finance/checkout/route.ts")).not.toContain(
      "STRIPE_SAAS_WEBHOOK_SECRET"
    );
    expect(readRepo("apps/web/src/lib/finance/m5-hard-stop.ts")).toContain("finance_m5_not_authorized");
    const webhook = readRepo("apps/web/src/app/api/finance/webhooks/stripe/route.ts");
    expect(webhook).not.toMatch(/late_fee/);
    expect(readRepo("apps/web/src/lib/finance/billing-service.ts")).not.toMatch(
      /assessLateFee|createLateFee/
    );
  });

  it("amends public copy for subscriber method choice without overclaiming", () => {
    const landing = readRepo("apps/web/src/components/marketing/public-landing-page.tsx");
    const legal = readRepo("apps/web/src/lib/legal/public-legal-copy.ts");
    expect(landing).toContain("Choose bank payments, cards, or both");
    expect(landing).not.toMatch(/free processing/i);
    expect(landing).not.toMatch(/instant ACH/i);
    expect(landing).not.toMatch(/admin can enroll/i);
    expect(legal).toContain("bank payments, cards, or both");
    expect(readRepo("apps/web/src/components/finance/online-payments-settings.tsx")).toContain(
      "Accepted tenant payment methods"
    );
    expect(readRepo("apps/web/src/components/finance/resident-billing-portal.tsx")).toContain(
      "Pay from Bank Account"
    );
  });
});
