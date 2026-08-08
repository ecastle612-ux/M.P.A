import type Stripe from "stripe";
import {
  buildSaasCheckoutMetadata,
  validateSaasCheckoutRequest,
  type SaasCheckoutRequest
} from "@mpa/shared";
import { serverEnv } from "../env/server-env";
import {
  getSaasStripeClient,
  randomIntegrationSuffix,
  resolveSaasPriceId,
  saasAutomaticTaxEnabled
} from "./client";
import {
  getSaasPurchaseByIdempotencyKey,
  rememberSaasPurchase,
  type StoredSaasPurchase
} from "./purchase-store";

export type CreateSaasCheckoutResult =
  | { ok: true; url: string; sessionId: string; purchase: StoredSaasPurchase; reused: boolean }
  | {
      ok: false;
      status: number;
      error: string;
      reason?: string;
      route?: "enterprise" | "pricing";
    };

export async function createSaasCheckoutSession(
  input: SaasCheckoutRequest
): Promise<CreateSaasCheckoutResult> {
  const validation = validateSaasCheckoutRequest(input, resolveSaasPriceId);
  if (!validation.ok) {
    const status =
      validation.reason === "enterprise_required" || validation.reason === "not_self_serve"
        ? 409
        : validation.reason === "slice_disabled"
          ? 404
          : 400;
    return {
      ok: false,
      status,
      error: validation.reason,
      reason: validation.reason,
      ...(validation.route ? { route: validation.route } : {})
    };
  }

  const stripe = getSaasStripeClient();
  if (!stripe) {
    return { ok: false, status: 503, error: "stripe_not_configured" };
  }

  const offer = validation.offer;
  const priceId = offer.stripePriceId;
  if (!priceId) {
    return { ok: false, status: 503, error: "price_unconfigured", route: "pricing" };
  }

  if (input.idempotencyKey) {
    const existing = getSaasPurchaseByIdempotencyKey(input.idempotencyKey);
    if (existing?.status === "checkout_completed") {
      return {
        ok: true,
        url: `${serverEnv.NEXT_PUBLIC_APP_URL}/checkout/success?session_id=${existing.stripeCheckoutSessionId}`,
        sessionId: existing.stripeCheckoutSessionId,
        purchase: existing,
        reused: true
      };
    }
    if (existing?.status === "checkout_created") {
      const prior = await stripe.checkout.sessions.retrieve(existing.stripeCheckoutSessionId);
      if (prior.status === "open" && prior.url) {
        return {
          ok: true,
          url: prior.url,
          sessionId: existing.stripeCheckoutSessionId,
          purchase: existing,
          reused: true
        };
      }
    }
  }

  const metadata = buildSaasCheckoutMetadata({
    offer,
    ...(input.demoSessionId ? { demoSessionId: input.demoSessionId } : {})
  });
  const appUrl = serverEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const idempotencyKey =
    input.idempotencyKey?.trim() ||
    `saas_checkout:${offer.id}:${input.customerEmail ?? "anon"}:${new Date().toISOString().slice(0, 13)}`;

  try {
    const sessionParams = {
      mode: "subscription" as const,
      // Do NOT set payment_method_types — dynamic payment methods (card, wallets, Link, ACH if enabled).
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout/cancel?offer=${encodeURIComponent(offer.id)}`,
      client_reference_id: offer.id,
      customer_email: input.customerEmail?.trim() || undefined,
      allow_promotion_codes: true,
      billing_address_collection: "required" as const,
      tax_id_collection: { enabled: true },
      automatic_tax: { enabled: saasAutomaticTaxEnabled() },
      metadata,
      subscription_data: {
        metadata
      },
      // Supported on recent Stripe API versions; cast keeps SDK typings portable.
      integration_identifier: `mpa-saas-checkout-${randomIntegrationSuffix()}`
    };
    const session = await stripe.checkout.sessions.create(
      sessionParams as Parameters<Stripe["checkout"]["sessions"]["create"]>[0],
      { idempotencyKey }
    );

    if (!session.url) {
      return { ok: false, status: 502, error: "checkout_url_missing" };
    }

    const now = new Date().toISOString();
    const purchase = rememberSaasPurchase({
      id: crypto.randomUUID(),
      stripeCheckoutSessionId: session.id,
      stripeCustomerId: typeof session.customer === "string" ? session.customer : null,
      stripeSubscriptionId:
        typeof session.subscription === "string" ? session.subscription : null,
      catalogOfferId: offer.id,
      productSku: offer.productSku,
      planTier: offer.planTier,
      billingCycle: offer.billingCycle ?? "monthly",
      status: "checkout_created",
      customerEmail: input.customerEmail?.trim() || null,
      idempotencyKey,
      demoSessionId: input.demoSessionId ?? null,
      metadata,
      provisioned: false,
      organizationId: null,
      userId: null,
      createdAt: now,
      updatedAt: now
    });

    return { ok: true, url: session.url, sessionId: session.id, purchase, reused: false };
  } catch (error) {
    return {
      ok: false,
      status: 502,
      error: error instanceof Error ? error.message : "stripe_checkout_failed"
    };
  }
}
