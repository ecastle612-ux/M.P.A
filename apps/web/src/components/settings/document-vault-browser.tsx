"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Button, Card, Input , navPillClassName} from "@mpa/ui";
import type { VaultDocumentRecord } from "../../lib/vault/contracts";
import {
  VAULT_BROWSER_CATEGORIES,
  formatVaultEntityLabel,
  matchesVaultBrowserCategory,
  type VaultBrowserCategoryId
} from "../../lib/vault/browser-categories";

function matchesQuery(document: VaultDocumentRecord, query: string): boolean {
  if (!query) return true;
  const haystack = `${document.title} ${document.documentType} ${document.notes ?? ""}`.toLowerCase();
  return haystack.includes(query.toLowerCase());
}

export function DocumentVaultBrowser({ initialDocuments }: { initialDocuments: VaultDocumentRecord[] }) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [category, setCategory] = useState<VaultBrowserCategoryId>("all");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [selectedId, setSelectedId] = useState<string | null>(initialDocuments[0]?.id ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      documents.filter(
        (document) =>
          matchesVaultBrowserCategory(document, category) && matchesQuery(document, deferredQuery.trim())
      ),
    [documents, category, deferredQuery]
  );

  const selected = filtered.find((document) => document.id === selectedId) ?? filtered[0] ?? null;

  async function refreshVault() {
    setLoading(true);
    setError(null);
    const response = await fetch("/api/documents?scope=organization");
    setLoading(false);
    if (!response.ok) {
      setError("Unable to refresh the document vault.");
      return;
    }
    const payload = (await response.json()) as { items?: VaultDocumentRecord[] };
    const items = payload.items ?? [];
    setDocuments(items);
    setSelectedId((current) => {
      if (current && items.some((item) => item.id === current)) return current;
      return items[0]?.id ?? null;
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-[var(--mpa-color-text-primary)]">
            Document Vault
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-[var(--mpa-color-text-secondary)]">
            Browse organization documents stored in the existing Document Vault — leases, facility files,
            invoices, and more. No duplicate storage.
          </p>
        </div>
        <Button type="button" variant="secondary" disabled={loading} onClick={() => void refreshVault()}>
          {loading ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1">
          {VAULT_BROWSER_CATEGORIES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setCategory(item.id)}
              className={navPillClassName(category === item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <Input
          aria-label="Search documents"
          placeholder="Search title, type, or notes"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="w-full lg:max-w-sm"
        />
      </div>

      {error ? <p className="text-sm text-[var(--mpa-color-feedback-error)]">{error}</p> : null}

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--mpa-color-text-tertiary)]">
            {filtered.length} document{filtered.length === 1 ? "" : "s"}
          </p>
          {filtered.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[var(--mpa-color-border-default)] p-4 text-sm text-[var(--mpa-color-text-secondary)]">
              No documents match this filter. Add references from leases, applicants, properties, and
              maintenance records — they appear here automatically.
            </p>
          ) : (
            <ul className="max-h-[28rem] space-y-2 overflow-y-auto">
              {filtered.map((document) => {
                const active = selected?.id === document.id;
                return (
                  <li key={document.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(document.id)}
                      className={
                        active
                          ? "w-full rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-surface-muted)] px-3 py-2.5 text-left"
                          : "w-full rounded-md border border-transparent px-3 py-2.5 text-left hover:bg-[var(--mpa-color-surface-muted)]"
                      }
                    >
                      <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">
                        {document.title}
                      </p>
                      <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                        {formatVaultEntityLabel(document.entityType)} ·{" "}
                        {document.documentType.replaceAll("_", " ")}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="space-y-3">
          <h2 className="text-base font-semibold">Preview</h2>
          {!selected ? (
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">
              Select a document to preview metadata and download when a file link is available.
            </p>
          ) : (
            <>
              <div>
                <p className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">{selected.title}</p>
                <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">
                  {formatVaultEntityLabel(selected.entityType)} ·{" "}
                  {selected.documentType.replaceAll("_", " ")}
                </p>
              </div>
              {selected.notes ? (
                <p className="text-sm text-[var(--mpa-color-text-secondary)]">{selected.notes}</p>
              ) : (
                <p className="text-sm text-[var(--mpa-color-text-secondary)]">No notes on this document.</p>
              )}
              <dl className="space-y-1 text-xs text-[var(--mpa-color-text-secondary)]">
                <div>
                  <dt className="inline text-[var(--mpa-color-text-tertiary)]">Entity ID: </dt>
                  <dd className="inline break-all font-mono">{selected.entityId}</dd>
                </div>
                <div>
                  <dt className="inline text-[var(--mpa-color-text-tertiary)]">Updated: </dt>
                  <dd className="inline">{new Date(selected.updatedAt).toLocaleString()}</dd>
                </div>
              </dl>
              {selected.fileUrl ? (
                <a href={selected.fileUrl} target="_blank" rel="noreferrer">
                  <Button type="button">Download / open</Button>
                </a>
              ) : (
                <p className="text-sm text-[var(--mpa-color-text-secondary)]">
                  This entry is a vault reference without a downloadable file link yet.
                </p>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
