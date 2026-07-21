import { AI_ASSISTANT_DISCLAIMER, type PromptKey } from "./contracts";
import { assistantFooter } from "./events";
import { formatOccupancySummary } from "./context";
import type { AiProvider, PortfolioContext, PromptExecutionResult } from "./provider-types";

type ResponseTone = "factual" | "draft";

/** Factual answers stay short; draft/recommendation wrappers only when content needs PM review. */
function buildResult(
  title: string,
  lines: string[],
  sources: PromptExecutionResult["sources"] = [],
  insightCandidates: PromptExecutionResult["insightCandidates"] = [],
  options: { tone?: ResponseTone } = {}
): PromptExecutionResult {
  const tone = options.tone ?? "factual";
  const content =
    tone === "draft"
      ? [AI_ASSISTANT_DISCLAIMER, "", ...lines, assistantFooter()].join("\n")
      : lines.join("\n");
  return { content, title, sources, insightCandidates };
}

function handleShowVacantUnits(context: PortfolioContext): PromptExecutionResult {
  const { snapshot, vacantUnits } = context;
  const lines = [
    `**Vacant units (${snapshot.vacanciesTotal} total)**`,
    snapshot.vacanciesTotal === 0
      ? "No vacant units right now — portfolio is fully occupied or units are not marked vacant."
      : vacantUnits.length === 0
        ? "Vacancy count is tracked at the portfolio level; open Units for the full list."
        : vacantUnits
            .map(
              (unit) =>
                `- Unit ${unit.unitNumber}${unit.propertyName ? ` at ${unit.propertyName}` : ""} — ${unit.occupancyStatus.replaceAll("_", " ")}`
            )
            .join("\n"),
    "",
    "Recommended next step: assign tenants to vacant-ready units or review marketing for vacant-not-ready units."
  ];
  return buildResult(
    "Vacant units",
    lines,
    [{ type: "units", label: "View units", href: "/units" }],
    snapshot.vacanciesTotal > 0
      ? [
          {
            insightType: "recommendation",
            category: "vacancy",
            priority: "high",
            title: `${snapshot.vacanciesTotal} vacant unit${snapshot.vacanciesTotal === 1 ? "" : "s"} need attention`,
            content: "Review vacant-ready units and assign tenants to reduce vacancy exposure.",
            actionHref: "/units",
            actionLabel: "View units"
          }
        ]
      : []
  );
}

function handleOverdueMaintenance(context: PortfolioContext): PromptExecutionResult {
  const maintenance = context.snapshot.maintenance;
  const overdue = maintenance?.overdueWorkOrders ?? 0;
  const high = maintenance?.highPriorityWorkOrders ?? 0;
  const samples = maintenance?.overdueSample ?? [];
  const lines = [
    `**Maintenance overview**`,
    `- Open work orders: ${maintenance?.openWorkOrders ?? 0}`,
    `- High priority: ${high}`,
    `- Overdue: ${overdue}`,
    samples.length
      ? ["", "**Overdue samples:**", ...samples.map((item) => `- ${item.workOrderNumber}: ${item.title}`)].join("\n")
      : ""
  ].filter(Boolean);
  return buildResult(
    "Overdue maintenance",
    lines,
    [{ type: "maintenance", label: "Maintenance queue", href: "/maintenance" }],
    overdue > 0
      ? [
          {
            insightType: "risk",
            category: "maintenance",
            priority: "high",
            title: `${overdue} overdue work order${overdue === 1 ? "" : "s"}`,
            content: "Overdue maintenance can impact resident satisfaction and owner reporting.",
            actionHref: "/maintenance",
            actionLabel: "Review work orders"
          }
        ]
      : []
  );
}

