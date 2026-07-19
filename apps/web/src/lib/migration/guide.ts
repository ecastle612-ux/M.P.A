import type { MigrationEntityType, MigrationImportFileRecord, MigrationWizardStep } from "./contracts";

/**
 * MIG-001 — presentation-only portfolio guide phases.
 * Does not change API wizard steps; overlays friendly guidance.
 */

export type PortfolioGuidePhaseId =
  | "organization"
  | "properties"
  | "units"
  | "residents"
  | "leases"
  | "vendors"
  | "balances"
  | "review"
  | "import"
  | "completion";

export type PortfolioGuidePhase = {
  id: PortfolioGuidePhaseId;
  label: string;
  description: string;
  entityType?: MigrationEntityType;
  /** Maps to existing job.currentStep for progress highlighting */
  wizardSteps: MigrationWizardStep[];
  optional?: boolean;
};

export const PORTFOLIO_GUIDE_PHASES: PortfolioGuidePhase[] = [
  {
    id: "organization",
    label: "Organization",
    description: "Confirm where you’re coming from so M.P.A. can suggest column matches.",
    wizardSteps: ["select_software"]
  },
  {
    id: "properties",
    label: "Properties",
    description: "Upload your property list (buildings and addresses).",
    entityType: "property",
    wizardSteps: ["upload", "map_columns"]
  },
  {
    id: "units",
    label: "Units",
    description: "Upload units so occupancy and leases can connect.",
    entityType: "unit",
    wizardSteps: ["upload", "map_columns"]
  },
  {
    id: "residents",
    label: "Residents",
    description: "Upload resident contact details (name, email, phone).",
    entityType: "tenant",
    wizardSteps: ["upload", "map_columns"]
  },
  {
    id: "leases",
    label: "Leases",
    description: "Upload lease terms, dates, and rent amounts.",
    entityType: "lease",
    wizardSteps: ["upload", "map_columns"]
  },
  {
    id: "vendors",
    label: "Vendors",
    description: "Upload your preferred maintenance vendors.",
    entityType: "vendor",
    wizardSteps: ["upload", "map_columns"],
    optional: true
  },
  {
    id: "balances",
    label: "Beginning balances",
    description: "Opening balances stay in Financials after import — we’ll show you where.",
    wizardSteps: ["upload", "map_columns", "preview"],
    optional: true
  },
  {
    id: "review",
    label: "Review",
    description: "Approve counts, warnings, and sample rows before anything is written.",
    wizardSteps: ["preview"]
  },
  {
    id: "import",
    label: "Import",
    description: "M.P.A. creates records in your live portfolio with a rollback path.",
    wizardSteps: ["import"]
  },
  {
    id: "completion",
    label: "Completion",
    description: "See what imported, what was skipped, and what still needs attention.",
    wizardSteps: ["results", "review_exceptions"]
  }
];

export const CORE_UPLOAD_ENTITIES: MigrationEntityType[] = [
  "property",
  "unit",
  "tenant",
  "lease",
  "vendor"
];

export function toMigrationEntityLabel(entityType: MigrationEntityType): string {
  const labels: Record<MigrationEntityType, string> = {
    property: "Properties",
    unit: "Units",
    tenant: "Residents",
    lease: "Leases",
    vendor: "Vendors",
    applicant: "Applicants",
    document: "Documents"
  };
  return labels[entityType];
}

export function resolveGuidePhase(
  step: MigrationWizardStep,
  files: MigrationImportFileRecord[]
): PortfolioGuidePhaseId {
  if (step === "select_software") return "organization";
  if (step === "preview") return "review";
  if (step === "import") return "import";
  if (step === "results" || step === "review_exceptions") return "completion";

  const uploaded = new Set(
    files.map((file) => file.entityType).filter((value): value is MigrationEntityType => Boolean(value))
  );
  for (const entity of CORE_UPLOAD_ENTITIES) {
    if (!uploaded.has(entity)) {
      if (entity === "property") return "properties";
      if (entity === "unit") return "units";
      if (entity === "tenant") return "residents";
      if (entity === "lease") return "leases";
      if (entity === "vendor") return "vendors";
    }
  }
  if (step === "upload" || step === "map_columns") return "balances";
  return "review";
}

export function entityUploadStatus(files: MigrationImportFileRecord[]): Array<{
  entityType: MigrationEntityType;
  label: string;
  uploaded: boolean;
  rowCount: number;
}> {
  return CORE_UPLOAD_ENTITIES.map((entityType) => {
    const matches = files.filter((file) => file.entityType === entityType);
    return {
      entityType,
      label: toMigrationEntityLabel(entityType),
      uploaded: matches.length > 0,
      rowCount: matches.reduce((sum, file) => sum + file.rowCount, 0)
    };
  });
}
