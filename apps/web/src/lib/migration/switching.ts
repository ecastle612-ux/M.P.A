import { createAuthServerComponentClient } from "../auth/server";
import { getPortfolioCounts } from "../workflow/server/portfolio-counts";
import { getMigrationDashboardMetrics, type MigrationDashboardMetrics } from "./server";

type SupabaseClientType = Awaited<ReturnType<typeof createAuthServerComponentClient>>;

export type SwitchingEntityCounts = {
  properties: number;
  units: number;
  residents: number;
  applicants: number;
  leases: number;
  documents: number;
  vendors: number;
  owners: number;
};

export type SwitchingChecklistItem = {
  id: string;
  label: string;
  complete: boolean;
  href: string;
  help: string;
};

export type SwitchingValidationIssue = {
  id: string;
  severity: "error" | "warning";
  title: string;
  description: string;
  count: number;
  fixLabel: string;
  fixHref: string;
  fixAction?: "bulk_skip_review" | "invite_residents" | "open_move_in";
};

export type GoLiveChecklistGroup = {
  title: string;
  items: string[];
};

export type CustomerSwitchingSnapshot = {
  metrics: MigrationDashboardMetrics;
  imported: SwitchingEntityCounts;
  portfolio: SwitchingEntityCounts;
  checklist: SwitchingChecklistItem[];
  remainingTasks: number;
  overallCompletionPct: number;
  estimatedMinutesRemaining: number | null;
  goLiveReady: boolean;
  goLiveStatus: "not_started" | "in_progress" | "blocked" | "ready";
  validationIssues: SwitchingValidationIssue[];
  goLiveGroups: GoLiveChecklistGroup[];
  recommendedFirstActions: Array<{ label: string; href: string; why: string }>;
};

export async function getCustomerSwitchingSnapshot(
  organizationId: string,
  client?: SupabaseClientType
): Promise<CustomerSwitchingSnapshot> {
  const supabase = client ?? (await createAuthServerComponentClient());
  const [metrics, portfolioCounts, imported, validationIssues, readiness] = await Promise.all([
    getMigrationDashboardMetrics(organizationId, supabase),
    getPortfolioCounts(organizationId),
    countImportedEntities(organizationId, supabase),
    detectSwitchingValidationIssues(organizationId, supabase),
    loadSwitchingReadiness(organizationId, supabase)
  ]);

  const portfolio: SwitchingEntityCounts = {
    properties: portfolioCounts.properties,
    units: portfolioCounts.units,
    residents: portfolioCounts.tenants,
    applicants: readiness.applicants,
    leases: portfolioCounts.leases,
    documents: readiness.documents,
    vendors: portfolioCounts.vendors,
    owners: readiness.owners
  };

  const checklist = buildSwitchingChecklist({
    organizationCreated: true,
    staffInvited: readiness.staffInvited,
    properties: portfolio.properties > 0 || imported.properties > 0,
    units: portfolio.units > 0 || imported.units > 0,
    residents: portfolio.residents > 0 || imported.residents > 0,
    leases: portfolio.leases > 0 || imported.leases > 0,
    documents: portfolio.documents > 0 || imported.documents > 0,
    vendors: portfolio.vendors > 0 || imported.vendors > 0,
    paymentsConnected: readiness.paymentsConnected,
    notificationsConfigured: readiness.notificationsConfigured,
    residentInvitesSent: readiness.residentInvitesSent,
    pendingReview: metrics.pendingReview,
    blockingIssues: validationIssues.filter((issue) => issue.severity === "error").length
  });

  const completed = checklist.filter((item) => item.complete).length;
  const overallCompletionPct = Math.round((completed / checklist.length) * 100);
  const remainingTasks = checklist.length - completed;
  const goLiveReady = remainingTasks === 0 && metrics.pendingReview === 0;
  const goLiveStatus: CustomerSwitchingSnapshot["goLiveStatus"] = goLiveReady
    ? "ready"
    : validationIssues.some((issue) => issue.severity === "error") || metrics.pendingReview > 0
      ? "blocked"
      : completed === 0
        ? "not_started"
        : "in_progress";

  const estimatedMinutesRemaining = estimateMinutesRemaining({
    remainingTasks,
    pendingReview: metrics.pendingReview,
    activeJobs: metrics.activeJobs,
    validationErrors: validationIssues.filter((issue) => issue.severity === "error").length
  });

  return {
    metrics,
    imported,
    portfolio,
    checklist,
    remainingTasks,
    overallCompletionPct,
    estimatedMinutesRemaining,
    goLiveReady,
    goLiveStatus,
    validationIssues,
    goLiveGroups: buildGoLiveGroups(goLiveReady),
    recommendedFirstActions: buildRecommendedActions({
      goLiveReady,
      pendingReview: metrics.pendingReview,
      properties: portfolio.properties,
      residents: portfolio.residents,
      leases: portfolio.leases,
      residentInvitesSent: readiness.residentInvitesSent
    })
  };
}