function handleExpiringLeases(context: PortfolioContext): PromptExecutionResult {
  const leases = context.snapshot.leases;
  const expiring = leases?.upcomingExpirations ?? context.snapshot.expiringLeasesTotal;
  const samples = leases?.expirationSample ?? [];
  const lines = [
    `**Leases expiring within 60 days: ${expiring}**`,
    samples.length
      ? samples.map((item) => `- ${item.leaseNumber}: ${item.tenantName ?? "Tenant"} at ${item.propertyName ?? "Property"} — ends ${item.endDate}`).join("\n")
      : expiring === 0
        ? "No upcoming expirations in the current window."
        : "Open Leases for the full expiration list."
  ];
  return buildResult(
    "Expiring leases",
    lines,
    [{ type: "leases", label: "View leases", href: "/leases" }],
    expiring > 0
      ? [
          {
            insightType: "recommendation",
            category: "lease",
            priority: "medium",
            title: `${expiring} lease${expiring === 1 ? "" : "s"} expiring soon`,
            content: "Start renewal conversations before expiration dates.",
            actionHref: "/leases",
            actionLabel: "Review leases"
          }
        ]
      : []
  );
}

function handleVendorPerformance(context: PortfolioContext): PromptExecutionResult {
  const vendors = context.snapshot.vendors;
  const lines = [
    "**Vendor performance snapshot**",
    `- Open assignments: ${vendors?.openAssignments ?? 0}`,
    `- Awaiting response: ${vendors?.awaitingResponse ?? 0}`,
    `- In progress: ${vendors?.inProgress ?? 0}`,
    `- Completed today: ${vendors?.completedToday ?? 0}`,
    `- Preferred vendors: ${vendors?.preferredVendorCount ?? 0}`,
    vendors?.averageRating != null ? `- Average rating: ${vendors.averageRating.toFixed(1)}` : ""
  ].filter(Boolean);
  return buildResult("Vendor performance", lines, [{ type: "vendors", label: "Vendors", href: "/vendors" }]);
}

function handleOwnerPortfolio(context: PortfolioContext): PromptExecutionResult {
  const { snapshot } = context;
  const lines = [
    "**Owner portfolio summary**",
    formatOccupancySummary(snapshot),
    `- Active tenants: ${snapshot.activeTenants}`,
    `- Recent move-ins (30d): ${snapshot.recentMoveIns}`,
    `- Renewal needed: ${snapshot.renewalNeededTotal}`,
    `- Open maintenance: ${snapshot.maintenance?.openWorkOrders ?? 0}`,
    `- Outstanding rent exposure: ${snapshot.financial ? `$${snapshot.financial.outstandingBalancesTotal.toFixed(2)}` : "See Financials"}`
  ];
  return buildResult(
    "Owner portfolio summary",
    lines,
    [{ type: "dashboard", label: "Operations Center", href: "/dashboard" }],
    [
      {
        insightType: "summary",
        category: "portfolio",
        priority: "medium",
        title: "Portfolio executive summary",
        content: formatOccupancySummary(snapshot),
        actionHref: "/dashboard",
        actionLabel: "Open Operations Center"
      }
    ]
  );
}

function handleTodayActivity(context: PortfolioContext): PromptExecutionResult {
  const activity = context.snapshot.recentActivity.slice(0, 8);
  const lines = [
    "**Today's recent activity**",
    activity.length
      ? activity.map((item) => `- ${item.title}${item.subtitle ? ` (${item.subtitle})` : ""}`).join("\n")
      : "No recent activity recorded yet."
  ];
  return buildResult("Today's activity", lines, [{ type: "dashboard", label: "Operations Center", href: "/dashboard" }]);
}

function handleDraftAnnouncement(context: PortfolioContext): PromptExecutionResult {
  const { snapshot } = context;
  const draft = [
    "**Subject:** Community update from property management",
    "",
    "Dear residents,",
    "",
    snapshot.vacanciesTotal > 0
      ? "We are preparing updates regarding building operations and community notices. Please watch for maintenance scheduling in common areas."
      : "Thank you for being part of our community. We will share any building updates here as they become available.",
    "",
    "If you have questions, contact the property management office.",
    "",
    "Thank you,",
    "Property Management"
  ].join("\n");
  return buildResult(
    "Draft announcement",
    ["**Draft tenant announcement (not sent):**", "", draft],
    [{ type: "communications", label: "Communications", href: "/communications/new" }],
    [
      {
        insightType: "draft",
        category: "communication",
        priority: "low",
        title: "Draft announcement ready for review",
        content: draft,
        actionHref: "/communications/new",
        actionLabel: "Create announcement"
      }
    ],
    { tone: "draft" }
  );
}

