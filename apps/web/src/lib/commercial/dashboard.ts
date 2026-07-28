/**
 * COM-001 Slice E — staff-only commercial dashboard aggregates (control plane).
 * Consumes COM A–D + BILL mirrors; never exposed to customer APIs.
 */
import { createServiceRoleServerClient } from "../auth/server";
import { listPrice } from "../saas/plan-display";
import type { SaasBillingInterval, SaasPlanCode } from "../integrations/saas-billing/contracts";
import { emitCommercialOpsEvent } from "./ops-events";
import type { CommercialDashboardSnapshot } from "./dashboard-types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

function serviceClient(): AnyClient {
  const client = createServiceRoleServerClient();
  if (!client) throw new Error("Commercial dashboard requires SUPABASE_SERVICE_ROLE_KEY");
  return client;
}

function countBy<T extends string>(rows: Array<Record<string, unknown>>, key: string): Record<T, number> {
  const out: Record<string, number> = {};
  for (const row of rows) {
    const k = String(row[key] ?? "unknown");
    out[k] = (out[k] ?? 0) + 1;
  }
  return out as Record<T, number>;
}

async function headCount(
  admin: AnyClient,
  table: string,
  apply?: (q: AnyClient) => AnyClient
): Promise<number> {
  let q = admin.from(table).select("id", { count: "exact", head: true });
  if (apply) q = apply(q);
  const { count, error } = await q;
  if (error) return 0;
  return count ?? 0;
}

/**
 * Build staff commercial dashboard snapshot from real COM + BILL tables.
 */
