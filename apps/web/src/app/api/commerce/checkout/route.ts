import { NextResponse } from "next/server";
import {
  COM_002_FLAGS,
  acquisitionHref,
  findForbiddenClientQuoteFields
} from "@mpa/shared";
import { acquisitionStateTokenFromRequest } from "../../../../lib/commerce/acquisition-quote-cookie";
import { getAcquisitionByQuoteId } from "../../../../lib/commerce/acquisition-session-store";
import { createUnitVolumeCheckoutSession } from "../../../../lib/saas-stripe/create-checkout-session";
import { isUnitVolumeCheckoutReady } from "../../../../lib/saas-stripe/client";

export const runtime = "nodejs";

/**
 * SaaS Checkout Session create — quote-authoritative unit-volume only.
 * Requires `{ quoteId }`. Never accepts client Price IDs, amounts, quantities,
 * trial flags, or legacy productSku/planTier acquisition payloads.
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
  for (const key of [
    "line_items",
    "lineItems",
    "subscription_data",
    "trial_period_days",
    "priceId",
    "productSku",
    "planTier",
    "billingCycle"
  ]) {
    if (key in body) {
      return NextResponse.json(
        {
          error: "legacy_checkout_unsupported",
          fields: [key],
          message:
            "Customer Checkout requires a server quoteId. Legacy productSku/planTier Price selection is not supported."
        },
        { status: 400 }
      );
    }
  }

  const quoteIdRaw = body["quoteId"] ?? body["quote_id"];
  const quoteId = typeof quoteIdRaw === "string" && quoteIdRaw.trim() ? quoteIdRaw.trim() : null;
  if (!quoteId) {
    return NextResponse.json(
      {
        error: "quote_id_required",
        redirectTo: acquisitionHref("questionnaire"),
        message: "Checkout requires a valid quoteId from the questionnaire."
      },
      { status: 400 }
    );
  }

  const record = await getAcquisitionByQuoteId(quoteId, {
    stateToken: acquisitionStateTokenFromRequest(request)
  });
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

  if (!isUnitVolumeCheckoutReady()) {
    return NextResponse.json(
      {
        error: "saas_checkout_not_configured",
        message:
          "Unit-volume Stripe Price env vars are not configured (STRIPE_PRICE_PM_BASE_* / STRIPE_PRICE_UNIT_BLOCK_*)."
      },
      { status: 503 }
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
