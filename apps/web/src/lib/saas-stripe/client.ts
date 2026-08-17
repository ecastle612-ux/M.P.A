import Stripe from "stripe";
import {
  missingUnitVolumePriceEnvKeysForQuote,
  saasDisplayPriceEnvKeyForOfferId,
  saasPriceEnvKeyForOfferId,
  unitVolumeCheckoutReadyEnvKeys,
  type BillingCycle
} from "@mpa/shared";
import { serverEnv } from "../env/server-env";

/** SaaS Stripe client — same account key OK; webhook secret is dedicated. */
export function isSaasStripeConfigured(): boolean {
  return Boolean(serverEnv.STRIPE_SECRET_KEY && serverEnv.STRIPE_SAAS_WEBHOOK_SECRET);
}

function envString(key: string): string | null {
  const value = serverEnv[key as keyof typeof serverEnv];
  return typeof value === "string" && value.length > 0 ? value : null;
}

/** Admin/historical: PM base + unit-block keys. Customer Checkout uses the per-quote gate. */
export function isUnitVolumeCheckoutReady(): boolean {
  if (!serverEnv.STRIPE_SECRET_KEY) {
    return false;
  }
  return unitVolumeCheckoutReadyEnvKeys().every((key) => Boolean(envString(key)));
}

export type UnitVolumeQuoteCheckoutGate =
  | { ready: true }
  | { ready: false; missingEnvKey: string };

/** Fail-closed per selected product/cycle. Never returns secret values. */
export function unitVolumeCheckoutGateForQuote(quote: {
  module: string;
  billing_interval: BillingCycle;
  additional_blocks: number;
}): UnitVolumeQuoteCheckoutGate {
  if (!serverEnv.STRIPE_SECRET_KEY) {
    return { ready: false, missingEnvKey: "STRIPE_SECRET_KEY" };
  }
  const missing = missingUnitVolumePriceEnvKeysForQuote(quote, envString);
  if (missing[0]) {
    return { ready: false, missingEnvKey: missing[0] };
  }
  return { ready: true };
}

/** Admin/historical readiness helper. Customer Checkout uses `unitVolumeCheckoutGateForQuote`. */
export function isSaasCheckoutReady(): boolean {
  if (isUnitVolumeCheckoutReady()) {
    return true;
  }
  return Boolean(
    serverEnv.STRIPE_SECRET_KEY &&
      serverEnv.STRIPE_PRICE_PM_PROFESSIONAL_MONTHLY &&
      serverEnv.STRIPE_PRICE_PM_PROFESSIONAL_ANNUAL
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

/** Resolve a unit-volume registry env key to a Stripe Price id (never invent IDs). */
export function resolveUnitVolumePriceEnv(envKey: string): string | null {
  const value = serverEnv[envKey as keyof typeof serverEnv];
  return typeof value === "string" && value.length > 0 ? value : null;
}

/** Display Price IDs for public Pricing transparency (may include FO/Complete). */
export function resolveSaasDisplayPriceId(offerId: string): string | null {
  const envKey = saasDisplayPriceEnvKeyForOfferId(offerId);
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
