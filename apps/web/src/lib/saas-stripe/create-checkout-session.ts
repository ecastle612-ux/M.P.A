import type Stripe from "stripe";
import {
  buildUnitVolumeCheckoutMetadata,
  legacyOfferCheckoutCancelPath,
  resolveCheckoutLineItems,
  unitVolumeCheckoutCancelPath,
  validateQuoteForCheckout,
  type CommercialQuote,
  type SaasCheckoutRequest,
  type UnitVolumeCheckoutPlan
} from "@mpa/shared";
import { serverEnv } from "../env/server-env";
import {
  getSaasStripeClient,
  isUnitVolumeCheckoutReady,
  randomIntegrationSuffix,
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
          : validation.reason === "price_unconfigured" ||
              validation.reason === "superseded_price_blocked"
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
          : validation.reason === "superseded_price_blocked"
            ? { route: "pricing" as const }
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
      error: resolved.reason,
      reason: resolved.reason,
      detail: resolved.priceId ?? resolved.missingEnvKey,
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
    throw new Error(
      resolved.reason === "superseded_price_blocked"
        ? `superseded_price_blocked:${resolved.priceId ?? resolved.missingEnvKey}`
        : resolved.missingEnvKey
    );
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
 * Hard-disabled for NEW session creation — customer Checkout is unit-volume only.
 * Fail-closed so obsolete Prices (including superseded provisional $99 Professional)
 * cannot be attached to new subscriptions via this helper.
 * Do not wire back into `/api/commerce/checkout`.
 */
export async function createSaasCheckoutSession(
  input: SaasCheckoutRequest
): Promise<CreateSaasCheckoutResult> {
  void input;
  return {
    ok: false,
    status: 410,
    error: "legacy_checkout_disabled",
    reason: "legacy_checkout_disabled",
    route: "pricing",
    detail:
      "Legacy offer Checkout cannot create new Stripe Sessions. Use quote-authoritative unit-volume Checkout."
  };
}
