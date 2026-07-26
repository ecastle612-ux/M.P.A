"use client";

import { Badge, Card, EmptyState } from "@mpa/ui";

import { StandaloneOpenLink } from "../pwa/standalone-open-link";
import type { OwnerDocumentListItem } from "../../lib/owner-portal/documents-shared";

export function OwnerDocumentRow({ document }: { document: OwnerDocumentListItem }) {
  return (
    <li>
      <Card variant="elevated" className="space-y-2 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">{document.title}</p>
            <p className="text-xs text-[var(--mpa-color-text-secondary)]">
              {document.documentType} · {document.propertyName} · {document.categoryLabel}
            </p>
            <p className="text-xs text-[var(--mpa-color-text-secondary)]">
              Uploaded {document.uploadedAtLabel}
              {" · "}
              Modified {document.updatedAtLabel}
              {document.fileSizeLabel ? ` · ${document.fileSizeLabel}` : null}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {document.statusLabel ? <Badge variant="neutral">{document.statusLabel}</Badge> : null}
            <Badge variant={document.available ? "success" : "warning"}>
              {document.available ? "Available" : "Unavailable"}
            </Badge>
          </div>
        </div>
        {document.available && document.downloadHref ? (
          <p className="text-xs">
            <StandaloneOpenLink
              href={document.downloadHref}
              documentTitle={document.title}
              className="font-medium text-[var(--mpa-color-text-link)] underline"
            >
              Download / view
            </StandaloneOpenLink>
          </p>
        ) : (
          <p className="text-xs text-[var(--mpa-color-text-secondary)]">
            This file is not available for download right now. Contact your property manager if you need access.
          </p>
        )}
      </Card>
    </li>
  );
}

export function OwnerDocumentsList({
  documents,
  emptyTitle = "No documents yet",
  emptyDescription = "When your property manager shares files for your properties, they appear here."
}: {
  documents: OwnerDocumentListItem[];
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (documents.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <ul className="space-y-2">
      {documents.map((document) => (
        <OwnerDocumentRow key={document.id} document={document} />
      ))}
    </ul>
  );
}