export async function getCommercialDashboardSnapshot(input?: {
  actorUserId?: string | null;
  emitOpened?: boolean;
}): Promise<CommercialDashboardSnapshot> {
  const admin = serviceClient();
  const now = new Date();
  const nowIso = now.toISOString();
  const d30 = new Date(now);
  d30.setUTCDate(d30.getUTCDate() - 30);
  const d7 = new Date(now);
  d7.setUTCDate(d7.getUTCDate() + 7);

  const [
    orgRows,
    newCustomersLast30Days,
    progressRows,
    healthRows,
    subRows,
    openInvoices,
    renewalRows,
    opportunityRows,
    offboardingRows,
    discoveryAccepted,
    discoveryOpen,
    engagementsTotal,
    engagementsOpen,
    partnersStub,
    saasTrialing,
    endingSoon7Days
  ] = await Promise.all([
    admin.from("organizations").select("id, commercial_status, created_at"),
    headCount(admin, "organizations", (q) =>
      q.eq("commercial_status", "active").gte("created_at", d30.toISOString())
    ),
    admin
      .from("commercial_implementation_progress")
      .select("organization_id, score, highest_milestone"),
    admin.from("commercial_health_scores").select("organization_id, band"),
    admin
      .from("saas_subscriptions")
      .select("organization_id, status, plan_code, billing_interval, current_period_end"),
    admin
      .from("saas_invoices")
      .select("id, amount_due, status")
      .in("status", ["open", "draft"]),
    admin.from("commercial_renewal_alerts").select("milestone_key, status"),
    admin.from("commercial_opportunities").select("id, stage, implementation_preference"),
    admin.from("commercial_offboarding_states").select("organization_id, stage"),
    headCount(admin, "commercial_feature_discovery_states", (q) =>
      q.eq("status", "accepted")
    ),
    headCount(admin, "commercial_feature_discovery_states", (q) =>
      q.in("status", ["open", "impressed", "snoozed"])
    ),
    headCount(admin, "commercial_implementation_engagements"),
    headCount(admin, "commercial_implementation_engagements", (q) =>
      q.in("status", ["requested", "matched", "in_progress"])
    ),
    headCount(admin, "commercial_implementation_partners"),
    headCount(admin, "saas_subscriptions", (q) => q.eq("status", "trialing")),
    headCount(admin, "saas_subscriptions", (q) =>
      q
        .eq("status", "trialing")
        .not("current_period_end", "is", null)
        .lte("current_period_end", d7.toISOString())
    )
  ]);

  const orgs = (
    orgRows.error ? [] : (orgRows.data ?? [])
  ) as Array<Record<string, unknown>>;
  const orgStatus = {
    total: orgs.length,
    trial: 0,
    pendingSetup: 0,
    active: 0,
    cancelled: 0,
    archived: 0,
    unknown: 0
  };
  for (const org of orgs) {
    const s = org["commercial_status"] != null ? String(org["commercial_status"]) : null;
    if (s === "trial") orgStatus.trial += 1;
    else if (s === "pending_setup") orgStatus.pendingSetup += 1;
    else if (s === "active") orgStatus.active += 1;
    else if (s === "cancelled") orgStatus.cancelled += 1;
    else if (s === "archived") orgStatus.archived += 1;
    else orgStatus.unknown += 1;
  }

  const progress = (progressRows.data ?? []) as Array<Record<string, unknown>>;
  let queueBelow100 = 0;
  let stalledBelow50 = 0;
  for (const row of progress) {
    const score = Number(row["score"] ?? 0);
    if (score < 100) queueBelow100 += 1;
    if (score < 50) stalledBelow50 += 1;
  }

  const opportunities = (opportunityRows.data ?? []) as Array<Record<string, unknown>>;
  let aiGuidedPath = 0;
  let professionalPath = 0;
  for (const row of opportunities) {
    const pref = String(row["implementation_preference"] ?? "");
    if (pref === "ai_guided") aiGuidedPath += 1;
    if (pref === "professional") professionalPath += 1;
  }

  const healthCounts = {
    healthy: 0,
    needsAttention: 0,
    atRisk: 0,
    critical: 0,
    unscored: Math.max(0, orgStatus.total - ((healthRows.data ?? []) as unknown[]).length)
  };
  for (const row of (healthRows.data ?? []) as Array<Record<string, unknown>>) {
    const band = String(row["band"] ?? "");
    if (band === "healthy") healthCounts.healthy += 1;
    else if (band === "needs_attention") healthCounts.needsAttention += 1;
    else if (band === "at_risk") healthCounts.atRisk += 1;
    else if (band === "critical") healthCounts.critical += 1;
  }

  const subs = (subRows.data ?? []) as Array<Record<string, unknown>>;
  let activeSubscriptions = 0;
  let pastDueSubscriptions = 0;
  let estimatedListMrr = 0;
  for (const sub of subs) {
    const status = String(sub["status"] ?? "");
    if (status === "active" || status === "trialing") {
      if (status === "active") activeSubscriptions += 1;
      const plan = String(sub["plan_code"] ?? "professional") as SaasPlanCode;
      const interval = String(sub["billing_interval"] ?? "month") as SaasBillingInterval;
      const price = listPrice(plan, interval);
      if (price != null) {
        estimatedListMrr += interval === "year" ? price / 12 : price;
      }
    }
    if (status === "past_due") pastDueSubscriptions += 1;
  }

  const invoices = (openInvoices.data ?? []) as Array<Record<string, unknown>>;
  let openInvoiceAmountDue = 0;
  for (const inv of invoices) {
    openInvoiceAmountDue += Number(inv["amount_due"] ?? 0);
  }

  const renewals = (renewalRows.data ?? []) as Array<Record<string, unknown>>;
  let renewalPending = 0;
  let renewalDueOrEmitted = 0;
  let t90 = 0;
  let t30 = 0;
  let t7 = 0;
  for (const row of renewals) {
    const status = String(row["status"] ?? "");
    const key = String(row["milestone_key"] ?? "");
    if (status === "pending") renewalPending += 1;
    if (status === "due" || status === "emitted") renewalDueOrEmitted += 1;
    if (key === "t90") t90 += 1;
    if (key === "t30") t30 += 1;
    if (key === "t7") t7 += 1;
  }

  const pipeline = countBy<string>(opportunities, "stage");

  const offboarding = (offboardingRows.data ?? []) as Array<Record<string, unknown>>;
  let exportWindow = 0;
  let frozen = 0;
  let archiveScheduled = 0;
  let inFlight = 0;
  for (const row of offboarding) {
    const stage = String(row["stage"] ?? "none");
    if (stage === "none" || stage === "recovered" || stage === "archived") continue;
    inFlight += 1;
    if (stage === "export_window") exportWindow += 1;
    if (stage === "frozen") frozen += 1;
    if (stage === "archive_scheduled") archiveScheduled += 1;
  }

  const snapshot: CommercialDashboardSnapshot = {
    generatedAt: nowIso,
    organizations: orgStatus,
    newCustomersLast30Days,
    trials: {
      commercialTrialStatus: orgStatus.trial,
      saasTrialing,
      endingSoon7Days
    },
    implementation: {
      queueBelow100,
      aiGuidedPath,
      professionalPath,
      stalledBelow50
    },
    health: healthCounts,
    billing: {
      activeSubscriptions,
      pastDueSubscriptions,
      openInvoiceCount: invoices.length,
      openInvoiceAmountDue,
      estimatedListMrr: Math.round(estimatedListMrr * 100) / 100
    },
    renewals: {
      pending: renewalPending,
      dueOrEmitted: renewalDueOrEmitted,
      t90,
      t30,
      t7
    },
    pipeline,
    offboarding: {
      inFlight,
      exportWindow,
      frozen,
      archiveScheduled
    },
    discovery: {
      openImpressions: discoveryOpen,
      accepted: discoveryAccepted
    },
    marketplace: {
      engagementsTotal,
      engagementsOpen,
      partnersStub
    },
    support: {
      available: false,
      openTickets: null
    }
  };

  if (input?.emitOpened) {
    await emitCommercialOpsEvent({
      eventType: "commercial.dashboard.opened",
      organizationId: null,
      subjectType: "commercial_dashboard",
      subjectId: "staff",
      actorUserId: input.actorUserId ?? null,
      summary: "Staff commercial dashboard opened",
      payload: {
        active_orgs: snapshot.organizations.active,
        past_due: snapshot.billing.pastDueSubscriptions,
        critical_health: snapshot.health.critical
      }
    });
  }

  return snapshot;
}
