import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DOCUMENT_ENTITY_LABELS,
  isDocumentCategory,
  isDocumentEntityType,
  isDocumentKind,
  isDocumentStatus,
  parseAuthoredBody,
  type AuthoredBody,
  type DocumentCategory,
  type DocumentEntityType,
  type DocumentKind,
  type DocumentLink,
  type DocumentRecord,
  type DocumentSource,
  type DocumentStatus,
  type DocumentVersion
} from "@mpa/shared";
import { emitPropertyEvent, writePropertyAudit } from "../property/events-audit";
import {
  getSignWellCompletedPdfUrl,
  getSignWellDocument,
  isSignWellCompletedStatus,
  isSignWellConfigured,
  resolveSignWellExternalFileUrl
} from "../signwell/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any>;

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

const CORE_DOCUMENT_COLUMNS =
  "id, organization_id, entity_type, entity_id, title, category, source, mime_type, file_name, byte_size, signwell_document_id, external_url, property_id, created_at, content_text, content_base64";

const EXTENDED_DOCUMENT_COLUMNS = `${CORE_DOCUMENT_COLUMNS}, tags, notes, status, keywords, version_number`;
const WORKSPACE_DOCUMENT_COLUMNS = `${EXTENDED_DOCUMENT_COLUMNS}, kind, template_id, body_json, deleted_at`;

export type DocumentActivityItem = {
  at: string;
  label: string;
  detail: string;
};

export type DocumentDetail = {
  document: DocumentRecord;
  contentText: string | null;
  contentBase64: string | null;
  bodyJson: AuthoredBody | null;
  signwellStatus: string | null;
  links: DocumentLink[];
  versions: DocumentVersion[];
  activity: DocumentActivityItem[];
};

function mapRow(row: Record<string, unknown>, entityLabel?: string | null): DocumentRecord {
  const contentText = row["content_text"];
  const contentBase64 = row["content_base64"];
  const externalUrl = (row["external_url"] as string | null) ?? null;
  const signwellDocumentId = (row["signwell_document_id"] as string | null) ?? null;
  const tagsRaw = row["tags"];
  const tags = Array.isArray(tagsRaw)
    ? tagsRaw.filter((tag): tag is string => typeof tag === "string")
    : [];
  const statusRaw = row["status"];
  const status: DocumentStatus =
    typeof statusRaw === "string" && isDocumentStatus(statusRaw) ? statusRaw : "active";
  const versionRaw = row["version_number"];
  const kindRaw = row["kind"];
  const kind: DocumentKind =
    typeof kindRaw === "string" && isDocumentKind(kindRaw) ? kindRaw : "file";
  return {
    id: row["id"] as string,
    organizationId: row["organization_id"] as string,
    entityType: row["entity_type"] as DocumentEntityType,
    entityId: row["entity_id"] as string,
    title: row["title"] as string,
    category: row["category"] as DocumentCategory,
    source: row["source"] as DocumentSource,
    mimeType: row["mime_type"] as string,
    fileName: (row["file_name"] as string | null) ?? null,
    byteSize: Number(row["byte_size"] ?? 0),
    signwellDocumentId,
    externalUrl,
    propertyId: (row["property_id"] as string | null) ?? null,
    entityLabel: entityLabel ?? null,
    createdAt: row["created_at"] as string,
    hasContent: Boolean(contentText || contentBase64 || externalUrl || signwellDocumentId),
    tags,
    notes: (row["notes"] as string | null | undefined) ?? null,
    status,
    keywords: (row["keywords"] as string | null | undefined) ?? null,
    versionNumber: typeof versionRaw === "number" ? versionRaw : Number(versionRaw ?? 1) || 1,
    kind,
    templateId: (row["template_id"] as string | null | undefined) ?? null,
    deletedAt: (row["deleted_at"] as string | null | undefined) ?? null
  };
}

function mapLinkRow(row: Record<string, unknown>): DocumentLink {
  return {
    id: row["id"] as string,
    entityType: row["entity_type"] as DocumentEntityType,
    entityId: row["entity_id"] as string,
    label: (row["label"] as string | null) ?? null,
    createdAt: row["created_at"] as string
  };
}

