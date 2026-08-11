import type Stripe from "stripe";
import { COM_002_FLAGS, isSaasCheckoutMetadata } from "@mpa/shared";
import { serverEnv } from "../env/server-env";
import { getSaasStripeClient } from "./client";
import {
  getSaasPurchaseBySessionId,
  listSaasPurchases,
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

function metaRecord(metadata: Stripe.Metadata | null | undefined): Record<string, string> {
  return Object.fromEntries(
    Object.entries(metadata ?? {}).filter(
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

function planTierFromMeta(meta: Record<string, string>): "professional" | "business" | undefined {
  if (meta["mpa_plan_tier"] === "business") return "business";
  if (meta["mpa_plan_tier"] === "professional") return "professional";
  return undefined;
}

function billingCycleFromMeta(meta: Record<string, string>): "monthly" | "annual" | undefined {
  if (meta["mpa_billing_cycle"] === "annual") return "annual";
  if (meta["mpa_billing_cycle"] === "monthly") return "monthly";
  return undefined;
}

function customerIdFromDispute(dispute: Stripe.Dispute): string | null {
  const charge = dispute.charge;
  if (charge && typeof charge === "object" && "customer" in charge) {
    return typeof charge.customer === "string" ? charge.customer : null;
  }
  return null;
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

async function handleLifecycleEvent(event: Stripe.Event): Promise<void> {
  if (!COM_002_FLAGS.sliceE_subscriptionLifecycle) {
    return;
  }
  const {
    applyChargeRefunded,
    applyDisputeClosed,
    applyDisputeCreated,
    applyInvoicePaid,
    applyInvoicePaymentActionRequired,
    applyInvoicePaymentFailed,
    applySubscriptionCreatedOrUpdated,
    seedLifecycleFromPurchase
  } = await import("../saas-lifecycle/apply-lifecycle");

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
    case "customer.subscription.trial_will_end": {
      const subscription = event.data.object as Stripe.Subscription & {
        current_period_end?: number;
        trial_end?: number | null;
        items?: { data?: Array<{ id: string; quantity?: number | null; price?: { id?: string } | null }> };
      };
      const meta = metaRecord(subscription.metadata);
      const periodEndUnix = subscription.current_period_end;
      const periodEnd =
        typeof periodEndUnix === "number"
          ? new Date(periodEndUnix * 1000).toISOString()
          : null;
      const planTier = planTierFromMeta(meta);
      const billingCycle = billingCycleFromMeta(meta);
      const items = subscription.items?.data ?? [];
      const baseItem = items[0] ?? null;
      const capacityItem =
        items.length > 1 ? items.find((item) => (item.quantity ?? 0) > 0 && item.id !== baseItem?.id) : null;
      const managedUnitCount = meta["mpa_managed_units"]
        ? Number(meta["mpa_managed_units"])
        : null;
      const authorizedAdditionalBlocks = meta["mpa_additional_blocks"]
        ? Number(meta["mpa_additional_blocks"])
        : capacityItem?.quantity ?? null;
      const authorizedUnitCapacity = meta["mpa_authorized_unit_capacity"]
        ? Number(meta["mpa_authorized_unit_capacity"])
        : null;
      const trialEndsAt =
        typeof subscription.trial_end === "number"
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null;
      await applySubscriptionCreatedOrUpdated({
        stripeSubscriptionId: subscription.id,
        stripeCustomerId:
          typeof subscription.customer === "string" ? subscription.customer : null,
        stripeStatus:
          event.type === "customer.subscription.deleted" ? "canceled" : subscription.status,
        cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
        currentPeriodEnd: periodEnd,
        ...(planTier ? { planTier } : {}),
        ...(billingCycle ? { billingCycle } : {}),
        stripeBaseItemId: baseItem?.id ?? null,
        stripeAdditionalCapacityItemId: capacityItem?.id ?? null,
        managedUnitCount: Number.isFinite(managedUnitCount) ? managedUnitCount : null,
        authorizedAdditionalBlocks: Number.isFinite(authorizedAdditionalBlocks as number)
          ? (authorizedAdditionalBlocks as number)
          : null,
        authorizedUnitCapacity: Number.isFinite(authorizedUnitCapacity as number)
          ? (authorizedUnitCapacity as number)
          : null,
        quoteId: meta["mpa_quote_id"] ?? null,
        trialEndsAt,
        eventId: event.id,
        eventType: event.type
      });
      return;
    }
    case "invoice.created": {
      // Prepared for Slice 4 capacity reconciliation — ack only for now.
      return;
    }
    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice & {
        subscription?: string | Stripe.Subscription | null;
      };
      const subId =
        typeof invoice.subscription === "string" ? invoice.subscription : null;
      if (subId) {
        const purchase = listSaasPurchases().find((p) => p.stripeSubscriptionId === subId);
        if (purchase?.stripeCheckoutSessionId) {
          seedLifecycleFromPurchase(purchase.stripeCheckoutSessionId);
        }
      }
      await applyInvoicePaid({
        stripeSubscriptionId: subId,
        stripeCustomerId: typeof invoice.customer === "string" ? invoice.customer : null,
        ...(typeof invoice.amount_paid === "number" ? { amountCents: invoice.amount_paid } : {}),
        eventId: event.id
      });
      return;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice & {
        subscription?: string | Stripe.Subscription | null;
      };
      await applyInvoicePaymentFailed({
        stripeSubscriptionId:
          typeof invoice.subscription === "string" ? invoice.subscription : null,
        stripeCustomerId: typeof invoice.customer === "string" ? invoice.customer : null,
        ...(typeof invoice.amount_due === "number" ? { amountCents: invoice.amount_due } : {}),
        eventId: event.id
      });
      return;
    }
    case "invoice.payment_action_required": {
      const invoice = event.data.object as Stripe.Invoice & {
        subscription?: string | Stripe.Subscription | null;
      };
      await applyInvoicePaymentActionRequired({
        stripeSubscriptionId:
          typeof invoice.subscription === "string" ? invoice.subscription : null,
        stripeCustomerId: typeof invoice.customer === "string" ? invoice.customer : null,
        eventId: event.id
      });
      return;
    }
    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      await applyChargeRefunded({
        stripeSubscriptionId: null,
        stripeCustomerId: typeof charge.customer === "string" ? charge.customer : null,
        ...(typeof charge.amount_refunded === "number"
          ? { amountCents: charge.amount_refunded }
          : {}),
        eventId: event.id
      });
      return;
    }
    case "charge.dispute.created": {
      const dispute = event.data.object as Stripe.Dispute;
      const customerId = customerIdFromDispute(dispute);
      const linked = customerId
        ? listSaasPurchases().find((p) => p.stripeCustomerId === customerId) ?? null
        : null;
      await applyDisputeCreated({
        stripeSubscriptionId: linked?.stripeSubscriptionId ?? null,
        stripeCustomerId: customerId,
        eventId: event.id
      });
      return;
    }
    case "charge.dispute.closed": {
      const dispute = event.data.object as Stripe.Dispute;
      const customerId = customerIdFromDispute(dispute);
      const linked = customerId
        ? listSaasPurchases().find((p) => p.stripeCustomerId === customerId) ?? null
        : null;
      await applyDisputeClosed({
        stripeSubscriptionId: linked?.stripeSubscriptionId ?? null,
        stripeCustomerId: customerId,
        won: dispute.status === "won",
        eventId: event.id
      });
      return;
    }
    default:
      return;
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
        if (COM_002_FLAGS.sliceE_subscriptionLifecycle && typeof session.subscription === "string") {
          const { seedLifecycleFromPurchase } = await import("../saas-lifecycle/apply-lifecycle");
          seedLifecycleFromPurchase(session.id);
        }
      } catch {
        // Provisioning/lifecycle failures are tracked on stores; webhook still acks.
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
    case "customer.subscription.trial_will_end":
    case "invoice.created":
    case "invoice.paid":
    case "invoice.payment_failed":
    case "invoice.payment_action_required":
    case "charge.refunded":
    case "charge.dispute.created":
    case "charge.dispute.closed": {
      try {
        await handleLifecycleEvent(event);
      } catch {
        // Persist ack; sweeper/reconcile can repair.
      }
      markSaasWebhookProcessed(event.id, null);
      return { ok: true, handled: event.type };
    }
    default: {
      markSaasWebhookProcessed(event.id, null);
      return { ok: true, ignored: true };
    }
  }
}
