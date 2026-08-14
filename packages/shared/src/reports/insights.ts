import type {
  ExecutivePersona,
  InsightTone,
  ReportArea,
  ReportingAreaBlock,
  ReportingInsight,
  ReportingMetric,
  ReportingSnapshot,
  ReportingTableRow
} from "./schemas";
import { PERSONA_DEFAULT_AREAS, REPORT_AREA_LABELS } from "./schemas";

export type RawReportingFacts = {
  properties: { id: string; name: string; status?: string | null }[];
  units: { id: string; propertyId: string | null; status?: string | null }[];
  leases: {
    id: string;
    status: string;
    endDate: string | null;
    startDate: string | null;
    propertyName?: string | null;
    residentName?: string | null;
  }[];
  residents: { id: string; displayName: string; portalStatus?: string | null; status?: string | null }[];
  workOrders: {
    id: string;
    title: string;
    status: string;
    priority: string;
    assigneeType?: string | null;
    propertyId?: string | null;
    submittedAt?: string | null;
    completedAt?: string | null;
  }[];
  documents: {
    id: string;
    title: string;
    status: string;
    category: string;
    createdAt: string;
    entityType?: string | null;
  }[];
  finance: {
    expectedRentThisMonth: number;
    rentCollectedThisMonth: number;
    outstandingRent: number;
    outstandingBalance: number;
    delinquencyCount: number;
    totalDelinquency: number;
    vendorPayablesOpen: number;
    vendorPaidThisMonth: number;
    netOperationalCash: number;
    occupancyRate: number;
    unitsTotal: number;
    unitsOccupied: number;
  } | null;
  subscription: {
    status: string | null;
    productSku: string | null;
    billingCycle: string | null;
    setupComplete: boolean;
  } | null;
  vendors: { id: string; name: string; status?: string | null }[];
  /** Phase 5 leasing facts — optional so existing callers stay valid. */
  applications?: {
    id: string;
    status: string;
    submittedAt?: string | null;
    decidedAt?: string | null;
    propertyId?: string | null;
  }[];
};

function money(n: number): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
  } catch {
    return `$${n.toFixed(0)}`;
  }
}

