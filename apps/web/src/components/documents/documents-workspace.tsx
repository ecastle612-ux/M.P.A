"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  DOCUMENT_CATEGORIES,
  DOCUMENT_CATEGORY_LABELS,
  DOCUMENT_ENTITY_LABELS,
  DOCUMENT_ENTITY_TYPES,
  DOCUMENT_STATUSES,
  PDF_EXPORT_TEMPLATES,
  inferMimeKind,
  type AuthoredBody,
  type DocumentRecord,
  type PdfExportTemplate
} from "@mpa/shared";
import { Alert, Badge, Button, EmptyState, Input, Skeleton } from "@mpa/ui";
import { AuthoredEditor } from "./authored-editor";

type Target = { id: string; label: string; propertyId?: string | null };

type TemplateOption = { id: string; title: string; description: string; category: string };

type Detail = {
  document: DocumentRecord;
  contentText: string | null;
  contentBase64: string | null;
  bodyJson?: AuthoredBody | null;
  signwellStatus: string | null;
  links: Array<{
    id: string;
    entityType: string;
    entityId: string;
    label: string | null;
    createdAt: string;
  }>;
  versions: Array<{
    id: string;
    versionNumber: number;
    title: string;
    mimeType: string;
    fileName: string | null;
    byteSize: number;
    notes: string | null;
    createdAt: string;
    createdBy: string | null;
  }>;
  activity: Array<{ at: string; label: string; detail: string }>;
};

const ENTITY_FILTERS = [
  "all",
  ...DOCUMENT_ENTITY_TYPES.filter((type) => type !== "organization")
] as const;

const linkFocus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus,#0F6B56)] focus-visible:ring-offset-2";

function initialEntityType(raw: string | null): (typeof ENTITY_FILTERS)[number] {
  if (raw && (ENTITY_FILTERS as readonly string[]).includes(raw)) {
    return raw as (typeof ENTITY_FILTERS)[number];
  }
  return "all";
}

function mimeBadge(mimeType: string): string {
  switch (inferMimeKind(mimeType)) {
    case "pdf":
      return "PDF";
    case "image":
      return "Image";
    case "office":
      return "Office";
    case "text":
      return "Text";
    case "cad":
      return "CAD";
    case "video":
      return "Video";
    default:
      return "File";
  }
}