async function countImportedEntities(
  organizationId: string,
  client: SupabaseClientType
): Promise<SwitchingEntityCounts> {
  const { data, error } = await client
    .from("migration_record_links")
    .select("entity_type")
    .eq("organization_id", organizationId)
    .is("rolled_back_at", null);

  if (error) throw new Error(error.message);

  const counts: SwitchingEntityCounts = {
    properties: 0,
    units: 0,
    residents: 0,
    applicants: 0,
    leases: 0,
    documents: 0,
    vendors: 0,
    owners: 0
  };

  for (const row of data ?? []) {
    const type = String(row.entity_type);
    if (type === "property") counts.properties += 1;
    else if (type === "unit") counts.units += 1;
    else if (type === "tenant") counts.residents += 1;
    else if (type === "applicant") counts.applicants += 1;
    else if (type === "lease") counts.leases += 1;
    else if (type === "document" || type === "vault_document") counts.documents += 1;
    else if (type === "vendor") counts.vendors += 1;
    else if (type === "owner") counts.owners += 1;
  }

  return counts;
}

async function loadSwitchingReadiness(organizationId: string, client: SupabaseClientType) {
  const [
    { count: applicants },
    { count: documents },
    { count: staffInvites },
    { count: acceptedStaff },
    { count: residentInvites },
    { count: notificationPrefs },
    { count: paymentMethods }
  ] = await Promise.all([
    client
      .from("applicants")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .is("deleted_at", null),
    client
      .from("vault_documents")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .is("deleted_at", null),
    client
      .from("organization_invitations")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .contains("roles", ["property_manager"]),
    client
      .from("organization_memberships")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "active")
      .contains("roles", ["property_manager"]),
    client
      .from("organization_invitations")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .contains("roles", ["tenant"]),
    client
      .from("notification_preferences")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId),
    client
      .from("payments")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
  ]);

  // Owners are not a first-class import entity yet — surface 0 unless linked as owner later.
  return {
    applicants: applicants ?? 0,
    documents: documents ?? 0,
    owners: 0,
    staffInvited: (staffInvites ?? 0) > 0 || (acceptedStaff ?? 0) > 1,
    residentInvitesSent: (residentInvites ?? 0) > 0,
    notificationsConfigured: (notificationPrefs ?? 0) > 0,
    // Connected if any payment activity exists OR billing settings table would; payments as proxy
    paymentsConnected: (paymentMethods ?? 0) > 0
  };
}

