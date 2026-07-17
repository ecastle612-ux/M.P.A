import type { ColumnMap, MigrationEntityType, MigrationSourceSoftware } from "./contracts";
import { getSoftwareTemplate } from "./templates";

export type ColumnDetectionResult = {
  columnMap: ColumnMap;
  confidence: number;
  unmappedHeaders: string[];
  unmappedFields: string[];
};

export function detectColumnMapping(
  headers: string[],
  entityType: MigrationEntityType,
  sourceSoftware: MigrationSourceSoftware
): ColumnDetectionResult {
  const template = getSoftwareTemplate(sourceSoftware);
  const aliases = template.entityTypes[entityType]?.columnMap ?? {};
  const normalizedHeaders = headers.map((header) => normalizeHeader(header));
  const columnMap: ColumnMap = {};
  const usedHeaders = new Set<string>();

  for (const [field, candidates] of Object.entries(aliases)) {
    const match = findBestHeaderMatch(headers, normalizedHeaders, candidates);
    if (match) {
      columnMap[field] = match;
      usedHeaders.add(match);
    }
  }

  const mappedFields = new Set(Object.keys(columnMap));
  const unmappedFields = Object.keys(aliases).filter((field) => !mappedFields.has(field));
  const unmappedHeaders = headers.filter((header) => !usedHeaders.has(header));
  const confidence =
    Object.keys(aliases).length === 0
      ? 0
      : Math.round((Object.keys(columnMap).length / Object.keys(aliases).length) * 100);

  return { columnMap, confidence, unmappedHeaders, unmappedFields };
}

export function applyColumnMapping(row: Record<string, string>, columnMap: ColumnMap): Record<string, string> {
  const mapped: Record<string, string> = {};
  for (const [field, header] of Object.entries(columnMap)) {
    mapped[field] = (row[header] ?? "").trim();
  }
  return mapped;
}

export function normalizeHeader(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function findBestHeaderMatch(
  headers: string[],
  normalizedHeaders: string[],
  candidates: string[]
): string | null {
  const normalizedCandidates = candidates.map((candidate) => normalizeHeader(candidate));

  for (let index = 0; index < headers.length; index += 1) {
    const header = headers[index];
    const normalized = normalizedHeaders[index];
    if (!header || !normalized) continue;

    if (normalizedCandidates.includes(normalized)) {
      return header;
    }

    for (const candidate of normalizedCandidates) {
      if (normalized.includes(candidate) || candidate.includes(normalized)) {
        return header;
      }
    }
  }

  return null;
}

export function buildDuplicateKey(entityType: MigrationEntityType, row: Record<string, string>): string {
  switch (entityType) {
    case "property":
      return [row["name"], row["addressLine1"], row["city"], row["postalCode"]]
        .map((part) => (part ?? "").trim().toLowerCase())
        .filter(Boolean)
        .join("|");
    case "unit":
      return [row["propertyName"] ?? row["propertyId"], row["unitNumber"]]
        .map((part) => (part ?? "").trim().toLowerCase())
        .filter(Boolean)
        .join("|");
    case "tenant":
    case "applicant":
      return [row["email"], row["firstName"], row["lastName"]]
        .map((part) => (part ?? "").trim().toLowerCase())
        .filter(Boolean)
        .join("|");
    case "lease":
      return [row["leaseNumber"], row["propertyName"], row["unitNumber"], row["tenantEmail"]]
        .map((part) => (part ?? "").trim().toLowerCase())
        .filter(Boolean)
        .join("|");
    case "vendor":
      return [row["businessName"], row["email"], row["phone"]]
        .map((part) => (part ?? "").trim().toLowerCase())
        .filter(Boolean)
        .join("|");
    default:
      return JSON.stringify(row);
  }
}

export function findDuplicateIndices(rows: Record<string, string>[], entityType: MigrationEntityType): number[] {
  const seen = new Map<string, number>();
  const duplicates: number[] = [];

  rows.forEach((row, index) => {
    const key = buildDuplicateKey(entityType, row);
    if (!key) return;
    if (seen.has(key)) {
      duplicates.push(index);
    } else {
      seen.set(key, index);
    }
  });

  return duplicates;
}
