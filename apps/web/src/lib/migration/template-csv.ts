import type { MigrationEntityType, MigrationSourceSoftware } from "./contracts";
import { getSoftwareTemplate } from "./templates";
import { toMigrationEntityLabel } from "./guide";

/** Build a downloadable CSV header row from software template aliases. */
export function buildTemplateCsv(entityType: MigrationEntityType, sourceSoftware: MigrationSourceSoftware): string {
  const template = getSoftwareTemplate(sourceSoftware);
  const aliases = template.entityTypes[entityType]?.columnMap ?? {};
  const headers = Object.values(aliases).map((candidates) => candidates[0] ?? "Column");
  const example = Object.keys(aliases).map((field) => exampleValue(entityType, field));
  return `${headers.map(escapeCsv).join(",")}\n${example.map(escapeCsv).join(",")}\n`;
}

export function downloadTemplateCsv(
  entityType: MigrationEntityType,
  sourceSoftware: MigrationSourceSoftware
): void {
  if (typeof window === "undefined") return;
  const csv = buildTemplateCsv(entityType, sourceSoftware);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `mpa-${entityType}-template.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function downloadImportLog(input: {
  jobNumber: string;
  summary: Record<string, unknown>;
  progressImported: number;
  progressWarnings: number;
  progressErrors: number;
}): void {
  if (typeof window === "undefined") return;
  const payload = {
    generatedAt: new Date().toISOString(),
    jobNumber: input.jobNumber,
    imported: input.progressImported,
    warnings: input.progressWarnings,
    errors: input.progressErrors,
    summary: input.summary
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `mpa-migration-log-${input.jobNumber}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function exampleValue(entityType: MigrationEntityType, field: string): string {
  const examples: Record<string, string> = {
    name: "Sunset Apartments",
    addressLine1: "100 Main St",
    city: "Austin",
    stateRegion: "TX",
    postalCode: "78701",
    propertyType: "multifamily",
    propertyName: "Sunset Apartments",
    unitNumber: "101",
    bedrooms: "2",
    bathrooms: "1",
    rentAmount: "1650",
    firstName: "Alex",
    lastName: "Rivera",
    email: "alex@example.com",
    phone: "5125550100",
    leaseNumber: "L-2026-001",
    tenantEmail: "alex@example.com",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    businessName: "Reliable Plumbing Co",
    primaryContactName: "Sam Lee"
  };
  return examples[field] ?? `${toMigrationEntityLabel(entityType)} sample`;
}
