import { NextResponse } from "next/server";
import {
  entitlementsForSku,
  hasEntitlement,
  isProductSku,
  type ProductSku
} from "@mpa/shared";
import { requireFinancePermission, type FinanceAuthz } from "./authz";

export type FinanceCheckoutActor =
  | { kind: "resident"; residentId: string }
  | { kind: "staff"; authz: FinanceAuthz };

/**
 * Staff checkout uses member-effective pm.finance:charge.write (ADR-033).
 * Resident checkout is lease-self only and never receives staff finance keys.
 * Role-only manager or admin authorization is forbidden.
 */
export async function authorizeFinanceCheckout(input: {
  residentLinkId: string | null;
  leaseOrganizationId: string;
}): Promise<{ actor: FinanceCheckoutActor } | { error: NextResponse }> {
  if (input.residentLinkId) {
    return { actor: { kind: "resident", residentId: input.residentLinkId } };
  }

  const staff = await requireFinancePermission("pm.finance:charge.write", input.leaseOrganizationId);
  if ("error" in staff) {
    return { error: staff.error };
  }
  return { actor: { kind: "staff", authz: staff } };
}

export function orgSkuAllowsResidentialFinance(skuCode: string | null | undefined): boolean {
  if (!skuCode || !isProductSku(skuCode)) {
    return false;
  }
  return hasEntitlement(entitlementsForSku(skuCode as ProductSku), "pm.financial_operations");
}

export function stripePaymentExecutionEnabled(
  settings: { stripe_payment_execution_enabled?: boolean | null } | null | undefined
): boolean {
  return settings?.stripe_payment_execution_enabled === true;
}

export function stripePaymentExecutionDisabledResponse() {
  return NextResponse.json({ error: "stripe_payment_execution_disabled" }, { status: 403 });
}

export function acceptedPaymentMethodDeniedResponse(requested: string) {
  return NextResponse.json(
    {
      error: "accepted_payment_method_disabled",
      message:
        requested === "us_bank_account"
          ? "This property does not accept bank payments."
          : "This property does not accept card payments."
    },
    { status: 403 }
  );
}
