import { NextResponse } from "next/server";
import {
  COM_002_FLAGS,
  acquisitionHref,
  findForbiddenClientQuoteFields,
  isBillingCycle,
  isPlanTier,
  isProductSku
} from "@mpa/shared";
import { getAcquisitionByQuoteId } from "../../../../lib/commerce/acquisition-session-store";
import {
  createSaasCheckoutSession,
  createUnitVolumeCheckoutSession
} from "../../../../lib/saas-stripe/create-checkout-session";
import { isSaasCheckoutReady, isUnitVolumeCheckoutReady } from "../../../../lib/saas-stripe/client";

export const runtime = "nodejs";

/**
 * SaaS Checkout Session create.
 * Preferred path (Slice 3): `{ quoteId }` — server reloads quote and builds unit-volume line items.
 * Legacy path: productSku/planTier/billingCycle (transitional).
 * Never accepts client Price IDs, amounts, quantities, or trial flags.
 */
export async function POST(request: Request) {
  if (!COM_002_FLAGS.sliceC_stripeCheckout) {
    return NextResponse.json({ error: "slice_disabled" }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const forbidden = findForbiddenClientQuoteFields(body);
  if (forbidden.length > 0) {
    return NextResponse.json(
      {
        error: "client_authoritative_fields_forbidden",
        fields: forbidden,
        message: "Stripe Price IDs, amounts, blocks, and trial flags are server-derived only."
      },
      { status: 400 }
    );
  }
  for (const key of ["line_items", "lineItems", "subscription_data", "trial_period_days", "priceId"]) {
    if (key in body) {
      return NextResponse.json(
        { error: "client_authoritative_fields_forbidden", fields: [key] },
        { status: 400 }
      );
    }
  }

  const quoteIdRaw = body["quoteId"] ?? body["quote_id"];
  const quoteId = typeof quoteIdRaw === "string" ? quoteIdRaw : null;

  if (quoteId) {
    if (!isUnitVolumeCheckoutReady() && !isSaasCheckoutReady()) {
      return NextResponse.json(
        {
          error: "saas_checkout_not_configured",
          message:
            "Unit-volume Stripe Price env vars are not configured yet (STRIPE_PRICE_PM_BASE_* / STRIPE_PRICE_UNIT_BLOCK_*)."
        },
        { status: 503 }
      );
    }

    const record = getAcquisitionByQuoteId(quoteId);
    if (!record) {
      return NextResponse.json(
        {
          error: "quote_missing",
          redirectTo: acquisitionHref("questionnaire"),
          message: "Quote not found. Restart the questionnaire to generate a fresh quote."
        },
        { status: 410 }
      );
    }

    const customerEmail =
      typeof body["customerEmail"] === "string" ? body["customerEmail"] : undefined;
    const demoSessionId =
      typeof body["demoSessionId"] === "string" ? body["demoSessionId"] : undefined;
    const idempotencyKey =
      typeof body["idempotencyKey"] === "string" ? body["idempotencyKey"] : undefined;

    const result = await createUnitVolumeCheckoutSession({
      quote: record.quote,
      clientBody: body,
      ...(customerEmail ? { customerEmail } : {}),
      ...(demoSessionId ? { demoSessionId } : {}),
      ...(idempotencyKey ? { idempotencyKey } : {})
    });

    if (!result.ok) {
      if (result.route === "enterprise") {
        return NextResponse.json(
          {
            error: result.error,
            redirectTo: acquisitionHref("enterprise", record.quote.module)
          },
          { status: result.status }
        );
      }
      if (result.route === "questionnaire") {
        return NextResponse.json(
          {
            error: result.error,
            redirectTo: acquisitionHref("questionnaire"),
            ...(result.detail ? { detail: result.detail } : {})
          },
          { status: result.status }
        );
      }
      return NextResponse.json(
        {
          error: result.error,
          ...(result.route ? { route: result.route } : {}),
          ...(result.detail ? { detail: result.detail } : {})
        },
        { status: result.status }
      );
    }

    return NextResponse.json({
      url: result.url,
      sessionId: result.sessionId,
      reused: result.reused,
      provisioned: false,
      quoteId,
      mode: "unit_volume"
    });
  }

  // Legacy transitional path (no quote) — still PM-only.
  if (!isSaasCheckoutReady()) {
    return NextResponse.json(
      { error: "saas_checkout_not_configured", message: "Stripe SaaS prices/keys not configured." },
      { status: 503 }
    );
  }

  const productSku = body["productSku"];
  const planTier = body["planTier"];
  const billingCycle = body["billingCycle"];
  if (
    typeof productSku !== "string" ||
    !isProductSku(productSku) ||
    typeof planTier !== "string" ||
    !isPlanTier(planTier) ||
    typeof billingCycle !== "string" ||
    !isBillingCycle(billingCycle)
  ) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  if (productSku !== "mpa_property_manager") {
    return NextResponse.json(
      {
        error: "enterprise_required",
        redirectTo: acquisitionHref("enterprise", productSku)
      },
      { status: 409 }
    );
  }

  const result = await createSaasCheckoutSession({
    productSku,
    planTier,
    billingCycle,
    ...(typeof body["customerEmail"] === "string" ? { customerEmail: body["customerEmail"] } : {}),
    ...(typeof body["demoSessionId"] === "string" ? { demoSessionId: body["demoSessionId"] } : {}),
    ...(typeof body["idempotencyKey"] === "string" ? { idempotencyKey: body["idempotencyKey"] } : {})
  });

  if (!result.ok) {
    if (result.route === "enterprise") {
      return NextResponse.json(
        {
          error: result.error,
          redirectTo: acquisitionHref("enterprise", productSku)
        },
        { status: result.status }
      );
    }
    return NextResponse.json(
      { error: result.error, ...(result.route ? { route: result.route } : {}) },
      { status: result.status }
    );
  }

  return NextResponse.json({
    url: result.url,
    sessionId: result.sessionId,
    reused: result.reused,
    provisioned: false,
    mode: "legacy_offer"
  });
}
