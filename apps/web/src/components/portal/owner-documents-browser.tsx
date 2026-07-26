"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { EmptyState, Input } from "@mpa/ui";
import {
  OWNER_DOCUMENT_CATEGORIES,
  matchesOwnerDocumentCategory,
  type OwnerDocumentCategoryId,
  type OwnerDocumentListItem
} from "../../lib/owner-portal/documents-shared";
import { OwnerDocumentRow } from "./owner-document-row";

function matchesSearch(document: OwnerDocumentListItem, query: string): boolean {
  if (!query) return true;
  const haystack = `${document.title} ${document.propertyName} ${document.categoryLabel} ${document.documentType}`.toLowerCase();
  return haystack.includes(query.toLowerCase());
}

export function OwnerDocumentsBrowser({
  documents,
  properties,
  documentTypes,
  loadNotes = [],
  lockedPropertyId = null
}: {
  documents: OwnerDocumentListItem[];
  properties: Array<{ id: string; name: string }>;
  documentTypes: string[];
  loadNotes?: string[];
  /** When set (property page), property filter is fixed. */
  lockedPropertyId?: string | null;
}) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [category, setCategory] = useState<OwnerDocumentCategoryId>("all");
  const [propertyId, setPropertyId] = useState<string>(lockedPropertyId ?? "all");
  const [documentType, setDocumentType] = useState<string>("all");

  const filtered = useMemo(() => {
    return documents.filter((document) => {
      if (lockedPropertyId && document.propertyId !== lockedPropertyId) return false;
      if (!lockedPropertyId && propertyId !== "all" && document.propertyId !== propertyId) return false;
      if (documentType !== "all" && document.documentType !== documentType) return false;
      if (!matchesOwnerDocumentCategory(document, category)) return false;
      return matchesSearch(document, deferredQuery.trim());
    });
  }, [documents, lockedPropertyId, propertyId, documentType, category, deferredQuery]);

  return (
    <div className="space-y-4">
      {loadNotes.length > 0 ? (
        <ul className="space-y-1 text-xs text-[var(--mpa-color-text-secondary)]">
          {loadNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      ) : null}

      <div className="flex flex-wrap gap-1">
        {OWNER_DOCUMENT_CATEGORIES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setCategory(item.id)}
            className={
              category === item.id
                ? "rounded-full bg-[var(--mpa-color-bg-surface-muted)] px-3 py-1 text-xs font-medium text-[var(--mpa-color-text-primary)]"
                : "rounded-full px-3 py-1 text-xs font-medium text-[var(--mpa-color-text-secondary)] hover:bg-[var(--mpa-color-bg-surface-muted)]"
            }
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Input
          aria-label="Search documents"
          placeholder="Search name, property, or category"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        {!lockedPropertyId ? (
          <label className="block space-y-1 text-xs text-[var(--mpa-color-text-secondary)]">
            <span>Property</span>
            <select
              className="w-full rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-3 py-2 text-sm text-[var(--mpa-color-text-primary)]"
              value={propertyId}
              onChange={(event) => setPropertyId(event.target.value)}
            >
              <option value="all">All properties</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="block space-y-1 text-xs text-[var(--mpa-color-text-secondary)]">
          <span>Document type</span>
          <select
            className="w-full rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-3 py-2 text-sm text-[var(--mpa-color-text-primary)]"
            value={documentType}
            onChange={(event) => setDocumentType(event.target.value)}
          >
            <option value="all">All types</option>
            {documentTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="text-xs text-[var(--mpa-color-text-secondary)]">
        {filtered.length} document{filtered.length === 1 ? "" : "s"}
        {deferredQuery.trim() || category !== "all" || propertyId !== "all" || documentType !== "all"
          ? " matching filters"
          : ""}
      </p>

      {documents.length === 0 ? (
        <EmptyState
          title="No documents yet"
          description="When your property manager shares statements, leases, inspections, or other files for your properties, they appear here."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No matches"
          description="Try a different search term, property, category, or document type."
        />
      ) : (
        <ul className="space-y-2">
          {filtered.map((document) => (
            <OwnerDocumentRow key={document.id} document={document} />
          ))}
        </ul>
      )}
    </div>
  );
}
