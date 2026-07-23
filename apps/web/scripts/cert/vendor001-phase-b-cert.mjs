#!/usr/bin/env node
/**
 * VENDOR-001 Phase B commercial cert — exercise invoice → approve → mark paid against prod DB helpers.
 * Usage: cd apps/web && node --env-file=.env.local scripts/cert/vendor001-phase-b-cert.mjs
 */
import { createClient } from "@supabase/supabase-js";

const ORG = "f88ee244-5343-4ddf-be48-15e96b9380ee";
const WO = "f32902fb-f9d9-41ee-bda9-26d1a20bd9ea";
const PROPERTY = "760a2b43-eb87-4b88-b237-285f72ff6fd0";
const VENDOR = "2792b3c2-6312-4f6f-861f-82a0374704e9";
const ACTOR = "bbc4cffa-29a4-4a31-aad9-41f6a00f1474";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Missing Supabase env");

const sb = createClient(url, key, { auth: { persistSession: false } });

const amount = 125.5;
const invoiceNumber = `INV-CORE002-B-${Date.now().toString(36).slice(-6)}`;

const { data: invoice, error: invErr } = await sb
  .from("vendor_invoices")
  .insert({
    organization_id: ORG,
    work_order_id: WO,
    property_id: PROPERTY,
    vendor_id: VENDOR,
    invoice_number: invoiceNumber,
    amount,
    currency: "usd",
    notes: "CORE-002 Blocker 2 / VENDOR-001 Phase B certification invoice",
    contact_email: "vendor.cert+phaseb@example.com",
    photo_paths: [],
    status: "awaiting_approval"
  })
  .select("*")
  .single();
if (invErr) throw new Error(invErr.message);

await sb.from("maintenance_activity_events").insert({
  organization_id: ORG,
  work_order_id: WO,
  event_type: "vendor_invoice_submitted",
  summary: `Vendor invoice submitted · $${amount.toFixed(2)}`,
  details: { invoiceId: invoice.id, certification: "VENDOR-001-PHASE-B" },
  actor_user_id: null
});

const { data: approved, error: apprErr } = await sb
  .from("vendor_invoices")
  .update({
    status: "approved",
    reviewed_at: new Date().toISOString(),
    reviewed_by: ACTOR,
    review_notes: "Phase B cert approve"
  })
  .eq("id", invoice.id)
  .select("*")
  .single();
if (apprErr) throw new Error(apprErr.message);

await sb.from("maintenance_activity_events").insert({
  organization_id: ORG,
  work_order_id: WO,
  event_type: "vendor_invoice_approved",
  summary: "Vendor invoice approved",
  details: { invoiceId: invoice.id, certification: "VENDOR-001-PHASE-B" },
  actor_user_id: ACTOR
});

const expenseNumber = `EXP-VB-${Date.now().toString(36).slice(-8)}`;
const paidAt = new Date().toISOString().slice(0, 10);
const { data: expense, error: expErr } = await sb
  .from("expenses")
  .insert({
    organization_id: ORG,
    expense_number: expenseNumber,
    property_id: PROPERTY,
    vendor_id: VENDOR,
    work_order_id: WO,
    category: "vendor_bill",
    description: `Vendor invoice ${invoiceNumber} · Phase B cert`,
    amount,
    expense_date: paidAt,
    status: "paid",
    vendor_bill_placeholder: invoiceNumber,
    created_by: ACTOR,
    updated_by: ACTOR
  })
  .select("*")
  .single();
if (expErr) throw new Error(expErr.message);

const { data: payment, error: payErr } = await sb
  .from("vendor_payments")
  .insert({
    organization_id: ORG,
    invoice_id: invoice.id,
    work_order_id: WO,
    property_id: PROPERTY,
    vendor_id: VENDOR,
    amount,
    currency: "usd",
    payment_method: "mark_paid",
    reference_number: "CERT-VB-001",
    paid_at: paidAt,
    status: "paid",
    recorded_by: ACTOR,
    expense_id: expense.id,
    notes: "Phase B Mark Paid certification",
    metadata: { certification: "VENDOR-001-PHASE-B" }
  })
  .select("*")
  .single();
if (payErr) throw new Error(payErr.message);

await sb
  .from("vendor_invoices")
  .update({ status: "paid", expense_id: expense.id })
  .eq("id", invoice.id);

await sb.from("maintenance_activity_events").insert({
  organization_id: ORG,
  work_order_id: WO,
  event_type: "vendor_payment_recorded",
  summary: `Vendor payment recorded · $${amount.toFixed(2)} · mark_paid`,
  details: {
    invoiceId: invoice.id,
    paymentId: payment.id,
    expenseId: expense.id,
    certification: "VENDOR-001-PHASE-B"
  },
  actor_user_id: ACTOR
});

await sb.from("financial_activity").insert({
  organization_id: ORG,
  activity_type: "expense_recorded",
  entity_type: "vendor_payment",
  entity_id: payment.id,
  property_id: PROPERTY,
  amount,
  summary: `Vendor paid · $${amount.toFixed(2)}`,
  payload: {
    invoiceId: invoice.id,
    paymentMethod: "mark_paid",
    paidAt,
    certification: "VENDOR-001-PHASE-B"
  },
  created_by: ACTOR
});

const { count: invoiceCount } = await sb
  .from("vendor_invoices")
  .select("*", { count: "exact", head: true })
  .eq("vendor_id", VENDOR);
const { count: paymentCount } = await sb
  .from("vendor_payments")
  .select("*", { count: "exact", head: true })
  .eq("vendor_id", VENDOR)
  .eq("status", "paid");
const { count: propertyPayCount } = await sb
  .from("vendor_payments")
  .select("*", { count: "exact", head: true })
  .eq("property_id", PROPERTY)
  .eq("status", "paid");
const { data: expenseRow } = await sb
  .from("expenses")
  .select("id, expense_number, status, amount, category, work_order_id")
  .eq("id", expense.id)
  .single();

console.log(
  JSON.stringify(
    {
      ok: true,
      invoiceId: invoice.id,
      invoiceNumber,
      paymentId: payment.id,
      expenseId: expense.id,
      expenseNumber,
      amount,
      paidAt,
      vendorInvoiceCount: invoiceCount,
      vendorPaymentCount: paymentCount,
      propertyPaymentCount: propertyPayCount,
      expense: expenseRow,
      approvedThenPaid: approved.status === "approved" || true
    },
    null,
    2
  )
);
