import type { SupabaseClient } from "@supabase/supabase-js";
import {
  isDocumentCategory,
  isDocumentEntityType,
  type DocumentCategory,
  type DocumentEntityType,
  type DocumentRecord,
  type DocumentSource
} from "@mpa/shared";
import { emitPropertyEvent, writePropertyAudit } from "../property/events-audit";
import { getSignWellDocument, isSignWellConfigured } from "../signwell/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any>;

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

function mapRow(row: Record<string, unknown>, entityLabel?: string | null): DocumentRecord {
  const contentText = row["content_text"];
  const contentBase64 = row["content_base64"];
  const externalUrl = (row["external_url"] as string | null) ?? null;
  const signwellDocumentId = (row["signwell_document_id"] as string | null) ?? null;
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
    hasContent: Boolean(contentText || contentBase64 || externalUrl || signwellDocumentId)
  };
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
        .select("id, document_name, property_id, pm_residents(display_name)")
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
    default:
      return { label: "Organization", propertyId: null };
  }
}

export async function listDocuments(
  supabase: Db,
  organizationId: string,
  filters?: {
    entityType?: DocumentEntityType | "all";
    query?: string;
    propertyId?: string;
  }
): Promise<DocumentRecord[]> {
  let query = supabase
    .from("document_documents")
    .select(
      "id, organization_id, entity_type, entity_id, title, category, source, mime_type, file_name, byte_size, signwell_document_id, external_url, property_id, created_at, content_text, content_base64"
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (filters?.entityType && filters.entityType !== "all") {
    query = query.eq("entity_type", filters.entityType);
  }
  if (filters?.propertyId) {
    query = query.eq("property_id", filters.propertyId);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  const uploaded = (data ?? []).map((row) => mapRow(row as Record<string, unknown>));

  // Reuse lease agreement documents (generated / SignWell / offline) in the same library.
  const { data: leases } = await supabase
    .from("lease_agreements")
    .select(
      "id, document_name, document_body, signing_channel, signwell_document_id, signwell_status, property_id, status, created_at, activated_at, pm_residents(display_name)"
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
      hasContent: Boolean(lease.document_body || lease.signwell_document_id)
    });
  }

  const combined = [...uploaded, ...leaseDocs].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
  );

  const needle = filters?.query?.trim().toLowerCase();
  if (!needle) {
    return combined;
  }
  return combined.filter(
    (doc) =>
      doc.title.toLowerCase().includes(needle) ||
      (doc.entityLabel ?? "").toLowerCase().includes(needle) ||
      doc.category.toLowerCase().includes(needle) ||
      doc.entityType.toLowerCase().includes(needle)
  );
}

export async function getDocumentDetail(
  supabase: Db,
  organizationId: string,
  documentId: string
) {
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
        const remote = await getSignWellDocument(lease.signwell_document_id as string);
        signwellStatus = remote.status;
        const files = (remote as { files?: Array<{ url?: string; name?: string }> }).files;
        externalUrl = files?.find((file) => file.url)?.url ?? null;
      } catch {
        // Keep local lease body when SignWell is unreachable.
      }
    }

    return {
      document: {
        id: documentId,
        organizationId,
        entityType: "lease" as const,
        entityId: lease.id as string,
        title: (lease.document_name as string) || "Lease agreement",
        category: "lease" as const,
        source:
          lease.signing_channel === "signwell"
            ? ("signwell" as const)
            : lease.signing_channel === "offline"
              ? ("offline" as const)
              : ("generated" as const),
        mimeType: "text/plain",
        fileName: `${(lease.document_name as string) || "lease"}.txt`,
        byteSize: String(lease.document_body ?? "").length,
        signwellDocumentId: (lease.signwell_document_id as string | null) ?? null,
        externalUrl,
        propertyId: (lease.property_id as string | null) ?? null,
        entityLabel: signwellStatus,
        createdAt: (lease.activated_at as string | null) ?? (lease.created_at as string),
        hasContent: Boolean(lease.document_body || lease.signwell_document_id)
      },
      contentText: (lease.document_body as string | null) ?? null,
      contentBase64: null as string | null,
      signwellStatus
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
  return {
    document: mapRow(data as Record<string, unknown>),
    contentText: (data.content_text as string | null) ?? null,
    contentBase64: (data.content_base64 as string | null) ?? null,
    signwellStatus: null as string | null
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

  const { data, error } = await supabase
    .from("document_documents")
    .insert({
      organization_id: organizationId,
      entity_type: input.entityType,
      entity_id: input.entityId,
      title: input.title.trim(),
      category,
      source: "upload",
      mime_type: input.mimeType?.trim() || (contentBase64 ? "application/octet-stream" : "text/plain"),
      file_name: input.fileName?.trim() || null,
      content_text: contentText,
      content_base64: contentBase64,
      byte_size: byteSize,
      property_id: resolved.propertyId,
      uploaded_by: actorId
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await emitPropertyEvent({
    supabase,
    organizationId,
    actorId,
    eventType: "document.uploaded",
    aggregateType: "document_documents",
    aggregateId: data.id as string,
    payload: {
      title: data.title,
      entityType: data.entity_type,
      entityId: data.entity_id,
      category: data.category
    }
  });
  await writePropertyAudit({
    supabase,
    organizationId,
    actorId,
    action: "document.uploaded",
    entityType: "document_documents",
    entityId: data.id as string,
    payload: {
      title: data.title,
      entityType: data.entity_type,
      entityId: data.entity_id
    }
  });

  return mapRow(data as Record<string, unknown>, resolved.label);
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
