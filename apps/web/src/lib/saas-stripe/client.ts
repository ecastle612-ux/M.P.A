import Stripe from "stripe";
import { saasPriceEnvKeyForOfferId } from "@mpa/shared";
import { serverEnv } from "../env/server-env";

/**
 * Live Stripe Price IDs for acct_1Tv5Lj8jGrZYUXDt (M.P.A.).
 * Env vars always win; these defaults unblock Confirm Plan when Production
 * has STRIPE_SECRET_KEY but price envs were not yet injected/redeployed.
 * Do not rename Stripe Products — mapping only (BUG-010 / ADR-019).
 */
const LIVE_PM_PRICE_DEFAULTS: Record<string, string> = {
  STRIPE_PRICE_PM_PROFESSIONAL_MONTHLY: "price_1Tw3Cb8jGrZYUXDtQwHvaXFW",
  STRIPE_PRICE_PM_PROFESSIONAL_ANNUAL: "price_1Tw3Cc8jGrZYUXDtoMZ4ypxU",
  STRIPE_PRICE_PM_BUSINESS_MONTHLY: "price_1Tw3Cd8jGrZYUXDtQTEZdC4G",
  STRIPE_PRICE_PM_BUSINESS_ANNUAL: "price_1Tw3Cd8jGrZYUXDt8nQgBomF"
};

/** SaaS Stripe client — same account key OK; webhook secret is dedicated. */
export function isSaasStripeConfigured(): boolean {
  return Boolean(serverEnv.STRIPE_SECRET_KEY && serverEnv.STRIPE_SAAS_WEBHOOK_SECRET);
}

/**
 * Confirm Plan readiness: secret key + resolvable Property Manager self-serve prices.
 * Business price envs remain optional at the gate; per-offer resolve still applies.
 */
export function isSaasCheckoutReady(): boolean {
  return Boolean(
    serverEnv.STRIPE_SECRET_KEY &&
      resolveSaasPriceId("mpa_property_manager__professional__monthly") &&
      resolveSaasPriceId("mpa_property_manager__professional__annual")
  );
}

export function getSaasStripeClient(): Stripe | null {
  if (!serverEnv.STRIPE_SECRET_KEY) {
    return null;
  }
  return new Stripe(serverEnv.STRIPE_SECRET_KEY);
}

export function resolveSaasPriceId(offerId: string): string | null {
  const envKey = saasPriceEnvKeyForOfferId(offerId);
  if (!envKey) {
    return null;
  }
  const fromEnv = serverEnv[envKey as keyof typeof serverEnv];
  if (typeof fromEnv === "string" && fromEnv.length > 0) {
    return fromEnv;
  }
  const fallback = LIVE_PM_PRICE_DEFAULTS[envKey];
  return fallback && fallback.length > 0 ? fallback : null;
}

export function saasAutomaticTaxEnabled(): boolean {
  return serverEnv.STRIPE_SAAS_AUTOMATIC_TAX === "true";
}

export function randomIntegrationSuffix(length = 8): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)] ?? "x";
  }
  return out;
}
