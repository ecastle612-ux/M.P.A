/**
 * UX-016 Slice B — role-specific view-model builders (presentation only).
 */

import type { LeaseListItem } from "../lease/server";
import type { TechnicianDashboardBuckets } from "../facility/technician-dashboard";
import type { OwnerPortalDashboardModel } from "../owner-portal/dashboard";
import type { OperationsCenterSnapshot } from "../master-admin/operations-center";
import type { VendorJobCard } from "../vendor-jobs/contracts";
import type { TenantAttentionItem, TenantTodayCard } from "../../components/portal/tenant-portal-home";
import {
  withSurfaceCopy,
  type UniversalAttentionItem,
  type UniversalDashboardViewModel,
  type UniversalMissionItem,
  type UniversalQuickAction
} from "./ux016-view-model";
import { UX016_SURFACE_COPY } from "./ux016-surfaces";

function greetingBase(input: {
  timeGreeting: string;
  userName: string | null;
  organizationName: string | null;
  placeLabel: string;
  dateLabel: string;
  statusSummary: string;
  supportingLine: string;
}) {
  return input;
}

export function buildTechnicianDashboardViewModel(input: {
  timeGreeting: string;
  userGreetingName: string | null;
  organizationName: string | null;
  dateLabel: string;
  buckets: TechnicianDashboardBuckets;
}): UniversalDashboardViewModel {
  const copy = UX016_SURFACE_COPY.facility_technician;
  const attention: UniversalAttentionItem[] = [];

  for (const job of [...input.buckets.overdue, ...input.buckets.today]) {
    if (attention.length >= 5) break;
    const severity =
      job.priority === "emergency" ? "critical" : job.priority === "high" ? "high" : "normal";
    attention.push({
      id: `tech-${job.id}`,
      title: job.title,
      reason: `${job.priority} · ${job.status}${job.dueDate ? ` · due ${job.dueDate.slice(0, 10)}` : ""}`,
      href: `/maintenance/${job.id}`,
      actionLabel: "Open job",
      severity
    });
  }

  const byPriority = {
    emergency: input.buckets.today.filter((j) => j.priority === "emergency").length,
    high: input.buckets.today.filter((j) => j.priority === "high").length,
    medium: input.buckets.today.filter((j) => j.priority === "medium").length,
    low: input.buckets.today.filter((j) => j.priority === "low").length
  };

  const mission: UniversalMissionItem[] = [];
  if (byPriority.emergency > 0) {
    mission.push({
      id: "tech-emergency",
      label: "emergency jobs",
      count: byPriority.emergency,
      href: "/maintenance?priority=emergency"
    });
  }
  if (byPriority.high > 0) {
    mission.push({
      id: "tech-high",
      label: "high-priority jobs",
      count: byPriority.high,
      href: "/maintenance?priority=high"
    });
  }
  if (byPriority.medium > 0) {
    mission.push({
      id: "tech-medium",
      label: "medium-priority jobs",
      count: byPriority.medium,
      href: "/maintenance?priority=medium"
    });
  }
  if (byPriority.low > 0) {
    mission.push({
      id: "tech-low",
      label: "low-priority jobs",
      count: byPriority.low,
      href: "/maintenance?priority=low"
    });
  }
  if (input.buckets.overdue.length > 0) {
    mission.push({
      id: "tech-overdue",
      label: "overdue jobs",
      count: input.buckets.overdue.length,
      href: "/maintenance"
    });
  }
  if (input.buckets.waiting.length > 0) {
    mission.push({
      id: "tech-waiting",
      label: "waiting / on hold",
      count: input.buckets.waiting.length,
      href: "/maintenance"
    });
  }

  const nextJob = attention[0];
  const statusSummary = nextJob
    ? `Your next job: ${nextJob.title}.`
    : input.buckets.today.length > 0
      ? `You have ${input.buckets.today.length} assigned job${input.buckets.today.length === 1 ? "" : "s"} today.`
      : "No assigned jobs right now.";

  const quickActions: UniversalQuickAction[] = [
    {
      id: "tech-start",
      label: "Start Job",
      href: nextJob?.href ?? "/maintenance"
    },
    { id: "tech-navigate", label: "Open Queue", href: "/maintenance" },
    { id: "tech-photos", label: "Upload Photos", href: nextJob?.href ?? "/maintenance" },
    { id: "tech-complete", label: "Complete Job", href: nextJob?.href ?? "/maintenance" },
    { id: "tech-parts", label: "Request Parts", href: nextJob?.href ?? "/facility/inventory" },
    { id: "tech-office", label: "Contact Office", href: "/inbox" }
  ];

  return withSurfaceCopy("facility_technician", {
    greeting: greetingBase({
      timeGreeting: input.timeGreeting,
      userName: input.userGreetingName,
      organizationName: input.organizationName,
      placeLabel: nextJob ? "Assigned jobs" : "Field queue",
      dateLabel: input.dateLabel,
      statusSummary,
      supportingLine: copy.supportingLine
    }),
    attention,
    mission: mission.slice(0, 8),
    quickActions,
    recentActivity: input.buckets.today.slice(0, 5).map((job) => ({
      id: `tech-act-${job.id}`,
      summary: job.title,
      meta: `${job.priority} · ${job.status}`,
      href: `/maintenance/${job.id}`
    })),
    insights: [
      { id: "tech-today", label: "Today", value: String(input.buckets.today.length), href: "/maintenance" },
      { id: "tech-overdue", label: "Overdue", value: String(input.buckets.overdue.length), href: "/maintenance" },
      { id: "tech-waiting", label: "Waiting", value: String(input.buckets.waiting.length), href: "/maintenance" }
    ]
  });
}

