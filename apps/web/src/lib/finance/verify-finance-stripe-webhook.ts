import type Stripe from "stripe";

export type FinanceWebhookSecretName = "platform" | "connect";

export type VerifyFinanceStripeWebhookResult =
  | { ok: true; event: Stripe.Event; verifiedWith: FinanceWebhookSecretName }
  | { ok: false; status: 400 | 503; error: string };

/**
 * FIN-OPS webhook signature verification.
 * Accepts a payload only after Stripe constructEvent succeeds with one configured secret.
 * Does not accept an event merely because the other secret failed.
 * Never uses STRIPE_SAAS_WEBHOOK_SECRET.
 */
export function verifyFinanceStripeWebhook(input: {
  constructEvent: (payload: string, header: string, secret: string) => Stripe.Event;
  body: string;
  signature: string | null;
  platformSecret?: string | null | undefined;
  connectSecret?: string | null | undefined;
}): VerifyFinanceStripeWebhookResult {
  if (!input.platformSecret) {
    return { ok: false, status: 503, error: "Stripe webhook not configured" };
  }
  if (!input.signature) {
    return { ok: false, status: 400, error: "Missing signature" };
  }

  const attempts: Array<{ name: FinanceWebhookSecretName; secret: string }> = [
    { name: "platform", secret: input.platformSecret }
  ];
  if (input.connectSecret && input.connectSecret !== input.platformSecret) {
    attempts.push({ name: "connect", secret: input.connectSecret });
  }

  let lastError = "Invalid signature";
  for (const attempt of attempts) {
    try {
      const event = input.constructEvent(input.body, input.signature, attempt.secret);
      return { ok: true, event, verifiedWith: attempt.name };
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Invalid signature";
    }
  }

  return { ok: false, status: 400, error: lastError };
}
