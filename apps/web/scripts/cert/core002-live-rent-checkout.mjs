#!/usr/bin/env node
/**
 * CORE-002 Blocker 1 — create live Stripe Checkout for RC-CORE002-LIVE-001 ($1).
 * Usage: node --env-file=apps/web/.env.local apps/web/scripts/cert/core002-live-rent-checkout.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { createHash, randomBytes } from "node:crypto";

const CHARGE_ID = "dc6aeed1-a834-4f56-bc02-331c4bf09c86";
const ORG_ID = "f88ee244-5343-4ddf-be48-15e96b9380ee";
const TENANT_ID = "caf3630d-8f86-4087-82da-6c9a68b2e62c";
const ACTOR_ID = "bbc4cffa-29a4-4a31-aad9-41f6a00f1474";
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://www.my-property-assistant.com").replace(/\/$/, "");

function requireEnv(name) {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

async function stripeForm(path, params) {
  const key = requireEnv("STRIPE_SECRET_KEY");
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== "") body.set(k, String(v));
  }
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  return json;
}

function billingNumber(prefix) {
  return `${prefix}-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${randomBytes(3).toString("hex")}`;
}

const supabase = createClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false, autoRefreshToken: false }
});

const { data: charge, error: chargeError } = await supabase
  .from("rent_charges")
  .select("*")
  .eq("id", CHARGE_ID)
  .eq("organization_id", ORG_ID)
  .single();
if (chargeError || !charge) throw new Error(chargeError?.message || "Charge not found");
if (Number(charge.outstanding_balance) !== 1) {
  throw new Error(`Expected $1 outstanding, got ${charge.outstanding_balance}`);
}

const { data: existingCustomer } = await supabase
  .from("payment_customers")
  .select("*")
  .eq("organization_id", ORG_ID)
  .eq("tenant_id", TENANT_ID)
  .eq("provider", "stripe")
  .maybeSingle();

let externalCustomerId = existingCustomer?.external_customer_id;
if (!externalCustomerId) {
  const { data: tenant } = await supabase.from("tenants").select("email, first_name, last_name").eq("id", TENANT_ID).single();
  const customer = await stripeForm("/customers", {
    email: tenant?.email || undefined,
    name: [tenant?.first_name, tenant?.last_name].filter(Boolean).join(" ") || undefined,
    "metadata[organization_id]": ORG_ID,
    "metadata[tenant_id]": TENANT_ID
  });
  externalCustomerId = customer.id;
  await supabase.from("payment_customers").insert({
    organization_id: ORG_ID,
    tenant_id: TENANT_ID,
    provider: "stripe",
    external_customer_id: externalCustomerId
  });
}

const attemptId = crypto.randomUUID();
const attemptNumber = billingNumber("PA");
const description = `CORE-002 commercial certification payment — ${charge.charge_number} ($1.00)`;

const { error: insertError } = await supabase.from("payment_attempts").insert({
  id: attemptId,
  organization_id: ORG_ID,
  attempt_number: attemptNumber,
  tenant_id: TENANT_ID,
  lease_id: charge.lease_id,
  provider: "stripe",
  amount: 1,
  currency: "usd",
  status: "requires_action",
  source: "one_time",
  charge_ids: [CHARGE_ID],
  metadata: {
    chargeIds: [CHARGE_ID],
    propertyId: charge.property_id,
    useCheckout: true,
    certification: "CORE-002-BLOCKER-1"
  },
  created_by: ACTOR_ID
});
if (insertError) throw new Error(insertError.message);

const session = await stripeForm("/checkout/sessions", {
  mode: "payment",
  customer: externalCustomerId,
  success_url: `${APP_URL}/portal/tenant/payments?paid=1&attempt=${attemptId}&session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${APP_URL}/portal/tenant/payments?canceled=1&attempt=${attemptId}`,
  client_reference_id: attemptId,
  "line_items[0][quantity]": "1",
  "line_items[0][price_data][currency]": "usd",
  "line_items[0][price_data][unit_amount]": "100",
  "line_items[0][price_data][product_data][name]": description,
  "payment_intent_data[description]": description,
  "payment_intent_data[metadata][organization_id]": ORG_ID,
  "payment_intent_data[metadata][attempt_id]": attemptId,
  "payment_intent_data[metadata][attempt_number]": attemptNumber,
  "payment_intent_data[metadata][certification]": "CORE-002-BLOCKER-1",
  "metadata[organization_id]": ORG_ID,
  "metadata[attempt_id]": attemptId,
  "metadata[attempt_number]": attemptNumber,
  "metadata[mpa_flow]": "resident_rent_checkout",
  "metadata[certification]": "CORE-002-BLOCKER-1"
});

const paymentIntentId =
  typeof session.payment_intent === "string"
    ? session.payment_intent
    : session.payment_intent?.id || null;

await supabase
  .from("payment_attempts")
  .update({
    external_attempt_id: paymentIntentId || session.id,
    metadata: {
      chargeIds: [CHARGE_ID],
      propertyId: charge.property_id,
      useCheckout: true,
      certification: "CORE-002-BLOCKER-1",
      checkoutUrl: session.url,
      checkoutSessionId: session.id
    }
  })
  .eq("id", attemptId);

console.log(
  JSON.stringify(
    {
      attemptId,
      attemptNumber,
      checkoutSessionId: session.id,
      paymentIntentId,
      checkoutUrl: session.url,
      chargeId: CHARGE_ID,
      amountUsd: 1,
      description
    },
    null,
    2
  )
);