function handleDraftMaintenanceUpdate(context: PortfolioContext): PromptExecutionResult {
  const sample = context.snapshot.maintenance?.openWorkOrderSample?.[0];
  const draft = [
    "**Subject:** Maintenance update",
    "",
    "Hello,",
    "",
    sample
      ? `We are actively working on maintenance request "${sample.title}" (${sample.workOrderNumber}). Our team will provide updates as work progresses.`
      : "We are monitoring open maintenance items for your building and will share updates as work is scheduled.",
    "",
    "Thank you for your patience.",
    "",
    "Property Management"
  ].join("\n");
  return buildResult(
    "Draft maintenance update",
    ["**Draft maintenance update (not sent):**", "", draft],
    [{ type: "maintenance", label: "Maintenance", href: "/maintenance" }],
    [
      {
        insightType: "draft",
        category: "maintenance",
        priority: "low",
        title: "Draft maintenance update",
        content: draft,
        actionHref: "/communications/new",
        actionLabel: "Use in announcement"
      }
    ],
    { tone: "draft" }
  );
}

function handlePortfolioSummary(context: PortfolioContext): PromptExecutionResult {
  return handleOwnerPortfolio(context);
}

function handleExplainOccupancy(context: PortfolioContext): PromptExecutionResult {
  const { snapshot } = context;
  const lines = [
    "**Occupancy breakdown**",
    formatOccupancySummary(snapshot),
    `- Vacant-ready units: ${snapshot.vacantReadyUnits}`,
    `- Total vacancies: ${snapshot.vacanciesTotal}`,
    snapshot.vacanciesTotal > 0
      ? "Vacancy reduces collected rent potential — prioritize leasing for vacant-ready units."
      : "Occupancy is strong; monitor upcoming lease expirations to maintain rate."
  ];
  return buildResult("Occupancy explained", lines, [{ type: "units", label: "Units", href: "/units" }]);
}

function handleFinancialHealth(context: PortfolioContext): PromptExecutionResult {
  const financial = context.snapshot.financial;
  const lines = financial
    ? [
        "**Financial health snapshot**",
        `- Rent due today: ${financial.rentDueToday}`,
        `- Late rent charges: ${financial.lateRentCount}`,
        `- Outstanding balances: $${financial.outstandingBalancesTotal.toFixed(2)}`,
        `- Owner statements generated: ${financial.ownerStatementsGenerated}`,
        `- Draft statements pending: ${financial.ownerStatementsDraft}`
      ]
    : ["Financial module data is not available for this organization."];
  return buildResult(
    "Financial health",
    lines,
    [{ type: "financials", label: "Financials", href: "/financials" }],
    financial && financial.lateRentCount > 0
      ? [
          {
            insightType: "risk",
            category: "financial",
            priority: "high",
            title: `${financial.lateRentCount} late rent charge${financial.lateRentCount === 1 ? "" : "s"}`,
            content: "Review late charges and follow up with residents.",
            actionHref: "/financials/charges",
            actionLabel: "View charges"
          }
        ]
      : []
  );
}

function handleCommunicationActivity(context: PortfolioContext): PromptExecutionResult {
  const comms = context.snapshot.communications;
  const lines = comms
    ? [
        "**Communication activity**",
        `- Unread announcements (resident-side): ${comms.unreadAnnouncements}`,
        `- Scheduled: ${comms.scheduledAnnouncements}`,
        `- Emergency: ${comms.emergencyAnnouncements}`,
        `- Average read rate: ${comms.averageReadPercentage}%`,
        `- Residents needing acknowledgment: ${comms.residentsNeedingAcknowledgment}`
      ]
    : ["Communication data is not available."];
  return buildResult("Communication activity", lines, [{ type: "communications", label: "Communications", href: "/communications" }]);
}

