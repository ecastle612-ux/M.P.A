/**
 * Reconstruct a COM-002 purchase from a live Stripe Checkout Session.
 * Used when serverless memory is empty but payment already completed.
 */

import type { BillingCycle, PlanTier } from "@mpa/shared";
import { getSaasStripeClient } from "./client";
import {
  getSaasPurchaseBySessionId,
  rememberSaasPurchase,
  updateSaasPurchase,
  type StoredSaasPurchase
} from "./purchase-store";

export async function ensurePurchaseFromStripeSession(
  sessionId: string
): Promise<StoredSaasPurchase | null> {
  const existing = getSaasPurchaseBySessionId(sessionId);
  const stripe = getSaasStripeClient();
  if (!stripe) {
    return existing;
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const meta = Object.fromEntries(
      Object.entries(session.metadata ?? {}).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string"
      )
    );
    if (meta["mpa_money_domain"] !== "saas_billing") {
      return existing;
    }

    const planTier: PlanTier =
      meta["mpa_plan_tier"] === "business" ? "business" : "professional";
    const billingCycle: BillingCycle =
      meta["mpa_billing_cycle"] === "annual" ? "annual" : "monthly";
    const completed =
      session.payment_status === "paid" || session.status === "complete";
    const status: StoredSaasPurchase["status"] = completed
      ? "checkout_completed"
      : session.status === "expired"
        ? "checkout_expired"
        : "checkout_created";

    if (existing) {
      return (
        updateSaasPurchase(sessionId, {
          status,
          stripeCustomerId:
            typeof session.customer === "string" ? session.customer : existing.stripeCustomerId,
          stripeSubscriptionId:
            typeof session.subscription === "string"
              ? session.subscription
              : existing.stripeSubscriptionId,
          customerEmail:
            session.customer_details?.email ?? session.customer_email ?? existing.customerEmail
        }) ?? existing
      );
    }

    const now = new Date().toISOString();
    return rememberSaasPurchase({
      id: crypto.randomUUID(),
      stripeCheckoutSessionId: session.id,
      stripeCustomerId: typeof session.customer === "string" ? session.customer : null,
      stripeSubscriptionId:
        typeof session.subscription === "string" ? session.subscription : null,
      catalogOfferId: meta["mpa_catalog_offer_id"] ?? session.client_reference_id ?? "unknown",
      productSku: "mpa_property_manager",
      planTier,
      billingCycle,
      status,
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
  } catch {
    return existing;
  }
}
