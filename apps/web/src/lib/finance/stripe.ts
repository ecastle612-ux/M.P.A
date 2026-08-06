import Stripe from "stripe";
import { serverEnv } from "../env/server-env";

export function isStripeConfigured(): boolean {
  return Boolean(serverEnv.STRIPE_SECRET_KEY);
}

export function getStripeClient(): Stripe | null {
  if (!serverEnv.STRIPE_SECRET_KEY) {
    return null;
  }
  return new Stripe(serverEnv.STRIPE_SECRET_KEY);
}

export function randomIntegrationSuffix(length = 8): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}
