import { NextResponse } from "next/server";
import { COM_002_FLAGS, isProductSku } from "@mpa/shared";
import { getSaasStripeClient } from "../../../../../lib/saas-stripe/client";
import { getSaasPurchaseBySessionId } from "../../../../../lib/saas-stripe/purchase-store";
import { minimalCheckoutSessionPayload } from "../../../../../lib/saas-commerce/session-privacy";
import {
  clientLookupKey,
  consumeCommerceSessionLookupRateLimit
} from "../../../../../lib/saas-commerce/session-lookup-rate-limit";

export const runtime = "nodejs";

/**
 * STAB-009 — purchase confirmation poll for checkout success page.
 * Soft-marks paid sessions and may start provisioning server-side.
 * Response is minimized: no organizationId, userId, email, or Stripe object dump.
 */
export async function GET(request: Request) {
  if (!COM_002_FLAGS.sliceC_stripeCheckout) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const sessionId = new URL(request.url).searchParams.get("session_id")?.trim() ?? "";
  if (!sessionId) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  if (!(await consumeCommerceSessionLookupRateLimit(clientLookupKey(request, `checkout:${sessionId}`)))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let purchase = getSaasPurchaseBySessionId(sessionId);
  const stripe = getSaasStripeClient();
  if (stripe && (!purchase || purchase.status === "checkout_created")) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status === "paid" || session.status === "complete") {
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
          const metaSku = session.metadata["mpa_product_sku"];
          purchase = rememberSaasPurchase({
            id: crypto.randomUUID(),
            stripeCheckoutSessionId: session.id,
            stripeCustomerId: typeof session.customer === "string" ? session.customer : null,
            stripeSubscriptionId:
              typeof session.subscription === "string" ? session.subscription : null,
            catalogOfferId: session.metadata["mpa_catalog_offer_id"] ?? "unknown",
            productSku: isProductSku(metaSku) ? metaSku : "mpa_property_manager",
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
      // Fall through with store state — never expose Stripe errors.
    }
  }

  if (!purchase) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (COM_002_FLAGS.sliceD_automaticProvisioning && purchase.status === "checkout_completed") {
    try {
      const { getProvisioningJob } = await import(
        "../../../../../lib/saas-provisioning/jobs-store"
      );
      if (!getProvisioningJob(sessionId)) {
        const { startOrAdvanceProvisioningFromPurchase } = await import(
          "../../../../../lib/saas-provisioning/run-provisioning"
        );
        await startOrAdvanceProvisioningFromPurchase(purchase);
        purchase = getSaasPurchaseBySessionId(sessionId) ?? purchase;
      }
    } catch {
      // Job records failures; minimized purchase status still returned.
    }
  }

  return NextResponse.json(
    minimalCheckoutSessionPayload({
      status: purchase.status,
      productSku: purchase.productSku,
      billingCycle: purchase.billingCycle,
      workspacePreparing: !purchase.provisioned,
      continuePath:
        purchase.status === "checkout_completed"
          ? `/commerce/continue?session_id=${encodeURIComponent(purchase.stripeCheckoutSessionId)}`
          : null
    })
  );
}
