"use client";

import { Select } from "@mpa/ui";
import type { ColumnMap, MigrationEntityType, MigrationSourceSoftware } from "../../lib/migration/contracts";
import { detectColumnMapping } from "../../lib/migration/mapping";
import { getSoftwareTemplate } from "../../lib/migration/templates";
import { toMigrationEntityLabel } from "../../lib/migration/guide";

const FIELD_LABELS: Record<string, string> = {
  name: "Property name",
  addressLine1: "Street address",
  city: "City",
  stateRegion: "State / region",
  postalCode: "Postal code",
  propertyType: "Property type",
  propertyName: "Property name",
  unitNumber: "Unit number",
  bedrooms: "Bedrooms",
  bathrooms: "Bathrooms",
  rentAmount: "Rent amount",
  firstName: "First name",
  lastName: "Last name",
  email: "Email",
  phone: "Phone",
  leaseNumber: "Lease number",
  tenantEmail: "Resident email",
  startDate: "Lease start",
  endDate: "Lease end",
  businessName: "Vendor name",
  primaryContactName: "Primary contact"
};

export function MigrationColumnMapper({
  entityType,
  sourceSoftware,
  headers,
  value,
  onChange,
  disabled
}: {
  entityType: MigrationEntityType;
  sourceSoftware: MigrationSourceSoftware;
  headers: string[];
  value: ColumnMap;
  onChange: (next: ColumnMap) => void;
  disabled?: boolean;
}) {
  const template = getSoftwareTemplate(sourceSoftware);
  const fields = Object.keys(template.entityTypes[entityType]?.columnMap ?? {});
  const detection = detectColumnMapping(headers, entityType, sourceSoftware);

  function applyAuto() {
    onChange(detection.columnMap);
  }

  if (fields.length === 0) {
    return (
      <p className="text-sm text-[var(--mpa-color-text-secondary)]">
        No mappable fields for {toMigrationEntityLabel(entityType)}.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">
            Match columns for {toMigrationEntityLabel(entityType)}
          </p>
          <p className="text-xs text-[var(--mpa-color-text-secondary)]">
            Auto-match confidence: {detection.confidence}%
            {detection.unmappedFields.length > 0
              ? ` · Still need: ${detection.unmappedFields.map((field) => FIELD_LABELS[field] ?? field).join(", ")}`
              : " · All suggested fields matched"}
          </p>
        </div>
        <button
          type="button"
          className="text-xs font-semibold text-[var(--mpa-color-brand-primary)] hover:underline"
          disabled={disabled}
          onClick={applyAuto}
        >
          Use suggested matches
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {fields.map((field) => (
          <label key={field} className="block space-y-1.5">
            <span className="text-sm font-medium text-[var(--mpa-color-text-primary)]">
              {FIELD_LABELS[field] ?? field}
            </span>
            <Select
              aria-label={`Map ${field}`}
              value={value[field] ?? ""}
              disabled={disabled}
              onChange={(event) => {
                const next = { ...value };
                if (event.target.value) next[field] = event.target.value;
                else delete next[field];
                onChange(next);
              }}
            >
              <option value="">Not mapped</option>
              {headers.map((header) => (
                <option key={header} value={header}>
                  {header}
                </option>
              ))}
            </Select>
          </label>
        ))}
      </div>
    </div>
  );
}
