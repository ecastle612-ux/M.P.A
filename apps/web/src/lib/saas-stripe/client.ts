import Stripe from "stripe";
import { saasPriceEnvKeyForOfferId } from "@mpa/shared";
import { serverEnv } from "../env/server-env";

/** SaaS Stripe client — same account key OK; webhook secret is dedicated. */
export function isSaasStripeConfigured(): boolean {
  return Boolean(serverEnv.STRIPE_SECRET_KEY && serverEnv.STRIPE_SAAS_WEBHOOK_SECRET);
}

export function isSaasCheckoutReady(): boolean {
  return Boolean(
    serverEnv.STRIPE_SECRET_KEY &&
      serverEnv.STRIPE_PRICE_PM_PROFESSIONAL_MONTHLY &&
      serverEnv.STRIPE_PRICE_PM_PROFESSIONAL_ANNUAL &&
      serverEnv.STRIPE_PRICE_PM_BUSINESS_MONTHLY &&
      serverEnv.STRIPE_PRICE_PM_BUSINESS_ANNUAL
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
  const value = serverEnv[envKey as keyof typeof serverEnv];
  return typeof value === "string" && value.length > 0 ? value : null;
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
