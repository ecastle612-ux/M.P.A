export const MIGRATION_SOURCE_SOFTWARE = [
  "custom",
  "appfolio",
  "buildium",
  "doorloop",
  "rent_manager",
  "propertyware",
  "yardi",
  "rentvine",
  "other"
] as const;

export type MigrationSourceSoftware = (typeof MIGRATION_SOURCE_SOFTWARE)[number];

export const MIGRATION_JOB_STATUSES = [
  "draft",
  "source_selected",
  "files_uploaded",
  "mapped",
  "preview_ready",
  "importing",
  "completed",
  "failed",
  "rolled_back",
  "cancelled"
] as const;

export type MigrationJobStatus = (typeof MIGRATION_JOB_STATUSES)[number];

export const MIGRATION_WIZARD_STEPS = [
  "select_software",
  "upload",
  "map_columns",
  "preview",
  "import",
  "results",
  "review_exceptions"
] as const;

export type MigrationWizardStep = (typeof MIGRATION_WIZARD_STEPS)[number];

export const MIGRATION_ENTITY_TYPES = [
  "property",
  "unit",
  "tenant",
  "lease",
  "vendor",
  "applicant",
  "document"
] as const;

export type MigrationEntityType = (typeof MIGRATION_ENTITY_TYPES)[number];

export const MIGRATION_FILE_TYPES = ["csv", "xlsx", "zip", "folder"] as const;
export type MigrationFileType = (typeof MIGRATION_FILE_TYPES)[number];

export const MIGRATION_REVIEW_ITEM_TYPES = [
  "unknown_property",
  "duplicate_property",
  "duplicate_unit",
  "duplicate_tenant",
  "duplicate_lease",
  "duplicate_vendor",
  "unmapped_field",
  "validation_error",
  "ambiguous_match"
] as const;

export type MigrationReviewItemType = (typeof MIGRATION_REVIEW_ITEM_TYPES)[number];

export const MIGRATION_REVIEW_RESOLUTIONS = [
  "pending",
  "resolved",
  "skipped",
  "merged",
  "replaced",
  "kept"
] as const;

export type MigrationReviewResolution = (typeof MIGRATION_REVIEW_RESOLUTIONS)[number];

export type ColumnMap = Record<string, string>;