async function detectSwitchingValidationIssues(
  organizationId: string,
  client: SupabaseClientType
): Promise<SwitchingValidationIssue[]> {
  const issues: SwitchingValidationIssue[] = [];

  const [
    { count: unitsWithoutProperty },
    { data: tenantsWithoutUnit },
    { data: leasesMissingTenant },
    { data: leasesMissingRent },
    { data: leasesMissingDates },
    { count: pendingReview },
    { data: tenantEmails }
  ] = await Promise.all([
    client
      .from("units")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .is("property_id", null),
    client
      .from("tenants")
      .select("id")
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .is("unit_id", null)
      .neq("lifecycle_status", "former")
      .limit(200),
    client
      .from("leases")
      .select("id")
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .is("primary_tenant_id", null)
      .limit(200),
    client
      .from("leases")
      .select("id")
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .or("rent_amount.is.null,rent_amount.eq.0")
      .limit(200),
    client
      .from("leases")
      .select("id")
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .or("start_date.is.null,end_date.is.null")
      .limit(200),
    client
      .from("migration_review_items")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "pending"),
    client
      .from("tenants")
      .select("email")
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .limit(2000)
  ]);

  const { count: propertiesCount } = await client
    .from("properties")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .is("deleted_at", null);

  if ((propertiesCount ?? 0) === 0) {
    issues.push({
      id: "missing_properties",
      severity: "error",
      title: "No properties yet",
      description: "Your portfolio needs at least one property before go-live.",
      count: 1,
      fixLabel: "Import or create a property",
      fixHref: "/migration/new"
    });
  }

  if ((unitsWithoutProperty ?? 0) > 0) {
    issues.push({
      id: "units_without_properties",
      severity: "error",
      title: "Units without a property",
      description: "Some units are not linked to a property and won’t show correctly in operations.",
      count: unitsWithoutProperty ?? 0,
      fixLabel: "Review units",
      fixHref: "/units"
    });
  }

  const tenantsMissingUnit = tenantsWithoutUnit?.length ?? 0;
  if (tenantsMissingUnit > 0) {
    issues.push({
      id: "residents_without_units",
      severity: "warning",
      title: "Residents without a unit",
      description: "These residents aren’t assigned to a unit yet — finish assignment before inviting them.",
      count: tenantsMissingUnit,
      fixLabel: "Open Move In",
      fixHref: "/residents/move-in",
      fixAction: "open_move_in"
    });
  }

  const leasesNoResident = leasesMissingTenant?.length ?? 0;
  if (leasesNoResident > 0) {
    issues.push({
      id: "leases_without_residents",
      severity: "error",
      title: "Leases without a resident",
      description: "Leases need a primary resident to collect rent and enable the portal.",
      count: leasesNoResident,
      fixLabel: "Review leases",
      fixHref: "/leases"
    });
  }

  const missingRent = leasesMissingRent?.length ?? 0;
  if (missingRent > 0) {
    issues.push({
      id: "missing_rent_amounts",
      severity: "warning",
      title: "Leases missing rent amount",
      description: "Add monthly rent so charges and owner statements work correctly.",
      count: missingRent,
      fixLabel: "Review leases",
      fixHref: "/leases"
    });
  }

  const missingDates = leasesMissingDates?.length ?? 0;
  if (missingDates > 0) {
    issues.push({
      id: "missing_lease_dates",
      severity: "warning",
      title: "Leases missing start or end dates",
      description: "Lease dates drive renewals and expiration alerts.",
      count: missingDates,
      fixLabel: "Review leases",
      fixHref: "/leases"
    });
  }

  const emailMap = new Map<string, number>();
  for (const row of tenantEmails ?? []) {
    const email = String(row.email).toLowerCase();
    emailMap.set(email, (emailMap.get(email) ?? 0) + 1);
  }
  const duplicateEmails = [...emailMap.values()].filter((count) => count > 1).length;
  if (duplicateEmails > 0) {
    issues.push({
      id: "duplicate_emails",
      severity: "warning",
      title: "Duplicate resident emails",
      description: "Duplicate emails can block portal invites. Keep one record per resident.",
      count: duplicateEmails,
      fixLabel: "Review residents",
      fixHref: "/tenants"
    });
  }

  if ((pendingReview ?? 0) > 0) {
    issues.push({
      id: "pending_review_queue",
      severity: "error",
      title: "Import exceptions need a decision",
      description: "Resolve or skip review items so your migration can finish cleanly.",
      count: pendingReview ?? 0,
      fixLabel: "Open review queue",
      fixHref: "/migration",
      fixAction: "bulk_skip_review"
    });
  }

  return issues;
}

function buildSwitchingChecklist(flags: {
  organizationCreated: boolean;
  staffInvited: boolean;
  properties: boolean;
  units: boolean;
  residents: boolean;
  leases: boolean;
  documents: boolean;
  vendors: boolean;
  paymentsConnected: boolean;
  notificationsConfigured: boolean;
  residentInvitesSent: boolean;
  pendingReview: number;
  blockingIssues: number;
}): SwitchingChecklistItem[] {
  const readyToGoLive =
    flags.organizationCreated &&
    flags.properties &&
    flags.units &&
    flags.residents &&
    flags.leases &&
    flags.pendingReview === 0 &&
    flags.blockingIssues === 0;

  return [
    {
      id: "organization",
      label: "Organization created",
      complete: flags.organizationCreated,
      href: "/setup",
      help: "Your company workspace is the home for every property and teammate."
    },
    {
      id: "staff",
      label: "Staff invited",
      complete: flags.staffInvited,
      href: "/setup",
      help: "Invite an assistant manager or leasing lead so you’re not operating alone."
    },
    {
      id: "properties",
      label: "Properties imported",
      complete: flags.properties,
      href: "/migration/new",
      help: "Properties are the foundation — units and residents attach here."
    },
    {
      id: "units",
      label: "Units imported",
      complete: flags.units,
      href: "/migration/new",
      help: "Units unlock occupancy tracking and lease assignment."
    },
    {
      id: "residents",
      label: "Residents imported",
      complete: flags.residents,
      href: "/migration/new",
      help: "Bring resident contact details over so you can invite them to the portal."
    },
    {
      id: "leases",
      label: "Leases imported",
      complete: flags.leases,
      href: "/migration/new",
      help: "Leases connect residents to units and enable rent collection."
    },
    {
      id: "documents",
      label: "Documents imported",
      complete: flags.documents,
      href: "/migration/new",
      help: "Lease PDFs and supporting files stay attached in the document vault."
    },
    {
      id: "vendors",
      label: "Vendors imported",
      complete: flags.vendors,
      href: "/migration/new",
      help: "Vendors keep maintenance assignments ready on day one."
    },
    {
      id: "payments",
      label: "Payment settings connected",
      complete: flags.paymentsConnected,
      href: "/financials",
      help: "Connect billing so you can record or collect rent after go-live."
    },
    {
      id: "notifications",
      label: "Notifications configured",
      complete: flags.notificationsConfigured,
      href: "/settings/notifications",
      help: "Make sure staff and residents get the alerts that matter."
    },
    {
      id: "resident_invites",
      label: "Resident invitations sent",
      complete: flags.residentInvitesSent,
      href: "/residents/bulk",
      help: "Invite residents so they can pay, request maintenance, and receive updates."
    },
    {
      id: "go_live",
      label: "Ready to go live",
      complete: readyToGoLive,
      href: "/migration#go-live",
      help: "All critical portfolio pieces are in place and exceptions are cleared."
    }
  ];
}

