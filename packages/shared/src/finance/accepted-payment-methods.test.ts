import { describe, expect, it } from "vitest";
import { AUTOPAY_CONSENT_VERSION } from "./tenant-payments";
import {
  AUTOPAY_ACH_CONSENT_TEXT,
  AUTOPAY_ACH_CONSENT_VERSION,
  ORGANIZATION_DISABLED_ACCEPTED_PAYMENT_METHOD,
  assertAcceptedMethodsWhileActive,
  canResumeAutopayAfterMethodDisable,
  connectPaymentCapabilities,
  enrollmentPaymentMethodType,
  normalizeAcceptedTenantPaymentMethods,
  offeredTenantPaymentMethods,
  paymentMethodOfferedForOrganization,
  tenantPayOnceLabel
} from "./accepted-payment-methods";

describe("docs/196 accepted tenant payment methods", () => {
  it("supports ACH only, cards only, and both", () => {
    const supported = { achSupported: true, cardSupported: true };
    expect(
      offeredTenantPaymentMethods({ achEnabled: true, cardEnabled: false }, supported)
    ).toEqual(["us_bank_account"]);
    expect(
      offeredTenantPaymentMethods({ achEnabled: false, cardEnabled: true }, supported)
    ).toEqual(["card"]);
    expect(
      offeredTenantPaymentMethods({ achEnabled: true, cardEnabled: true }, supported)
    ).toEqual(["card", "us_bank_account"]);
  });

  it("rejects both disabled while Online Payments is active", () => {
    expect(
      assertAcceptedMethodsWhileActive({
        executionEnabled: true,
        accepted: { achEnabled: false, cardEnabled: false },
        supported: { achSupported: true, cardSupported: true }
      })
    ).toEqual({ ok: false, error: "accepted_payment_method_required" });
    expect(
      assertAcceptedMethodsWhileActive({
        executionEnabled: false,
        accepted: { achEnabled: false, cardEnabled: false },
        supported: { achSupported: true, cardSupported: true }
      }).ok
    ).toBe(true);
  });

  it("does not treat an unsupported method as the remaining enabled method", () => {
    expect(
      assertAcceptedMethodsWhileActive({
        executionEnabled: true,
        accepted: { achEnabled: true, cardEnabled: false },
        supported: { achSupported: false, cardSupported: true }
      }).ok
    ).toBe(false);
  });

  it("defaults missing settings to both enabled and requires ACH capability for bank payments", () => {
    expect(normalizeAcceptedTenantPaymentMethods(null)).toEqual({
      achEnabled: true,
      cardEnabled: true
    });
    expect(
      connectPaymentCapabilities({
        charges_enabled: true,
        status: "ready"
      })
    ).toEqual({ cardSupported: true, achSupported: false });
    expect(
      connectPaymentCapabilities({
        charges_enabled: true,
        status: "ready",
        metadata: { capabilities: { us_bank_account_ach_payments: "active", card_payments: "active" } }
      }).achSupported
    ).toBe(true);
  });

  it("labels tenant Pay Once from offered methods only", () => {
    expect(tenantPayOnceLabel(["us_bank_account"])).toBe("Pay from Bank Account");
    expect(tenantPayOnceLabel(["card"])).toBe("Pay by Card");
    expect(tenantPayOnceLabel(["card", "us_bank_account"])).toBe("Pay once");
  });

  it("treats historical enrollments without a type as card and never silently substitutes", () => {
    expect(enrollmentPaymentMethodType(null)).toBe("card");
    expect(
      paymentMethodOfferedForOrganization({
        paymentMethodType: "us_bank_account",
        accepted: { achEnabled: false, cardEnabled: true },
        supported: { achSupported: true, cardSupported: true }
      })
    ).toBe(false);
    expect(
      canResumeAutopayAfterMethodDisable({
        status: "paused",
        pausedReason: ORGANIZATION_DISABLED_ACCEPTED_PAYMENT_METHOD,
        consentVersion: AUTOPAY_ACH_CONSENT_VERSION,
        paymentMethodType: "us_bank_account",
        occupancyCurrent: true,
        hasPaymentMethod: true,
        connectReady: true,
        executionEnabled: true,
        methodOffered: true
      })
    ).toBe(true);
    expect(
      canResumeAutopayAfterMethodDisable({
        status: "paused",
        pausedReason: ORGANIZATION_DISABLED_ACCEPTED_PAYMENT_METHOD,
        consentVersion: AUTOPAY_CONSENT_VERSION,
        paymentMethodType: "us_bank_account",
        occupancyCurrent: true,
        hasPaymentMethod: true,
        connectReady: true,
        executionEnabled: true,
        methodOffered: true
      })
    ).toBe(false);
    expect(AUTOPAY_ACH_CONSENT_TEXT).toMatch(/ACH/);
    expect(AUTOPAY_ACH_CONSENT_TEXT).not.toMatch(/admin can enroll/i);
  });
});
