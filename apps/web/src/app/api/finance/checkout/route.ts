import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  connectAccountReady,
  createCheckoutInputSchema,
  paymentMethodOfferedForOrganization,
  remainingBalance,
  resolveCheckoutAmount,
  roundMoney,
  stripeHostedPaymentMethodConfig
} from "@mpa/shared";
import { createAuthServerClient } from "../../../../lib/auth/server";
import {
  acceptedPaymentMethodDeniedResponse,
  authorizeFinanceCheckout,
  orgSkuAllowsResidentialFinance,
  stripePaymentExecutionDisabledResponse
} from "../../../../lib/finance/checkout-authz";
import { connectUnavailableResponse } from "../../../../lib/finance/connect-service";
import { loadTenantPaymentGate } from "../../../../lib/finance/online-payments-service";
import { emitFinanceEvent, writeFinanceAudit } from "../../../../lib/finance/events-audit";
import {
  connectedRequestOptions,
  getStripeClient,
  isStripeConfigured,
  randomIntegrationSuffix
} from "../../../../lib/finance/stripe";
import { createServiceRoleClient } from "../../../../lib/supabase/service-role";
import { serverEnv } from "../../../../lib/env/server-env";

export async function POST(request: Request) {
  const authClient = await createAuthServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = authClient as SupabaseClient<any>;
  const {
    data: { user }
  } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = createCheckoutInputSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const { data: leaseRow } = await supabase
    .from("lease_agreements")
    .select("id, property_id, organization_id")
    .eq("id", parsed.data.leaseId)
    .maybeSingle();

  if (!leaseRow) {
    return NextResponse.json({ error: "Lease not found" }, { status: 404 });
  }

  const { data: residentLink } = await supabase
    .from("lease_residents")
    .select("id, occupancy_status, occupy_from, occupy_to")
    .eq("lease_id", leaseRow.id)
    .eq("user_id", user.id)
    .maybeSingle();

  const { occupancyIsCurrent } = await import("@mpa/shared");
  const occupying =
    residentLink &&
    occupancyIsCurrent({
      occupancyStatus: (residentLink.occupancy_status as "scheduled" | "occupying" | "moved_out") ?? "occupying",
      occupyFrom: (residentLink.occupy_from as string | null) ?? "1970-01-01",
      occupyTo: (residentLink.occupy_to as string | null) ?? null
    });

  const authorized = await authorizeFinanceCheckout({
    residentLinkId: occupying ? residentLink.id : null,
    leaseOrganizationId: leaseRow.organization_id
  });
  if ("error" in authorized) {
    return authorized.error;
  }

  let writer;
  try {
    writer = createServiceRoleClient();
  } catch {
    writer = supabase;
  }

  const [{ data: subscription }, gate] = await Promise.all([
    writer
      .from("organization_subscriptions")
      .select("sku_code, status")
      .eq("organization_id", leaseRow.organization_id)
      .maybeSingle(),
    loadTenantPaymentGate(writer, leaseRow.organization_id)
  ]);

  const skuCode = subscription && subscription.status !== "canceled" ? subscription.sku_code : null;
  if (!orgSkuAllowsResidentialFinance(skuCode)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!gate.executionEnabled) {
    return stripePaymentExecutionDisabledResponse();
  }

  const connect = gate.connect;
  if (!connectAccountReady(connect) || !connect?.stripe_account_id) {
    return NextResponse.json(connectUnavailableResponse(connect), { status: 403 });
  }

  if (
    !paymentMethodOfferedForOrganization({
      paymentMethodType: parsed.data.paymentMethodType,
      accepted: gate.accepted,
      supported: gate.supported
    })
  ) {
    return acceptedPaymentMethodDeniedResponse(parsed.data.paymentMethodType);
  }

  if (!isStripeConfigured()) {
    return NextResponse.json(
      {
        error:
          "Online payments are not configured. Ask your property manager to record a manual payment, or set STRIPE_SECRET_KEY."
      },
      { status: 503 }
    );
  }

  const stripe = getStripeClient();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe unavailable" }, { status: 503 });
  }

  let chargeQuery = supabase
    .from("financial_charges")
    .select("*")
    .eq("organization_id", leaseRow.organization_id)
    .eq("lease_id", leaseRow.id)
    .in("status", ["open", "partially_paid"]);

  if (parsed.data.chargeIds?.length) {
    chargeQuery = chargeQuery.in("id", parsed.data.chargeIds);
  }

  const { data: charges, error: chargesError } = await chargeQuery;
  if (chargesError) {
    return NextResponse.json({ error: chargesError.message }, { status: 400 });
  }

  const remaining = roundMoney(
    (charges ?? []).reduce(
      (sum, charge) =>
        sum +
        remainingBalance({
          amount: Number(charge.amount),
          amount_paid: Number(charge.amount_paid)
        }),
      0
    )
  );
  const amountResult = resolveCheckoutAmount({
    remaining,
    ...(parsed.data.amount != null ? { requestedAmount: parsed.data.amount } : {})
  });
  if (!amountResult.ok) {
    return NextResponse.json({ error: amountResult.error }, { status: 400 });
  }
  const amount = amountResult.amount;
  const selectedChargeIds = (charges ?? []).map((charge) => charge.id as string);

  const { data: existingPending } = await writer
    .from("financial_payments")
    .select("id, amount, status, stripe_checkout_session_id, metadata")
    .eq("organization_id", leaseRow.organization_id)
    .eq("lease_id", leaseRow.id)
    .eq("status", "pending")
    .eq("amount", amount)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingPending?.stripe_checkout_session_id) {
    try {
      const existingSession = await stripe.checkout.sessions.retrieve(
        existingPending.stripe_checkout_session_id,
        {},
        connectedRequestOptions(connect.stripe_account_id)
      );
      const sameMethod =
        (existingPending.metadata as { payment_method_type?: string } | null)?.payment_method_type ===
        parsed.data.paymentMethodType;
      if (existingSession.status === "open" && existingSession.url && sameMethod) {
        return NextResponse.json({
          checkoutUrl: existingSession.url,
          sessionId: existingSession.id,
          paymentId: existingPending.id,
          amount,
          reused: true
        });
      }
    } catch {
      // Create a new session below.
    }
  }

  const currency = (charges?.[0]?.currency ?? "USD").toLowerCase();
  const { data: resident } = await supabase
    .from("lease_residents")
    .select("id")
    .eq("lease_id", leaseRow.id)
    .eq("is_primary", true)
    .maybeSingle();

  const { data: payment, error: paymentError } = await writer
    .from("financial_payments")
    .insert({
      organization_id: leaseRow.organization_id,
      property_id: leaseRow.property_id,
      lease_id: leaseRow.id,
      resident_id: resident?.id ?? residentLink?.id ?? null,
      amount,
      currency: currency.toUpperCase(),
      status: "pending",
      method: "online_stripe",
      recorded_by: user.id,
      stripe_connect_account_id: connect.stripe_account_id,
      selected_charge_ids: selectedChargeIds,
      metadata: { source: "pay_once", payment_method_type: parsed.data.paymentMethodType }
    })
    .select("*")
    .single();

  if (paymentError) {
    return NextResponse.json({ error: paymentError.message }, { status: 400 });
  }

  const successUrl =
    parsed.data.successUrl ??
    `${serverEnv.NEXT_PUBLIC_APP_URL}/portal/tenant/billing?payment=success&method=${parsed.data.paymentMethodType}&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl =
    parsed.data.cancelUrl ?? `${serverEnv.NEXT_PUBLIC_APP_URL}/portal/tenant/billing?payment=cancelled`;
  const methodConfig = stripeHostedPaymentMethodConfig(parsed.data.paymentMethodType);

  try {
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        ...methodConfig,
        success_url: successUrl,
        cancel_url: cancelUrl,
        client_reference_id: payment.id,
        metadata: {
          payment_id: payment.id,
          organization_id: leaseRow.organization_id,
          lease_id: leaseRow.id,
          domain: "tenant_property",
          payment_method_type: parsed.data.paymentMethodType
        },
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency,
              unit_amount: Math.round(amount * 100),
              product_data: {
                name: "Resident balance payment",
                description: `Lease ${leaseRow.id.slice(0, 8)}`
              }
            }
          }
        ],
        integration_identifier: `mpa-resident-pay-${randomIntegrationSuffix()}`
      } as unknown as Parameters<typeof stripe.checkout.sessions.create>[0],
      connectedRequestOptions(connect.stripe_account_id, `checkout:${payment.id}`)
    );

    await writer
      .from("financial_payments")
      .update({ stripe_checkout_session_id: session.id, updated_at: new Date().toISOString() })
      .eq("id", payment.id);

    await emitFinanceEvent({
      supabase: writer,
      organizationId: leaseRow.organization_id,
      actorId: user.id,
      eventType: "finance.payment.pending",
      aggregateType: "financial_payment",
      aggregateId: payment.id,
      payload: { sessionId: session.id, amount, source: "pay_once" }
    });
    await writeFinanceAudit({
      supabase: writer,
      organizationId: leaseRow.organization_id,
      actorId: user.id,
      action: "finance.payment.succeeded",
      entityType: "financial_payment",
      entityId: payment.id,
      payload: { stage: "checkout_created", sessionId: session.id, connectAccount: connect.stripe_account_id }
    });

    return NextResponse.json({
      checkoutUrl: session.url,
      sessionId: session.id,
      paymentId: payment.id,
      amount
    });
  } catch (error) {
    await writer
      .from("financial_payments")
      .update({
        status: "failed",
        failure_reason: "checkout_create_failed",
        updated_at: new Date().toISOString()
      })
      .eq("id", payment.id);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Checkout failed" },
      { status: 400 }
    );
  }
}
