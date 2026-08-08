import type Stripe from "stripe";
import { isSaasCheckoutMetadata } from "@mpa/shared";
import { serverEnv } from "../env/server-env";
import { getSaasStripeClient } from "./client";
import {
  getSaasPurchaseBySessionId,
  markSaasWebhookProcessed,
  rememberSaasPurchase,
  rememberSaasWebhookEvent,
  updateSaasPurchase
} from "./purchase-store";

export type SaasWebhookResult =
  | { ok: true; duplicate?: boolean; ignored?: boolean; handled?: string }
  | { ok: false; status: number; error: string };

function metaFromSession(session: Stripe.Checkout.Session): Record<string, string> {
  return Object.fromEntries(
    Object.entries(session.metadata ?? {}).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string"
    )
  );
}

function ensurePurchaseFromSession(session: Stripe.Checkout.Session) {
  const existing = getSaasPurchaseBySessionId(session.id);
  if (existing) {
    return existing;
  }
  const meta = metaFromSession(session);
  if (!isSaasCheckoutMetadata(meta)) {
    return null;
  }
  const now = new Date().toISOString();
  return rememberSaasPurchase({
    id: crypto.randomUUID(),
    stripeCheckoutSessionId: session.id,
    stripeCustomerId: typeof session.customer === "string" ? session.customer : null,
    stripeSubscriptionId: typeof session.subscription === "string" ? session.subscription : null,
    catalogOfferId: meta["mpa_catalog_offer_id"] ?? session.client_reference_id ?? "unknown",
    productSku: "mpa_property_manager",
    planTier: meta["mpa_plan_tier"] === "business" ? "business" : "professional",
    billingCycle: meta["mpa_billing_cycle"] === "annual" ? "annual" : "monthly",
    status: "checkout_created",
    customerEmail: session.customer_details?.email ?? session.customer_email ?? null,
    idempotencyKey: null,
    demoSessionId: meta["mpa_demo_session_id"] ?? null,
    metadata: meta,
    provisioned: false,
    organizationId: null,
    userId: null,
    createdAt: now,
    updatedAt: now
  });
}

export function verifySaasStripeWebhook(
  body: string,
  signature: string | null
): { ok: true; event: Stripe.Event } | { ok: false; status: number; error: string } {
  const stripe = getSaasStripeClient();
  if (!stripe || !serverEnv.STRIPE_SAAS_WEBHOOK_SECRET) {
    return { ok: false, status: 503, error: "saas_webhook_not_configured" };
  }
  if (!signature) {
    return { ok: false, status: 400, error: "missing_signature" };
  }
  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      serverEnv.STRIPE_SAAS_WEBHOOK_SECRET
    );
    return { ok: true, event };
  } catch (error) {
    return {
      ok: false,
      status: 400,
      error: error instanceof Error ? error.message : "invalid_signature"
    };
  }
}

export async function handleSaasStripeEvent(event: Stripe.Event): Promise<SaasWebhookResult> {
  const remembered = rememberSaasWebhookEvent({
    stripeEventId: event.id,
    eventType: event.type,
    payload: event,
    processedAt: null,
    checkoutSessionId: null,
    createdAt: new Date().toISOString()
  });
  if (remembered.duplicate) {
    return { ok: true, duplicate: true };
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const meta = metaFromSession(session);
      if (!isSaasCheckoutMetadata(meta)) {
        markSaasWebhookProcessed(event.id, session.id);
        return { ok: true, ignored: true };
      }
      ensurePurchaseFromSession(session);
      updateSaasPurchase(session.id, {
        status: "checkout_completed",
        stripeCustomerId: typeof session.customer === "string" ? session.customer : null,
        stripeSubscriptionId:
          typeof session.subscription === "string" ? session.subscription : null,
        customerEmail: session.customer_details?.email ?? session.customer_email ?? null
      });
      try {
        const { COM_002_FLAGS } = await import("@mpa/shared");
        if (COM_002_FLAGS.sliceD_automaticProvisioning) {
          const { startOrAdvanceProvisioningFromCheckoutSession } = await import(
            "../saas-provisioning/run-provisioning"
          );
          await startOrAdvanceProvisioningFromCheckoutSession({
            id: session.id,
            customer: typeof session.customer === "string" ? session.customer : null,
            subscription: typeof session.subscription === "string" ? session.subscription : null,
            customer_email: session.customer_email,
            customer_details: session.customer_details,
            metadata: meta
          });
        }
      } catch {
        // Provisioning failures are tracked on the job; webhook still acks to allow retry/reconcile.
      }
      markSaasWebhookProcessed(event.id, session.id);
      return { ok: true, handled: event.type };
    }
    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (!isSaasCheckoutMetadata(metaFromSession(session))) {
        markSaasWebhookProcessed(event.id, session.id);
        return { ok: true, ignored: true };
      }
      updateSaasPurchase(session.id, { status: "checkout_expired" });
      markSaasWebhookProcessed(event.id, session.id);
      return { ok: true, handled: event.type };
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
    case "invoice.paid":
    case "invoice.payment_failed":
    case "invoice.payment_action_required":
    case "charge.refunded":
    case "charge.dispute.created":
    case "charge.dispute.closed": {
      // Persist/ack only — subscription lifecycle & provisioning are later slices.
      markSaasWebhookProcessed(event.id, null);
      return { ok: true, handled: event.type };
    }
    default: {
      markSaasWebhookProcessed(event.id, null);
      return { ok: true, ignored: true };
    }
  }
}