function mapVersionRow(row: Record<string, unknown>): DocumentVersion {
  return {
    id: row["id"] as string,
    versionNumber: Number(row["version_number"] ?? 1),
    title: row["title"] as string,
    mimeType: (row["mime_type"] as string) || "text/plain",
    fileName: (row["file_name"] as string | null) ?? null,
    byteSize: Number(row["byte_size"] ?? 0),
    notes: (row["notes"] as string | null) ?? null,
    createdAt: row["created_at"] as string,
    createdBy: (row["created_by"] as string | null) ?? null
  };
}

function buildActivity(input: {
  createdAt: string;
  title: string;
  links: DocumentLink[];
  versions: DocumentVersion[];
}): DocumentActivityItem[] {
  const items: DocumentActivityItem[] = [
    { at: input.createdAt, label: "Created", detail: input.title }
  ];
  for (const version of input.versions) {
    items.push({
      at: version.createdAt,
      label: `Version ${version.versionNumber}`,
      detail: version.notes?.trim() || version.title
    });
  }
  for (const link of input.links) {
    const entityLabel = DOCUMENT_ENTITY_LABELS[link.entityType] ?? link.entityType;
    items.push({
      at: link.createdAt,
      label: "Linked",
      detail: link.label?.trim() ? `${entityLabel} · ${link.label}` : entityLabel
    });
  }
  return items.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
}

function matchesQuery(doc: DocumentRecord, needle: string): boolean {
  const haystack = [
    doc.title,
    doc.entityLabel ?? "",
    doc.category,
    doc.entityType,
    doc.fileName ?? "",
    doc.mimeType,
    doc.notes ?? "",
    doc.keywords ?? "",
    ...(doc.tags ?? [])
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle);
}

async function resolveEntityLabel(
  supabase: Db,
  organizationId: string,
  entityType: DocumentEntityType,
  entityId: string
): Promise<{ label: string; propertyId: string | null }> {
  switch (entityType) {
    case "property": {
      const { data } = await supabase
        .from("property_properties")
        .select("id, name")
        .eq("organization_id", organizationId)
        .eq("id", entityId)
        .maybeSingle();
      return { label: (data?.name as string) ?? "Property", propertyId: entityId };
    }
    case "unit": {
      const { data } = await supabase
        .from("property_units")
        .select("id, unit_label, property_id")
        .eq("organization_id", organizationId)
        .eq("id", entityId)
        .maybeSingle();
      const unitLabel = data?.unit_label as string | undefined;
      return {
        label: unitLabel ? `Unit ${unitLabel}` : "Unit",
        propertyId: (data?.property_id as string | null) ?? null
      };
    }
    case "resident": {
      const { data } = await supabase
        .from("pm_residents")
        .select("id, display_name, property_id")
        .eq("organization_id", organizationId)
        .eq("id", entityId)
        .maybeSingle();
      return {
        label: (data?.display_name as string) ?? "Resident",
        propertyId: (data?.property_id as string | null) ?? null
      };
    }
    case "lease": {
      const { data } = await supabase
        .from("lease_agreements")
        .select("id, document_name, property_id, pm_residents!resident_id(display_name)")
        .eq("organization_id", organizationId)
        .eq("id", entityId)
        .maybeSingle();
      const resident = Array.isArray(data?.pm_residents)
        ? data?.pm_residents[0]
        : data?.pm_residents;
      const name =
        (data?.document_name as string | undefined) ??
        (resident as { display_name?: string } | null)?.display_name ??
        "Lease";
      return { label: name, propertyId: (data?.property_id as string | null) ?? null };
    }
    case "application": {
      const { data } = await supabase
        .from("lease_applications")
        .select("id, property_id, pm_residents(display_name)")
        .eq("organization_id", organizationId)
        .eq("id", entityId)
        .maybeSingle();
      const resident = Array.isArray(data?.pm_residents)
        ? data?.pm_residents[0]
        : data?.pm_residents;
      return {
        label: (resident as { display_name?: string } | null)?.display_name
          ? `Application — ${(resident as { display_name: string }).display_name}`
          : "Application",
        propertyId: (data?.property_id as string | null) ?? null
      };
    }
    case "maintenance": {
      const { data } = await supabase
        .from("maintenance_work_orders")
        .select("id, title, property_id")
        .eq("organization_id", organizationId)
        .eq("id", entityId)
        .maybeSingle();
      return {
        label: (data?.title as string) ?? "Work order",
        propertyId: (data?.property_id as string | null) ?? null
      };
    }
    case "vendor": {
      const { data } = await supabase
        .from("vendor_vendors")
        .select("id, name")
        .eq("organization_id", organizationId)
        .eq("id", entityId)
        .maybeSingle();
      return { label: (data?.name as string) ?? "Vendor", propertyId: null };
    }
    case "organization":
      return { label: "Organization", propertyId: null };
    case "asset":
    case "inspection":
    case "compliance":
    case "financial":
    case "building":
      return { label: DOCUMENT_ENTITY_LABELS[entityType], propertyId: null };
    default:
      return { label: "Document", propertyId: null };
  }
}

