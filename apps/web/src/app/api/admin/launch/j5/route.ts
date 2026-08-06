import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { isPlatformOperatorUser } from "../../../../../lib/commercial/server";
import { getRentReadiness } from "../../../../../lib/finance/billing-service";
import {
  getOwnerFinancialSummary,
  getPropertyFinancialSnapshot
} from "../../../../../lib/finance/reporting-service";
import { isStripeConfigured } from "../../../../../lib/finance/stripe";

export async function GET(request: Request) {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  if (!(await isPlatformOperatorUser(user))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const organizationId = new URL(request.url).searchParams.get("organizationId");
  if (!organizationId) {
    return NextResponse.json({ error: "organizationId is required" }, { status: 400 });
  }

  const [
    rent,
    { data: chargesData },
    { data: paymentsData },
    { data: receiptsData },
    { data: eventsData },
    { data: auditsData }
  ] = await Promise.all([
    getRentReadiness(supabase, organizationId),
    supabase
      .from("financial_charges")
      .select("id, status, charge_type, amount, amount_paid, lease_id, created_at")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(80),
    supabase
      .from("financial_payments")
      .select(
        "id, status, method, amount, lease_id, property_id, paid_at, stripe_checkout_session_id, created_at"
      )
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(80),
    supabase
      .from("financial_receipts")
      .select("id, receipt_number, payment_id, amount, issued_at, created_at")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("event_domain_events")
      .select("id, event_type, aggregate_type, aggregate_id, created_at")
      .eq("organization_id", organizationId)
      .in("event_type", [
        "finance.charge.created",
        "finance.payment.pending",
        "finance.payment.succeeded",
        "finance.payment.reminder_sent",
        "finance.payment.failed"
      ])
      .order("created_at", { ascending: false })
      .limit(60),
    supabase
      .from("audit_events")
      .select("id, action, entity_type, entity_id, created_at")
      .eq("organization_id", organizationId)
      .in("action", [
        "finance.charge.created",
        "finance.payment.succeeded",
        "finance.payment.reminder_sent",
        "finance.payment.failed"
      ])
      .order("created_at", { ascending: false })
      .limit(60)
  ]);

  type AnyRow = Record<string, unknown>;
  const charges = (chargesData ?? []) as AnyRow[];
  const payments = (paymentsData ?? []) as AnyRow[];
  const receipts = (receiptsData ?? []) as AnyRow[];
  const events = (eventsData ?? []) as AnyRow[];
  const audits = (auditsData ?? []) as AnyRow[];

  const openCharges = charges.filter((row) =>
    ["open", "partially_paid", "overdue"].includes(String(row["status"]))
  );
  const paidCharges = charges.filter((row) => row["status"] === "paid");
  const succeededPayments = payments.filter((row) => row["status"] === "succeeded");
  const manualPayments = succeededPayments.filter((row) =>
    String(row["method"] ?? "").startsWith("manual")
  );
  const stripePayments = succeededPayments.filter(
    (row) =>
      String(row["method"] ?? "").includes("stripe") ||
      String(row["method"] ?? "") === "online_stripe" ||
      Boolean(row["stripe_checkout_session_id"])
  );

  const samplePropertyId =
    (succeededPayments.find((row) => row["property_id"])?.["property_id"] as string | undefined) ??
    null;

  let propertyMoneyLive = false;
  let ownerSummaryLive = false;
  let propertyMoneyDetail = "No sample property with payments yet";
  let ownerSummaryDetail = "Owner summary not loaded";

  if (samplePropertyId) {
    try {
      const snapshot = await getPropertyFinancialSnapshot(supabase, organizationId, samplePropertyId);
      propertyMoneyLive = Boolean(snapshot);
      propertyMoneyDetail = propertyMoneyLive
        ? `Sample property=${samplePropertyId}; rentCollectedThisMonth=${snapshot.rentCollectedThisMonth}`
        : `Sample property=${samplePropertyId}; snapshot missing`;
    } catch (error) {
      propertyMoneyLive = false;
      propertyMoneyDetail =
        error instanceof Error ? error.message : "Property financial snapshot failed";
    }
  }

  try {
    const summary = await getOwnerFinancialSummary(supabase, organizationId);
    ownerSummaryLive = Boolean(summary);
    ownerSummaryDetail = ownerSummaryLive
      ? `Properties=${summary.properties.length}; income=${summary.currentMonthIncome}`
      : "Owner summary empty";
  } catch (error) {
    ownerSummaryLive = false;
    ownerSummaryDetail = error instanceof Error ? error.message : "Owner summary failed";
  }

  const timelinePayment = events.some((event) => event["event_type"] === "finance.payment.succeeded");
  const auditPayment = audits.some((row) => row["action"] === "finance.payment.succeeded");
  const reminderSent = events.some((event) => event["event_type"] === "finance.payment.reminder_sent");

  const checks = {
    chargeCreated: charges.length > 0,
    chargeOpenOrPaid: openCharges.length > 0 || paidCharges.length > 0,
    paymentSucceeded: succeededPayments.length > 0,
    manualPayment: manualPayments.length > 0,
    stripePayment: stripePayments.length > 0,
    stripeConfigured: isStripeConfigured(),
    receiptGenerated: receipts.length > 0,
    reminderSent,
    timelineEvent: timelinePayment,
    auditEvent: auditPayment,
    propertyFinancialUpdate: propertyMoneyLive,
    ownerSummaryUpdate: ownerSummaryLive,
    rentReady: rent.rentReady,
    assistantNextIsMaintenance: rent.rentReady
  };

  return NextResponse.json({
    organizationId,
    rent,
    stripeConfigured: isStripeConfigured(),
    charges: charges.slice(0, 20),
    payments: payments.slice(0, 20),
    receipts: receipts.slice(0, 20),
    timelineEvents: events,
    auditEvents: audits,
    samplePropertyId,
    propertyMoneyDetail,
    ownerSummaryDetail,
    checks,
    counts: {
      charges: charges.length,
      openCharges: openCharges.length,
      paidCharges: paidCharges.length,
      succeededPayments: succeededPayments.length,
      manualPayments: manualPayments.length,
      stripePayments: stripePayments.length,
      receipts: receipts.length
    },
    assistantRecommendation: rent.rentReady
      ? "Submit your first maintenance request."
      : "Collect your first rent.",
    stripeNote:
      "Pass on stripePayment requires a succeeded Stripe/online checkout in this org. Manual payment alone can complete the customer journey; Stripe remains the online path when configured."
  });
}
