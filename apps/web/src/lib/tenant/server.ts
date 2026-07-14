import { createAuthServerComponentClient } from "../auth/server";
import type { Database, Json } from "@mpa/supabase";
import type { CreateTenantInput, TenantRecord, UpdateTenantInput } from "./contracts";

type TenantRow = {
  id: string;
  organization_id: string;
  first_name: string;
  last_name: string;
  preferred_name: string | null;
  email: string;
  phone: string | null;
  date_of_birth: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  notes: string | null;
  status: TenantRecord["status"];
  metadata: Json | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  deleted_at: string | null;
};

export type TenantListItem = TenantRecord;

type SupabaseClientType = Awaited<ReturnType<typeof createAuthServerComponentClient>>;
type TenantUpdate = Database["public"]["Tables"]["tenants"]["Update"];

type TenantListOptions = {
  search?: string;
  sortBy?: "updated_at" | "last_name" | "created_at";
  sortOrder?: "asc" | "desc";
  limit?: number;
  offset?: number;
};

export async function getTenantsForOrganization(
  organizationId: string,
  options: TenantListOptions = {},
  client?: SupabaseClientType
): Promise<TenantListItem[]> {
  const supabase = await resolveClient(client);
  let query = supabase
    .from("tenants")
    .select(
      "id, organization_id, first_name, last_name, preferred_name, email, phone, date_of_birth, emergency_contact_name, emergency_contact_phone, notes, status, metadata, created_at, updated_at, archived_at, deleted_at"
    )
    .eq("organization_id", organizationId)
    .is("deleted_at", null);

  const trimmedSearch = options.search?.trim();
  if (trimmedSearch) {
    const escaped = escapeLike(trimmedSearch);
    query = query.or(
      `first_name.ilike.%${escaped}%,last_name.ilike.%${escaped}%,preferred_name.ilike.%${escaped}%,email.ilike.%${escaped}%`
    );
  }

  const sortBy = options.sortBy ?? "updated_at";
  const ascending = (options.sortOrder ?? "desc") === "asc";
  query = query.order(sortBy, { ascending });

  if (options.limit !== undefined) {
    const from = options.offset ?? 0;
    query = query.range(from, from + options.limit - 1);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as TenantRow[]).map(toTenantRecord);
}

export async function getTenantForOrganization(
  organizationId: string,
  tenantId: string,
  client?: SupabaseClientType
): Promise<TenantRecord | null> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("tenants")
    .select(
      "id, organization_id, first_name, last_name, preferred_name, email, phone, date_of_birth, emergency_contact_name, emergency_contact_phone, notes, status, metadata, created_at, updated_at, archived_at, deleted_at"
    )
    .eq("organization_id", organizationId)
    .eq("id", tenantId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? toTenantRecord(data as TenantRow) : null;
}

export async function createTenant(
  organizationId: string,
  userId: string,
  input: CreateTenantInput,
  client?: SupabaseClientType
): Promise<TenantRecord> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("tenants")
    .insert({
      organization_id: organizationId,
      first_name: input.firstName,
      last_name: input.lastName,
      preferred_name: input.preferredName,
      email: input.email,
      phone: input.phone,
      date_of_birth: input.dateOfBirth,
      emergency_contact_name: input.emergencyContactName,
      emergency_contact_phone: input.emergencyContactPhone,
      notes: input.notes,
      status: input.status,
      metadata: input.metadata as Json,
      created_by: userId,
      updated_by: userId
    })
    .select(
      "id, organization_id, first_name, last_name, preferred_name, email, phone, date_of_birth, emergency_contact_name, emergency_contact_phone, notes, status, metadata, created_at, updated_at, archived_at, deleted_at"
    )
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Tenant creation failed");
  }

  return toTenantRecord(data as TenantRow);
}

