import type { SupabaseClient } from "@supabase/supabase-js";
import {
  AUTOPAY_CONSENT_TEXT,
  autopayConsentForMethod,
  autopayCoverageCopy,
  chargeIsAutopayEligible,
  enrollmentPaymentMethodType,
  occupancyIsCurrent,
  paymentMethodOfferedForOrganization,
  remainingBalance,
  resolveCheckoutAmount,
  roundMoney,
  stripeHostedPaymentMethodConfig,
  type ChargeType,
  type TenantPaymentMethodType
} from "@mpa/shared";
import { applySucceededPayment, markPaymentFailed, markPaymentProcessing } from "./billing-service";
import { stripePaymentExecutionEnabled } from "./checkout-authz";
import { connectAccountReady, loadConnectAccount } from "./connect-service";
import { emitFinanceEvent, writeFinanceAudit, writeFinanceNotification } from "./events-audit";
import { loadTenantPaymentGate, pauseAutopayForDisabledMethod } from "./online-payments-service";
import { connectedRequestOptions, getStripeClient } from "./stripe";
import { serverEnv } from "../env/server-env";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any>;

export function tenantConsentAccepted(
  consentText: string,
  paymentMethodType: TenantPaymentMethodType = "card"
): boolean {
  const normalized = consentText.trim().toLowerCase();
  const base =
    normalized.includes("i authorize") &&
    normalized.includes("autopay") &&
    !normalized.includes("admin can enroll");
  if (!base) {
    return false;
  }
  if (paymentMethodType === "us_bank_account") {
    return normalized.includes("bank") || normalized.includes("ach");
  }
  return true;
}

