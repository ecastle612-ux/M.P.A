import { NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  applyPaymentRefund,
  applySucceededPayment,
  markPaymentFailed,
  recordPaymentDispute
} from "../../../../../lib/finance/billing-service";
import { syncConnectAccount } from "../../../../../lib/finance/connect-service";
import {
  resolveCheckoutFailure,
  resolveCheckoutSessionCompleted,
  resolvePaymentIntentSucceeded
} from "../../../../../lib/finance/finops-stripe-webhook";
import { getStripeClient } from "../../../../../lib/finance/stripe";
import { verifyFinanceStripeWebhook } from "../../../../../lib/finance/verify-finance-stripe-webhook";
import { createServiceRoleClient } from "../../../../../lib/supabase/service-role";
import { serverEnv } from "../../../../../lib/env/server-env";

export const runtime = "nodejs";

const HANDLED = new Set([
  "checkout.session.completed",
  "checkout.session.expired",
  "payment_intent.payment_failed",
  "payment_intent.succeeded",
  "charge.refunded",
  "charge.dispute.created",
  "charge.dispute.closed",
  "account.updated"
]);

export async function POST(request: Request) {
  const stripe = getStripeClient();
  if (!stripe || !serverEnv.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe webhook not configured" }, { status: 503 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  const verified = verifyFinanceStripeWebhook({
    constructEvent: (payload, header, secret) => stripe.webhooks.constructEvent(payload, header, secret),
    body,
    signature,
    platformSecret: serverEnv.STRIPE_WEBHOOK_SECRET,
    connectSecret: serverEnv.STRIPE_CONNECT_WEBHOOK_SECRET
  });
  if (!verified.ok) {
    return NextResponse.json({ error: verified.error }, { status: verified.status });
  }
  const { event, verifiedWith } = verified;

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
    return NextResponse.json({ ok: true, duplicate: true, verifiedWith });
  }

  if (!existing) {
    await supabase.from("financial_stripe_webhook_events").insert({
      stripe_event_id: event.id,
      event_type: event.type,
      payload: {
        ...(event as unknown as Record<string, unknown>),
        mpa_verified_with: verifiedWith
      }
    });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === "setup" || session.metadata?.["source"] === "autopay_setup") {
        await supabase
          .from("financial_stripe_webhook_events")
          .update({
            processed_at: new Date().toISOString(),
            organization_id: session.metadata?.["organization_id"] ?? null
          })
          .eq("stripe_event_id", event.id);
        return NextResponse.json({ ok: true, setup: true, verifiedWith });
      }
      const paymentId = session.metadata?.["payment_id"] ?? session.client_reference_id;
      const organizationId = session.metadata?.["organization_id"];
      const leaseId = session.metadata?.["lease_id"];

      if (!paymentId || !organizationId || !leaseId) {
        throw new Error("Missing payment metadata on Checkout Session");
      }

      const { data: payment } = await supabase
        .from("financial_payments")
        .select("id, organization_id, lease_id, amount, status, stripe_checkout_session_id, currency, selected_charge_ids")
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
        return NextResponse.json({ ok: true, alreadySucceeded: true, verifiedWith });
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
        correlationId: event.id,
        chargeIds: payment?.selected_charge_ids ?? null
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

    if (event.type === "payment_intent.succeeded") {
      const intent = event.data.object as Stripe.PaymentIntent;
      const paymentId = intent.metadata?.["payment_id"];
      const organizationId = intent.metadata?.["organization_id"];
      const leaseId = intent.metadata?.["lease_id"];
      if (paymentId && organizationId && leaseId) {
        const { data: payment } = await supabase
          .from("financial_payments")
          .select("id, organization_id, lease_id, amount, status, stripe_checkout_session_id, currency, selected_charge_ids")
          .eq("id", paymentId)
          .maybeSingle();
        const resolution = resolvePaymentIntentSucceeded({
          payment,
          organizationId,
          leaseId,
          amountTotalCents: intent.amount_received ?? intent.amount
        });
        if (resolution.action === "apply") {
          await applySucceededPayment(supabase, {
            organizationId,
            actorId: null,
            leaseId,
            amount: resolution.amount,
            currency: (intent.currency ?? payment?.currency ?? "usd").toUpperCase(),
            method: "online_stripe",
            paymentId: resolution.paymentId,
            stripePaymentIntentId: intent.id,
            correlationId: event.id,
            chargeIds: payment?.selected_charge_ids ?? null
          });
        } else if (resolution.action === "refuse") {
          throw new Error(resolution.error);
        }
        await supabase
          .from("financial_stripe_webhook_events")
          .update({
            processed_at: new Date().toISOString(),
            organization_id: organizationId,
            payment_id: paymentId
          })
          .eq("stripe_event_id", event.id);
      }
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

    if (event.type === "charge.refunded") {
      const charge = event.data.object as Stripe.Charge;
      const paymentId = charge.metadata?.["payment_id"];
      const organizationId = charge.metadata?.["organization_id"];
      if (paymentId && organizationId) {
        const refund = charge.refunds?.data?.[0];
        await applyPaymentRefund(supabase, {
          organizationId,
          paymentId,
          refundAmount: (refund?.amount ?? charge.amount_refunded) / 100,
          stripeRefundId: refund?.id ?? charge.id,
          correlationId: event.id
        });
      }
      await supabase
        .from("financial_stripe_webhook_events")
        .update({ processed_at: new Date().toISOString(), organization_id: organizationId ?? null })
        .eq("stripe_event_id", event.id);
    }

    if (event.type === "charge.dispute.created" || event.type === "charge.dispute.closed") {
      const dispute = event.data.object as Stripe.Dispute;
      const paymentId = dispute.metadata?.["payment_id"] ?? (typeof dispute.charge === "string" ? null : null);
      const organizationId = dispute.metadata?.["organization_id"];
      const chargeId = typeof dispute.charge === "string" ? dispute.charge : dispute.charge?.id;
      let resolvedPaymentId = paymentId;
      let resolvedOrg = organizationId;
      if (!resolvedPaymentId && chargeId) {
        const { data: payment } = await supabase
          .from("financial_payments")
          .select("id, organization_id")
          .eq("stripe_payment_intent_id", typeof dispute.payment_intent === "string" ? dispute.payment_intent : "")
          .maybeSingle();
        resolvedPaymentId = payment?.id ?? null;
        resolvedOrg = payment?.organization_id ?? resolvedOrg;
      }
      if (resolvedPaymentId && resolvedOrg) {
        await recordPaymentDispute(supabase, {
          organizationId: resolvedOrg,
          paymentId: resolvedPaymentId,
          disputeId: dispute.id,
          disputeStatus: dispute.status,
          lost: event.type === "charge.dispute.closed" && dispute.status === "lost",
          amount: dispute.amount / 100,
          correlationId: event.id
        });
      }
      await supabase
        .from("financial_stripe_webhook_events")
        .update({ processed_at: new Date().toISOString(), organization_id: resolvedOrg ?? null })
        .eq("stripe_event_id", event.id);
    }

    if (event.type === "account.updated") {
      const account = event.data.object as Stripe.Account;
      const organizationId = account.metadata?.["organization_id"];
      if (organizationId) {
        await syncConnectAccount(supabase, organizationId, null);
      }
      await supabase
        .from("financial_stripe_webhook_events")
        .update({ processed_at: new Date().toISOString(), organization_id: organizationId ?? null })
        .eq("stripe_event_id", event.id);
    }

    if (!HANDLED.has(event.type)) {
      await supabase
        .from("financial_stripe_webhook_events")
        .update({ processed_at: new Date().toISOString() })
        .eq("stripe_event_id", event.id);
    }

    return NextResponse.json({ ok: true, verifiedWith });
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
