/** Reporting & Analytics Center — shared types and pure insight builders. */

export const REPORT_AREAS = [
  "property_operations",
  "facility_operations",
  "resident_experience",
  "financial_performance",
  "commercial",
  "maintenance",
  "assets",
  "compliance",
  "vendors",
  "documents",
  "platform_health"
] as const;

export type ReportArea = (typeof REPORT_AREAS)[number];

export const REPORT_AREA_LABELS: Record<ReportArea, string> = {
  property_operations: "Property Operations",
  facility_operations: "Facility Operations",
  resident_experience: "Resident Experience",
  financial_performance: "Financial Performance",
  commercial: "Commercial",
  maintenance: "Maintenance",
  assets: "Assets",
  compliance: "Compliance",
  vendors: "Vendors",
  documents: "Documents",
  platform_health: "Platform Health"
};

export const EXECUTIVE_PERSONAS = [
  "organization_owner",
  "property_manager",
  "facility_manager",
  "platform_operator"
] as const;

export type ExecutivePersona = (typeof EXECUTIVE_PERSONAS)[number];

export const EXECUTIVE_PERSONA_LABELS: Record<ExecutivePersona, string> = {
  organization_owner: "Organization Owner",
  property_manager: "Property Manager",
  facility_manager: "Facility Manager",
  platform_operator: "Platform Operator"
};

/** Areas each executive persona should see first. */
export const PERSONA_DEFAULT_AREAS: Record<ExecutivePersona, readonly ReportArea[]> = {
  organization_owner: [
    "financial_performance",
    "property_operations",
    "commercial",
    "resident_experience",
    "documents",
    "platform_health"
  ],
  property_manager: [
    "property_operations",
    "maintenance",
    "resident_experience",
    "financial_performance",
    "vendors",
    "documents"
  ],
  facility_manager: [
    "facility_operations",
    "maintenance",
    "assets",
    "compliance",
    "vendors",
    "documents"
  ],
  platform_operator: [
    "commercial",
    "platform_health",
    "documents",
    "financial_performance",
    "property_operations"
  ]
};

export type InsightTone = "attention" | "positive" | "neutral" | "watch";

export type ReportingInsight = {
  id: string;
  area: ReportArea;
  tone: InsightTone;
  headline: string;
  detail: string;
  decision: string;
  href?: string;
  metricLabel?: string;
  metricValue?: string;
  trendDirection?: "up" | "down" | "flat";
  trendLabel?: string;
};

export type ReportingMetric = {
  id: string;
  area: ReportArea;
  label: string;
  value: string;
  hint?: string;
  tone?: InsightTone;
};

export type ReportingTableRow = {
  id: string;
  label: string;
  secondary?: string;
  status?: string;
  value?: string;
  href?: string;
};

export type ReportingAreaBlock = {
  area: ReportArea;
  label: string;
  summary: string;
  metrics: ReportingMetric[];
  rows: ReportingTableRow[];
  emptyReason?: string;
};

export type ReportingFilters = {
  dateFrom?: string | null;
  dateTo?: string | null;
  propertyId?: string | null;
  category?: string | null;
  status?: string | null;
  area?: ReportArea | "all" | null;
  persona?: ExecutivePersona | null;
};

export type ReportingSnapshot = {
  generatedAt: string;
  organizationId: string;
  organizationName: string | null;
  persona: ExecutivePersona;
  attentionQuestion: string;
  insights: ReportingInsight[];
  areas: ReportingAreaBlock[];
  filterOptions: {
    properties: Array<{ id: string; label: string }>;
    categories: string[];
    statuses: string[];
  };
  dataHonesty: string[];
};
