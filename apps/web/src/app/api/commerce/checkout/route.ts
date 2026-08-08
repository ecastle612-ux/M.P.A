import { NextResponse } from "next/server";
import {
  COM_002_FLAGS,
  acquisitionHref,
  isBillingCycle,
  isPlanTier,
  isProductSku
} from "@mpa/shared";
import { createSaasCheckoutSession } from "../../../../lib/saas-stripe/create-checkout-session";
import { isSaasCheckoutReady } from "../../../../lib/saas-stripe/client";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!COM_002_FLAGS.sliceC_stripeCheckout) {
    return NextResponse.json({ error: "slice_disabled" }, { status: 404 });
  }
  if (!isSaasCheckoutReady()) {
    return NextResponse.json(
      { error: "saas_checkout_not_configured", message: "Stripe SaaS prices/keys not configured." },
      { status: 503 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    productSku?: string;
    planTier?: string;
    billingCycle?: string;
    customerEmail?: string;
    demoSessionId?: string;
    idempotencyKey?: string;
  };

  if (
    !body.productSku ||
    !isProductSku(body.productSku) ||
    !body.planTier ||
    !isPlanTier(body.planTier) ||
    !body.billingCycle ||
    !isBillingCycle(body.billingCycle)
  ) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  if (body.productSku !== "mpa_property_manager") {
    return NextResponse.json(
      {
        error: "enterprise_required",
        redirectTo: acquisitionHref("enterprise", body.productSku)
      },
      { status: 409 }
    );
  }

  const result = await createSaasCheckoutSession({
    productSku: body.productSku,
    planTier: body.planTier,
    billingCycle: body.billingCycle,
    customerEmail: body.customerEmail,
    demoSessionId: body.demoSessionId,
    idempotencyKey: body.idempotencyKey
  });

  if (!result.ok) {
    if (result.route === "enterprise") {
      return NextResponse.json(
        {
          error: result.error,
          redirectTo: acquisitionHref("enterprise", body.productSku)
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
    provisioned: false
  });
}
