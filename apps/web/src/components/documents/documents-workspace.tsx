"use client";

import { useEffect, useMemo, useState } from "react";
import { DOCUMENT_CATEGORIES, DOCUMENT_ENTITY_TYPES, type DocumentRecord } from "@mpa/shared";
import { Badge, Button, EmptyState, Input, Skeleton } from "@mpa/ui";

type Target = { id: string; label: string; propertyId?: string | null };

type Detail = {
  document: DocumentRecord;
  contentText: string | null;
  contentBase64: string | null;
  signwellStatus: string | null;
};

const FILTERS = ["all", ...DOCUMENT_ENTITY_TYPES.filter((type) => type !== "organization")] as const;

export function DocumentsWorkspace() {
  const [entityType, setEntityType] = useState<(typeof FILTERS)[number]>("all");
  const [query, setQuery] = useState("");
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [targets, setTargets] = useState<Record<string, Target[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [uploadEntityType, setUploadEntityType] = useState("property");
  const [uploadEntityId, setUploadEntityId] = useState("");
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadCategory, setUploadCategory] = useState("general");
  const [uploadText, setUploadText] = useState("");
  const [uploadFileName, setUploadFileName] = useState("");
  const [uploadBase64, setUploadBase64] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (entityType !== "all") {
          params.set("entityType", entityType);
        }
        if (query.trim()) {
          params.set("q", query.trim());
        }
        const response = await fetch(`/api/shared/documents?${params.toString()}`);
        const body = await response.json();
        if (!response.ok) {
          throw new Error(body.error ?? "Failed to load documents");
        }
        if (!cancelled) {
          setDocuments(body.documents as DocumentRecord[]);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load documents");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [entityType, query, reloadKey]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const response = await fetch("/api/shared/documents/targets");
      const body = await response.json();
      if (!cancelled && response.ok) {
        setTargets(body.targets as Record<string, Target[]>);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const entityOptions = useMemo(() => targets[uploadEntityType] ?? [], [targets, uploadEntityType]);
  const resolvedUploadEntityId = entityOptions.some((item) => item.id === uploadEntityId)
    ? uploadEntityId
    : (entityOptions[0]?.id ?? "");

  async function openDocument(id: string, syncSignWell = false) {
    setSelectedId(id);
    setDetail(null);
    const response = await fetch(
      `/api/shared/documents/${encodeURIComponent(id)}${syncSignWell ? "?syncSignWell=1" : ""}`
    );
    const body = await response.json();
    if (!response.ok) {
      setError(body.error ?? "Failed to open document");
      return;
    }
    setDetail(body as Detail);
  }

  async function onFileChange(file: File | null) {
    if (!file) {
      setUploadBase64(null);
      setUploadFileName("");
      return;
    }
    setUploadFileName(file.name);
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    setUploadBase64(btoa(binary));
    if (!uploadTitle) {
      setUploadTitle(file.name.replace(/\.[^.]+$/, ""));
    }
  }

  async function submitUpload() {
    setUploading(true);
    setError(null);
    try {
      const response = await fetch("/api/shared/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType: uploadEntityType,
          entityId: resolvedUploadEntityId,
          title: uploadTitle,
          category: uploadCategory,
          fileName: uploadFileName || undefined,
          mimeType: uploadBase64 ? "application/octet-stream" : "text/plain",
          contentText: uploadText || undefined,
          contentBase64: uploadBase64 || undefined
        })
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error ?? "Upload failed");
      }
      setUploadTitle("");
      setUploadText("");
      setUploadBase64(null);
      setUploadFileName("");
      setReloadKey((value) => value + 1);
      await openDocument((body.document as DocumentRecord).id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Shared Platform · Documents
        </p>
        <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
          Document library
        </h1>
        <p className="max-w-3xl text-sm text-[var(--mpa-color-text-secondary)]">
          View and organize property, resident, lease, maintenance, and vendor documents. Lease and
          SignWell agreements reuse the existing leasing records — one library, no duplicate vault.
        </p>
      </header>

      <section className="flex flex-wrap items-end gap-2">
        <label className="space-y-1 text-sm">
          <span className="text-xs text-[var(--mpa-color-text-secondary)]">Filter</span>
          <select
            className="block rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-2"
            value={entityType}
            onChange={(event) => setEntityType(event.target.value as (typeof FILTERS)[number])}
          >
            {FILTERS.map((value) => (
              <option key={value} value={value}>
                {value === "all" ? "All documents" : value}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-[220px] flex-1 space-y-1 text-sm">
          <span className="text-xs text-[var(--mpa-color-text-secondary)]">Search</span>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search title, category, entity"
            aria-label="Search documents"
          />
        </label>
        <Button type="button" onClick={() => setReloadKey((value) => value + 1)}>
          Refresh
        </Button>
      </section>

      {error ? <p className="text-sm text-[#C0392B]">{error}</p> : null}

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-3" aria-label="Document list">
          {loading ? (
            <Skeleton className="h-40 w-full" />
          ) : documents.length === 0 ? (
            <EmptyState
              title="No documents yet"
              description="Upload a file or open a lease that already has a generated agreement."
            />
          ) : (
            <ul className="space-y-2">
              {documents.map((doc) => (
                <li key={doc.id}>
                  <button
                    type="button"
                    onClick={() => void openDocument(doc.id)}
                    className="w-full rounded-md border border-[var(--mpa-color-border-default)] bg-white p-3 text-left hover:bg-gray-50"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium text-[var(--mpa-color-text-primary)]">
                        {doc.title}
                      </span>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="info">{doc.entityType}</Badge>
                        <Badge variant="neutral">{doc.source}</Badge>
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">
                      {doc.category}
                      {doc.entityLabel ? ` · ${doc.entityLabel}` : ""}
                      {doc.signwellDocumentId ? " · SignWell" : ""}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="space-y-4">
          <section
            aria-label="Upload document"
            className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4"
          >
            <h2 className="text-sm font-semibold">Upload & organize</h2>
            <label className="block space-y-1 text-sm">
              <span className="text-xs text-[var(--mpa-color-text-secondary)]">Attach to</span>
              <select
                className="w-full rounded-md border border-[var(--mpa-color-border-default)] px-3 py-2"
                value={uploadEntityType}
                onChange={(event) => {
                  setUploadEntityType(event.target.value);
                  setUploadEntityId("");
                }}
              >
                {DOCUMENT_ENTITY_TYPES.filter((type) => type !== "organization").map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1 text-sm">
              <span className="text-xs text-[var(--mpa-color-text-secondary)]">Record</span>
              <select
                className="w-full rounded-md border border-[var(--mpa-color-border-default)] px-3 py-2"
                value={resolvedUploadEntityId}
                onChange={(event) => setUploadEntityId(event.target.value)}
              >
                {entityOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1 text-sm">
              <span className="text-xs text-[var(--mpa-color-text-secondary)]">Title</span>
              <Input value={uploadTitle} onChange={(event) => setUploadTitle(event.target.value)} />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="text-xs text-[var(--mpa-color-text-secondary)]">Category</span>
              <select
                className="w-full rounded-md border border-[var(--mpa-color-border-default)] px-3 py-2"
                value={uploadCategory}
                onChange={(event) => setUploadCategory(event.target.value)}
              >
                {DOCUMENT_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1 text-sm">
              <span className="text-xs text-[var(--mpa-color-text-secondary)]">File (optional)</span>
              <input
                type="file"
                onChange={(event) => void onFileChange(event.target.files?.[0] ?? null)}
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="text-xs text-[var(--mpa-color-text-secondary)]">Or paste text</span>
              <textarea
                className="min-h-[90px] w-full rounded-md border border-[var(--mpa-color-border-default)] px-3 py-2"
                value={uploadText}
                onChange={(event) => setUploadText(event.target.value)}
              />
            </label>
            <Button
              type="button"
              disabled={uploading || !resolvedUploadEntityId || !uploadTitle.trim()}
              onClick={() => void submitUpload()}
            >
              {uploading ? "Uploading…" : "Upload document"}
            </Button>
          </section>

          <section
            aria-label="Document detail"
            className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4"
          >
            <h2 className="text-sm font-semibold">Document detail</h2>
            {!selectedId ? (
              <p className="text-sm text-[var(--mpa-color-text-secondary)]">
                Select a document to view contents or SignWell status.
              </p>
            ) : !detail ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <div className="space-y-2 text-sm">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="info">{detail.document.entityType}</Badge>
                  <Badge variant="neutral">{detail.document.source}</Badge>
                  {detail.signwellStatus ? (
                    <Badge variant="success">SignWell · {detail.signwellStatus}</Badge>
                  ) : null}
                </div>
                <p className="font-medium">{detail.document.title}</p>
                {detail.document.signwellDocumentId ? (
                  <Button type="button" onClick={() => void openDocument(detail.document.id, true)}>
                    Sync SignWell document
                  </Button>
                ) : null}
                {detail.document.externalUrl ? (
                  <a
                    href={detail.document.externalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-[var(--mpa-color-brand-primary)] underline"
                  >
                    Open SignWell completed file
                  </a>
                ) : null}
                {detail.contentText ? (
                  <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-md bg-gray-50 p-3 text-xs">
                    {detail.contentText}
                  </pre>
                ) : detail.contentBase64 ? (
                  <p className="text-[var(--mpa-color-text-secondary)]">
                    Binary file stored ({detail.document.byteSize} bytes)
                    {detail.document.fileName ? ` · ${detail.document.fileName}` : ""}
                  </p>
                ) : (
                  <p className="text-[var(--mpa-color-text-secondary)]">No previewable content.</p>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
