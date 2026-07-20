import { createAuthServerComponentClient } from "../auth/server";
import type { Database, Json } from "@mpa/supabase";
import type {
  CreateVaultDocumentInput,
  UpdateVaultDocumentInput,
  VaultDocumentRecord,
  VaultEntityType
} from "./contracts";

type VaultDocumentRow = {
  id: string;
  organization_id: string;
  entity_type: VaultEntityType;
  entity_id: string;
  document_type: string;
  title: string;
  file_url: string | null;
  notes: string | null;
  metadata: Json | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type SupabaseClientType = Awaited<ReturnType<typeof createAuthServerComponentClient>>;
type VaultDocumentUpdate = Database["public"]["Tables"]["vault_documents"]["Update"];

export async function getVaultDocumentsForEntity(
  organizationId: string,
  entityType: VaultEntityType,
  entityId: string,
  client?: SupabaseClientType
): Promise<VaultDocumentRecord[]> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("vault_documents")
    .select(
      "id, organization_id, entity_type, entity_id, document_type, title, file_url, notes, metadata, created_at, updated_at, deleted_at"
    )
    .eq("organization_id", organizationId)
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return ((data ?? []) as VaultDocumentRow[]).map(toVaultDocumentRecord);
}

export type ListOrganizationVaultDocumentsFilters = {
  entityType?: VaultEntityType;
  documentType?: string;
  query?: string;
  limit?: number;
};

export async function listOrganizationVaultDocuments(
  organizationId: string,
  filters: ListOrganizationVaultDocumentsFilters = {},
  client?: SupabaseClientType
): Promise<VaultDocumentRecord[]> {
  const supabase = await resolveClient(client);
  const limit = Math.min(Math.max(filters.limit ?? 200, 1), 500);

  let query = supabase
    .from("vault_documents")
    .select(
      "id, organization_id, entity_type, entity_id, document_type, title, file_url, notes, metadata, created_at, updated_at, deleted_at"
    )
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (filters.entityType) {
    query = query.eq("entity_type", filters.entityType);
  }
  if (filters.documentType?.trim()) {
    query = query.ilike("document_type", `%${filters.documentType.trim()}%`);
  }
  if (filters.query?.trim()) {
    const q = filters.query.trim();
    query = query.or(`title.ilike.%${q}%,document_type.ilike.%${q}%,notes.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return ((data ?? []) as VaultDocumentRow[]).map(toVaultDocumentRecord);
}

export async function createVaultDocument(
  organizationId: string,
  userId: string,
  input: CreateVaultDocumentInput,
  client?: SupabaseClientType
): Promise<VaultDocumentRecord> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("vault_documents")
    .insert({
      organization_id: organizationId,
      entity_type: input.entityType,
      entity_id: input.entityId,
      document_type: input.documentType,
      title: input.title,
      file_url: input.fileUrl ?? null,
      notes: input.notes ?? null,
      metadata: (input.metadata ?? {}) as Json,
      created_by: userId,
      updated_by: userId
    })
    .select(
      "id, organization_id, entity_type, entity_id, document_type, title, file_url, notes, metadata, created_at, updated_at, deleted_at"
    )
    .single();

  if (error || !data) throw new Error(error?.message ?? "Document creation failed");
  return toVaultDocumentRecord(data as VaultDocumentRow);
}

export async function updateVaultDocument(
  organizationId: string,
  documentId: string,
  userId: string,
  updates: UpdateVaultDocumentInput,
  client?: SupabaseClientType
): Promise<VaultDocumentRecord | null> {
  const supabase = await resolveClient(client);
  const patch: VaultDocumentUpdate = { updated_by: userId };
  if (updates.documentType !== undefined) patch.document_type = updates.documentType;
  if (updates.title !== undefined) patch.title = updates.title;
  if (updates.fileUrl !== undefined) patch.file_url = updates.fileUrl;
  if (updates.notes !== undefined) patch.notes = updates.notes;
  if (updates.metadata !== undefined) patch.metadata = updates.metadata as Json;

  const { data, error } = await supabase
    .from("vault_documents")
    .update(patch)
    .eq("organization_id", organizationId)
    .eq("id", documentId)
    .is("deleted_at", null)
    .select(
      "id, organization_id, entity_type, entity_id, document_type, title, file_url, notes, metadata, created_at, updated_at, deleted_at"
    )
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? toVaultDocumentRecord(data as VaultDocumentRow) : null;
}

export async function transferVaultDocuments(
  organizationId: string,
  fromEntityType: VaultEntityType,
  fromEntityId: string,
  toEntityType: VaultEntityType,
  toEntityId: string,
  userId: string,
  client?: SupabaseClientType
): Promise<number> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("vault_documents")
    .update({
      entity_type: toEntityType,
      entity_id: toEntityId,
      updated_by: userId
    })
    .eq("organization_id", organizationId)
    .eq("entity_type", fromEntityType)
    .eq("entity_id", fromEntityId)
    .is("deleted_at", null)
    .select("id");

  if (error) throw new Error(error.message);
  return data?.length ?? 0;
}

function toVaultDocumentRecord(row: VaultDocumentRow): VaultDocumentRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    documentType: row.document_type,
    title: row.title,
    fileUrl: row.file_url,
    notes: row.notes,
    metadata:
      row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
        ? (row.metadata as Record<string, unknown>)
        : {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at
  };
}

async function resolveClient(client?: SupabaseClientType): Promise<SupabaseClientType> {
  return client ?? (await createAuthServerComponentClient());
}
