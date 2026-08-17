import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { getLeaseLedger } from "../../../../../lib/finance/billing-service";
import { stripePaymentExecutionEnabled } from "../../../../../lib/finance/checkout-authz";
import { residentOnlinePayAvailable } from "../../../../../lib/finance/resident-online-pay";
import { createServiceRoleClient } from "../../../../../lib/supabase/service-role";

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

  const { deriveOccupancyAccess, utcToday } = await import("@mpa/shared");
  const { data: residents, error } = await supabase
    .from("lease_residents")
    .select(
      "id, lease_id, organization_id, display_name, financial_status, occupancy_status, occupy_from, occupy_to"
    )
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (!residents?.length) {
    return NextResponse.json({
      linked: false,
      onlinePaymentsEnabled: false,
      accounts: []
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let settingsReader: SupabaseClient<any> = supabase;
  try {
    settingsReader = createServiceRoleClient();
  } catch {
    settingsReader = supabase;
  }

  const organizationIds = [
    ...new Set(residents.map((resident) => resident.organization_id as string).filter(Boolean))
  ];
  const executionByOrganization = new Map<string, boolean>();
  if (organizationIds.length > 0) {
    const { data: settingsRows } = await settingsReader
      .from("financial_module_settings")
      .select("organization_id, stripe_payment_execution_enabled")
      .in("organization_id", organizationIds);
    for (const row of settingsRows ?? []) {
      executionByOrganization.set(
        row.organization_id as string,
        stripePaymentExecutionEnabled(row)
      );
    }
  }

  const today = utcToday();
  const accounts = [];
  for (const resident of residents) {
    const access = deriveOccupancyAccess(
      {
        occupancyStatus:
          (resident.occupancy_status as "scheduled" | "occupying" | "moved_out") ?? "occupying",
        occupyFrom: (resident.occupy_from as string | null) ?? "1970-01-01",
        occupyTo: (resident.occupy_to as string | null) ?? null
      },
      today
    );
    if (access === "future") {
      continue;
    }
    const ledger = await getLeaseLedger(supabase, resident.organization_id, resident.lease_id);
    const balance = ledger.balance;
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
      accessMode: access,
      canPay: access === "active",
      onlinePaymentsEnabled: residentOnlinePayAvailable({
        stripePaymentExecutionEnabled:
          executionByOrganization.get(resident.organization_id as string) === true,
        occupancyAccess: access
      }),
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
    onlinePaymentsEnabled: accounts.some((account) => account.onlinePaymentsEnabled),
    accounts
  });
}