export async function updateTenant(
  organizationId: string,
  tenantId: string,
  userId: string,
  updates: UpdateTenantInput,
  client?: SupabaseClientType
): Promise<TenantRecord | null> {
  const supabase = await resolveClient(client);
  const patch: TenantUpdate = { updated_by: userId };

  if (updates.firstName !== undefined) patch.first_name = updates.firstName;
  if (updates.lastName !== undefined) patch.last_name = updates.lastName;
  if (updates.preferredName !== undefined) patch.preferred_name = updates.preferredName;
  if (updates.email !== undefined) patch.email = updates.email;
  if (updates.phone !== undefined) patch.phone = updates.phone;
  if (updates.dateOfBirth !== undefined) patch.date_of_birth = updates.dateOfBirth;
  if (updates.emergencyContactName !== undefined) patch.emergency_contact_name = updates.emergencyContactName;
  if (updates.emergencyContactPhone !== undefined) patch.emergency_contact_phone = updates.emergencyContactPhone;
  if (updates.notes !== undefined) patch.notes = updates.notes;
  if (updates.status !== undefined) patch.status = updates.status;
  if (updates.metadata !== undefined) patch.metadata = updates.metadata as Json;

  const { data, error } = await supabase
    .from("tenants")
    .update(patch)
    .eq("organization_id", organizationId)
    .eq("id", tenantId)
    .is("deleted_at", null)
    .select(
      "id, organization_id, first_name, last_name, preferred_name, email, phone, date_of_birth, emergency_contact_name, emergency_contact_phone, notes, status, metadata, created_at, updated_at, archived_at, deleted_at"
    )
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? toTenantRecord(data as TenantRow) : null;
}

export async function archiveTenant(
  organizationId: string,
  tenantId: string,
  userId: string,
  client?: SupabaseClientType
): Promise<TenantRecord | null> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("tenants")
    .update({
      status: "archived",
      archived_at: new Date().toISOString(),
      archived_by: userId,
      updated_by: userId
    })
    .eq("organization_id", organizationId)
    .eq("id", tenantId)
    .is("deleted_at", null)
    .select(
      "id, organization_id, first_name, last_name, preferred_name, email, phone, date_of_birth, emergency_contact_name, emergency_contact_phone, notes, status, metadata, created_at, updated_at, archived_at, deleted_at"
    )
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? toTenantRecord(data as TenantRow) : null;
}

export async function restoreTenant(
  organizationId: string,
  tenantId: string,
  userId: string,
  client?: SupabaseClientType
): Promise<TenantRecord | null> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("tenants")
    .update({
      status: "active",
      archived_at: null,
      archived_by: null,
      deleted_at: null,
      deleted_by: null,
      updated_by: userId
    })
    .eq("organization_id", organizationId)
    .eq("id", tenantId)
    .select(
      "id, organization_id, first_name, last_name, preferred_name, email, phone, date_of_birth, emergency_contact_name, emergency_contact_phone, notes, status, metadata, created_at, updated_at, archived_at, deleted_at"
    )
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? toTenantRecord(data as TenantRow) : null;
}

export async function softDeleteTenant(
  organizationId: string,
  tenantId: string,
  userId: string,
  client?: SupabaseClientType
): Promise<TenantRecord | null> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("tenants")
    .update({
      status: "archived",
      deleted_at: new Date().toISOString(),
      deleted_by: userId,
      updated_by: userId
    })
    .eq("organization_id", organizationId)
    .eq("id", tenantId)
    .is("deleted_at", null)
    .select(
      "id, organization_id, first_name, last_name, preferred_name, email, phone, date_of_birth, emergency_contact_name, emergency_contact_phone, notes, status, metadata, created_at, updated_at, archived_at, deleted_at"
    )
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? toTenantRecord(data as TenantRow) : null;
}

function toTenantRecord(row: TenantRow): TenantRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    firstName: row.first_name,
    lastName: row.last_name,
    preferredName: row.preferred_name,
    email: row.email,
    phone: row.phone,
    dateOfBirth: row.date_of_birth,
    emergencyContactName: row.emergency_contact_name,
    emergencyContactPhone: row.emergency_contact_phone,
    notes: row.notes,
    status: row.status,
    metadata:
      row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
        ? (row.metadata as Record<string, unknown>)
        : {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
    deletedAt: row.deleted_at
  };
}

function escapeLike(value: string): string {
  return value.replaceAll("%", "\\%").replaceAll("_", "\\_");
}

async function resolveClient(client?: SupabaseClientType): Promise<SupabaseClientType> {
  return client ?? (await createAuthServerComponentClient());
}