export function buildLeasingDashboardViewModel(input: {
  timeGreeting: string;
  userGreetingName: string | null;
  organizationName: string | null;
  dateLabel: string;
  leases: LeaseListItem[];
  canCreateLease: boolean;
  canCreateApplicant: boolean;
}): UniversalDashboardViewModel {
  const copy = UX016_SURFACE_COPY.leasing_agent;
  const today = new Date().toISOString().slice(0, 10);
  const active = input.leases.filter((l) => l.status === "active");
  const awaitingSignature = input.leases.filter((l) => l.status === "draft" || l.status === "signed");
  const renewals = input.leases.filter(
    (l) => l.renewalStatus === "offered" || l.renewalStatus === "pending" || l.renewalStatus === "notice_given"
  );
  const expiringSoon = input.leases.filter((l) => {
    if (!l.endDate || l.status !== "active") return false;
    const end = l.endDate.slice(0, 10);
    return end >= today && end <= new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString().slice(0, 10);
  });

  const attention: UniversalAttentionItem[] = [];
  for (const lease of awaitingSignature.slice(0, 3)) {
    attention.push({
      id: `lease-sig-${lease.id}`,
      title:
        lease.status === "draft"
          ? `Lease ${lease.leaseNumber} unsent`
          : `Lease ${lease.leaseNumber} awaiting activation`,
      reason: lease.tenantName
        ? `${lease.tenantName} · ${lease.status === "draft" ? "draft / unsent" : "signed"}`
        : lease.status === "draft"
          ? "Draft lease needs to be sent"
          : "Signed lease ready to activate",
      href: `/leases/${lease.id}`,
      actionLabel: lease.status === "draft" ? "Send lease" : "Review",
      severity: "high"
    });
  }
  for (const lease of expiringSoon.slice(0, 2)) {
    if (attention.length >= 5) break;
    attention.push({
      id: `lease-exp-${lease.id}`,
      title: `Lease ${lease.leaseNumber} expiring`,
      reason: `Ends ${lease.endDate?.slice(0, 10) ?? "soon"}`,
      href: `/leases/${lease.id}`,
      actionLabel: "Follow up",
      severity: "high"
    });
  }
  for (const lease of renewals.slice(0, 2)) {
    if (attention.length >= 5) break;
    attention.push({
      id: `lease-renew-${lease.id}`,
      title: `Lease ${lease.leaseNumber} renewal`,
      reason: `Renewal status: ${lease.renewalStatus}`,
      href: `/leases/${lease.id}`,
      actionLabel: "Follow up",
      severity: "normal"
    });
  }

  const mission: UniversalMissionItem[] = [];
  if (awaitingSignature.length > 0) {
    mission.push({
      id: "leasing-signatures",
      label: "leases to send / activate",
      count: awaitingSignature.length,
      href: "/leases?status=draft"
    });
  }
  if (renewals.length > 0) {
    mission.push({
      id: "leasing-followups",
      label: "follow-ups / renewals",
      count: renewals.length,
      href: "/leases"
    });
  }
  if (expiringSoon.length > 0) {
    mission.push({
      id: "leasing-expiring",
      label: "expiring leases",
      count: expiringSoon.length,
      href: "/leases?status=active"
    });
  }
  mission.push({
    id: "leasing-applicants",
    label: "applications",
    count: Math.max(1, awaitingSignature.length),
    href: "/applicants"
  });
  mission.push({
    id: "leasing-active",
    label: "active leases",
    count: active.length,
    href: "/leases?status=active"
  });

  const quickActions: UniversalQuickAction[] = [
    { id: "leasing-tour", label: "Schedule Tour", href: "/applicants" },
    ...(input.canCreateLease
      ? [{ id: "leasing-send", label: "Send Lease", href: "/leases/new" }]
      : [{ id: "leasing-open", label: "Open Leases", href: "/leases" }]),
    { id: "leasing-contact", label: "Contact Applicant", href: "/applicants" },
    ...(input.canCreateApplicant
      ? [{ id: "leasing-app", label: "Create Application", href: "/applicants/new" }]
      : [{ id: "leasing-apps", label: "Applications", href: "/applicants" }]),
    { id: "leasing-docs", label: "Documents", href: "/settings/documents" },
    { id: "leasing-residents", label: "Residents", href: "/tenants" }
  ];

  return withSurfaceCopy("leasing_agent", {
    greeting: greetingBase({
      timeGreeting: input.timeGreeting,
      userName: input.userGreetingName,
      organizationName: input.organizationName,
      placeLabel: "Leasing pipeline",
      dateLabel: input.dateLabel,
      statusSummary:
        awaitingSignature.length > 0
          ? `${awaitingSignature.length} lease${awaitingSignature.length === 1 ? "" : "s"} need sending or activation.`
          : expiringSoon.length > 0
            ? `${expiringSoon.length} lease${expiringSoon.length === 1 ? "" : "s"} expiring soon.`
            : "Leasing pipeline is clear for now.",
      supportingLine: copy.supportingLine
    }),
    attention,
    mission: mission.slice(0, 8),
    quickActions: quickActions.slice(0, 6),
    recentActivity: input.leases.slice(0, 6).map((lease) => ({
      id: `lease-act-${lease.id}`,
      summary: `Lease ${lease.leaseNumber}`,
      meta: [lease.tenantName, lease.status].filter(Boolean).join(" · "),
      href: `/leases/${lease.id}`
    })),
    insights: [
      { id: "leasing-active-kpi", label: "Active leases", value: String(active.length), href: "/leases" },
      {
        id: "leasing-sig-kpi",
        label: "Draft / signed",
        value: String(awaitingSignature.length),
        href: "/leases"
      },
      { id: "leasing-exp-kpi", label: "Expiring soon", value: String(expiringSoon.length), href: "/leases" }
    ]
  });
}