async function selectDocumentRows(
  supabase: Db,
  organizationId: string,
  filters?: {
    entityType?: DocumentEntityType | "all";
    propertyId?: string;
    category?: DocumentCategory;
    status?: DocumentStatus;
  }
) {
  let workspaceQuery = supabase
    .from("document_documents")
    .select(WORKSPACE_DOCUMENT_COLUMNS)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (filters?.entityType && filters.entityType !== "all") {
    workspaceQuery = workspaceQuery.eq("entity_type", filters.entityType);
  }
  if (filters?.propertyId) {
    workspaceQuery = workspaceQuery.eq("property_id", filters.propertyId);
  }
  if (filters?.category) {
    workspaceQuery = workspaceQuery.eq("category", filters.category);
  }
  if (filters?.status) {
    workspaceQuery = workspaceQuery.eq("status", filters.status);
  }
  const workspace = await workspaceQuery;
  if (!workspace.error) {
    return workspace;
  }

  let extendedQuery = supabase
    .from("document_documents")
    .select(EXTENDED_DOCUMENT_COLUMNS)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (filters?.entityType && filters.entityType !== "all") {
    extendedQuery = extendedQuery.eq("entity_type", filters.entityType);
  }
  if (filters?.propertyId) {
    extendedQuery = extendedQuery.eq("property_id", filters.propertyId);
  }
  if (filters?.category) {
    extendedQuery = extendedQuery.eq("category", filters.category);
  }
  if (filters?.status) {
    extendedQuery = extendedQuery.eq("status", filters.status);
  }

  const extended = await extendedQuery;
  if (!extended.error) {
    return extended;
  }

  const message = extended.error.message.toLowerCase();
  const missingColumn =
    message.includes("column") ||
    message.includes("does not exist") ||
    message.includes("schema cache");
  if (!missingColumn) {
    return extended;
  }

  // Fall back to core columns when intelligence migration is not applied yet.
  let coreQuery = supabase
    .from("document_documents")
    .select(CORE_DOCUMENT_COLUMNS)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (filters?.entityType && filters.entityType !== "all") {
    coreQuery = coreQuery.eq("entity_type", filters.entityType);
  }
  if (filters?.propertyId) {
    coreQuery = coreQuery.eq("property_id", filters.propertyId);
  }
  // category/status columns may be missing — skip DB filter; client filter applied later if needed
  return coreQuery;
}

export async function listDocumentLinks(
  supabase: Db,
  organizationId: string,
  documentId: string
): Promise<DocumentLink[]> {
  const { data, error } = await supabase
    .from("document_document_links")
    .select("id, entity_type, entity_id, label, created_at")
    .eq("organization_id", organizationId)
    .eq("document_id", documentId)
    .order("created_at", { ascending: false });

  if (error) {
    const message = error.message.toLowerCase();
    if (
      message.includes("does not exist") ||
      message.includes("schema cache") ||
      message.includes("relation")
    ) {
      return [];
    }
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapLinkRow(row as Record<string, unknown>));
}