export function DocumentsWorkspace() {
  const searchParams = useSearchParams();
  const [entityType, setEntityType] = useState<(typeof ENTITY_FILTERS)[number]>(() =>
    initialEntityType(searchParams.get("entityType"))
  );
  const [category, setCategory] = useState<string>("all");
  const [kind, setKind] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [templateId, setTemplateId] = useState("blank");
  const [authoredTitle, setAuthoredTitle] = useState("");
  const [creatingAuthored, setCreatingAuthored] = useState(false);
  const [autosaving, setAutosaving] = useState(false);
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [targets, setTargets] = useState<Record<string, Target[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [linkBusy, setLinkBusy] = useState(false);

  const [uploadEntityType, setUploadEntityType] = useState("property");
  const [uploadEntityId, setUploadEntityId] = useState("");
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadCategory, setUploadCategory] = useState("general");
  const [uploadText, setUploadText] = useState("");
  const [uploadFileName, setUploadFileName] = useState("");
  const [uploadBase64, setUploadBase64] = useState<string | null>(null);
  const [uploadMime, setUploadMime] = useState("text/plain");
  const [uploadTags, setUploadTags] = useState("");
  const [uploadNotes, setUploadNotes] = useState("");
  const [uploadKeywords, setUploadKeywords] = useState("");
  const [uploading, setUploading] = useState(false);

  const [linkEntityType, setLinkEntityType] = useState("vendor");
  const [linkEntityId, setLinkEntityId] = useState("");
  const [pdfTemplate, setPdfTemplate] = useState<PdfExportTemplate>("generic");

  const urlEntityType = initialEntityType(searchParams.get("entityType"));
  const urlQuery = searchParams.get("q") ?? "";
  const urlKey = `${urlEntityType}|${urlQuery}`;
  const [seenUrlKey, setSeenUrlKey] = useState(urlKey);
  if (urlKey !== seenUrlKey) {
    setSeenUrlKey(urlKey);
    setEntityType(urlEntityType);
    setQuery(urlQuery);
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (entityType !== "all") params.set("entityType", entityType);
        if (category !== "all") params.set("category", category);
        if (kind !== "all") params.set("kind", kind);
        if (status !== "all") params.set("status", status);
        if (query.trim()) params.set("q", query.trim());
        const response = await fetch(`/api/shared/documents?${params.toString()}`);
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? "Failed to load documents");
        if (!cancelled) setDocuments(body.documents as DocumentRecord[]);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load documents");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [entityType, category, kind, status, query, reloadKey]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const response = await fetch("/api/shared/documents/templates");
      const body = await response.json();
      if (!cancelled && response.ok) {
        setTemplates(body.templates as TemplateOption[]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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

  const linkOptions = useMemo(() => targets[linkEntityType] ?? [], [targets, linkEntityType]);
  const resolvedLinkEntityId = linkOptions.some((item) => item.id === linkEntityId)
    ? linkEntityId
    : (linkOptions[0]?.id ?? "");

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
      setUploadMime("text/plain");
      return;
    }
    setUploadFileName(file.name);
    setUploadMime(file.type || "application/octet-stream");
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    setUploadBase64(btoa(binary));
    if (!uploadTitle) setUploadTitle(file.name.replace(/\.[^.]+$/, ""));
  }

  async function submitUpload() {
    setUploading(true);
    setError(null);
    try {
      const tags = uploadTags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
      const response = await fetch("/api/shared/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType: uploadEntityType,
          entityId: resolvedUploadEntityId,
          title: uploadTitle,
          category: uploadCategory,
          fileName: uploadFileName || undefined,
          mimeType: uploadBase64 ? uploadMime : "text/plain",
          contentText: uploadText || undefined,
          contentBase64: uploadBase64 || undefined,
          tags,
          notes: uploadNotes || undefined,
          keywords: uploadKeywords || undefined
        })
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Upload failed");
      setUploadTitle("");
      setUploadText("");
      setUploadBase64(null);
      setUploadFileName("");
      setUploadTags("");
      setUploadNotes("");
      setUploadKeywords("");
      setReloadKey((value) => value + 1);
      await openDocument((body.document as DocumentRecord).id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function downloadPdf() {
    if (!selectedId) return;
    setPdfBusy(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/shared/documents/${encodeURIComponent(selectedId)}/pdf?template=${pdfTemplate}`
      );
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "PDF export failed");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${detail?.document.title ?? "document"}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "PDF export failed");
    } finally {
      setPdfBusy(false);
    }
  }

  async function downloadBinary() {
    if (!detail?.contentBase64 || !detail.document.fileName) return;
    const binary = atob(detail.contentBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: detail.document.mimeType || "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = detail.document.fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function createAuthored() {
    setCreatingAuthored(true);
    setError(null);
    try {
      const response = await fetch("/api/shared/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "authored",
          templateId,
          title: authoredTitle || undefined
        })
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Failed to create document");
      setAuthoredTitle("");
      setReloadKey((value) => value + 1);
      const created = body as Detail;
      setSelectedId(created.document.id);
      setDetail(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create document");
    } finally {
      setCreatingAuthored(false);
    }
  }

  const saveAuthored = useCallback(
    async (next: { title: string; body: AuthoredBody; checkpoint?: boolean }) => {
      if (!selectedId) return;
      setAutosaving(true);
      try {
        const response = await fetch(`/api/shared/documents/${encodeURIComponent(selectedId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: next.title,
            bodyJson: next.body,
            checkpoint: next.checkpoint
          })
        });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? "Autosave failed");
        setDetail(body as Detail);
        setReloadKey((value) => value + 1);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Autosave failed");
      } finally {
        setAutosaving(false);
      }
    },
    [selectedId]
  );

  async function deleteAuthored() {
    if (!selectedId) return;
    const response = await fetch(`/api/shared/documents/${encodeURIComponent(selectedId)}`, {
      method: "DELETE"
    });
    if (!response.ok) {
      const body = await response.json();
      setError(body.error ?? "Delete failed");
      return;
    }
    setSelectedId(null);
    setDetail(null);
    setReloadKey((value) => value + 1);
  }

  async function addRelationship() {
    if (!selectedId || !resolvedLinkEntityId || selectedId.startsWith("lease:")) return;
    setLinkBusy(true);
    setError(null);
    try {
      const label = linkOptions.find((item) => item.id === resolvedLinkEntityId)?.label;
      const response = await fetch(`/api/shared/documents/${encodeURIComponent(selectedId)}/links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType: linkEntityType,
          entityId: resolvedLinkEntityId,
          label
        })
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Failed to add relationship");
      await openDocument(selectedId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add relationship");
    } finally {
      setLinkBusy(false);
    }
  }

  const previewKind = detail ? inferMimeKind(detail.document.mimeType) : "other";
  const imagePreview =
    detail?.contentBase64 && previewKind === "image"
      ? `data:${detail.document.mimeType};base64,${detail.contentBase64}`
      : null;

  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Shared Platform · Operational Workspace
        </p>
        <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)] md:text-3xl">
          Documents
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
          One library for uploaded files and authored M.P.A. documents. Create from a template,
          edit rich text, export a professional PDF. Tables live next door — not a second vault.
        </p>
        <Link
          href="/shared/tables"
          className={`text-sm font-medium text-[var(--mpa-color-brand-primary)] ${linkFocus}`}
        >
          Open Tables
        </Link>
      </header>

      <section
        aria-label="Search and filters"
        className="grid gap-3 rounded-2xl border border-[var(--mpa-color-border-default)] bg-white p-4 sm:grid-cols-2 lg:grid-cols-5"
      >
        <label className="space-y-1 text-sm lg:col-span-2">
          <span className="text-xs font-medium text-[var(--mpa-color-text-secondary)]">Search</span>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name, resident, vendor, asset, tags, keywords…"
            aria-label="Search documents"
            className="min-h-11"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-xs font-medium text-[var(--mpa-color-text-secondary)]">Belongs to</span>
          <select
            className="block min-h-11 w-full rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-2"
            value={entityType}
            onChange={(event) => setEntityType(event.target.value as (typeof ENTITY_FILTERS)[number])}
          >
            {ENTITY_FILTERS.map((value) => (
              <option key={value} value={value}>
                {value === "all"
                  ? "All entities"
                  : DOCUMENT_ENTITY_LABELS[value as keyof typeof DOCUMENT_ENTITY_LABELS]}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-xs font-medium text-[var(--mpa-color-text-secondary)]">Category</span>
          <select
            className="block min-h-11 w-full rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-2"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="all">All categories</option>
            {DOCUMENT_CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {DOCUMENT_CATEGORY_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-xs font-medium text-[var(--mpa-color-text-secondary)]">Kind</span>
          <select
            className="block min-h-11 w-full rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-2"
            value={kind}
            onChange={(event) => setKind(event.target.value)}
          >
            <option value="all">All kinds</option>
            <option value="file">Uploaded files</option>
            <option value="authored">Authored documents</option>
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-xs font-medium text-[var(--mpa-color-text-secondary)]">Status</span>
          <select
            className="block min-h-11 w-full rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-2"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="all">All statuses</option>
            {DOCUMENT_STATUSES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </section>

      {error ? (
<Alert variant="danger">{error}</Alert>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="space-y-3" aria-label="Document library">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">Library</h2>
            <Button type="button" onClick={() => setReloadKey((value) => value + 1)}>
              Refresh
            </Button>
          </div>
          {loading ? (
            <Skeleton className="h-40 w-full" />
          ) : documents.length === 0 ? (
            <EmptyState
              title="No documents yet"
              description="Upload a file, or open a lease that already has a generated agreement."
            />
          ) : (
            <ul className="space-y-2">
              {documents.map((doc) => {
                const active = selectedId === doc.id;
                return (
                  <li key={doc.id}>
                    <button
                      type="button"
                      onClick={() => void openDocument(doc.id)}
                      className={`w-full rounded-2xl border bg-white p-3 text-left transition ${linkFocus} ${
                        active
                          ? "border-[var(--mpa-color-brand-primary)] ring-1 ring-[var(--mpa-color-brand-primary)]"
                          : "border-[var(--mpa-color-border-default)] hover:border-[var(--mpa-color-brand-primary)]"
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <span className="font-medium text-[var(--mpa-color-text-primary)]">
                          {doc.title}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="info">
                            {DOCUMENT_ENTITY_LABELS[doc.entityType] ?? doc.entityType}
                          </Badge>
                          <Badge variant="neutral">
                            {doc.kind === "authored" ? "Authored" : mimeBadge(doc.mimeType)}
                          </Badge>
                          {doc.status && doc.status !== "active" ? (
                            <Badge variant="warning">{doc.status}</Badge>
                          ) : null}
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">
                        {DOCUMENT_CATEGORY_LABELS[doc.category] ?? doc.category}
                        {doc.entityLabel ? ` · ${doc.entityLabel}` : ""}
                        {doc.versionNumber ? ` · v${doc.versionNumber}` : ""}
                        {doc.tags?.length ? ` · ${doc.tags.slice(0, 3).join(", ")}` : ""}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div className="space-y-4">
          <section
            aria-label="Document detail"
            className="space-y-3 rounded-2xl border border-[var(--mpa-color-border-default)] bg-white p-4"
          >
            <h2 className="text-sm font-semibold">Preview & actions</h2>
            {!selectedId ? (
              <p className="text-sm text-[var(--mpa-color-text-secondary)]">
                Select a document to preview, download, export a PDF, or manage relationships.
              </p>
            ) : !detail ? (
              <Skeleton className="h-28 w-full" />
            ) : (
              <div className="space-y-3 text-sm">
                <div className="flex flex-wrap gap-1">
                  <Badge variant="info">
                    {DOCUMENT_ENTITY_LABELS[detail.document.entityType] ??
                      detail.document.entityType}
                  </Badge>
                  <Badge variant="neutral">{detail.document.source}</Badge>
                  <Badge variant="neutral">{mimeBadge(detail.document.mimeType)}</Badge>
                  {detail.signwellStatus ? (
                    <Badge variant="success">SignWell · {detail.signwellStatus}</Badge>
                  ) : null}
                </div>
                {detail.document.kind === "authored" ? (
                  <AuthoredEditor
                    key={detail.document.id}
                    title={detail.document.title}
                    body={detail.bodyJson ?? null}
                    saving={autosaving}
                    onChange={(next) => void saveAuthored(next)}
                    onDelete={() => void deleteAuthored()}
                  />
                ) : (
                <p className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]">
                  {detail.document.title}
                </p>
                )}
                {detail.document.notes ? (
                  <p className="text-[var(--mpa-color-text-secondary)]">{detail.document.notes}</p>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  {detail.document.signwellDocumentId ? (
                    <Button type="button" onClick={() => void openDocument(detail.document.id, true)}>
                      Sync SignWell
                    </Button>
                  ) : null}
                  {detail.document.externalUrl ? (
                    <a
                      href={detail.document.externalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={`inline-flex min-h-10 items-center rounded-md border border-[var(--mpa-color-border-default)] px-3 text-sm font-medium text-[var(--mpa-color-brand-primary)] ${linkFocus}`}
                    >
                      Open external file
                    </a>
                  ) : null}
                  {detail.contentBase64 ? (
                    <Button type="button" onClick={downloadBinary}>
                      Download file
                    </Button>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-end gap-2 rounded-xl border border-[var(--mpa-color-border-default)] p-3">
                  <label className="min-w-[160px] flex-1 space-y-1 text-xs">
                    <span className="text-[var(--mpa-color-text-secondary)]">Professional PDF</span>
                    <select
                      className="block min-h-10 w-full rounded-md border border-[var(--mpa-color-border-default)] px-2 py-1.5"
                      value={pdfTemplate}
                      onChange={(event) => setPdfTemplate(event.target.value as PdfExportTemplate)}
                    >
                      {PDF_EXPORT_TEMPLATES.map((template) => (
                        <option key={template} value={template}>
                          {template.replace(/_/g, " ")}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Button type="button" disabled={pdfBusy} onClick={() => void downloadPdf()}>
                    {pdfBusy ? "Building PDF…" : "Export PDF"}
                  </Button>
                </div>

                {imagePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imagePreview}
                    alt={detail.document.title}
                    className="max-h-80 w-full rounded-xl border border-[var(--mpa-color-border-default)] object-contain"
                  />
                ) : detail.contentText ? (
                  <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-xl bg-[var(--mpa-color-bg-app)] p-3 text-xs leading-5">
                    {detail.contentText}
                  </pre>
                ) : detail.contentBase64 ? (
                  <p className="text-[var(--mpa-color-text-secondary)]">
                    Binary stored ({detail.document.byteSize} bytes)
                    {detail.document.fileName ? ` · ${detail.document.fileName}` : ""}.{" "}
                    {previewKind === "cad" || previewKind === "video"
                      ? "CAD and video files download for viewing in a native app."
                      : "Preview uses download or professional PDF export."}
                  </p>
                ) : (
                  <p className="text-[var(--mpa-color-text-secondary)]">No previewable content.</p>
                )}

                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
                    Relationships
                  </h3>
                  <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                    One document · many relationships · no duplicate uploads.
                  </p>
                  <ul className="space-y-1">
                    <li className="rounded-lg bg-[var(--mpa-color-bg-app)] px-2 py-1.5 text-xs">
                      Primary ·{" "}
                      {DOCUMENT_ENTITY_LABELS[detail.document.entityType] ?? detail.document.entityType}
                      {detail.document.entityLabel ? ` · ${detail.document.entityLabel}` : ""}
                    </li>
                    {(detail.links ?? []).map((link) => (
                      <li key={link.id} className="rounded-lg bg-[var(--mpa-color-bg-app)] px-2 py-1.5 text-xs">
                        {DOCUMENT_ENTITY_LABELS[link.entityType as keyof typeof DOCUMENT_ENTITY_LABELS] ??
                          link.entityType}
                        {link.label ? ` · ${link.label}` : ""}
                      </li>
                    ))}
                  </ul>
                  {!selectedId.startsWith("lease:") ? (
                    <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                      <select
                        className="min-h-10 rounded-md border border-[var(--mpa-color-border-default)] px-2 py-1.5 text-sm"
                        value={linkEntityType}
                        onChange={(event) => {
                          setLinkEntityType(event.target.value);
                          setLinkEntityId("");
                        }}
                      >
                        {DOCUMENT_ENTITY_TYPES.filter((type) => type !== "organization").map(
                          (type) => (
                            <option key={type} value={type}>
                              {DOCUMENT_ENTITY_LABELS[type]}
                            </option>
                          )
                        )}
                      </select>
                      <select
                        className="min-h-10 rounded-md border border-[var(--mpa-color-border-default)] px-2 py-1.5 text-sm"
                        value={resolvedLinkEntityId}
                        onChange={(event) => setLinkEntityId(event.target.value)}
                      >
                        {linkOptions.length === 0 ? (
                          <option value="">No targets loaded</option>
                        ) : (
                          linkOptions.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.label}
                            </option>
                          ))
                        )}
                      </select>
                      <Button
                        type="button"
                        disabled={linkBusy || !resolvedLinkEntityId}
                        onClick={() => void addRelationship()}
                      >
                        Link
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                      Lease-sourced documents reuse leasing records. Index into the library to add
                      extra links.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
                    Version history
                  </h3>
                  {(detail.versions ?? []).length === 0 ? (
                    <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                      Version {detail.document.versionNumber ?? 1} · current
                    </p>
                  ) : (
                    <ul className="space-y-1">
                      {detail.versions.map((version) => (
                        <li key={version.id} className="text-xs text-[var(--mpa-color-text-secondary)]">
                          v{version.versionNumber} · {version.title} ·{" "}
                          {new Date(version.createdAt).toLocaleString()}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
                    Activity timeline
                  </h3>
                  <ul className="space-y-1">
                    {(detail.activity ?? []).map((item, index) => (
                      <li key={`${item.at}-${index}`} className="text-xs text-[var(--mpa-color-text-secondary)]">
                        <span className="font-medium text-[var(--mpa-color-text-primary)]">
                          {item.label}
                        </span>{" "}
                        · {item.detail} · {new Date(item.at).toLocaleString()}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </section>

          <section
            aria-label="Upload document"
            className="space-y-3 rounded-2xl border border-[var(--mpa-color-border-default)] bg-white p-4"
          >
            <h2 className="text-sm font-semibold">Create authored document</h2>
            <p className="text-xs text-[var(--mpa-color-text-secondary)]">
              Native M.P.A. documents from the Phase 1 template catalog. Not a marketplace.
            </p>
            <label className="block space-y-1 text-sm">
              <span className="text-xs text-[var(--mpa-color-text-secondary)]">Template</span>
              <select
                className="w-full rounded-md border border-[var(--mpa-color-border-default)] px-3 py-2"
                value={templateId}
                onChange={(event) => setTemplateId(event.target.value)}
              >
                {(templates.length ? templates : [{ id: "blank", title: "Blank document", description: "", category: "general" }]).map(
                  (template) => (
                    <option key={template.id} value={template.id}>
                      {template.title}
                    </option>
                  )
                )}
              </select>
            </label>
            <label className="block space-y-1 text-sm">
              <span className="text-xs text-[var(--mpa-color-text-secondary)]">Title</span>
              <Input
                value={authoredTitle}
                onChange={(event) => setAuthoredTitle(event.target.value)}
                placeholder="Optional title"
              />
            </label>
            <Button type="button" disabled={creatingAuthored} onClick={() => void createAuthored()}>
              {creatingAuthored ? "Creating…" : "Create document"}
            </Button>
          </section>

          <section
            aria-label="Upload file"
            className="space-y-3 rounded-2xl border border-[var(--mpa-color-border-default)] bg-white p-4"
          >
            <h2 className="text-sm font-semibold">Upload & organize</h2>
            <p className="text-xs text-[var(--mpa-color-text-secondary)]">
              Attach once to the owning record. Add more relationships later — never duplicate the
              file.
            </p>
            <label className="block space-y-1 text-sm">
              <span className="text-xs text-[var(--mpa-color-text-secondary)]">Belongs to</span>
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
                    {DOCUMENT_ENTITY_LABELS[type]}
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
                {entityOptions.length === 0 ? (
                  <option value="">No records available for this type yet</option>
                ) : (
                  entityOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))
                )}
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
                {DOCUMENT_CATEGORIES.map((value) => (
                  <option key={value} value={value}>
                    {DOCUMENT_CATEGORY_LABELS[value]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1 text-sm">
              <span className="text-xs text-[var(--mpa-color-text-secondary)]">Tags (comma separated)</span>
              <Input
                value={uploadTags}
                onChange={(event) => setUploadTags(event.target.value)}
                placeholder="warranty, chiller, 2026"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="text-xs text-[var(--mpa-color-text-secondary)]">Keywords</span>
              <Input
                value={uploadKeywords}
                onChange={(event) => setUploadKeywords(event.target.value)}
                placeholder="Search keywords"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="text-xs text-[var(--mpa-color-text-secondary)]">Notes</span>
              <textarea
                className="min-h-[70px] w-full rounded-md border border-[var(--mpa-color-border-default)] px-3 py-2"
                value={uploadNotes}
                onChange={(event) => setUploadNotes(event.target.value)}
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="text-xs text-[var(--mpa-color-text-secondary)]">
                File (PDF, images, Office, text)
              </span>
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
              {uploading ? "Uploading…" : "Upload to Document Intelligence"}
            </Button>
          </section>
        </div>
      </div>
    </div>
  );
}