export function buildResidentDashboardViewModel(input: {
  timeGreeting: string;
  firstName: string;
  propertyName: string | null;
  unitNumber: string | null;
  dateLabel: string;
  hasLinkedTenant: boolean;
  attentionItems: TenantAttentionItem[];
  todayCards: TenantTodayCard[];
}): UniversalDashboardViewModel {
  const copy = UX016_SURFACE_COPY.resident;
  const place = [input.propertyName, input.unitNumber ? `Unit ${input.unitNumber}` : null]
    .filter(Boolean)
    .join(" · ");

  const attention: UniversalAttentionItem[] = input.attentionItems.slice(0, 5).map((item) => ({
    id: item.id,
    title: item.title,
    reason: item.body,
    href: item.href,
    actionLabel: "Open",
    severity: item.critical ? "critical" : item.unread || item.timeSensitive ? "high" : "normal"
  }));

  const mission: UniversalMissionItem[] = input.todayCards.slice(0, 8).map((card, index) => ({
    id: card.id || `today-${index}`,
    label: card.title,
    count: 1,
    href: card.href
  }));

  const quickActions: UniversalQuickAction[] = [
    { id: "res-request", label: "Submit Request", href: "/portal/tenant/maintenance/new" },
    { id: "res-pay", label: "Pay Rent", href: "/portal/tenant/payments" },
    { id: "res-messages", label: "Messages", href: "/portal/tenant/messages" },
    { id: "res-docs", label: "Documents", href: "/portal/tenant/documents" },
    { id: "res-amenities", label: "Community", href: "/portal/tenant/community" },
    { id: "res-more", label: "More", href: "/portal/tenant/more" }
  ];

  return withSurfaceCopy("resident", {
    greeting: greetingBase({
      timeGreeting: input.timeGreeting,
      userName: input.firstName,
      organizationName: null,
      placeLabel: place || (input.hasLinkedTenant ? "Your home" : "Resident portal"),
      dateLabel: input.dateLabel,
      statusSummary:
        attention.length > 0
          ? `${attention.length} update${attention.length === 1 ? "" : "s"} need${attention.length === 1 ? "s" : ""} your attention.`
          : "Everything looks good today.",
      supportingLine: copy.supportingLine
    }),
    attention,
    mission,
    quickActions,
    recentActivity: attention.slice(0, 5).map((item) => ({
      id: `res-act-${item.id}`,
      summary: item.title,
      meta: item.reason,
      href: item.href
    })),
    insights: []
  });
}

