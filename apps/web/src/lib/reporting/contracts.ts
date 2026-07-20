/** FIN-001 report catalog and shared contracts. Reporting plane only — no accounting writes. */

export const REPORT_TYPES = [
  "monthly_profit_and_loss",
  "owner_statement",
  "rent_roll",
  "cash_flow_summary",
  "expense_report",
  "delinquency_report",
  "maintenance_summary"
] as const;

export type ReportType = (typeof REPORT_TYPES)[number];

export const RECOGNITION_BASES = ["cash", "accrual"] as const;
export type RecognitionBasis = (typeof RECOGNITION_BASES)[number];

export const REPORT_JOB_STATUSES = ["queued", "running", "succeeded", "failed"] as const;
export type ReportJobStatus = (typeof REPORT_JOB_STATUSES)[number];

export const REPORT_JOB_STAGES = [
  "queued",
  "fetching_data",
  "building_model",
  "rendering_pdf",
  "saving_vault",
  "complete"
] as const;
export type ReportJobStage = (typeof REPORT_JOB_STAGES)[number];

export const FINANCIAL_REPORT_DOCUMENT_TYPE = "financial_report";

export type ReportPeriod = {
  year: number;
  month: number;
  startDate: string;
  endDate: string;
  label: string;
};

export type ReportHealth = {
  status: "healthy" | "incomplete";
  transactionsIncluded: boolean;
  expensesIncluded: boolean;
  rentIncluded: boolean;
  reconciliationStatus: "reconciled" | "unreconciled" | "unknown";
  warning: string | null;
};

export type ReportLineItem = {
  id: string;
  label: string;
  amount: number;
  meta?: string | null;
};

export type ReportSection = {
  id: string;
  title: string;
  lines: ReportLineItem[];
  subtotal: number;
};

export type ReportIdentity = {
  organizationName: string;
  logoLabel: string;
  propertyName: string;
  propertyAddress: string;
  managerName: string;
  reportTitle: string;
  periodLabel: string;
  recognitionBasis: RecognitionBasis;
  generatedAt: string;
};

export type ReportModel = {
  reportType: ReportType;
  identity: ReportIdentity;
  health: ReportHealth;
  sections: ReportSection[];
  totals: Array<{ label: string; amount: number; emphasis?: boolean }>;
  notes: string[];
  sourceFingerprint: string;
};

export type ReportCatalogItem = {
  type: ReportType;
  title: string;
  description: string;
  supportsRecognitionBasis: boolean;
};

export type ReportRequestInput = {
  reportType: ReportType;
  propertyId: string;
  year: number;
  month: number;
  recognitionBasis?: RecognitionBasis;
  persistToVault?: boolean;
};

export type ReportVersionSummary = {
  id: string;
  reportType: ReportType;
  propertyId: string;
  year: number;
  month: number;
  version: number;
  recognitionBasis: RecognitionBasis;
  sourceFingerprint: string;
  generatedAt: string;
  title: string;
  mediaAssetId: string | null;
  downloadPath: string;
};

export type ReportJobResult = {
  reportModel: ReportModel;
  version: ReportVersionSummary | null;
  cached: boolean;
  contentHash: string;
  pdfBase64?: string;
};

export type ReportJobRecord = {
  id: string;
  organizationId: string;
  userId: string;
  status: ReportJobStatus;
  stage: ReportJobStage;
  progressPercent: number;
  input: ReportRequestInput;
  error: { code: string; message: string } | null;
  result: ReportJobResult | null;
  createdAt: string;
  updatedAt: string;
};

export const REPORT_CATALOG: ReportCatalogItem[] = [
  {
    type: "monthly_profit_and_loss",
    title: "Monthly Profit & Loss",
    description: "Income versus operating expenses for the selected month.",
    supportsRecognitionBasis: true
  },
  {
    type: "owner_statement",
    title: "Owner Statement",
    description: "Owner-ready period packet with collections, expenses, and net.",
    supportsRecognitionBasis: true
  },
  {
    type: "rent_roll",
    title: "Rent Roll",
    description: "Unit occupancy, lease terms, and contractual rent as of period end.",
    supportsRecognitionBasis: false
  },
  {
    type: "cash_flow_summary",
    title: "Cash Flow Summary",
    description: "Period cash inflows and outflows for the property.",
    supportsRecognitionBasis: false
  },
  {
    type: "expense_report",
    title: "Expense Report",
    description: "Itemized and categorized property expenses.",
    supportsRecognitionBasis: false
  },
  {
    type: "delinquency_report",
    title: "Delinquency Report",
    description: "Outstanding balances and aging by unit and resident.",
    supportsRecognitionBasis: false
  },
  {
    type: "maintenance_summary",
    title: "Maintenance Summary",
    description: "Work orders opened and completed in the period, by status and category.",
    supportsRecognitionBasis: false
  }
];

export function isReportType(value: unknown): value is ReportType {
  return typeof value === "string" && (REPORT_TYPES as readonly string[]).includes(value);
}

export function isRecognitionBasis(value: unknown): value is RecognitionBasis {
  return typeof value === "string" && (RECOGNITION_BASES as readonly string[]).includes(value);
}

export function parseReportRequestInput(payload: unknown): ReportRequestInput | null {
  if (!payload || typeof payload !== "object") return null;
  const value = payload as Record<string, unknown>;
  if (!isReportType(value["reportType"])) return null;
  const propertyId = typeof value["propertyId"] === "string" ? value["propertyId"].trim() : "";
  const year = typeof value["year"] === "number" ? value["year"] : Number(value["year"]);
  const month = typeof value["month"] === "number" ? value["month"] : Number(value["month"]);
  if (!propertyId || !Number.isInteger(year) || year < 2000 || year > 2100) return null;
  if (!Number.isInteger(month) || month < 1 || month > 12) return null;

  const recognitionBasis = isRecognitionBasis(value["recognitionBasis"])
    ? value["recognitionBasis"]
    : "cash";

  return {
    reportType: value["reportType"],
    propertyId,
    year,
    month,
    recognitionBasis,
    persistToVault: value["persistToVault"] === false ? false : true
  };
}

export function buildPeriod(year: number, month: number): ReportPeriod {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0));
  const startDate = start.toISOString().slice(0, 10);
  const endDate = end.toISOString().slice(0, 10);
  const label = start.toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  return { year, month, startDate, endDate, label };
}

export function reportTypeTitle(type: ReportType): string {
  return REPORT_CATALOG.find((item) => item.type === type)?.title ?? type;
}

export function formatReportMoney(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

export function roundMoney(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}
