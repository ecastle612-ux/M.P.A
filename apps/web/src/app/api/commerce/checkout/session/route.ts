import { NextResponse } from "next/server";
import { COM_002_FLAGS } from "@mpa/shared";
import { getSaasStripeClient } from "../../../../../lib/saas-stripe/client";
import { getSaasPurchaseBySessionId } from "../../../../../lib/saas-stripe/purchase-store";

export const runtime = "nodejs";

/** Read-only purchase status for success page polling — no provisioning. */
export async function GET(request: Request) {
  if (!COM_002_FLAGS.sliceC_stripeCheckout) {
    return NextResponse.json({ error: "slice_disabled" }, { status: 404 });
  }
  const sessionId = new URL(request.url).searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ error: "missing_session_id" }, { status: 400 });
  }

  let purchase = getSaasPurchaseBySessionId(sessionId);
  const stripe = getSaasStripeClient();
  if (stripe && (!purchase || purchase.status === "checkout_created")) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status === "paid" || session.status === "complete") {
        // Soft-mark from redirect race if webhook is delayed — still no provision.
        const { updateSaasPurchase, rememberSaasPurchase } = await import(
          "../../../../../lib/saas-stripe/purchase-store"
        );
        if (purchase) {
          purchase =
            updateSaasPurchase(sessionId, {
              status: "checkout_completed",
              stripeCustomerId: typeof session.customer === "string" ? session.customer : null,
              stripeSubscriptionId:
                typeof session.subscription === "string" ? session.subscription : null,
              customerEmail: session.customer_details?.email ?? session.customer_email ?? null
            }) ?? purchase;
        } else if (session.metadata?.["mpa_money_domain"] === "saas_billing") {
          const now = new Date().toISOString();
          purchase = rememberSaasPurchase({
            id: crypto.randomUUID(),
            stripeCheckoutSessionId: session.id,
            stripeCustomerId: typeof session.customer === "string" ? session.customer : null,
            stripeSubscriptionId:
              typeof session.subscription === "string" ? session.subscription : null,
            catalogOfferId: session.metadata["mpa_catalog_offer_id"] ?? "unknown",
            productSku: "mpa_property_manager",
            planTier: session.metadata["mpa_plan_tier"] === "business" ? "business" : "professional",
            billingCycle: session.metadata["mpa_billing_cycle"] === "annual" ? "annual" : "monthly",
            status: "checkout_completed",
            customerEmail: session.customer_details?.email ?? session.customer_email ?? null,
            idempotencyKey: null,
            demoSessionId: session.metadata["mpa_demo_session_id"] ?? null,
            metadata: Object.fromEntries(
              Object.entries(session.metadata).filter(
                (e): e is [string, string] => typeof e[1] === "string"
              )
            ),
            provisioned: false,
            organizationId: null,
            userId: null,
            createdAt: now,
            updatedAt: now
          });
        }
      } else if (session.status === "expired") {
        const { updateSaasPurchase } = await import("../../../../../lib/saas-stripe/purchase-store");
        purchase = updateSaasPurchase(sessionId, { status: "checkout_expired" }) ?? purchase;
      }
    } catch {
      // Fall through with store state.
    }
  }

  if (!purchase) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({
    sessionId: purchase.stripeCheckoutSessionId,
    status: purchase.status,
    offerId: purchase.catalogOfferId,
    planTier: purchase.planTier,
    billingCycle: purchase.billingCycle,
    provisioned: false,
    organizationId: null,
    userId: null
  });
}
