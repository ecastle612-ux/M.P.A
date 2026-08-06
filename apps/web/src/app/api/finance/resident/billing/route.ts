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
    const receipts = (ledger.payments ?? [])
      .flatMap((payment) => {
        const nested = payment.financial_receipts;
        if (!nested) {
          return [];
        }
        return Array.isArray(nested) ? nested : [nested];
      })
      .filter(Boolean);

    accounts.push({
      resident,
      balance,
      openCharges,
      upcomingCharges: upcoming,
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
