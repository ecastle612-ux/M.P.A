"use client";

import { Card } from "@mpa/ui";
import {
  LEASE_DOCUMENT_TYPES,
  toLeaseDocumentTypeLabel,
  type LeaseDocumentRecord
} from "../../lib/lease/contracts";

export function LeaseDocumentsPanel({ documents }: { documents: LeaseDocumentRecord[] }) {
  const documentByType = new Map(documents.map((document) => [document.documentType, document]));

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">Lease documents</h2>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Track expected lease document types for this agreement. Organization files live in Settings → Documents.
        </p>
      </div>

      <ul className="space-y-2">
        {LEASE_DOCUMENT_TYPES.map((documentType) => {
          const document = documentByType.get(documentType);
          return (
            <li
              key={documentType}
              className="rounded-md border border-dashed border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface-muted)] p-3"
            >
              <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">
                {document?.title ?? toLeaseDocumentTypeLabel(documentType)}
              </p>
              <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">
                {document?.notes && !/future|placeholder|reserved/i.test(document.notes)
                  ? document.notes
                  : "No file linked for this document type yet."}
              </p>
              <p className="mt-1 text-xs uppercase tracking-wide text-[var(--mpa-color-text-muted)]">
                Status: {document?.ocrReady ? "Ready for review" : document ? "On file" : "Not attached"}
              </p>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