export function buildOwnerDashboardViewModel(input: {
  timeGreeting: string;
  dateLabel: string;
  model: OwnerPortalDashboardModel;
}): UniversalDashboardViewModel {
  const copy = UX016_SURFACE_COPY.owner;
  const attention: UniversalAttentionItem[] = input.model.attentionItems.slice(0, 5).map((item) => ({
    id: item.id,
    title: item.title,
    reason: item.subtitle ?? "Needs your review",
    href: item.href ?? "/portal/owner",
    actionLabel: "Review",
    severity: "high"
  }));

  const mission: UniversalMissionItem[] = [];
  if (input.model.latestStatement.status === "ready" && input.model.latestStatement.items.length > 0) {
    mission.push({
      id: "owner-reports",
      label: "financial reports",
      count: input.model.latestStatement.items.length,
      href: "/portal/owner/financials"
    });
  }
  if (input.model.recentMessages.status === "ready" && input.model.recentMessages.items.length > 0) {
    mission.push({
      id: "owner-messages",
      label: "portfolio notices",
      count: input.model.recentMessages.items.length,
      href: "/portal/owner/messages"
    });
  }
  mission.push({
    id: "owner-portfolio",
    label: "properties to review",
    count: Math.max(1, input.model.propertyCount),
    href: "/portal/owner/properties"
  });
  if (input.model.pendingPayout.status === "ready") {
    mission.push({
      id: "owner-approvals",
      label: "capital / payout items",
      count: 1,
      href: "/portal/owner/financials"
    });
  }

  const widgetValue = (state: OwnerPortalDashboardModel["occupancy"]): string => {
    if (state.status === "ready" && "value" in state) return String(state.value);
    return "—";
  };

  return withSurfaceCopy("owner", {
    greeting: greetingBase({
      timeGreeting: input.timeGreeting,
      userName: input.model.welcomeName,
      organizationName: null,
      placeLabel:
        input.model.propertyCount === 1
          ? "1 property"
          : `Portfolio · ${input.model.propertyCount} properties`,
      dateLabel: input.dateLabel,
      statusSummary:
        attention.length > 0
          ? `${attention.length} item${attention.length === 1 ? "" : "s"} need your attention.`
          : "Your portfolio is calm right now.",
      supportingLine: copy.supportingLine
    }),
    attention,
    mission: mission.slice(0, 8),
    quickActions: [
      { id: "owner-reports", label: "Reports", href: "/portal/owner/reports" },
      { id: "owner-docs", label: "Documents", href: "/portal/owner/documents" },
      { id: "owner-portfolio", label: "Portfolio", href: "/portal/owner/properties" },
      { id: "owner-financials", label: "Financials", href: "/portal/owner/financials" },
      { id: "owner-messages", label: "Messages", href: "/portal/owner/messages" },
      { id: "owner-settings", label: "Settings", href: "/portal/owner/settings" }
    ],
    recentActivity:
      input.model.recentMessages.status === "ready"
        ? input.model.recentMessages.items.slice(0, 6).map((item) => ({
            id: item.id,
            summary: item.title,
            meta: item.subtitle ?? "Message",
            href: item.href ?? "/portal/owner/messages"
          }))
        : [],
    insights: [
      {
        id: "owner-occ",
        label: "Occupancy",
        value: widgetValue(input.model.occupancy),
        href: "/portal/owner/properties"
      },
      {
        id: "owner-rev",
        label: "Revenue",
        value: widgetValue(input.model.revenue),
        href: "/portal/owner/financials"
      },
      {
        id: "owner-exp",
        label: "Expenses",
        value: widgetValue(input.model.expenses),
        href: "/portal/owner/financials"
      }
    ]
  });
}

