import { createAuthServerComponentClient } from "../auth/server";
import type { IntegrityIssue, IntegrityReport } from "./contracts";

type SupabaseClientType = Awaited<ReturnType<typeof createAuthServerComponentClient>>;

async function headCount(
  promise: PromiseLike<{ count: number | null; error: { message: string } | null }>
): Promise<number> {
  const { count, error } = await promise;
  if (error) return 0;
  return count ?? 0;
}

export async function runDataIntegrityAudit(
  organizationId: string,
  client?: SupabaseClientType
): Promise<IntegrityReport> {
  const supabase = client ?? (await createAuthServerComponentClient());
  const issues: IntegrityIssue[] = [];

  const [
    unitsWithoutProperty,
    tenantsWithoutUnit,
    leasesWithoutTenant,
    leasesWithoutUnit,
    leasesMissingRent,
    leasesMissingDates,
    paymentsWithoutCharge,
    workOrdersWithoutProperty,
    messagesWithoutThread
  ] = await Promise.all([
    headCount(
      supabase
        .from("units")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .is("deleted_at", null)
        .is("property_id", null)
    ),
    headCount(
      supabase
        .from("tenants")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .is("deleted_at", null)
        .is("unit_id", null)
    ),
    headCount(
      supabase
        .from("leases")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .is("deleted_at", null)
        .is("primary_tenant_id", null)
    ),
    headCount(
      supabase
        .from("leases")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .is("deleted_at", null)
        .is("unit_id", null)
    ),
    headCount(
      supabase
        .from("leases")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .is("deleted_at", null)
        .or("rent_amount.is.null,rent_amount.eq.0")
    ),
    headCount(
      supabase
        .from("leases")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .is("deleted_at", null)
        .or("start_date.is.null,end_date.is.null")
    ),
    headCount(
      supabase
        .from("payments")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .is("rent_charge_id", null)
    ),
    headCount(
      supabase
        .from("maintenance_work_orders")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .is("deleted_at", null)
        .is("property_id", null)
    ),
    headCount(
      supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .is("thread_id", null)
    )
  ]);

  const { data: tenantEmails } = await supabase
    .from("tenants")
    .select("email")
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .limit(3000);

  const emailCounts = new Map<string, number>();
  for (const row of tenantEmails ?? []) {
    const email = typeof row.email === "string" ? row.email.trim().toLowerCase() : "";
    if (!email) continue;
    emailCounts.set(email, (emailCounts.get(email) ?? 0) + 1);
  }
  const duplicateEmails = [...emailCounts.values()].filter((n) => n > 1).length;

  const { data: activeLeases } = await supabase
    .from("leases")
    .select("id, unit_id, status")
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .in("status", ["active", "current"])
    .limit(500);

  const unitIds = [...new Set((activeLeases ?? []).map((l) => l.unit_id).filter(Boolean))] as string[];
  let conflictingOccupancy = 0;
  if (unitIds.length > 0) {
    const { data: units } = await supabase
      .from("units")
      .select("id, occupancy_status")
      .eq("organization_id", organizationId)
      .in("id", unitIds.slice(0, 200));
    conflictingOccupancy = (units ?? []).filter(
      (u) => u.occupancy_status === "vacant_ready" || u.occupancy_status === "vacant_not_ready"
    ).length;
  }

  function push(
    id: string,
    domain: string,
    severity: IntegrityIssue["severity"],
    title: string,
    description: string,
    count: number,
    recovery: string
  ) {
    if (count <= 0) return;
    issues.push({ id, domain, severity, title, description, count, recovery });
  }

  push(
    "units_without_property",
    "units",
    "error",
    "Units without a property",
    "These units cannot appear correctly in portfolio operations.",
    unitsWithoutProperty,
    "Open Units, assign each unit to a property, or re-import the unit file."
  );
  push(
    "residents_without_unit",
    "residents",
    "warning",
    "Residents without a unit",
    "Active residents should be assigned before invitations and rent collection.",
    tenantsWithoutUnit,
    "Use Move In or Transfer Unit to assign housing."
  );
  push(
    "leases_without_resident",
    "leases",
    "error",
    "Leases without a resident",
    "Leases need a primary resident for billing and portal access.",
    leasesWithoutTenant,
    "Edit the lease and link the primary resident."
  );
  push(
    "leases_without_unit",
    "leases",
    "error",
    "Leases without a unit",
    "A lease must be tied to a unit to track occupancy.",
    leasesWithoutUnit,
    "Edit the lease and select the correct unit."
  );
  push(
    "leases_missing_rent",
    "leases",
    "warning",
    "Leases missing rent amount",
    "Rent collection and statements need a rent amount.",
    leasesMissingRent,
    "Update rent on each lease before charging."
  );
  push(
    "leases_missing_dates",
    "leases",
    "warning",
    "Leases missing start or end dates",
    "Lifecycle and renewals depend on lease dates.",
    leasesMissingDates,
    "Add start and end dates on the lease."
  );
  push(
    "payments_without_charge",
    "payments",
    "warning",
    "Payments not linked to a charge",
    "Unlinked payments make balances harder to reconcile.",
    paymentsWithoutCharge,
    "Review Financials and attach payments to the correct charge when possible."
  );
  push(
    "work_orders_without_property",
    "maintenance",
    "warning",
    "Work orders without a property",
    "Maintenance routing works best when property is set.",
    workOrdersWithoutProperty,
    "Edit the work order and select a property."
  );
  push(
    "messages_without_thread",
    "messages",
    "error",
    "Messages without a conversation",
    "Orphan messages won’t appear in any inbox.",
    messagesWithoutThread,
    "Contact support if this count is non-zero after a migration."
  );
  push(
    "duplicate_resident_emails",
    "residents",
    "warning",
    "Duplicate resident emails",
    "Duplicate emails confuse invitations and portal login.",
    duplicateEmails,
    "Merge or correct duplicate resident records."
  );
  push(
    "active_lease_on_vacant_unit",
    "leases",
    "error",
    "Active lease on a vacant unit",
    "Occupancy status disagrees with an active lease.",
    conflictingOccupancy,
    "Update the unit status to Occupied or end the incorrect lease."
  );

  const errorCount = issues.filter((i) => i.severity === "error").length;
  const warningCount = issues.filter((i) => i.severity === "warning").length;

  return {
    organizationId,
    checkedAt: new Date().toISOString(),
    issueCount: issues.length,
    errorCount,
    warningCount,
    issues
  };
}
