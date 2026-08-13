import type Stripe from "stripe";
import {
  buildSaasCheckoutMetadata,
  buildUnitVolumeCheckoutMetadata,
  legacyOfferCheckoutCancelPath,
  resolveCheckoutLineItems,
  unitVolumeCheckoutCancelPath,
  validateQuoteForCheckout,
  validateSaasCheckoutRequest,
  type CommercialQuote,
  type SaasCheckoutRequest,
  type UnitVolumeCheckoutPlan
} from "@mpa/shared";
import { serverEnv } from "../env/server-env";
import {
  getSaasStripeClient,
  isUnitVolumeCheckoutReady,
  randomIntegrationSuffix,
  resolveSaasPriceId,
  resolveUnitVolumePriceEnv,
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
      route?: "enterprise" | "pricing" | "questionnaire";
      detail?: string;
    };

export type CreateUnitVolumeCheckoutInput = {
  quote: CommercialQuote;
  customerEmail?: string | null;
  demoSessionId?: string | null;
  idempotencyKey?: string | null;
  clientBody?: Record<string, unknown> | null;
};

/**
 * Quote-authoritative unit-volume Checkout Session (Slice 3).
 * Creates a Stripe Checkout Session only when unit-volume Price env vars are configured
 * (typically test mode). Never trusts client Price IDs / amounts / trial flags.
 */
export async function createUnitVolumeCheckoutSession(
  input: CreateUnitVolumeCheckoutInput
): Promise<CreateSaasCheckoutResult> {
  const validation = validateQuoteForCheckout({
    quote: input.quote,
    resolvePriceId: resolveUnitVolumePriceEnv,
    ...(input.clientBody !== undefined ? { clientBody: input.clientBody } : {})
  });
  if (!validation.ok) {
    const status =
      validation.reason === "module_gated"
        ? 409
        : validation.reason === "quote_expired" || validation.reason === "quote_missing"
          ? 410
          : validation.reason === "price_unconfigured"
            ? 503
            : 400;
    return {
      ok: false,
      status,
      error: validation.reason,
      reason: validation.reason,
      ...(validation.detail ? { detail: validation.detail } : {}),
      ...(validation.reason === "module_gated"
        ? { route: "enterprise" as const }
        : validation.reason === "quote_expired" || validation.reason === "quote_missing"
          ? { route: "questionnaire" as const }
          : {})
    };
  }

  if (!isUnitVolumeCheckoutReady()) {
    return {
      ok: false,
      status: 503,
      error: "unit_volume_prices_unconfigured",
      reason: "price_unconfigured",
      route: "pricing",
      detail: "STRIPE_PRICE_PM_BASE_* / STRIPE_PRICE_UNIT_BLOCK_* not configured"
    };
  }

  const plan = validation.plan;
  const resolved = resolveCheckoutLineItems(plan, resolveUnitVolumePriceEnv);
  if (!resolved.ok) {
    return {
      ok: false,
      status: 503,
      error: "price_unconfigured",
      reason: "price_unconfigured",
      detail: resolved.missingEnvKey,
      route: "pricing"
    };
  }

  const stripe = getSaasStripeClient();
  if (!stripe) {
    return { ok: false, status: 503, error: "stripe_not_configured" };
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

  const metadata = buildUnitVolumeCheckoutMetadata({
    quote: input.quote,
    ...(input.demoSessionId ? { demoSessionId: input.demoSessionId } : {})
  });
  const appUrl = serverEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const idempotencyKey =
    input.idempotencyKey?.trim() ||
    `saas_uv_checkout:${plan.quoteId}:${input.customerEmail ?? "anon"}:${new Date().toISOString().slice(0, 13)}`;

  try {
    const email = input.customerEmail?.trim();
    const sessionParams = {
      mode: "subscription" as const,
      line_items: resolved.items.map((item) => ({
        price: item.price,
        quantity: item.quantity
      })),
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}${unitVolumeCheckoutCancelPath(plan.quoteId)}`,
      client_reference_id: plan.quoteId,
      ...(email ? { customer_email: email } : {}),
      allow_promotion_codes: true,
      billing_address_collection: "required" as const,
      tax_id_collection: { enabled: true },
      automatic_tax: { enabled: saasAutomaticTaxEnabled() },
      // Required payment method — no trial without a card on file.
      payment_method_collection: "always" as const,
      metadata,
      subscription_data: {
        metadata,
        ...(plan.trialPeriodDays ? { trial_period_days: plan.trialPeriodDays } : {})
      },
      // Supported on recent Stripe API versions; cast keeps SDK typings portable.
      integration_identifier: `mpa-saas-uv-checkout-${randomIntegrationSuffix()}`
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
      catalogOfferId: metadata["mpa_catalog_offer_id"] ?? plan.quoteId,
      productSku: plan.module,
      planTier: "professional",
      billingCycle: plan.billingInterval,
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

/** @internal test helper — builds session params without calling Stripe. */
export function buildUnitVolumeSessionParamsForTest(input: {
  plan: UnitVolumeCheckoutPlan;
  prices: Record<string, string>;
  appUrl?: string;
}): {
  line_items: Array<{ price: string; quantity: number }>;
  payment_method_collection: "always";
  subscription_data: { trial_period_days?: number; metadata: Record<string, string> };
  metadata: Record<string, string>;
} {
  const resolved = resolveCheckoutLineItems(input.plan, (key) => input.prices[key] ?? null);
  if (!resolved.ok) {
    throw new Error(resolved.missingEnvKey);
  }
  return {
    line_items: resolved.items.map((item) => ({ price: item.price, quantity: item.quantity })),
    payment_method_collection: "always",
    subscription_data: {
      metadata: input.plan.metadata,
      ...(input.plan.trialPeriodDays
        ? { trial_period_days: input.plan.trialPeriodDays }
        : {})
    },
    metadata: input.plan.metadata
  };
}

/**
 * Legacy offer-based Checkout (pre–unit-volume).
 * Not reachable from customer Checkout API — retained for admin/historical helpers + tests only.
 * Do not wire back into `/api/commerce/checkout`.
 */
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
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}${legacyOfferCheckoutCancelPath(offer.id)}`,
      client_reference_id: offer.id,
      customer_email: input.customerEmail?.trim() || undefined,
      allow_promotion_codes: true,
      billing_address_collection: "required" as const,
      tax_id_collection: { enabled: true },
      automatic_tax: { enabled: saasAutomaticTaxEnabled() },
      payment_method_collection: "always" as const,
      metadata,
      subscription_data: {
        metadata
      },
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