export async function loadAutopayEnrollment(supabase: Db, organizationId: string, leaseId: string) {
  const { data, error } = await supabase
    .from("financial_autopay_enrollments")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("lease_id", leaseId)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export function describeAutopay(
  enrollment: {
    status?: string | null;
    paused_reason?: string | null;
    payment_method_brand?: string | null;
    payment_method_last4?: string | null;
    payment_method_type?: string | null;
  } | null,
  extras?: { nextDue?: string | null; nextAmount?: number | null }
) {
  return {
    on: enrollment?.status === "active",
    status: enrollment?.status ?? "off",
    paused: enrollment?.status === "paused",
    pausedReason: enrollment?.paused_reason ?? null,
    paymentMethodType: enrollmentPaymentMethodType(enrollment),
    paymentMethod:
      enrollment?.payment_method_last4
        ? `${enrollment.payment_method_brand ?? "card"} •••• ${enrollment.payment_method_last4}`
        : null,
    covers: autopayCoverageCopy(),
    consentRequired: AUTOPAY_CONSENT_TEXT,
    nextDue: extras?.nextDue ?? null,
    nextAmount: extras?.nextAmount ?? null
  };
}

export async function startAutopaySetup(
  supabase: Db,
  args: {
    organizationId: string;
    leaseId: string;
    residentId: string;
    userId: string;
    consentText: string;
    paymentMethodType: TenantPaymentMethodType;
  }
) {
  if (!tenantConsentAccepted(args.consentText, args.paymentMethodType)) {
    throw new Error("autopay_consent_required");
  }
  const gate = await loadTenantPaymentGate(supabase, args.organizationId);
  if (
    !paymentMethodOfferedForOrganization({
      paymentMethodType: args.paymentMethodType,
      accepted: gate.accepted,
      supported: gate.supported
    })
  ) {
    throw new Error("accepted_payment_method_disabled");
  }
  const connect = gate.connect;
  if (!connectAccountReady(connect)) {
    throw new Error("stripe_connect_not_ready");
  }
  const stripe = getStripeClient();
  if (!stripe || !connect?.stripe_account_id) {
    throw new Error("Stripe unavailable");
  }

  let customerId: string | null = null;
  const { data: existingCustomer } = await supabase
    .from("financial_stripe_customers")
    .select("stripe_customer_id")
    .eq("organization_id", args.organizationId)
    .eq("lease_id", args.leaseId)
    .eq("stripe_account_id", connect.stripe_account_id)
    .maybeSingle();
  if (existingCustomer?.stripe_customer_id) {
    customerId = existingCustomer.stripe_customer_id as string;
  } else {
    const customer = await stripe.customers.create(
      {
        metadata: {
          organization_id: args.organizationId,
          lease_id: args.leaseId,
          resident_id: args.residentId
        }
      },
      connectedRequestOptions(connect.stripe_account_id)
    );
    customerId = customer.id;
    await supabase.from("financial_stripe_customers").insert({
      organization_id: args.organizationId,
      lease_id: args.leaseId,
      resident_id: args.residentId,
      stripe_account_id: connect.stripe_account_id,
      stripe_customer_id: customer.id
    });
  }

  const methodConfig = stripeHostedPaymentMethodConfig(args.paymentMethodType);
  const consent = autopayConsentForMethod(args.paymentMethodType);
  const session = await stripe.checkout.sessions.create(
    {
      mode: "setup",
      customer: customerId,
      ...methodConfig,
      success_url: `${serverEnv.NEXT_PUBLIC_APP_URL}/portal/tenant/billing?autopay=return&leaseId=${args.leaseId}&method=${args.paymentMethodType}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${serverEnv.NEXT_PUBLIC_APP_URL}/portal/tenant/billing?autopay=cancelled`,
      metadata: {
        organization_id: args.organizationId,
        lease_id: args.leaseId,
        resident_id: args.residentId,
        source: "autopay_setup",
        domain: "tenant_property",
        payment_method_type: args.paymentMethodType
      }
    } as unknown as Parameters<typeof stripe.checkout.sessions.create>[0],
    connectedRequestOptions(connect.stripe_account_id, `autopay-setup:${args.leaseId}:${customerId}`)
  );

  return {
    checkoutUrl: session.url,
    sessionId: session.id,
    consentText: consent.text,
    consentVersion: consent.version,
    paymentMethodType: args.paymentMethodType
  };
}

export async function confirmAutopayEnrollment(
  supabase: Db,
  args: {
    organizationId: string;
    leaseId: string;
    residentId: string;
    userId: string;
    setupIntentId?: string;
    checkoutSessionId?: string;
    consentText: string;
    paymentMethodType: TenantPaymentMethodType;
  }
) {
  if (!tenantConsentAccepted(args.consentText, args.paymentMethodType)) {
    throw new Error("autopay_consent_required");
  }
  const gate = await loadTenantPaymentGate(supabase, args.organizationId);
  if (
    !paymentMethodOfferedForOrganization({
      paymentMethodType: args.paymentMethodType,
      accepted: gate.accepted,
      supported: gate.supported
    })
  ) {
    throw new Error("accepted_payment_method_disabled");
  }
  const connect = gate.connect;
  if (!connectAccountReady(connect) || !connect?.stripe_account_id) {
    throw new Error("stripe_connect_not_ready");
  }
  const stripe = getStripeClient();
  if (!stripe) {
    throw new Error("Stripe unavailable");
  }
  let setupIntentId = args.setupIntentId ?? null;
  if (!setupIntentId && args.checkoutSessionId) {
    const session = await stripe.checkout.sessions.retrieve(
      args.checkoutSessionId,
      {},
      connectedRequestOptions(connect.stripe_account_id)
    );
    if (session.mode !== "setup") {
      throw new Error("autopay_setup_incomplete");
    }
    setupIntentId =
      typeof session.setup_intent === "string"
        ? session.setup_intent
        : session.setup_intent?.id ?? null;
  }
  if (!setupIntentId) {
    throw new Error("autopay_setup_incomplete");
  }
  const setupIntent = await stripe.setupIntents.retrieve(
    setupIntentId,
    {},
    connectedRequestOptions(connect.stripe_account_id)
  );
  if (setupIntent.status !== "succeeded" || !setupIntent.payment_method || !setupIntent.customer) {
    throw new Error("autopay_setup_incomplete");
  }
  const paymentMethodId =
    typeof setupIntent.payment_method === "string"
      ? setupIntent.payment_method
      : setupIntent.payment_method.id;
  const customerId =
    typeof setupIntent.customer === "string" ? setupIntent.customer : setupIntent.customer.id;
  const method = await stripe.paymentMethods.retrieve(
    paymentMethodId,
    {},
    connectedRequestOptions(connect.stripe_account_id)
  );
  const savedType = method.type === "us_bank_account" ? "us_bank_account" : "card";
  if (savedType !== args.paymentMethodType) {
    throw new Error("accepted_payment_method_disabled");
  }
  const consent = autopayConsentForMethod(args.paymentMethodType);

  const row = {
    organization_id: args.organizationId,
    lease_id: args.leaseId,
    resident_id: args.residentId,
    stripe_account_id: connect.stripe_account_id,
    stripe_customer_id: customerId,
    stripe_payment_method_id: paymentMethodId,
    payment_method_type: args.paymentMethodType,
    payment_method_brand:
      method.card?.brand ?? method.us_bank_account?.bank_name ?? method.type ?? args.paymentMethodType,
    payment_method_last4: method.card?.last4 ?? method.us_bank_account?.last4 ?? null,
    status: "active",
    consent_text: args.consentText,
    consent_version: consent.version,
    consented_at: new Date().toISOString(),
    revoked_at: null,
    paused_reason: null,
    created_by: args.userId,
    updated_at: new Date().toISOString()
  };

  const existing = await loadAutopayEnrollment(supabase, args.organizationId, args.leaseId);
  const query = existing
    ? supabase.from("financial_autopay_enrollments").update(row).eq("id", existing.id)
    : supabase.from("financial_autopay_enrollments").insert(row);
  const { data, error } = await query.select("*").single();
  if (error) {
    throw new Error(error.message);
  }

  await emitFinanceEvent({
    supabase,
    organizationId: args.organizationId,
    actorId: args.userId,
    eventType: "finance.autopay.enrolled",
    aggregateType: "financial_autopay_enrollment",
    aggregateId: data.id,
    payload: { leaseId: args.leaseId }
  });
  await writeFinanceAudit({
    supabase,
    organizationId: args.organizationId,
    actorId: args.userId,
    action: "finance.autopay.enrolled",
    entityType: "financial_autopay_enrollment",
    entityId: data.id,
    payload: { leaseId: args.leaseId }
  });
  await writeFinanceNotification({
    supabase,
    organizationId: args.organizationId,
    userId: args.userId,
    leaseId: args.leaseId,
    notificationKey: "finance.autopay.enrolled",
    title: "AutoPay is on",
    body: autopayCoverageCopy(),
    href: "/portal/tenant/billing"
  });
  return data;
}

export async function revokeAutopayEnrollment(
  supabase: Db,
  args: { organizationId: string; leaseId: string; userId: string }
) {
  const existing = await loadAutopayEnrollment(supabase, args.organizationId, args.leaseId);
  if (!existing) {
    return null;
  }
  const { data, error } = await supabase
    .from("financial_autopay_enrollments")
    .update({
      status: "revoked",
      revoked_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("id", existing.id)
    .select("*")
    .single();
  if (error) {
    throw new Error(error.message);
  }
  await emitFinanceEvent({
    supabase,
    organizationId: args.organizationId,
    actorId: args.userId,
    eventType: "finance.autopay.revoked",
    aggregateType: "financial_autopay_enrollment",
    aggregateId: data.id,
    payload: { leaseId: args.leaseId, balancesPreserved: true }
  });
  await writeFinanceAudit({
    supabase,
    organizationId: args.organizationId,
    actorId: args.userId,
    action: "finance.autopay.revoked",
    entityType: "financial_autopay_enrollment",
    entityId: data.id,
    payload: { balancesPreserved: true }
  });
  return data;
}

export async function runAutopayForLease(
  supabase: Db,
  args: {
    organizationId: string;
    leaseId: string;
    asOfDate?: string;
  }
) {
  const gate = await loadTenantPaymentGate(supabase, args.organizationId);
  if (!stripePaymentExecutionEnabled(gate.settings)) {
    throw new Error("stripe_payment_execution_disabled");
  }
  const enrollment = await loadAutopayEnrollment(supabase, args.organizationId, args.leaseId);
  if (!enrollment || enrollment.status !== "active") {
    throw new Error("autopay_disabled");
  }
  const enrolledType = enrollmentPaymentMethodType(enrollment);
  if (
    !paymentMethodOfferedForOrganization({
      paymentMethodType: enrolledType,
      accepted: gate.accepted,
      supported: gate.supported
    })
  ) {
    await pauseAutopayForDisabledMethod(supabase, {
      organizationId: args.organizationId,
      actorId: enrollment.resident_id as string,
      disabledType: enrolledType
    });
    throw new Error("accepted_payment_method_disabled");
  }
  const { data: occupant } = await supabase
    .from("lease_residents")
    .select("occupancy_status, occupy_from, occupy_to")
    .eq("organization_id", args.organizationId)
    .eq("lease_id", args.leaseId)
    .eq("id", enrollment.resident_id)
    .maybeSingle();
  const occupying =
    occupant &&
    occupancyIsCurrent({
      occupancyStatus: (occupant.occupancy_status as "scheduled" | "occupying" | "moved_out") ?? "occupying",
      occupyFrom: (occupant.occupy_from as string | null) ?? "1970-01-01",
      occupyTo: (occupant.occupy_to as string | null) ?? null
    });
  if (!occupying) {
    await revokeAutopayEnrollment(supabase, {
      organizationId: args.organizationId,
      leaseId: args.leaseId,
      userId: enrollment.resident_id as string
    });
    throw new Error("autopay_occupancy_revoked");
  }
  const connect = await loadConnectAccount(supabase, args.organizationId);
  if (!connectAccountReady(connect) || !connect?.stripe_account_id) {
    throw new Error("stripe_connect_not_ready");
  }
  const asOf = args.asOfDate ?? new Date().toISOString().slice(0, 10);
  const { data: charges, error } = await supabase
    .from("financial_charges")
    .select("id, due_at, charge_type, amount, amount_paid, status, autopay_eligible, fee_category, schedule_id")
    .eq("organization_id", args.organizationId)
    .eq("lease_id", args.leaseId)
    .in("status", ["open", "partially_paid"])
    .lte("due_at", asOf);
  if (error) {
    throw new Error(error.message);
  }
  const eligible = (charges ?? []).filter((charge) =>
    chargeIsAutopayEligible({
      charge_type: charge.charge_type as ChargeType,
      autopay_eligible: charge.autopay_eligible,
      fee_category: charge.fee_category,
      schedule_id: charge.schedule_id
    })
  );
  const remaining = roundMoney(
    eligible.reduce(
      (sum, charge) =>
        sum + remainingBalance({ amount: Number(charge.amount), amount_paid: Number(charge.amount_paid) }),
      0
    )
  );
  const amountCheck = resolveCheckoutAmount({ remaining });
  if (!amountCheck.ok) {
    return { skipped: true, reason: amountCheck.error, charged: 0 };
  }

  const { data: lease } = await supabase
    .from("lease_agreements")
    .select("property_id, currency")
    .eq("id", args.leaseId)
    .maybeSingle();

  const { data: payment, error: paymentError } = await supabase
    .from("financial_payments")
    .insert({
      organization_id: args.organizationId,
      property_id: lease?.property_id,
      lease_id: args.leaseId,
      resident_id: enrollment.resident_id,
      amount: amountCheck.amount,
      currency: (lease?.currency ?? "USD").toUpperCase(),
      status: "pending",
      method: "online_stripe",
      stripe_connect_account_id: connect.stripe_account_id,
      selected_charge_ids: eligible.map((charge) => charge.id),
      metadata: { source: "autopay", payment_method_type: enrolledType }
    })
    .select("*")
    .single();
  if (paymentError) {
    throw new Error(paymentError.message);
  }

  const stripe = getStripeClient();
  if (!stripe) {
    await markPaymentFailed(supabase, payment.id, args.organizationId, "stripe_unavailable");
    throw new Error("Stripe unavailable");
  }

  try {
    const intent = await stripe.paymentIntents.create(
      {
        amount: Math.round(amountCheck.amount * 100),
        currency: (lease?.currency ?? "usd").toLowerCase(),
        customer: enrollment.stripe_customer_id,
        payment_method: enrollment.stripe_payment_method_id,
        payment_method_types: [enrolledType],
        off_session: true,
        confirm: true,
        metadata: {
          payment_id: payment.id,
          organization_id: args.organizationId,
          lease_id: args.leaseId,
          source: "autopay",
          payment_method_type: enrolledType
        }
      },
      connectedRequestOptions(connect.stripe_account_id, `autopay:${payment.id}`)
    );

    await supabase
      .from("financial_payments")
      .update({
        stripe_payment_intent_id: intent.id,
        status: intent.status === "processing" ? "processing" : payment.status,
        updated_at: new Date().toISOString()
      })
      .eq("id", payment.id);

    if (intent.status === "processing") {
      await markPaymentProcessing(supabase, payment.id, args.organizationId, "ach_processing");
    }

    if (intent.status === "succeeded") {
      await applySucceededPayment(supabase, {
        organizationId: args.organizationId,
        actorId: null,
        leaseId: args.leaseId,
        amount: amountCheck.amount,
        currency: (lease?.currency ?? "USD").toUpperCase(),
        method: "online_stripe",
        paymentId: payment.id,
        stripePaymentIntentId: intent.id,
        chargeIds: eligible.map((charge) => charge.id)
      });
    }
    return { skipped: false, paymentId: payment.id, amount: amountCheck.amount, status: intent.status };
  } catch (error) {
    await markPaymentFailed(
      supabase,
      payment.id,
      args.organizationId,
      error instanceof Error ? error.message : "autopay_declined"
    );
    throw error;
  }
}