export async function addDocumentLink(
  supabase: Db,
  organizationId: string,
  documentId: string,
  entityType: string,
  entityId: string,
  label?: string
): Promise<DocumentLink> {
  if (!isDocumentEntityType(entityType)) {
    throw new Error("Invalid entity type");
  }
  if (!entityId.trim()) {
    throw new Error("entityId is required");
  }

  const { data, error } = await supabase
    .from("document_document_links")
    .upsert(
      {
        organization_id: organizationId,
        document_id: documentId,
        entity_type: entityType,
        entity_id: entityId.trim(),
        label: label?.trim() || null
      },
      { onConflict: "document_id,entity_type,entity_id" }
    )
    .select("id, entity_type, entity_id, label, created_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapLinkRow(data as Record<string, unknown>);
}

export async function listDocumentVersions(
  supabase: Db,
  organizationId: string,
  documentId: string
): Promise<DocumentVersion[]> {
  const { data, error } = await supabase
    .from("document_document_versions")
    .select(
      "id, version_number, title, mime_type, file_name, byte_size, notes, created_at, created_by"
    )
    .eq("organization_id", organizationId)
    .eq("document_id", documentId)
    .order("version_number", { ascending: false });

  if (error) {
    const message = error.message.toLowerCase();
    if (
      message.includes("does not exist") ||
      message.includes("schema cache") ||
      message.includes("relation")
    ) {
      return [];
    }
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapVersionRow(row as Record<string, unknown>));
}

export async function listDocuments(
  supabase: Db,
  organizationId: string,
  filters?: {
    entityType?: DocumentEntityType | "all";
    query?: string;
    propertyId?: string;
    category?: DocumentCategory;
    status?: DocumentStatus;
    includeAuthored?: boolean;
    includeDeleted?: boolean;
    kind?: DocumentKind | "all";
  }
): Promise<DocumentRecord[]> {
  const { data, error } = await selectDocumentRows(supabase, organizationId, filters);
  if (error) {
    throw new Error(error.message);
  }

  let uploaded = (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
  if (!filters?.includeDeleted) {
    uploaded = uploaded.filter((doc) => !doc.deletedAt);
  }
  if (filters?.kind && filters.kind !== "all") {
    uploaded = uploaded.filter((doc) => (doc.kind ?? "file") === filters.kind);
  } else if (filters?.includeAuthored === false) {
    uploaded = uploaded.filter((doc) => (doc.kind ?? "file") !== "authored");
  }

  // When falling back to core columns, category/status may not have been filtered in SQL.
  if (filters?.category) {
    uploaded = uploaded.filter((doc) => doc.category === filters.category);
  }
  if (filters?.status) {
    uploaded = uploaded.filter((doc) => (doc.status ?? "active") === filters.status);
  }

  // Reuse lease agreement documents (generated / SignWell / offline) in the same library.
  const { data: leases } = await supabase
    .from("lease_agreements")
    .select(
      "id, document_name, document_body, signing_channel, signwell_document_id, signwell_status, property_id, status, created_at, activated_at, pm_residents!resident_id(display_name)"
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(50);

  const leaseDocs: DocumentRecord[] = [];
  for (const lease of leases ?? []) {
    if (!lease.document_body && !lease.signwell_document_id) {
      continue;
    }
    if (filters?.entityType && filters.entityType !== "all" && filters.entityType !== "lease") {
      continue;
    }
    if (filters?.propertyId && lease.property_id !== filters.propertyId) {
      continue;
    }
    if (filters?.category && filters.category !== "lease") {
      continue;
    }
    if (filters?.status && filters.status !== "active") {
      continue;
    }
    const alreadyIndexed = uploaded.some(
      (doc) => doc.entityType === "lease" && doc.entityId === lease.id && doc.source !== "upload"
    );
    if (alreadyIndexed) {
      continue;
    }
    const resident = Array.isArray(lease.pm_residents)
      ? lease.pm_residents[0]
      : lease.pm_residents;
    const source: DocumentSource =
      lease.signing_channel === "signwell"
        ? "signwell"
        : lease.signing_channel === "offline"
          ? "offline"
          : "generated";
    leaseDocs.push({
      id: `lease:${lease.id}`,
      organizationId,
      entityType: "lease",
      entityId: lease.id as string,
      title: (lease.document_name as string) || "Lease agreement",
      category: "lease",
      source,
      mimeType: "text/plain",
      fileName: `${(lease.document_name as string) || "lease"}.txt`,
      byteSize: String(lease.document_body ?? "").length,
      signwellDocumentId: (lease.signwell_document_id as string | null) ?? null,
      externalUrl: null,
      propertyId: (lease.property_id as string | null) ?? null,
      entityLabel:
        (resident as { display_name?: string } | null)?.display_name ??
        (lease.signwell_status as string | null) ??
        "Lease",
      createdAt: (lease.activated_at as string | null) ?? (lease.created_at as string),
      hasContent: Boolean(lease.document_body || lease.signwell_document_id),
      tags: [],
      notes: null,
      status: "active",
      keywords: null,
      versionNumber: 1,
      kind: "file"
    });
  }

  const combined = [...uploaded, ...leaseDocs].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
  );

  const needle = filters?.query?.trim().toLowerCase();
  if (!needle) {
    return combined;
  }
  return combined.filter((doc) => matchesQuery(doc, needle));
}

async function hydrateSignWellExternalFile(signwellDocumentId: string): Promise<{
  status: string | null;
  externalUrl: string | null;
}> {
  const remote = await getSignWellDocument(signwellDocumentId);
  const files = (remote as { files?: Array<{ url?: string; name?: string }> }).files;
  const fromFiles = files?.find((file) => file.url)?.url ?? null;
  const completedPdfUrl =
    !fromFiles && isSignWellCompletedStatus(remote.status)
      ? await getSignWellCompletedPdfUrl(signwellDocumentId)
      : null;
  return {
    status: remote.status,
    externalUrl: resolveSignWellExternalFileUrl({
      files: files ?? null,
      status: remote.status,
      completedPdfUrl
    })
  };
}

export async function getDocumentDetail(
  supabase: Db,
  organizationId: string,
  documentId: string
): Promise<DocumentDetail | null> {
  if (documentId.startsWith("lease:")) {
    const leaseId = documentId.slice("lease:".length);
    const { data: lease, error } = await supabase
      .from("lease_agreements")
      .select(
        "id, document_name, document_body, signing_channel, signwell_document_id, signwell_status, property_id, status, created_at, activated_at"
      )
      .eq("organization_id", organizationId)
      .eq("id", leaseId)
      .maybeSingle();
    if (error) {
      throw new Error(error.message);
    }
    if (!lease) {
      return null;
    }

    let signwellStatus = (lease.signwell_status as string | null) ?? null;
    let externalUrl: string | null = null;
    if (lease.signwell_document_id && isSignWellConfigured()) {
      try {
        const live = await hydrateSignWellExternalFile(lease.signwell_document_id as string);
        signwellStatus = live.status ?? signwellStatus;
        externalUrl = live.externalUrl;
      } catch {
        // Keep local lease body when SignWell is unreachable.
      }
    }

    const createdAt = (lease.activated_at as string | null) ?? (lease.created_at as string);
    const title = (lease.document_name as string) || "Lease agreement";
    const document: DocumentRecord = {
      id: documentId,
      organizationId,
      entityType: "lease",
      entityId: lease.id as string,
      title,
      category: "lease",
      source:
        lease.signing_channel === "signwell"
          ? "signwell"
          : lease.signing_channel === "offline"
            ? "offline"
            : "generated",
      mimeType: "text/plain",
      fileName: `${(lease.document_name as string) || "lease"}.txt`,
      byteSize: String(lease.document_body ?? "").length,
      signwellDocumentId: (lease.signwell_document_id as string | null) ?? null,
      externalUrl,
      propertyId: (lease.property_id as string | null) ?? null,
      entityLabel: signwellStatus,
      createdAt,
      hasContent: Boolean(lease.document_body || lease.signwell_document_id),
      tags: [],
      notes: null,
      status: "active",
      keywords: null,
      versionNumber: 1,
      kind: "file"
    };

    return {
      document,
      contentText: (lease.document_body as string | null) ?? null,
      contentBase64: null,
      bodyJson: null,
      signwellStatus,
      links: [],
      versions: [],
      activity: [{ at: createdAt, label: "Created", detail: title }]
    };
  }

  const { data, error } = await supabase
    .from("document_documents")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", documentId)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    return null;
  }

  let document = mapRow(data as Record<string, unknown>);
  if (document.deletedAt) {
    return null;
  }
  let signwellStatus: string | null = null;
  if (document.signwellDocumentId && isSignWellConfigured()) {
    try {
      const live = await hydrateSignWellExternalFile(document.signwellDocumentId);
      signwellStatus = live.status;
      document = { ...document, externalUrl: live.externalUrl ?? document.externalUrl };
    } catch {
      // Keep the stored row when SignWell is unreachable.
    }
  }
  const [links, versions] = await Promise.all([
    listDocumentLinks(supabase, organizationId, documentId),
    listDocumentVersions(supabase, organizationId, documentId)
  ]);

  return {
    document: { ...document, links },
    contentText: (data.content_text as string | null) ?? null,
    contentBase64: (data.content_base64 as string | null) ?? null,
    bodyJson: parseAuthoredBody(data.body_json) ?? null,
    signwellStatus,
    links,
    versions,
    activity: buildActivity({
      createdAt: document.createdAt,
      title: document.title,
      links,
      versions
    })
  };
}

export async function uploadDocument(
  supabase: Db,
  organizationId: string,
  actorId: string,
  input: {
    entityType: string;
    entityId: string;
    title: string;
    category?: string;
    fileName?: string;
    mimeType?: string;
    contentText?: string;
    contentBase64?: string;
    tags?: string[];
    notes?: string;
    keywords?: string;
    relatedLinks?: Array<{ entityType: string; entityId: string; label?: string }>;
  }
) {
  if (!isDocumentEntityType(input.entityType)) {
    throw new Error("Invalid entity type");
  }
  const category = input.category && isDocumentCategory(input.category) ? input.category : "general";
  const contentText = input.contentText?.trim() || null;
  const contentBase64 = input.contentBase64?.trim() || null;
  if (!contentText && !contentBase64) {
    throw new Error("Provide file content or text");
  }

  const byteSize = contentBase64
    ? Math.floor((contentBase64.length * 3) / 4)
    : new TextEncoder().encode(contentText ?? "").length;
  if (byteSize > MAX_UPLOAD_BYTES) {
    throw new Error("File exceeds 2 MB launch limit");
  }

  const resolved = await resolveEntityLabel(
    supabase,
    organizationId,
    input.entityType,
    input.entityId
  );

  const tags = (input.tags ?? [])
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 40);
  const notes = input.notes?.trim() || null;
  const keywords = input.keywords?.trim() || null;
  const mimeType =
    input.mimeType?.trim() || (contentBase64 ? "application/octet-stream" : "text/plain");
  const fileName = input.fileName?.trim() || null;
  const title = input.title.trim();

  const insertPayload: Record<string, unknown> = {
    organization_id: organizationId,
    entity_type: input.entityType,
    entity_id: input.entityId,
    title,
    category,
    source: "upload",
    mime_type: mimeType,
    file_name: fileName,
    content_text: contentText,
    content_base64: contentBase64,
    byte_size: byteSize,
    property_id: resolved.propertyId,
    uploaded_by: actorId,
    tags,
    notes,
    keywords,
    status: "active",
    version_number: 1
  };

  let data: Record<string, unknown> | null = null;
  let error: { message: string } | null = null;

  {
    const result = await supabase.from("document_documents").insert(insertPayload).select("*").single();
    data = (result.data as Record<string, unknown> | null) ?? null;
    error = result.error;
  }

  if (error) {
    const message = error.message.toLowerCase();
    const missingColumn =
      message.includes("column") ||
      message.includes("does not exist") ||
      message.includes("schema cache");
    if (missingColumn) {
      const corePayload = {
        organization_id: insertPayload["organization_id"],
        entity_type: insertPayload["entity_type"],
        entity_id: insertPayload["entity_id"],
        title: insertPayload["title"],
        category: insertPayload["category"],
        source: insertPayload["source"],
        mime_type: insertPayload["mime_type"],
        file_name: insertPayload["file_name"],
        content_text: insertPayload["content_text"],
        content_base64: insertPayload["content_base64"],
        byte_size: insertPayload["byte_size"],
        property_id: insertPayload["property_id"],
        uploaded_by: insertPayload["uploaded_by"]
      };
      const fallback = await supabase
        .from("document_documents")
        .insert(corePayload)
        .select("*")
        .single();
      data = (fallback.data as Record<string, unknown> | null) ?? null;
      error = fallback.error;
    }
  }

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to upload document");
  }

  const documentId = data["id"] as string;

  // Primary link matching the document's entity_type / entity_id.
  try {
    await addDocumentLink(
      supabase,
      organizationId,
      documentId,
      input.entityType,
      input.entityId,
      resolved.label
    );
  } catch {
    // Links table may not exist yet — upload still succeeds.
  }

  for (const related of input.relatedLinks ?? []) {
    if (!isDocumentEntityType(related.entityType) || !related.entityId?.trim()) {
      continue;
    }
    if (related.entityType === input.entityType && related.entityId === input.entityId) {
      continue;
    }
    try {
      await addDocumentLink(
        supabase,
        organizationId,
        documentId,
        related.entityType,
        related.entityId,
        related.label
      );
    } catch {
      // Skip related link failures without failing the upload.
    }
  }

  await supabase.from("document_document_versions").insert({
    organization_id: organizationId,
    document_id: documentId,
    version_number: 1,
    title,
    mime_type: mimeType,
    file_name: fileName,
    content_text: contentText,
    content_base64: contentBase64,
    byte_size: byteSize,
    notes,
    created_by: actorId
  });

  await emitPropertyEvent({
    supabase,
    organizationId,
    actorId,
    eventType: "document.uploaded",
    aggregateType: "document_documents",
    aggregateId: documentId,
    payload: {
      title: data["title"],
      entityType: data["entity_type"],
      entityId: data["entity_id"],
      category: data["category"]
    }
  });
  await writePropertyAudit({
    supabase,
    organizationId,
    actorId,
    action: "document.uploaded",
    entityType: "document_documents",
    entityId: documentId,
    payload: {
      title: data["title"],
      entityType: data["entity_type"],
      entityId: data["entity_id"]
    }
  });

  return mapRow(data, resolved.label);
}