function handleLeaseRenewals(context: PortfolioContext): PromptExecutionResult {
  const leases = context.snapshot.leases;
  const lines = [
    "**Lease renewal outlook**",
    `- Upcoming expirations: ${leases?.upcomingExpirations ?? 0}`,
    `- Renewals needed: ${leases?.renewalNeeded ?? context.snapshot.renewalNeededTotal}`,
    `- Upcoming move-ins: ${leases?.upcomingMoveIns ?? 0}`,
    `- Upcoming move-outs: ${leases?.upcomingMoveOuts ?? 0}`
  ];
  const expiring = leases?.upcomingExpirations ?? context.snapshot.expiringLeasesTotal;
  return buildResult(
    "Lease renewals",
    lines,
    [{ type: "leases", label: "View leases", href: "/leases" }],
    expiring > 0
      ? [
          {
            insightType: "recommendation",
            category: "lease",
            priority: "medium",
            title: `${expiring} lease${expiring === 1 ? "" : "s"} need renewal attention`,
            content: "Review renewal status and start tenant conversations.",
            actionHref: "/leases",
            actionLabel: "Review leases"
          }
        ]
      : []
  );
}

function handleTenantCount(context: PortfolioContext): PromptExecutionResult {
  const count = context.snapshot.activeTenants;
  const answer =
    count === 1 ? "You have 1 active tenant." : `You have ${count} active tenants.`;
  return buildResult("Tenant count", [answer], [
    { type: "tenants", label: "View tenants", href: "/tenants" },
    { type: "leases", label: "View leases", href: "/leases" }
  ]);
}

function handleCustomQuestion(context: PortfolioContext, message: string | null): PromptExecutionResult {
  const query = message?.trim() ?? "";
  const lower = query.toLowerCase();
  if (lower.includes("vacant") || lower.includes("vacancy")) return handleShowVacantUnits(context);
  if (lower.includes("maintenance") || lower.includes("overdue")) return handleOverdueMaintenance(context);
  if (lower.includes("lease") || lower.includes("expir")) return handleExpiringLeases(context);
  if (lower.includes("vendor")) return handleVendorPerformance(context);
  if (lower.includes("financial") || lower.includes("rent") || lower.includes("balance")) return handleFinancialHealth(context);
  if (lower.includes("announcement") || lower.includes("communication")) return handleCommunicationActivity(context);
  if (lower.includes("occupancy")) return handleExplainOccupancy(context);
  if (lower.includes("tenant") || lower.includes("resident")) return handleTenantCount(context);
  return buildResult(
    "Operational answer",
    [
      "I can answer that from portfolio data. Try asking about tenants, vacancies, maintenance, leases, vendors, or financials."
    ],
    [
      { type: "tenants", label: "View tenants", href: "/tenants" },
      { type: "dashboard", label: "Operations Center", href: "/dashboard" },
      { type: "ai", label: "AI Operations", href: "/ai-operations" }
    ]
  );
}

const HANDLERS: Record<PromptKey, (context: PortfolioContext, message: string | null) => PromptExecutionResult> = {
  show_vacant_units: (ctx) => handleShowVacantUnits(ctx),
  show_overdue_maintenance: (ctx) => handleOverdueMaintenance(ctx),
  show_expiring_leases: (ctx) => handleExpiringLeases(ctx),
  summarize_vendor_performance: (ctx) => handleVendorPerformance(ctx),
  summarize_owner_portfolio: (ctx) => handleOwnerPortfolio(ctx),
  summarize_today_activity: (ctx) => handleTodayActivity(ctx),
  draft_announcement: (ctx) => handleDraftAnnouncement(ctx),
  draft_maintenance_update: (ctx) => handleDraftMaintenanceUpdate(ctx),
  portfolio_summary: (ctx) => handlePortfolioSummary(ctx),
  explain_occupancy: (ctx) => handleExplainOccupancy(ctx),
  summarize_financial_health: (ctx) => handleFinancialHealth(ctx),
  summarize_communication_activity: (ctx) => handleCommunicationActivity(ctx),
  summarize_lease_renewals: (ctx) => handleLeaseRenewals(ctx),
  custom_question: (ctx, message) => handleCustomQuestion(ctx, message)
};

export const relationalAiProvider: AiProvider = {
  id: "relational",
  name: "M.P.A. Relational Assistant",
  executePrompt({ promptKey, message, context }) {
    const key = (promptKey in HANDLERS ? promptKey : "custom_question") as PromptKey;
    return HANDLERS[key](context, message);
  }
};

export function getDefaultAiProvider(): AiProvider {
  return relationalAiProvider;
}