export function buildSupportDashboardViewModel(input: {
  timeGreeting: string;
  dateLabel: string;
  snapshot: OperationsCenterSnapshot;
}): UniversalDashboardViewModel {
  const copy = UX016_SURFACE_COPY.support;
  const attention: UniversalAttentionItem[] = input.snapshot.attention.slice(0, 5).map((item) => ({
    id: item.id,
    title: item.title,
    reason: item.context ?? item.category,
    href: item.href,
    actionLabel: "Open",
    severity: item.severity === "critical" ? "critical" : item.severity === "warning" ? "high" : "normal"
  }));

  const criticalCount = input.snapshot.attention.filter((a) => a.severity === "critical").length;
  const warningCount = input.snapshot.attention.filter((a) => a.severity === "warning").length;

  return withSurfaceCopy("support", {
    greeting: greetingBase({
      timeGreeting: input.timeGreeting,
      userName: input.snapshot.greetingName,
      organizationName: input.snapshot.activeOrganizationName,
      placeLabel: "Master Admin · Support",
      dateLabel: input.dateLabel,
      statusSummary:
        criticalCount > 0
          ? `${criticalCount} critical ticket${criticalCount === 1 ? "" : "s"} need immediate action.`
          : warningCount > 0
            ? `${warningCount} warning${warningCount === 1 ? "" : "s"} in the support queue.`
            : "No critical support fires right now.",
      supportingLine: copy.supportingLine
    }),
    attention,
    mission: [
      {
        id: "support-critical",
        label: "critical tickets",
        count: Math.max(criticalCount, 0),
        href: "/master-admin"
      },
      {
        id: "support-warnings",
        label: "SLA / warnings",
        count: Math.max(warningCount, 0),
        href: "/master-admin"
      },
      {
        id: "support-investigations",
        label: "pending investigations",
        count: Math.max(input.snapshot.attention.length, 0),
        href: "/master-admin/health"
      }
    ].filter((row) => row.count > 0 || row.id === "support-investigations"),
    quickActions: [
      { id: "support-search", label: "Search User", href: "/master-admin" },
      { id: "support-ticket", label: "Open Ticket", href: "/master-admin" },
      { id: "support-incident", label: "Incident Dashboard", href: "/master-admin/health" },
      { id: "support-diagnostics", label: "Diagnostics", href: "/master-admin/notifications" },
      { id: "support-commercial", label: "Commercial", href: "/master-admin/commercial" },
      { id: "support-testing", label: "Testing", href: "/master-admin/testing" }
    ],
    recentActivity: input.snapshot.attention.slice(0, 6).map((item) => ({
      id: `support-act-${item.id}`,
      summary: item.title,
      meta: item.category,
      href: item.href
    })),
    insights: input.snapshot.kpis.slice(0, 6).map((kpi) => ({
      id: kpi.id,
      label: kpi.label,
      value: kpi.available ? kpi.value : "—",
      href: kpi.href
    }))
  });
}

