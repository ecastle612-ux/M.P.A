import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { getLeaseLedger, refreshResidentFinancialStatus } from "../../../../../lib/finance/billing-service";
import { isStripeConfigured } from "../../../../../lib/finance/stripe";

export async function GET() {
  const authClient = await createAuthServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = authClient as SupabaseClient<any>;
  const {
    data: { user }
  } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { data: residents, error } = await supabase
    .from("lease_residents")
    .select("id, lease_id, organization_id, display_name, financial_status")
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (!residents?.length) {
    return NextResponse.json({
      linked: false,
      onlinePaymentsEnabled: isStripeConfigured(),
      accounts: []
    });
  }

  const accounts = [];
  for (const resident of residents) {
    const ledger = await getLeaseLedger(supabase, resident.organization_id, resident.lease_id);
    const balance = await refreshResidentFinancialStatus(supabase, resident.organization_id, resident.lease_id);
    const today = new Date().toISOString().slice(0, 10);
    const upcoming = (ledger.charges ?? []).filter(
      (charge) =>
        ["open", "partially_paid"].includes(charge.status) &&
        charge.due_at >= today &&
        charge.charge_type !== "credit"
    );
    const openCharges = (ledger.charges ?? []).filter((charge) =>
      ["open", "partially_paid"].includes(charge.status)
    );
    const paidCharges = (ledger.charges ?? []).filter((charge) => charge.status === "paid");
    const lateFees = openCharges.filter((charge) => charge.charge_type === "late_fee");
    const receipts = (ledger.payments ?? [])
      .flatMap((payment) => {
        const nested = payment.financial_receipts;
        if (!nested) {
          return [];
        }
        return Array.isArray(nested) ? nested : [nested];
      })
      .filter(Boolean);

    const { data: arrangements } = await supabase
      .from("financial_payment_arrangements")
      .select("id, status, total_amount, installment_amount, installments_total, installments_paid, next_due_on, notes")
      .eq("organization_id", resident.organization_id)
      .eq("lease_id", resident.lease_id)
      .in("status", ["proposed", "active"])
      .order("created_at", { ascending: false });

    accounts.push({
      resident,
      balance,
      openCharges,
      paidCharges,
      upcomingCharges: upcoming,
      lateFees,
      paymentArrangements: arrangements ?? [],
      recentPayments: (ledger.payments ?? []).slice(0, 10),
      receipts,
      recentTransactions: (ledger.ledger ?? []).slice(0, 15)
    });
  }

  return NextResponse.json({
    linked: true,
    onlinePaymentsEnabled: isStripeConfigured(),
    accounts
  });
}
