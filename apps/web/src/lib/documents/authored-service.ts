import type { SupabaseClient } from "@supabase/supabase-js";
import {
  flattenAuthoredBody,
  getAuthoredTemplate,
  isAuthoredTemplateId,
  isDocumentCategory,
  isDocumentEntityType,
  parseAuthoredBody,
  type AuthoredBody,
  type AuthoredTemplateId,
  type DocumentCategory,
  type DocumentEntityType
} from "@mpa/shared";
import { emitPropertyEvent, writePropertyAudit } from "../property/events-audit";
import { getDocumentDetail, type DocumentDetail } from "./document-service";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any>;

async function snapshotVersion(
  supabase: Db,
  organizationId: string,
  documentId: string,
  actorId: string,
  input: {
    versionNumber: number;
    title: string;
    contentText: string;
    bodyJson: AuthoredBody;
    notes?: string | null;
  }
) {
  await supabase.from("document_document_versions").insert({
    organization_id: organizationId,
    document_id: documentId,
    version_number: input.versionNumber,
    title: input.title,
    mime_type: "application/json",
    file_name: `${input.title}.json`,
    content_text: input.contentText,
    body_json: input.bodyJson,
    byte_size: new TextEncoder().encode(input.contentText).length,
    notes: input.notes ?? "Authored checkpoint",
    created_by: actorId
  });
}