export async function ensureSignWellLeaseDocumentIndexed(
  supabase: Db,
  organizationId: string,
  actorId: string,
  leaseId: string
) {
  const detail = await getDocumentDetail(supabase, organizationId, `lease:${leaseId}`);
  if (!detail?.document.signwellDocumentId) {
    return detail;
  }

  const { data: existing } = await supabase
    .from("document_documents")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("entity_type", "lease")
    .eq("entity_id", leaseId)
    .eq("source", "signwell")
    .maybeSingle();

  if (!existing) {
    await supabase.from("document_documents").insert({
      organization_id: organizationId,
      entity_type: "lease",
      entity_id: leaseId,
      title: detail.document.title,
      category: "lease",
      source: "signwell",
      mime_type: "text/plain",
      file_name: detail.document.fileName,
      content_text: detail.contentText,
      byte_size: detail.document.byteSize,
      signwell_document_id: detail.document.signwellDocumentId,
      external_url: detail.document.externalUrl,
      property_id: detail.document.propertyId,
      uploaded_by: actorId
    });
    await emitPropertyEvent({
      supabase,
      organizationId,
      actorId,
      eventType: "document.signwell_indexed",
      aggregateType: "lease_agreements",
      aggregateId: leaseId,
      payload: { signwellDocumentId: detail.document.signwellDocumentId }
    });
  }

  return detail;
}

export async function getDocumentsReadiness(supabase: Db, organizationId: string) {
  const [{ count: uploadCount }, { count: leaseDocCount }, { count: eventCount }] =
    await Promise.all([
      supabase
        .from("document_documents")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId),
      supabase
        .from("lease_agreements")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .not("document_body", "is", null),
      supabase
        .from("event_domain_events")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("event_type", "document.uploaded")
    ]);

  const documentsAvailable = (uploadCount ?? 0) + (leaseDocCount ?? 0) > 0;
  return {
    uploadCount: uploadCount ?? 0,
    leaseDocumentCount: leaseDocCount ?? 0,
    uploadEventCount: eventCount ?? 0,
    documentsAvailable,
    documentsReady: documentsAvailable
  };
}
