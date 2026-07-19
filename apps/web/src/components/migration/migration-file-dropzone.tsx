"use client";

import { useCallback, useState } from "react";
import { Button } from "@mpa/ui";
import type { MigrationEntityType, MigrationSourceSoftware } from "../../lib/migration/contracts";
import { toMigrationEntityLabel } from "../../lib/migration/guide";
import { downloadTemplateCsv } from "../../lib/migration/template-csv";

export function MigrationFileDropzone({
  entityType,
  sourceSoftware,
  disabled,
  onFile
}: {
  entityType: MigrationEntityType;
  sourceSoftware: MigrationSourceSoftware;
  disabled?: boolean;
  onFile: (file: File) => void;
}) {
  const [dragging, setDragging] = useState(false);

  const handleFiles = useCallback(
    (list: FileList | null) => {
      const file = list?.[0];
      if (file) onFile(file);
    },
    [onFile]
  );

  return (
    <div className="space-y-3">
      <div
        className={[
          "rounded-[var(--mpa-radius-lg)] border-2 border-dashed px-4 py-8 text-center transition",
          dragging
            ? "border-[var(--mpa-color-brand-primary)] bg-[var(--mpa-color-brand-primary-subtle)]/50"
            : "border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface-muted)]/40"
        ].join(" ")}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (!disabled) handleFiles(event.dataTransfer.files);
        }}
      >
        <p className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">
          Drop your {toMigrationEntityLabel(entityType).toLowerCase()} file here
        </p>
        <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">
          CSV or Excel (.xlsx). Example columns: name, address, email, rent — we’ll match them automatically.
        </p>
        <label className="mt-4 inline-flex cursor-pointer">
          <span className="inline-flex h-9 items-center rounded-[var(--mpa-radius-md)] bg-[var(--mpa-color-brand-primary)] px-4 text-sm font-medium text-[var(--mpa-color-text-inverse)]">
            Choose file
          </span>
          <input
            type="file"
            className="sr-only"
            accept=".csv,.xlsx,.xls,.zip"
            disabled={disabled}
            onChange={(event) => handleFiles(event.target.files)}
          />
        </label>
      </div>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        disabled={disabled}
        onClick={() => downloadTemplateCsv(entityType, sourceSoftware)}
      >
        Download {toMigrationEntityLabel(entityType)} template
      </Button>
    </div>
  );
}