function daysUntil(iso: string | null, now: Date): number | null {
  if (!iso) return null;
  const end = new Date(iso);
  if (Number.isNaN(end.getTime())) return null;
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function insight(
  partial: Omit<ReportingInsight, "tone"> & { tone?: InsightTone }
): ReportingInsight {
  return { tone: "attention", ...partial };
}

function metric(
  area: ReportArea,
  id: string,
  label: string,
  value: string,
  hint?: string,
  tone?: InsightTone
): ReportingMetric {
  const row: ReportingMetric = { id, area, label, value };
  if (hint !== undefined) row.hint = hint;
  if (tone !== undefined) row.tone = tone;
  return row;
}

export function resolveExecutivePersona(input: {
  roles: readonly string[];
  hasFacilityEntitlement: boolean;
  isPlatformOperator?: boolean;
}): ExecutivePersona {
  if (input.isPlatformOperator) return "platform_operator";
  if (input.roles.includes("organization_admin")) return "organization_owner";
  if (input.hasFacilityEntitlement && input.roles.includes("maintenance_technician")) {
    return "facility_manager";
  }
  if (input.hasFacilityEntitlement && !input.roles.includes("property_manager")) {
    return "facility_manager";
  }
  if (input.roles.includes("property_manager") || input.roles.includes("leasing_agent")) {
    return "property_manager";
  }
  if (input.hasFacilityEntitlement) return "facility_manager";
  return "organization_owner";
}

/** Pure insight builder — uses only supplied facts; never invents counts. */
export function buildReportingInsights(facts: RawReportingFacts, now = new Date()): ReportingInsight[] {
  const insights: ReportingInsight[] = [];
  const openStatuses = new Set(["submitted", "triaged", "assigned", "in_progress"]);
  const openWos = facts.workOrders.filter((w) => openStatuses.has(w.status));
  const emergency = openWos.filter((w) => w.priority === "emergency");
  const completed = facts.workOrders.filter((w) => w.status === "completed" || w.completedAt);

  const expiringLeases = facts.leases.filter((lease) => {
    const d = daysUntil(lease.endDate, now);
    return d !== null && d >= 0 && d <= 30 && !["ended", "draft"].includes(lease.status);
  });

  if (emergency.length > 0) {
    insights.push(
      insight({
        id: "wo-emergency",
        area: "maintenance",
        tone: "attention",
        headline: `${emergency.length} emergency work order${emergency.length === 1 ? "" : "s"} need attention`,
        detail: emergency
          .slice(0, 3)
          .map((w) => w.title)
          .join(" · "),
        decision: "Triage emergencies before routine work.",
        href: "/pm/maintenance",
        metricLabel: "Emergencies",
        metricValue: String(emergency.length)
      })
    );
  }

  if (expiringLeases.length > 0) {
    insights.push(
      insight({
        id: "leases-expiring",
        area: "property_operations",
        tone: "watch",
        headline: `${expiringLeases.length} lease${expiringLeases.length === 1 ? "" : "s"} expire within 30 days`,
        detail: expiringLeases
          .slice(0, 3)
          .map((l) => l.residentName ?? l.propertyName ?? "Lease")
          .join(" · "),
        decision: "Start renewal outreach or listing prep now.",
        href: "/pm/leasing",
        metricLabel: "Expiring ≤30d",
        metricValue: String(expiringLeases.length)
      })
    );
  }

  const applications = facts.applications ?? [];
  const openApplications = applications.filter((a) =>
    ["draft", "submitted", "incomplete", "screening_pending"].includes(a.status)
  );
  const approvedApplications = applications.filter((a) => a.status === "approved");
  if (openApplications.length > 0) {
    insights.push(
      insight({
        id: "applications-open",
        area: "property_operations",
        tone: "watch",
        headline: `${openApplications.length} application${openApplications.length === 1 ? "" : "s"} in leasing pipeline`,
        detail: `${approvedApplications.length} approved · ready for lease when screening completes.`,
        decision: "Review applications awaiting decision in Leasing.",
        href: "/pm/leasing#applications",
        metricLabel: "Open applications",
        metricValue: String(openApplications.length)
      })
    );
  }

  if (facts.finance && facts.finance.delinquencyCount > 0) {
    insights.push(
      insight({
        id: "finance-delinquency",
        area: "financial_performance",
        tone: "attention",
        headline: `${facts.finance.delinquencyCount} resident${facts.finance.delinquencyCount === 1 ? "" : "s"} past due · ${money(facts.finance.totalDelinquency)}`,
        detail: `Outstanding rent ${money(facts.finance.outstandingRent)}.`,
        decision: "Review delinquency cases and collection next steps.",
        href: "/pm/financial-operations#delinquency",
        metricLabel: "Past due",
        metricValue: money(facts.finance.totalDelinquency)
      })
    );
  }

  if (facts.finance && facts.finance.unitsTotal > 0) {
    const rate = facts.finance.occupancyRate;
    insights.push(
      insight({
        id: "occupancy",
        area: "property_operations",
        tone: rate >= 95 ? "positive" : rate >= 85 ? "neutral" : "watch",
        headline: `Occupancy is ${rate.toFixed(0)}% (${facts.finance.unitsOccupied}/${facts.finance.unitsTotal} units)`,
        detail: rate < 90 ? "Vacancy is high enough to prioritize leasing." : "Occupancy supports stable rent collections.",
        decision: rate < 90 ? "Focus leasing on vacant units." : "Monitor turnover and renewals.",
        href: "/pm/properties",
        metricLabel: "Occupancy",
        metricValue: `${rate.toFixed(0)}%`,
        trendDirection: rate >= 90 ? "up" : "down",
        trendLabel: "Current period"
      })
    );
  }

  const pendingResidents = facts.residents.filter((r) => r.portalStatus === "pending_activation");
  if (pendingResidents.length > 0) {
    insights.push(
      insight({
        id: "resident-activation",
        area: "resident_experience",
        tone: "watch",
        headline: `${pendingResidents.length} resident${pendingResidents.length === 1 ? "" : "s"} awaiting portal activation`,
        detail: pendingResidents
          .slice(0, 3)
          .map((r) => r.displayName)
          .join(" · "),
        decision: "Send activation reminders to improve self-service.",
        href: "/pm/residents",
        metricLabel: "Pending activation",
        metricValue: String(pendingResidents.length)
      })
    );
  }

  if (openWos.length > 0 && completed.length > 0) {
    insights.push(
      insight({
        id: "maintenance-backlog",
        area: "facility_operations",
        tone: openWos.length > completed.length ? "watch" : "neutral",
        headline: `${openWos.length} open work orders · ${completed.length} completed in view`,
        detail: "Completion vs backlog from current work-order records only.",
        decision: openWos.length > 10 ? "Reduce backlog before adding new PM work." : "Keep clearing open items.",
        href: "/pm/maintenance",
        metricLabel: "Open WOs",
        metricValue: String(openWos.length)
      })
    );
  } else if (openWos.length > 0) {
    insights.push(
      insight({
        id: "maintenance-open",
        area: "maintenance",
        tone: "neutral",
        headline: `${openWos.length} open work order${openWos.length === 1 ? "" : "s"}`,
        detail: "No completion timestamps in the current sample to compute average time.",
        decision: "Assign unassigned work and close completed jobs.",
        href: "/pm/maintenance",
        metricLabel: "Open",
        metricValue: String(openWos.length)
      })
    );
  }

  const warrantyDocs = facts.documents.filter((d) => d.category === "warranty" && d.status === "active");
  const complianceDocs = facts.documents.filter((d) => d.category === "compliance");
  const draftDocs = facts.documents.filter((d) => d.status === "draft");

  if (draftDocs.length > 0) {
    insights.push(
      insight({
        id: "docs-draft",
        area: "documents",
        tone: "watch",
        headline: `${draftDocs.length} draft document${draftDocs.length === 1 ? "" : "s"} still incomplete`,
        detail: "Draft status comes from Document Intelligence — not assumed missing files.",
        decision: "Finish or archive drafts to keep the library trustworthy.",
        href: "/shared/documents?status=draft",
        metricLabel: "Drafts",
        metricValue: String(draftDocs.length)
      })
    );
  }

  if (complianceDocs.length === 0 && facts.properties.length > 0) {
    insights.push(
      insight({
        id: "docs-compliance-gap",
        area: "compliance",
        tone: "watch",
        headline: "No compliance documents on file yet",
        detail: "Based on document_documents category=compliance for this organization.",
        decision: "Upload required compliance artifacts and link them to properties.",
        href: "/shared/documents?entityType=compliance",
        metricLabel: "Compliance docs",
        metricValue: "0"
      })
    );
  }

  if (warrantyDocs.length > 0) {
    insights.push(
      insight({
        id: "docs-warranty",
        area: "documents",
        tone: "neutral",
        headline: `${warrantyDocs.length} active warranty document${warrantyDocs.length === 1 ? "" : "s"} on file`,
        detail: "Expiration dates are not stored as structured fields yet — review documents manually.",
        decision: "Confirm warranty coverage before capital or vendor spend.",
        href: "/shared/documents?q=warranty",
        metricLabel: "Warranties",
        metricValue: String(warrantyDocs.length)
      })
    );
  }

  if (facts.finance && facts.finance.vendorPayablesOpen > 0) {
    insights.push(
      insight({
        id: "vendor-payables",
        area: "vendors",
        tone: "watch",
        headline: `${money(facts.finance.vendorPayablesOpen)} in open vendor payables`,
        detail: `Vendor paid this month: ${money(facts.finance.vendorPaidThisMonth)}.`,
        decision: "Approve or schedule vendor payments that are due.",
        href: "/pm/financial-operations",
        metricLabel: "Payables",
        metricValue: money(facts.finance.vendorPayablesOpen)
      })
    );
  }

  if (facts.subscription) {
    const status = facts.subscription.status ?? "unknown";
    insights.push(
      insight({
        id: "commercial-subscription",
        area: "commercial",
        tone: status === "active" || status === "trialing" ? "positive" : "attention",
        headline: `Subscription status: ${status}${facts.subscription.productSku ? ` · ${facts.subscription.productSku}` : ""}`,
        detail: facts.subscription.setupComplete
          ? "Guided setup marked complete."
          : "Guided setup is not complete — activation may be incomplete.",
        decision: facts.subscription.setupComplete
          ? "Monitor plan fit and module adoption."
          : "Finish Guided Setup to activate the workspace.",
        href: "/billing",
        metricLabel: "Plan",
        metricValue: status
      })
    );
  }

  if (insights.length === 0) {
    insights.push(
      insight({
        id: "no-signals",
        area: "platform_health",
        tone: "neutral",
        headline: "No urgent signals from available platform data",
        detail: "Metrics appear only when source records exist. Empty domains stay empty.",
        decision: "Continue normal operations; re-check after new activity.",
        href: "/pm/mission-control"
      })
    );
  }

  return insights;
}

function areaBlock(
  area: ReportArea,
  summary: string,
  metrics: ReportingMetric[],
  rows: ReportingTableRow[],
  emptyReason?: string
): ReportingAreaBlock {
  const block: ReportingAreaBlock = {
    area,
    label: REPORT_AREA_LABELS[area],
    summary,
    metrics,
    rows
  };
  if (metrics.length === 0 && rows.length === 0 && emptyReason !== undefined) {
    block.emptyReason = emptyReason;
  }
  return block;
}

export function buildReportingAreas(facts: RawReportingFacts, now = new Date()): ReportingAreaBlock[] {
  const openStatuses = new Set(["submitted", "triaged", "assigned", "in_progress"]);
  const openWos = facts.workOrders.filter((w) => openStatuses.has(w.status));
  const completedWos = facts.workOrders.filter((w) => w.status === "completed");
  const emergency = openWos.filter((w) => w.priority === "emergency");

  const vacantUnits = facts.units.filter((u) => {
    const s = (u.status ?? "").toLowerCase();
    return s === "available" || s.includes("vacant");
  });
  const occupiedUnits = facts.units.filter((u) => (u.status ?? "").toLowerCase().includes("occup"));
  const expiring = facts.leases.filter((lease) => {
    const d = daysUntil(lease.endDate, now);
    return d !== null && d >= 0 && d <= 60 && lease.status !== "ended";
  });

  const propertyMetrics: ReportingMetric[] = [];
  if (facts.properties.length > 0) {
    propertyMetrics.push(metric("property_operations", "props", "Properties", String(facts.properties.length)));
  }
  if (facts.units.length > 0) {
    propertyMetrics.push(metric("property_operations", "units", "Units tracked", String(facts.units.length)));
    propertyMetrics.push(
      metric("property_operations", "vacant", "Vacant (status)", String(vacantUnits.length), undefined, vacantUnits.length ? "watch" : "positive")
    );
    propertyMetrics.push(metric("property_operations", "occupied", "Occupied (status)", String(occupiedUnits.length)));
  }
  if (facts.finance) {
    propertyMetrics.push(
      metric("property_operations", "occ-rate", "Occupancy rate", `${facts.finance.occupancyRate.toFixed(0)}%`)
    );
  }
  propertyMetrics.push(metric("property_operations", "lease-expire", "Leases ≤60d", String(expiring.length)));
  const apps = facts.applications ?? [];
  if (apps.length > 0) {
    const decided = apps.filter((a) => a.status === "approved" || a.status === "denied");
    const approved = apps.filter((a) => a.status === "approved").length;
    const approvalPct = decided.length > 0 ? Math.round((approved / decided.length) * 100) : null;
    propertyMetrics.push(metric("property_operations", "apps", "Applications", String(apps.length)));
    if (approvalPct !== null) {
      propertyMetrics.push(
        metric("property_operations", "app-approval", "Approval %", `${approvalPct}%`)
      );
    }
  }

  const propertyRows: ReportingTableRow[] = expiring.slice(0, 8).map((lease) => {
    const row: ReportingTableRow = {
      id: lease.id,
      label: lease.residentName ?? "Lease",
      status: lease.status,
      href: "/pm/leasing"
    };
    const secondary = lease.propertyName ?? lease.endDate;
    if (secondary) row.secondary = secondary;
    if (lease.endDate) row.value = `Ends ${lease.endDate}`;
    return row;
  });

  const facilityMetrics: ReportingMetric[] = [
    metric("facility_operations", "open", "Open work orders", String(openWos.length), undefined, openWos.length > 0 ? "watch" : "positive"),
    metric("facility_operations", "emergency", "Emergencies", String(emergency.length), undefined, emergency.length ? "attention" : "positive"),
    metric("facility_operations", "completed", "Completed (sample)", String(completedWos.length))
  ];
  const facilityRows: ReportingTableRow[] = openWos.slice(0, 8).map((w) => ({
    id: w.id,
    label: w.title,
    status: w.status,
    secondary: w.priority,
    href: "/pm/maintenance"
  }));

  const residentMetrics: ReportingMetric[] = [
    metric("resident_experience", "residents", "Residents", String(facts.residents.length)),
    metric(
      "resident_experience",
      "pending",
      "Portal pending",
      String(facts.residents.filter((r) => r.portalStatus === "pending_activation").length),
      undefined,
      "watch"
    )
  ];

  const financialMetrics: ReportingMetric[] = [];
  if (facts.finance) {
    financialMetrics.push(
      metric("financial_performance", "expected", "Rent expected", money(facts.finance.expectedRentThisMonth)),
      metric("financial_performance", "collected", "Rent collected", money(facts.finance.rentCollectedThisMonth), undefined, "positive"),
      metric("financial_performance", "outstanding", "Outstanding rent", money(facts.finance.outstandingRent), undefined, facts.finance.outstandingRent > 0 ? "attention" : "positive"),
      metric("financial_performance", "net", "Net operational cash", money(facts.finance.netOperationalCash)),
      metric("financial_performance", "vendor-paid", "Vendor spend (paid)", money(facts.finance.vendorPaidThisMonth)),
      metric("financial_performance", "delinq", "Past-due residents", String(facts.finance.delinquencyCount))
    );
  }

  const commercialMetrics: ReportingMetric[] = [];
  if (facts.subscription) {
    commercialMetrics.push(
      metric("commercial", "status", "Subscription", facts.subscription.status ?? "—"),
      metric("commercial", "sku", "Product", facts.subscription.productSku ?? "—"),
      metric("commercial", "cycle", "Billing cycle", facts.subscription.billingCycle ?? "—"),
      metric(
        "commercial",
        "setup",
        "Activation",
        facts.subscription.setupComplete ? "Setup complete" : "Setup incomplete",
        undefined,
        facts.subscription.setupComplete ? "positive" : "watch"
      )
    );
  }

  const docsByCategory = new Map<string, number>();
  for (const doc of facts.documents) {
    docsByCategory.set(doc.category, (docsByCategory.get(doc.category) ?? 0) + 1);
  }
  const documentMetrics: ReportingMetric[] = [
    metric("documents", "total", "Documents", String(facts.documents.length)),
    metric("documents", "active", "Active", String(facts.documents.filter((d) => d.status === "active").length)),
    metric("documents", "draft", "Draft", String(facts.documents.filter((d) => d.status === "draft").length)),
    metric("documents", "compliance", "Compliance", String(docsByCategory.get("compliance") ?? 0)),
    metric("documents", "warranty", "Warranty", String(docsByCategory.get("warranty") ?? 0)),
    metric("documents", "inspection", "Inspection", String(docsByCategory.get("inspection") ?? 0))
  ];
  const documentRows: ReportingTableRow[] = facts.documents.slice(0, 8).map((d) => ({
    id: d.id,
    label: d.title,
    secondary: d.category,
    status: d.status,
    href: `/shared/documents`
  }));

  const vendorMetrics: ReportingMetric[] = [
    metric("vendors", "count", "Vendors", String(facts.vendors.length)),
    metric(
      "vendors",
      "payables",
      "Open payables",
      facts.finance ? money(facts.finance.vendorPayablesOpen) : "—",
      undefined,
      facts.finance && facts.finance.vendorPayablesOpen > 0 ? "watch" : "neutral"
    )
  ];

  const assetEmpty =
    "Facility Assets is live in Facility Operations. Reporting & Analytics does not invent asset-health scores — use Facility Reports for list, status, and repair history.";
  const complianceEmpty =
    facts.documents.some((d) => d.category === "compliance")
      ? undefined
      : "No compliance documents recorded yet. Upload and link compliance files in Document Intelligence.";

  return [
    areaBlock(
      "property_operations",
      "Occupancy, vacancy signals, and lease timing from property/unit/lease records.",
      propertyMetrics,
      propertyRows,
      facts.properties.length === 0 ? "No properties on file for this organization." : undefined
    ),
    areaBlock(
      "facility_operations",
      "Open vs completed work from maintenance_work_orders (facility modules stay honest when planned).",
      facilityMetrics,
      facilityRows
    ),
    areaBlock(
      "resident_experience",
      "Portal activation and resident roster signals — satisfaction scores are not invented.",
      residentMetrics,
      facts.residents.slice(0, 8).map((r) => {
        const row: ReportingTableRow = {
          id: r.id,
          label: r.displayName,
          href: "/pm/residents"
        };
        const status = r.portalStatus ?? r.status;
        if (status) row.status = status;
        return row;
      }),
      facts.residents.length === 0 ? "No residents on file." : undefined
    ),
    areaBlock(
      "financial_performance",
      "Rent, balances, and vendor spend from Financial Operations reporting (same source as Command Center).",
      financialMetrics,
      [],
      facts.finance ? undefined : "Financial snapshot unavailable for this organization."
    ),
    areaBlock(
      "commercial",
      "This organization’s subscription and activation — platform-wide MRR/ARR remains in Owner Operations Command Center.",
      commercialMetrics,
      [],
      facts.subscription ? undefined : "No subscription row found for this organization."
    ),
    areaBlock(
      "maintenance",
      "Residential and operational maintenance backlog from work orders.",
      [
        metric("maintenance", "open", "Open", String(openWos.length)),
        metric("maintenance", "emergency", "Emergency", String(emergency.length)),
        metric("maintenance", "completed", "Completed", String(completedWos.length)),
        metric(
          "maintenance",
          "unassigned",
          "Unassigned",
          String(openWos.filter((w) => !w.assigneeType || w.assigneeType === "unassigned").length)
        )
      ],
      facilityRows
    ),
    areaBlock("assets", assetEmpty, [], [], assetEmpty),
    areaBlock(
      "compliance",
      "Compliance posture from Document Intelligence categories — not a fabricated score.",
      [
        metric("compliance", "docs", "Compliance documents", String(docsByCategory.get("compliance") ?? 0)),
        metric("compliance", "inspection-docs", "Inspection documents", String(docsByCategory.get("inspection") ?? 0))
      ],
      facts.documents
        .filter((d) => d.category === "compliance" || d.category === "inspection")
        .slice(0, 8)
        .map((d) => ({
          id: d.id,
          label: d.title,
          status: d.status,
          secondary: d.category,
          href: "/shared/documents"
        })),
      complianceEmpty
    ),
    areaBlock(
      "vendors",
      "Vendor directory plus open payables from finance.",
      vendorMetrics,
      facts.vendors.slice(0, 8).map((v) => {
        const row: ReportingTableRow = {
          id: v.id,
          label: v.name,
          href: "/pm/vendors"
        };
        if (v.status) row.status = v.status;
        return row;
      }),
      facts.vendors.length === 0 ? "No vendors on file." : undefined
    ),
    areaBlock(
      "documents",
      "Document Intelligence volume and status — PDF export counts are not tracked as a separate metric store yet.",
      documentMetrics,
      documentRows,
      facts.documents.length === 0 ? "Document library is empty." : undefined
    ),
    areaBlock(
      "platform_health",
      "Workspace readiness from available org records.",
      [
        metric("platform_health", "properties", "Properties", String(facts.properties.length)),
        metric("platform_health", "docs", "Documents", String(facts.documents.length)),
        metric("platform_health", "open-wo", "Open work", String(openWos.length)),
        metric(
          "platform_health",
          "setup",
          "Setup",
          facts.subscription?.setupComplete ? "Complete" : facts.subscription ? "Incomplete" : "Unknown"
        )
      ],
      []
    )
  ];
}

export function filterAreasForPersona(
  areas: ReportingAreaBlock[],
  persona: ExecutivePersona,
  selectedArea?: ReportArea | "all" | null
): ReportingAreaBlock[] {
  const allowed = new Set(PERSONA_DEFAULT_AREAS[persona]);
  let filtered = areas.filter((a) => allowed.has(a.area));
  if (selectedArea && selectedArea !== "all") {
    filtered = areas.filter((a) => a.area === selectedArea);
  }
  return filtered;
}

export function filterInsightsForPersona(
  insights: ReportingInsight[],
  persona: ExecutivePersona,
  selectedArea?: ReportArea | "all" | null
): ReportingInsight[] {
  const allowed = new Set(PERSONA_DEFAULT_AREAS[persona]);
  let filtered = insights.filter((i) => allowed.has(i.area) || i.area === "platform_health");
  if (selectedArea && selectedArea !== "all") {
    filtered = insights.filter((i) => i.area === selectedArea);
  }
  return filtered;
}

export function assembleReportingSnapshot(input: {
  organizationId: string;
  organizationName: string | null;
  persona: ExecutivePersona;
  facts: RawReportingFacts;
  now?: Date;
}): ReportingSnapshot {
  const now = input.now ?? new Date();
  const insights = filterInsightsForPersona(buildReportingInsights(input.facts, now), input.persona);
  const areas = filterAreasForPersona(buildReportingAreas(input.facts, now), input.persona);
  const honesty: string[] = [
    "Insights use existing organization records only.",
    "Empty domains stay empty — no fabricated charts or satisfaction scores."
  ];
  if (!input.facts.finance) honesty.push("Financial Operations snapshot was unavailable.");
  if (input.facts.units.length === 0) honesty.push("Unit-level vacancy trends require unit records.");

  return {
    generatedAt: now.toISOString(),
    organizationId: input.organizationId,
    organizationName: input.organizationName,
    persona: input.persona,
    attentionQuestion: "What should I pay attention to today?",
    insights,
    areas,
    filterOptions: {
      properties: input.facts.properties.map((p) => ({ id: p.id, label: p.name })),
      categories: Array.from(new Set(input.facts.documents.map((d) => d.category))).sort(),
      statuses: Array.from(
        new Set([
          ...input.facts.workOrders.map((w) => w.status),
          ...input.facts.documents.map((d) => d.status),
          ...input.facts.leases.map((l) => l.status)
        ])
      ).sort()
    },
    dataHonesty: honesty
  };
}