export type MigrationJobRecord = {
  id: string;
  organizationId: string;
  jobNumber: string;
  name: string;
  status: MigrationJobStatus;
  sourceSoftware: MigrationSourceSoftware;
  currentStep: MigrationWizardStep;
  progressTotal: number;
  progressImported: number;
  progressErrors: number;
  progressWarnings: number;
  completionPct: number;
  checkpointId: string | null;
  summary: Record<string, unknown>;
  metadata: Record<string, unknown>;
  startedAt: string | null;
  completedAt: string | null;
  rolledBackAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type MigrationImportFileRecord = {
  id: string;
  organizationId: string;
  jobId: string;
  fileType: MigrationFileType;
  originalFilename: string;
  storagePath: string | null;
  entityType: MigrationEntityType | null;
  rowCount: number;
  columnHeaders: string[];
  parseStatus: "pending" | "parsed" | "failed";
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type MigrationReviewItemRecord = {
  id: string;
  organizationId: string;
  jobId: string;
  itemType: MigrationReviewItemType;
  status: MigrationReviewResolution;
  title: string;
  description: string | null;
  sourceRow: Record<string, unknown>;
  candidateRecords: Array<Record<string, unknown>>;
  resolution: Record<string, unknown>;
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
};

export type MigrationActivityRecord = {
  id: string;
  organizationId: string;
  jobId: string;
  eventType: string;
  summary: string;
  payload: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
};

export type ParsedImportRow = Record<string, string>;

export type ParsedImportFile = {
  headers: string[];
  rows: ParsedImportRow[];
};

export type CreateMigrationJobInput = {
  name: string;
  sourceSoftware?: MigrationSourceSoftware;
};

export type UpdateMigrationJobInput = {
  name?: string;
  sourceSoftware?: MigrationSourceSoftware;
  currentStep?: MigrationWizardStep;
  status?: MigrationJobStatus;
  columnMaps?: Partial<Record<MigrationEntityType, ColumnMap>>;
};

export type MigrationReviewAction =
  | { action: "merge"; targetId: string }
  | { action: "keep"; targetId: string }
  | { action: "replace"; targetId: string }
  | { action: "skip" };

export function isMigrationSourceSoftware(value: unknown): value is MigrationSourceSoftware {
  return typeof value === "string" && MIGRATION_SOURCE_SOFTWARE.includes(value as MigrationSourceSoftware);
}

export function isMigrationEntityType(value: unknown): value is MigrationEntityType {
  return typeof value === "string" && MIGRATION_ENTITY_TYPES.includes(value as MigrationEntityType);
}

export function isMigrationWizardStep(value: unknown): value is MigrationWizardStep {
  return typeof value === "string" && MIGRATION_WIZARD_STEPS.includes(value as MigrationWizardStep);
}

export function toMigrationSourceLabel(source: MigrationSourceSoftware): string {
  const labels: Record<MigrationSourceSoftware, string> = {
    custom: "Custom / Generic CSV",
    appfolio: "AppFolio",
    buildium: "Buildium",
    doorloop: "DoorLoop",
    rent_manager: "Rent Manager",
    propertyware: "Propertyware",
    yardi: "Yardi",
    rentvine: "Rentvine",
    other: "Other software"
  };
  return labels[source];
}

export function toMigrationStepLabel(step: MigrationWizardStep): string {
  const labels: Record<MigrationWizardStep, string> = {
    select_software: "Select source software",
    upload: "Upload files",
    map_columns: "Map columns",
    preview: "Preview import",
    import: "Run import",
    results: "Review results",
    review_exceptions: "Resolve exceptions"
  };
  return labels[step];
}

export function nextWizardStep(step: MigrationWizardStep): MigrationWizardStep | null {
  const index = MIGRATION_WIZARD_STEPS.indexOf(step);
  if (index < 0 || index >= MIGRATION_WIZARD_STEPS.length - 1) return null;
  return MIGRATION_WIZARD_STEPS[index + 1] ?? null;
}

export function parseCreateMigrationJobInput(payload: unknown): CreateMigrationJobInput | null {
  if (!payload || typeof payload !== "object") return null;
  const value = payload as Record<string, unknown>;
  const name = readString(value["name"], 2, 160);
  if (!name) return null;
  const sourceSoftware = isMigrationSourceSoftware(value["sourceSoftware"]) ? value["sourceSoftware"] : "custom";
  return { name, sourceSoftware };
}

export function parseUpdateMigrationJobInput(payload: unknown): UpdateMigrationJobInput | null {
  if (!payload || typeof payload !== "object") return null;
  const value = payload as Record<string, unknown>;
  const updates: UpdateMigrationJobInput = {};
  const name = readString(value["name"], 2, 160);
  if (name) updates.name = name;
  if (isMigrationSourceSoftware(value["sourceSoftware"])) updates.sourceSoftware = value["sourceSoftware"];
  if (isMigrationWizardStep(value["currentStep"])) updates.currentStep = value["currentStep"];
  if (typeof value["status"] === "string" && MIGRATION_JOB_STATUSES.includes(value["status"] as MigrationJobStatus)) {
    updates.status = value["status"] as MigrationJobStatus;
  }
  if (value["columnMaps"] && typeof value["columnMaps"] === "object" && !Array.isArray(value["columnMaps"])) {
    updates.columnMaps = parseColumnMaps(value["columnMaps"] as Record<string, unknown>);
  }
  return Object.keys(updates).length > 0 ? updates : null;
}

export function parseColumnMaps(value: Record<string, unknown>): Partial<Record<MigrationEntityType, ColumnMap>> {
  const result: Partial<Record<MigrationEntityType, ColumnMap>> = {};
  for (const entityType of MIGRATION_ENTITY_TYPES) {
    const raw = value[entityType];
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
    const map: ColumnMap = {};
    for (const [field, column] of Object.entries(raw as Record<string, unknown>)) {
      if (typeof column === "string" && column.trim()) map[field] = column.trim();
    }
    if (Object.keys(map).length > 0) result[entityType] = map;
  }
  return result;
}

export function parseMigrationReviewAction(payload: unknown): MigrationReviewAction | null {
  if (!payload || typeof payload !== "object") return null;
  const value = payload as Record<string, unknown>;
  const action = typeof value["action"] === "string" ? value["action"] : null;
  if (action === "skip") return { action: "skip" };
  const targetId = readUuid(value["targetId"]);
  if (!targetId) return null;
  if (action === "merge" || action === "keep" || action === "replace") {
    return { action, targetId };
  }
  return null;
}

export function detectFileType(filename: string, mimeType?: string | null): MigrationFileType | null {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".csv")) return "csv";
  if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) return "xlsx";
  if (lower.endsWith(".zip")) return "zip";
  if (mimeType?.includes("csv")) return "csv";
  if (mimeType?.includes("spreadsheet") || mimeType?.includes("excel")) return "xlsx";
  if (mimeType?.includes("zip")) return "zip";
  return null;
}

function readString(value: unknown, min: number, max: number): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length < min || trimmed.length > max) return null;
  return trimmed.length === 0 && min > 0 ? null : trimmed;
}

function readUuid(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return null;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value
    : null;
}