export function buildVendorDashboardViewModel(input: {
  timeGreeting: string;
  dateLabel: string;
  token: string;
  job: VendorJobCard;
}): UniversalDashboardViewModel {
  const copy = UX016_SURFACE_COPY.vendor;
  const jobHref = `/v/${input.token}`;
  const phase = input.job.phase;
  const severity: UniversalAttentionItem["severity"] =
    phase === "pending_accept" || phase === "ready" ? "critical" : phase === "on_site" ? "high" : "normal";

  const attention: UniversalAttentionItem[] = [
    {
      id: "vendor-job",
      title: input.job.title,
      reason: `${input.job.status} · ${input.job.propertyAddress}`,
      href: jobHref,
      actionLabel:
        phase === "pending_accept" ? "Accept job" : phase === "ready" ? "Start job" : "Open job",
      severity
    }
  ];

  if (phase === "finished") {
    attention.push({
      id: "vendor-invoice",
      title: "Invoice may be requested",
      reason: "Upload invoice details for this completed job when ready.",
      href: jobHref,
      actionLabel: "Upload invoice",
      severity: "high"
    });
  }

  const quickActions: UniversalQuickAction[] = [
    { id: "vendor-accept", label: "Accept Job", href: jobHref },
    { id: "vendor-start", label: "Start Job", href: jobHref },
    { id: "vendor-invoice", label: "Upload Invoice", href: jobHref },
    {
      id: "vendor-contact",
      label: "Contact Manager",
      href: input.job.managerPhone ? `tel:${input.job.managerPhone}` : jobHref
    }
  ];

  return withSurfaceCopy("vendor", {
    greeting: greetingBase({
      timeGreeting: input.timeGreeting,
      userName: "Vendor",
      organizationName: input.job.managerName,
      placeLabel: input.job.propertyAddress,
      dateLabel: input.dateLabel,
      statusSummary: `Job ${input.job.workOrderNumber} · ${input.job.phase.replace(/_/g, " ")}`,
      supportingLine: copy.supportingLine
    }),
    attention: attention.slice(0, 5),
    mission: [
      { id: "vendor-assigned", label: "assigned work", count: 1, href: jobHref },
      { id: "vendor-schedule", label: "today’s schedule", count: 1, href: jobHref },
      ...(phase === "finished"
        ? [{ id: "vendor-pending-invoice", label: "pending invoices", count: 1, href: jobHref }]
        : [])
    ],
    quickActions,
    recentActivity: [
      {
        id: "vendor-act",
        summary: input.job.title,
        meta: input.job.status,
        href: jobHref
      }
    ],
    insights: []
  });
}