function estimateMinutesRemaining(input: {
  remainingTasks: number;
  pendingReview: number;
  activeJobs: number;
  validationErrors: number;
}): number | null {
  if (input.remainingTasks === 0 && input.pendingReview === 0) return 0;
  const minutes =
    input.remainingTasks * 8 + input.pendingReview * 2 + input.activeJobs * 15 + input.validationErrors * 5;
  return Math.max(10, Math.min(minutes, 240));
}

function buildGoLiveGroups(ready: boolean): GoLiveChecklistGroup[] {
  return [
    {
      title: "Go Live Checklist",
      items: ready
        ? [
            "Confirm today’s rent charges look right",
            "Walk one property in Operations Center",
            "Tell your team M.P.A. is the system of record"
          ]
        : [
            "Finish remaining migration checklist items",
            "Clear import exceptions in the review queue",
            "Verify properties, units, residents, and leases"
          ]
    },
    {
      title: "Staff Checklist",
      items: [
        "Confirm each staff member can sign in",
        "Assign who owns maintenance vs leasing today",
        "Bookmark Operations Center for morning standup"
      ]
    },
    {
      title: "Resident Checklist",
      items: [
        "Send portal invitations to active residents",
        "Share how to submit a maintenance request",
        "Confirm welcome notifications arrived for a test resident"
      ]
    }
  ];
}

function buildRecommendedActions(input: {
  goLiveReady: boolean;
  pendingReview: number;
  properties: number;
  residents: number;
  leases: number;
  residentInvitesSent: boolean;
}): Array<{ label: string; href: string; why: string }> {
  if (input.goLiveReady) {
    return [
      {
        label: "Open Operations Center",
        href: "/dashboard",
        why: "See what needs attention on day one."
      },
      {
        label: "Move in a resident",
        href: "/residents/move-in",
        why: "Practice the guided move-in before peak season."
      },
      {
        label: "Record a payment",
        href: "/financials/charges",
        why: "Confirm billing feels natural for your team."
      }
    ];
  }

  const actions: Array<{ label: string; href: string; why: string }> = [];
  if (input.pendingReview > 0) {
    actions.push({
      label: "Resolve import exceptions",
      href: "/migration",
      why: "Clear blockers so your data is trustworthy."
    });
  }
  if (input.properties === 0) {
    actions.push({
      label: "Start portfolio import",
      href: "/migration/new",
      why: "Bring properties over first — everything else depends on them."
    });
  } else if (input.residents === 0) {
    actions.push({
      label: "Import residents",
      href: "/migration/new",
      why: "Residents unlock leases, invites, and the portal."
    });
  } else if (input.leases === 0) {
    actions.push({
      label: "Import leases",
      href: "/migration/new",
      why: "Leases connect people to units and rent."
    });
  }
  if (!input.residentInvitesSent && input.residents > 0) {
    actions.push({
      label: "Send resident invitations",
      href: "/residents/bulk",
      why: "Get residents into the portal before go-live week."
    });
  }
  if (actions.length === 0) {
    actions.push({
      label: "Continue migration checklist",
      href: "/migration",
      why: "Finish the remaining switching steps at your pace."
    });
  }
  return actions.slice(0, 4);
}

export async function bulkSkipPendingReviewItems(
  organizationId: string,
  userId: string,
  jobId: string | null,
  client?: SupabaseClientType
): Promise<{ skipped: number }> {
  const supabase = client ?? (await createAuthServerComponentClient());
  let query = supabase
    .from("migration_review_items")
    .select("id, job_id")
    .eq("organization_id", organizationId)
    .eq("status", "pending")
    .limit(100);

  if (jobId) query = query.eq("job_id", jobId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const { resolveMigrationReviewItem } = await import("./server");
  let skipped = 0;
  for (const item of data ?? []) {
    await resolveMigrationReviewItem(
      organizationId,
      item.job_id as string,
      item.id as string,
      userId,
      "skipped",
      { action: "skip", reason: "one_click_bulk_skip" },
      supabase
    );
    skipped += 1;
  }
  return { skipped };
}
