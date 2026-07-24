/**
 * PAY-001 C1/C2 — live destination charges require a provider that can apply transfer_data.
 * Noop / keyless sandbox must never invent destination settlement corpus.
 */

import { isPay001DestinationFundingEnvEnabled } from "./flags";
import { resolveDefaultPaymentProviderId } from "../integrations/payments/registry";

export type DestinationProviderCapability = {
  capable: boolean;
  providerId: string;
  hasStripeSecret: boolean;
  envFundingEnabled: boolean;
  reason: string | null;
};

/**
 * Production config lock (cert C2):
 * destination enrollment path requires PAYMENT_PROVIDER=stripe + STRIPE_SECRET_KEY + env funding on.
 */
export function evaluateDestinationProviderCapability(
  providerId?: string
): DestinationProviderCapability {
  const resolved = (providerId ?? resolveDefaultPaymentProviderId()).trim().toLowerCase();
  const hasStripeSecret = Boolean(process.env["STRIPE_SECRET_KEY"]?.trim());
  const envFundingEnabled = isPay001DestinationFundingEnvEnabled();

  if (resolved !== "stripe") {
    return {
      capable: false,
      providerId: resolved,
      hasStripeSecret,
      envFundingEnabled,
      reason: `Destination charges require PAYMENT_PROVIDER=stripe (got ${resolved})`
    };
  }
  if (!hasStripeSecret) {
    return {
      capable: false,
      providerId: resolved,
      hasStripeSecret,
      envFundingEnabled,
      reason: "Destination charges require STRIPE_SECRET_KEY (keyless sandbox cannot apply transfer_data)"
    };
  }
  if (!envFundingEnabled) {
    return {
      capable: false,
      providerId: resolved,
      hasStripeSecret,
      envFundingEnabled,
      reason: "PAY001_DESTINATION_FUNDING_ENABLED is off"
    };
  }
  return {
    capable: true,
    providerId: resolved,
    hasStripeSecret,
    envFundingEnabled,
    reason: null
  };
}

export function canApplyLiveDestinationCharges(providerId?: string): boolean {
  return evaluateDestinationProviderCapability(providerId).capable;
}
