import { NextResponse } from "next/server";
import { handleSaasStripeEvent, verifySaasStripeWebhook } from "../../../../../lib/saas-stripe/webhook";

export const runtime = "nodejs";

/**
 * Dedicated COM-002 SaaS Stripe webhook endpoint.
 * Do not share with /api/finance/webhooks/stripe.
 */
export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  const verified = verifySaasStripeWebhook(body, signature);
  if (!verified.ok) {
    return NextResponse.json({ error: verified.error }, { status: verified.status });
  }

  const result = await handleSaasStripeEvent(verified.event);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result);
}
