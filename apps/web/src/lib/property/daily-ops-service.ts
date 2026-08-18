import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildDailyOpsAssistantBriefing,
  buildDailyOpsGreeting,
  buildDailyOpsReadyAssistantCopy,
  formatMoney,
  resolveDailyOpsBriefingAccess,
  type DailyOpsAttentionItem,
  type UserRole
} from "@mpa/shared";

export { getDailyOpsReadiness, markDailyOpsReviewed } from "./journey-readiness";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any>;

const emptyRows = { data: [] as never[] };

export async function buildDailyOperationsBriefing(
  supabase: Db,
  organizationId: string,
  actor: {
    userId: string;
    displayName?: string | null;
    roles?: UserRole[] | string[] | null;
    permissions?: readonly string[] | null;
  },
  context: {
    organizationName?: string | null;
    propertyCount: number;
    firstActionTitle: string;
  }
) {
  const access = resolveDailyOpsBriefingAccess({
    roles: actor.roles ?? [],
    permissions: actor.permissions ?? []
  });

  const [
    financeReport,
    { data: openWorkOrders },
    { data: pendingLeases },
    { data: pendingResidents },
    { data: recentEvents },
    { data: openApplications },
    { data: upcomingMoveIns },
    { data: upcomingRenewals }
  ] = await Promise.all([
    access.includeFinance
      ? import("../finance/reporting-service").then((mod) =>
          mod.getCommandCenterReport(supabase, organizationId).catch(() => null)
        )
      : Promise.resolve(null),
    supabase
      .from("maintenance_work_orders")
      .select("id, title, status, priority, assignee_type, property_id")
      .eq("organization_id", organizationId)
      .eq("work_surface", "residential")
      .in("status", ["submitted", "triaged", "assigned", "in_progress", "completed"])
      .order("submitted_at", { ascending: false })
      .limit(40),
    access.includeResidentLease
      ? supabase
          .from("lease_agreements")
          .select("id, status, start_date, pm_residents(display_name), property_properties(name)")
          .eq("organization_id", organizationId)
          .in("status", ["draft", "pending_signature", "signed"])
          .order("created_at", { ascending: false })
          .limit(20)
      : Promise.resolve(emptyRows),
    access.includeResidentLease
      ? supabase
          .from("pm_residents")
          .select("id, display_name, portal_status, status")
          .eq("organization_id", organizationId)
          .eq("portal_status", "pending_activation")
          .limit(20)
      : Promise.resolve(emptyRows),
    supabase
      .from("event_domain_events")
      .select("id, event_type, created_at, payload")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(12),
    access.includeResidentLease
      ? supabase
          .from("lease_applications")
          .select("id, status, pm_residents(display_name)")
          .eq("organization_id", organizationId)
          .in("status", ["submitted", "incomplete", "screening_pending"])
          .order("updated_at", { ascending: false })
          .limit(20)
      : Promise.resolve(emptyRows),
    access.includeResidentLease
      ? supabase
          .from("pm_residents")
          .select("id, display_name, status, lease_id")
          .eq("organization_id", organizationId)
          .eq("status", "pending_move_in")
          .limit(20)
      : Promise.resolve(emptyRows),
    access.includeResidentLease
      ? supabase
          .from("lease_agreements")
          .select("id, end_date, status, pm_residents(display_name)")
          .eq("organization_id", organizationId)
          .eq("status", "active")
          .not("end_date", "is", null)
          .gte("end_date", new Date().toISOString().slice(0, 10))
          .lte(
            "end_date",
            new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
          )
          .order("end_date", { ascending: true })
          .limit(20)
      : Promise.resolve(emptyRows)
  ]);

  const workOrders = openWorkOrders ?? [];
  const emergencyMaintenanceCount = workOrders.filter((row) => row.priority === "emergency").length;
  const unassignedMaintenanceCount = workOrders.filter(
    (row) => row.assignee_type === "unassigned" || !row.assignee_type
  ).length;
  const assignedMaintenanceCount = workOrders.filter((row) =>
    ["technician", "vendor"].includes(String(row.assignee_type))
  ).length;

  const outstandingRent = financeReport?.financialSnapshot.outstandingRent ?? 0;
  const delinquencyCount = financeReport?.financialSnapshot.delinquencyCount ?? 0;
  const vendorInvoicesAwaitingApproval =
    financeReport?.financialSnapshot.vendorInvoicesAwaitingApproval ?? 0;
  const vendorPaymentsDue = financeReport?.financialSnapshot.vendorPaymentsDue ?? 0;

  const briefing = buildDailyOpsAssistantBriefing({
    displayName: actor.displayName ?? null,
    organizationName: context.organizationName ?? null,
    propertyCount: context.propertyCount,
    outstandingRent,
    delinquencyCount,
    openMaintenanceCount: workOrders.length,
    emergencyMaintenanceCount,
    unassignedMaintenanceCount,
    assignedMaintenanceCount,
    pendingSignatureLeaseCount: (pendingLeases ?? []).length,
    pendingActivationResidentCount: (pendingResidents ?? []).length,
    vendorInvoicesAwaitingApproval,
    vendorPaymentsDue,
    recentActivityCount: financeReport?.recentActivity.length ?? (recentEvents ?? []).length,
    firstActionTitle: context.firstActionTitle
  });

  const immediateAttention: DailyOpsAttentionItem[] = [];
  const waitingOnMe: DailyOpsAttentionItem[] = [];
  const waitingOnOthers: DailyOpsAttentionItem[] = [];

  for (const row of workOrders.filter((item) => item.priority === "emergency").slice(0, 5)) {
    immediateAttention.push({
      id: `wo-emergency-${row.id}`,
      domain: "maintenance",
      title: row.title as string,
      detail: "Emergency maintenance",
      href: "/pm/maintenance",
      urgency: "immediate"
    });
  }
  for (const row of (financeReport?.delinquencySummary.residentsOverdue ?? []).slice(0, 5)) {
    const caseRow = row as { id?: string; open_balance?: number; status?: string };
    immediateAttention.push({
      id: `delinq-${caseRow.id ?? "case"}`,
      domain: "finance",
      title: `Delinquency case · ${formatMoney(Number(caseRow.open_balance ?? 0))}`,
      detail: `Status: ${caseRow.status ?? "past due"}`,
      href: "/pm/financial-operations#delinquency",
      urgency: "immediate"
    });
  }

  if (vendorInvoicesAwaitingApproval > 0) {
    waitingOnMe.push({
      id: "vendor-approvals",
      domain: "vendor",
      title: `${vendorInvoicesAwaitingApproval} vendor invoice(s) to approve`,
      detail: "Waiting on you in Financial Operations",
      href: "/pm/financial-operations#vendor-invoices",
      urgency: "waiting_on_me"
    });
  }
  for (const row of workOrders
    .filter((item) => item.assignee_type === "unassigned")
    .slice(0, 5)) {
    waitingOnMe.push({
      id: `wo-unassigned-${row.id}`,
      domain: "maintenance",
      title: row.title as string,
      detail: "Unassigned work order",
      href: "/pm/maintenance",
      urgency: "waiting_on_me"
    });
  }
  for (const lease of (pendingLeases ?? []).slice(0, 5)) {
    const resident = Array.isArray(lease.pm_residents)
      ? lease.pm_residents[0]
      : lease.pm_residents;
    waitingOnMe.push({
      id: `lease-${lease.id}`,
      domain: "leasing",
      title: `Lease ${(resident as { display_name?: string } | null)?.display_name ?? ""}`.trim(),
      detail: `Status: ${lease.status}`,
      href: `/pm/leasing/${lease.id}`,
      urgency: "waiting_on_me"
    });
  }

  const applicationsAwaitingReview = (openApplications ?? []).filter((row) =>
    ["submitted", "incomplete"].includes(row.status as string)
  );
  const screeningPendingApps = (openApplications ?? []).filter(
    (row) => row.status === "screening_pending"
  );
  if (applicationsAwaitingReview.length > 0) {
    waitingOnMe.push({
      id: "applications-awaiting-review",
      domain: "leasing",
      title: `${applicationsAwaitingReview.length} application(s) awaiting review`,
      detail: "Review completeness and continue the leasing pipeline",
      href: "/pm/leasing#applications",
      urgency: "waiting_on_me"
    });
  }
  if (screeningPendingApps.length > 0) {
    waitingOnOthers.push({
      id: "screening-pending",
      domain: "leasing",
      title: `${screeningPendingApps.length} pending screening result(s)`,
      detail: "Screening pending (manual)",
      href: "/pm/leasing#applications",
      urgency: "waiting_on_others"
    });
  }
  const readyToSign = (pendingLeases ?? []).filter((row) =>
    ["draft", "pending_signature"].includes(row.status as string)
  );
  if (readyToSign.length > 0) {
    waitingOnMe.push({
      id: "leases-ready-to-sign",
      domain: "leasing",
      title: `${readyToSign.length} lease(s) ready to sign`,
      detail: "Send or complete signature in Leasing",
      href: "/pm/leasing#lease-signing",
      urgency: "waiting_on_me"
    });
  }
  if ((upcomingMoveIns ?? []).length > 0) {
    waitingOnMe.push({
      id: "upcoming-move-ins",
      domain: "leasing",
      title: `${(upcomingMoveIns ?? []).length} upcoming move-in(s)`,
      detail: "Pending move-in person status",
      href: "/pm/leasing#move-ins",
      urgency: "waiting_on_me"
    });
  }
  if ((upcomingRenewals ?? []).length > 0) {
    waitingOnMe.push({
      id: "upcoming-renewals",
      domain: "leasing",
      title: `${(upcomingRenewals ?? []).length} upcoming renewal(s)`,
      detail: "Active leases ending within 60 days",
      href: "/pm/leasing#renewals",
      urgency: "waiting_on_me"
    });
  }

  if (outstandingRent > 0) {
    waitingOnMe.push({
      id: "outstanding-rent",
      domain: "finance",
      title: `${formatMoney(outstandingRent)} outstanding rent`,
      detail: "Follow up from Financial Operations",
      href: "/pm/financial-operations#record",
      urgency: "waiting_on_me"
    });
  }

  for (const row of workOrders
    .filter((item) => ["technician", "vendor"].includes(String(item.assignee_type)))
    .slice(0, 5)) {
    waitingOnOthers.push({
      id: `wo-assigned-${row.id}`,
      domain: "maintenance",
      title: row.title as string,
      detail: `Assigned to ${row.assignee_type}`,
      href: "/pm/maintenance",
      urgency: "waiting_on_others"
    });
  }
  for (const resident of (pendingResidents ?? []).slice(0, 5)) {
    waitingOnOthers.push({
      id: `resident-portal-${resident.id}`,
      domain: "resident",
      title: resident.display_name as string,
      detail: "Portal pending activation",
      href: `/pm/residents/${resident.id}`,
      urgency: "waiting_on_others"
    });
  }
  if (vendorPaymentsDue > 0) {
    waitingOnOthers.push({
      id: "vendor-payments-due",
      domain: "vendor",
      title: `${vendorPaymentsDue} vendor payment(s) scheduled`,
      detail: "Waiting on payment execution / mark paid",
      href: "/pm/financial-operations#vendor-invoices",
      urgency: "waiting_on_others"
    });
  }

  const recommendedActions = [
    immediateAttention[0],
    waitingOnMe[0],
    waitingOnOthers[0],
    workOrders.length > 0
      ? {
          id: "docs-evidence",
          domain: "property" as const,
          title: "Attach maintenance evidence in Documents",
          detail: "Upload photos or invoices to the work order record",
          href: "/shared/documents",
          urgency: "waiting_on_me" as const
        }
      : null,
    outstandingRent > 0
      ? {
          id: "comms-followup",
          domain: "resident" as const,
          title: "Message residents about outstanding rent",
          detail: "Use Communications for a clear follow-up",
          href: "/shared/communications",
          urgency: "waiting_on_me" as const
        }
      : null
  ].filter(Boolean) as DailyOpsAttentionItem[];

  const quickActions = [
    ...(access.includeFinance
      ? [{ id: "mc-fo", label: "Financial Operations", href: "/pm/financial-operations" }]
      : []),
    { id: "mc-maintenance", label: "Maintenance", href: "/pm/maintenance" },
    ...(access.includeResidentLease
      ? [
          { id: "mc-leasing", label: "Leasing", href: "/pm/leasing" },
          { id: "mc-residents", label: "Residents", href: "/pm/residents" }
        ]
      : []),
    { id: "mc-properties", label: "Properties", href: "/pm/properties" },
    { id: "mc-documents", label: "Documents", href: "/shared/documents" },
    { id: "mc-communications", label: "Communications", href: "/shared/communications" },
    ...(access.includeFinance
      ? [{ id: "mc-owner", label: "Owner portfolio", href: "/portal/owner" }]
      : []),
    ...(access.includeFinance ? (financeReport?.quickActions.slice(0, 3) ?? []) : [])
  ];

  // Dedupe quick actions by href
  const seen = new Set<string>();
  const uniqueQuickActions = quickActions.filter((action) => {
    if (seen.has(action.href)) {
      return false;
    }
    seen.add(action.href);
    return true;
  });

  const recentActivity = (financeReport?.recentActivity ?? []).slice(0, 8).map((item) => ({
    id: item.id,
    title: item.title,
    detail: item.detail,
    href: item.href ?? "/pm/financial-operations",
    occurredAt: item.occurredAt
  }));

  const timeline = (recentEvents ?? []).slice(0, 8).map((event) => ({
    id: event.id as string,
    title: String(event.event_type),
    detail:
      typeof (event.payload as { title?: string } | null)?.title === "string"
        ? (event.payload as { title: string }).title
        : "Platform activity",
    occurredAt: event.created_at as string
  }));

  return {
    greeting: buildDailyOpsGreeting({ displayName: actor.displayName ?? null }),
    briefing,
    successCopy: buildDailyOpsReadyAssistantCopy(),
    immediateAttention,
    waitingOnMe,
    waitingOnOthers,
    recommendedActions,
    quickActions: uniqueQuickActions,
    financialSnapshot: financeReport?.financialSnapshot ?? null,
    financeAlerts: financeReport?.alerts ?? [],
    openMaintenance: workOrders.slice(0, 8).map((row) => ({
      id: row.id as string,
      title: row.title as string,
      status: row.status as string,
      priority: row.priority as string,
      href: "/pm/maintenance"
    })),
    upcomingLeases: (pendingLeases ?? []).slice(0, 8).map((lease) => {
      const resident = Array.isArray(lease.pm_residents)
        ? lease.pm_residents[0]
        : lease.pm_residents;
      const property = Array.isArray(lease.property_properties)
        ? lease.property_properties[0]
        : lease.property_properties;
      return {
        id: lease.id as string,
        status: lease.status as string,
        startDate: lease.start_date as string | null,
        residentName: (resident as { display_name?: string } | null)?.display_name ?? "Resident",
        propertyName: (property as { name?: string } | null)?.name ?? "Property",
        href: `/pm/leasing/${lease.id}`
      };
    }),
    residentAlerts: (pendingResidents ?? []).slice(0, 8).map((resident) => ({
      id: resident.id as string,
      title: resident.display_name as string,
      detail: "Portal pending activation",
      href: `/pm/residents/${resident.id}`
    })),
    vendorAlerts: [
      ...(vendorInvoicesAwaitingApproval > 0
        ? [
            {
              id: "vendor-approve",
              title: `${vendorInvoicesAwaitingApproval} invoice(s) awaiting approval`,
              detail: "Vendor payables",
              href: "/pm/financial-operations#vendor-invoices"
            }
          ]
        : []),
      ...(vendorPaymentsDue > 0
        ? [
            {
              id: "vendor-pay",
              title: `${vendorPaymentsDue} payment(s) due`,
              detail: "Vendor payables",
              href: "/pm/financial-operations#vendor-invoices"
            }
          ]
        : [])
    ],
    recentActivity,
    timeline,
    notifications: [
      ...immediateAttention.slice(0, 3).map((item) => ({
        id: `n-${item.id}`,
        title: item.title,
        detail: item.detail,
        href: item.href
      })),
      ...waitingOnMe.slice(0, 2).map((item) => ({
        id: `n-${item.id}`,
        title: item.title,
        detail: item.detail,
        href: item.href
      }))
    ]
  };
}
