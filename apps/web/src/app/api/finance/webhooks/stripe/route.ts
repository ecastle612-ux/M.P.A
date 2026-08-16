import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { applySucceededPayment, markPaymentFailed } from "../../../../../lib/finance/billing-service";
import {
  resolveCheckoutFailure,
  resolveCheckoutSessionCompleted
} from "../../../../../lib/finance/finops-stripe-webhook";
import { getStripeClient } from "../../../../../lib/finance/stripe";
import { createServiceRoleClient } from "../../../../../lib/supabase/service-role";
import { serverEnv } from "../../../../../lib/env/server-env";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const stripe = getStripeClient();
  if (!stripe || !serverEnv.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe webhook not configured" }, { status: 503 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, serverEnv.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid signature" },
      { status: 400 }
    );
  }

  let supabase;
  try {
    supabase = createServiceRoleClient();
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Service role unavailable" },
      { status: 503 }
    );
  }

  const { data: existing } = await supabase
    .from("financial_stripe_webhook_events")
    .select("id, processed_at")
    .eq("stripe_event_id", event.id)
    .maybeSingle();

  if (existing?.processed_at) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  if (!existing) {
    await supabase.from("financial_stripe_webhook_events").insert({
      stripe_event_id: event.id,
      event_type: event.type,
      payload: event as unknown as Record<string, unknown>
    });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const paymentId = session.metadata?.["payment_id"] ?? session.client_reference_id;
      const organizationId = session.metadata?.["organization_id"];
      const leaseId = session.metadata?.["lease_id"];

      if (!paymentId || !organizationId || !leaseId) {
        throw new Error("Missing payment metadata on Checkout Session");
      }

      const { data: payment } = await supabase
        .from("financial_payments")
        .select("id, organization_id, lease_id, amount, status, stripe_checkout_session_id, currency")
        .eq("id", paymentId)
        .maybeSingle();

      const resolution = resolveCheckoutSessionCompleted({
        payment,
        organizationId,
        leaseId,
        checkoutSessionId: session.id,
        amountTotalCents: session.amount_total
      });

      if (resolution.action === "refuse") {
        throw new Error(resolution.error);
      }

      if (resolution.action === "already_succeeded") {
        await supabase
          .from("financial_stripe_webhook_events")
          .update({
            processed_at: new Date().toISOString(),
            organization_id: organizationId,
            payment_id: resolution.paymentId
          })
          .eq("stripe_event_id", event.id);
        return NextResponse.json({ ok: true, alreadySucceeded: true });
      }

      const intentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? null;
      await applySucceededPayment(supabase, {
        organizationId,
        actorId: null,
        leaseId,
        amount: resolution.amount,
        currency: (session.currency ?? payment?.currency ?? "usd").toUpperCase(),
        method: "online_stripe",
        paymentId: resolution.paymentId,
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId: intentId,
        correlationId: event.id
      });

      await supabase
        .from("financial_stripe_webhook_events")
        .update({
          processed_at: new Date().toISOString(),
          organization_id: organizationId,
          payment_id: resolution.paymentId,
          error: null
        })
        .eq("stripe_event_id", event.id);
    }

    if (event.type === "checkout.session.expired" || event.type === "payment_intent.payment_failed") {
      const object = event.data.object as { metadata?: Record<string, string> };
      const paymentId = object.metadata?.["payment_id"];
      const organizationId = object.metadata?.["organization_id"];
      const { data: payment } = paymentId
        ? await supabase
            .from("financial_payments")
            .select("id, organization_id, lease_id, amount, status, stripe_checkout_session_id")
            .eq("id", paymentId)
            .maybeSingle()
        : { data: null };
      const resolution = resolveCheckoutFailure({
        paymentId,
        organizationId,
        payment
      });
      if (resolution.action === "refuse") {
        throw new Error(resolution.error);
      }
      if (resolution.action === "mark_failed" && organizationId) {
        await markPaymentFailed(supabase, resolution.paymentId, organizationId, event.type, event.id);
        await supabase
          .from("financial_stripe_webhook_events")
          .update({
            processed_at: new Date().toISOString(),
            organization_id: organizationId,
            payment_id: resolution.paymentId
          })
          .eq("stripe_event_id", event.id);
      }
    }

    if (!["checkout.session.completed", "checkout.session.expired", "payment_intent.payment_failed"].includes(event.type)) {
      await supabase
        .from("financial_stripe_webhook_events")
        .update({ processed_at: new Date().toISOString() })
        .eq("stripe_event_id", event.id);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    await supabase
      .from("financial_stripe_webhook_events")
      .update({ error: error instanceof Error ? error.message : "webhook_failed" })
      .eq("stripe_event_id", event.id);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook processing failed" },
      { status: 500 }
    );
  }
}
