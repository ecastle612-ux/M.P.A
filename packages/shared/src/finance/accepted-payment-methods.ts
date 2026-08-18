import { AUTOPAY_CONSENT_VERSION } from "./tenant-payments";

export const TENANT_PAYMENT_METHOD_TYPES = ["card", "us_bank_account"] as const;
export type TenantPaymentMethodType = (typeof TENANT_PAYMENT_METHOD_TYPES)[number];

export const ORGANIZATION_DISABLED_ACCEPTED_PAYMENT_METHOD =
  "organization_disabled_accepted_payment_method" as const;

export const AUTOPAY_ACH_CONSENT_VERSION = "docs-196-ach-v1";

export const AUTOPAY_ACH_CONSENT_TEXT =
  "I authorize M.P.A. to automatically debit the US bank account I save using ACH for posted recurring rent and any recurring fees my property marked AutoPay-eligible. One-time charges such as deposits, damage, and ad-hoc fees are not included unless I later consent to those categories. I can turn AutoPay off at any time. Setting rent on my lease does not enroll me.";

export type AcceptedTenantPaymentMethods = {
  achEnabled: boolean;
  cardEnabled: boolean;
};

export type SupportedTenantPaymentMethods = {
  achSupported: boolean;
  cardSupported: boolean;
};

export function isTenantPaymentMethodType(value: unknown): value is TenantPaymentMethodType {
  return value === "card" || value === "us_bank_account";
}

export function parseTenantPaymentMethodType(value: unknown): TenantPaymentMethodType | null {
  return isTenantPaymentMethodType(value) ? value : null;
}

export function normalizeAcceptedTenantPaymentMethods(settings?: {
  tenant_ach_payments_enabled?: boolean | null;
  tenant_card_payments_enabled?: boolean | null;
} | null): AcceptedTenantPaymentMethods {
  return {
    achEnabled: settings?.tenant_ach_payments_enabled !== false,
    cardEnabled: settings?.tenant_card_payments_enabled !== false
  };
}

export function connectPaymentCapabilities(account?: {
  charges_enabled?: boolean | null;
  status?: string | null;
  metadata?: {
    capabilities?: {
      card_payments?: string | null;
      us_bank_account_ach_payments?: string | null;
    } | null;
  } | null;
} | null): SupportedTenantPaymentMethods {
  const cardCapability = account?.metadata?.capabilities?.card_payments;
  const achCapability = account?.metadata?.capabilities?.us_bank_account_ach_payments;
  return {
    cardSupported:
      cardCapability === "active" ||
      (account?.charges_enabled === true && account?.status === "ready"),
    achSupported: achCapability === "active"
  };
}

export function offeredTenantPaymentMethods(
  accepted: AcceptedTenantPaymentMethods,
  supported: SupportedTenantPaymentMethods
): TenantPaymentMethodType[] {
  const offered: TenantPaymentMethodType[] = [];
  if (accepted.cardEnabled && supported.cardSupported) {
    offered.push("card");
  }
  if (accepted.achEnabled && supported.achSupported) {
    offered.push("us_bank_account");
  }
  return offered;
}

export function paymentMethodOfferedForOrganization(input: {
  paymentMethodType: TenantPaymentMethodType;
  accepted: AcceptedTenantPaymentMethods;
  supported: SupportedTenantPaymentMethods;
}): boolean {
  return offeredTenantPaymentMethods(input.accepted, input.supported).includes(input.paymentMethodType);
}

export function assertAcceptedMethodsWhileActive(input: {
  executionEnabled: boolean;
  accepted: AcceptedTenantPaymentMethods;
  supported: SupportedTenantPaymentMethods;
}): { ok: true; offered: TenantPaymentMethodType[] } | { ok: false; error: string } {
  const offered = offeredTenantPaymentMethods(input.accepted, input.supported);
  if (input.executionEnabled && offered.length === 0) {
    return { ok: false, error: "accepted_payment_method_required" };
  }
  return { ok: true, offered };
}

export function enrollmentPaymentMethodType(enrollment?: {
  payment_method_type?: string | null;
} | null): TenantPaymentMethodType {
  return parseTenantPaymentMethodType(enrollment?.payment_method_type) ?? "card";
}

export function tenantPayOnceLabel(offered: TenantPaymentMethodType[]): string {
  const ach = offered.includes("us_bank_account");
  const card = offered.includes("card");
  if (ach && !card) {
    return "Pay from Bank Account";
  }
  if (card && !ach) {
    return "Pay by Card";
  }
  return "Pay once";
}

export function tenantPaymentMethodChoiceLabel(type: TenantPaymentMethodType): string {
  return type === "us_bank_account" ? "Bank Account" : "Card";
}

export function autopayConsentForMethod(type: TenantPaymentMethodType): {
  text: string;
  version: string;
} {
  if (type === "us_bank_account") {
    return { text: AUTOPAY_ACH_CONSENT_TEXT, version: AUTOPAY_ACH_CONSENT_VERSION };
  }
  return {
    text:
      "I authorize M.P.A. to automatically charge the payment method I save for posted recurring rent and any recurring fees my property marked AutoPay-eligible. One-time charges such as deposits, damage, and ad-hoc fees are not included unless I later consent to those categories. I can turn AutoPay off at any time. Setting rent on my lease does not enroll me.",
    version: AUTOPAY_CONSENT_VERSION
  };
}

export function canResumeAutopayAfterMethodDisable(input: {
  status?: string | null;
  pausedReason?: string | null;
  consentVersion?: string | null;
  paymentMethodType?: string | null;
  occupancyCurrent: boolean;
  hasPaymentMethod: boolean;
  connectReady: boolean;
  executionEnabled: boolean;
  methodOffered: boolean;
}): boolean {
  const type = enrollmentPaymentMethodType({
    payment_method_type: input.paymentMethodType ?? null
  });
  const expectedVersion = autopayConsentForMethod(type).version;
  return (
    input.status === "paused" &&
    input.pausedReason === ORGANIZATION_DISABLED_ACCEPTED_PAYMENT_METHOD &&
    input.consentVersion === expectedVersion &&
    input.occupancyCurrent === true &&
    input.hasPaymentMethod === true &&
    input.connectReady === true &&
    input.executionEnabled === true &&
    input.methodOffered === true
  );
}

export function stripeHostedPaymentMethodConfig(type: TenantPaymentMethodType): {
  payment_method_types: Array<"card" | "us_bank_account">;
  payment_method_options?: {
    us_bank_account: {
      financial_connections: { permissions: Array<"payment_method"> };
      verification_method: "automatic";
    };
  };
} {
  if (type === "us_bank_account") {
    return {
      payment_method_types: ["us_bank_account"],
      payment_method_options: {
        us_bank_account: {
          financial_connections: { permissions: ["payment_method"] },
          verification_method: "automatic"
        }
      }
    };
  }
  return {
    payment_method_types: ["card"]
  };
}