export async function createAuthoredDocument(
  supabase: Db,
  organizationId: string,
  actorId: string,
  input: {
    title?: string;
    templateId?: string;
    entityType?: string;
    entityId?: string;
    category?: string;
  }
): Promise<DocumentDetail> {
  const templateId: AuthoredTemplateId = isAuthoredTemplateId(input.templateId)
    ? input.templateId
    : "blank";
  const template = getAuthoredTemplate(templateId);
  const body = template.body;
  const contentText = flattenAuthoredBody(body);
  const title = input.title?.trim() || template.title;
  const entityType: DocumentEntityType =
    input.entityType && isDocumentEntityType(input.entityType) ? input.entityType : "organization";
  const entityId = input.entityId?.trim() || organizationId;
  const category: DocumentCategory =
    input.category && isDocumentCategory(input.category) ? input.category : template.category;

  const { data, error } = await supabase
    .from("document_documents")
    .insert({
      organization_id: organizationId,
      entity_type: entityType,
      entity_id: entityId,
      title,
      category,
      source: "generated",
      mime_type: "application/json",
      file_name: `${title}.json`,
      content_text: contentText,
      body_json: body,
      byte_size: new TextEncoder().encode(contentText).length,
      uploaded_by: actorId,
      tags: ["authored"],
      status: "draft",
      version_number: 1,
      kind: "authored",
      template_id: templateId === "blank" ? null : templateId
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create authored document");
  }

  const documentId = data.id as string;
  await snapshotVersion(supabase, organizationId, documentId, actorId, {
    versionNumber: 1,
    title,
    contentText,
    bodyJson: body,
    notes: templateId === "blank" ? "Created" : `Created from ${template.title}`
  });

  await emitPropertyEvent({
    supabase,
    organizationId,
    actorId,
    eventType: "document.created",
    aggregateType: "document_documents",
    aggregateId: documentId,
    payload: { title, kind: "authored", templateId }
  });
  await writePropertyAudit({
    supabase,
    organizationId,
    actorId,
    action: "document.created",
    entityType: "document_documents",
    entityId: documentId,
    payload: { title, kind: "authored", templateId }
  });

  const detail = await getDocumentDetail(supabase, organizationId, documentId);
  if (!detail) {
    throw new Error("Failed to load authored document");
  }
  return detail;
}

export async function updateAuthoredDocument(
  supabase: Db,
  organizationId: string,
  actorId: string,
  documentId: string,
  input: {
    title?: string;
    bodyJson?: unknown;
    category?: string;
    checkpoint?: boolean;
  }
): Promise<DocumentDetail> {
  const { data: existing, error: loadError } = await supabase
    .from("document_documents")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", documentId)
    .maybeSingle();
  if (loadError) throw new Error(loadError.message);
  if (!existing || existing.deleted_at) {
    throw new Error("Document not found");
  }
  if (existing.kind !== "authored") {
    throw new Error("Only authored documents can be edited in the workspace editor");
  }

  const body = input.bodyJson !== undefined ? parseAuthoredBody(input.bodyJson) : parseAuthoredBody(existing.body_json);
  if (input.bodyJson !== undefined && !body) {
    throw new Error("Invalid authored document body");
  }
  const nextBody = body ?? parseAuthoredBody(existing.body_json);
  if (!nextBody) {
    throw new Error("Invalid authored document body");
  }
  const title = input.title?.trim() || (existing.title as string);
  const contentText = flattenAuthoredBody(nextBody);
  const category =
    input.category && isDocumentCategory(input.category) ? input.category : (existing.category as string);
  const nextVersion = Number(existing.version_number ?? 1) + (input.checkpoint ? 1 : 0);

  const { error } = await supabase
    .from("document_documents")
    .update({
      title,
      category,
      body_json: nextBody,
      content_text: contentText,
      byte_size: new TextEncoder().encode(contentText).length,
      version_number: input.checkpoint ? nextVersion : existing.version_number,
      status: "active",
      updated_at: new Date().toISOString()
    })
    .eq("organization_id", organizationId)
    .eq("id", documentId)
    .is("deleted_at", null);
  if (error) throw new Error(error.message);

  if (input.checkpoint) {
    await snapshotVersion(supabase, organizationId, documentId, actorId, {
      versionNumber: nextVersion,
      title,
      contentText,
      bodyJson: nextBody,
      notes: "Checkpoint"
    });
  }

  await emitPropertyEvent({
    supabase,
    organizationId,
    actorId,
    eventType: "document.updated",
    aggregateType: "document_documents",
    aggregateId: documentId,
    payload: { title, checkpoint: Boolean(input.checkpoint) }
  });
  await writePropertyAudit({
    supabase,
    organizationId,
    actorId,
    action: "document.updated",
    entityType: "document_documents",
    entityId: documentId,
    payload: { title, checkpoint: Boolean(input.checkpoint) }
  });

  const detail = await getDocumentDetail(supabase, organizationId, documentId);
  if (!detail) throw new Error("Document not found");
  return detail;
}

export async function softDeleteDocument(
  supabase: Db,
  organizationId: string,
  actorId: string,
  documentId: string
) {
  const { data, error } = await supabase
    .from("document_documents")
    .update({ deleted_at: new Date().toISOString(), status: "archived" })
    .eq("organization_id", organizationId)
    .eq("id", documentId)
    .is("deleted_at", null)
    .select("id, title, kind")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Document not found");

  await writePropertyAudit({
    supabase,
    organizationId,
    actorId,
    action: "document.updated",
    entityType: "document_documents",
    entityId: documentId,
    payload: { title: data.title, deleted: true }
  });
  return { id: data.id as string, deleted: true };
}

export async function restoreDocument(
  supabase: Db,
  organizationId: string,
  actorId: string,
  documentId: string
) {
  const { data, error } = await supabase
    .from("document_documents")
    .update({ deleted_at: null, status: "active" })
    .eq("organization_id", organizationId)
    .eq("id", documentId)
    .select("id, title")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Document not found");

  await writePropertyAudit({
    supabase,
    organizationId,
    actorId,
    action: "document.updated",
    entityType: "document_documents",
    entityId: documentId,
    payload: { title: data.title, restored: true }
  });
  const detail = await getDocumentDetail(supabase, organizationId, documentId);
  if (!detail) throw new Error("Document not found");
  return detail;
}

export async function auditDocumentExport(
  supabase: Db,
  organizationId: string,
  actorId: string,
  documentId: string,
  format: "pdf"
) {
  await emitPropertyEvent({
    supabase,
    organizationId,
    actorId,
    eventType: "document.exported",
    aggregateType: "document_documents",
    aggregateId: documentId,
    payload: { format }
  });
  await writePropertyAudit({
    supabase,
    organizationId,
    actorId,
    action: "document.exported",
    entityType: "document_documents",
    entityId: documentId,
    payload: { format }
  });
}
