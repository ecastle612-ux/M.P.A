import { createAuthServerComponentClient } from "../auth/server";
import type { Database, Json } from "@mpa/supabase";
import type { CreateTenantInput, TenantRecord, UpdateTenantInput } from "./contracts";

const TENANT_SELECT =
  "id, organization_id, property_id, unit_id, first_name, last_name, preferred_name, email, avatar_url, phone, date_of_birth, move_in_date, move_out_date, documents_placeholder, emergency_contact_name, emergency_contact_phone, notes, status, lifecycle_status, metadata, created_at, updated_at, archived_at, deleted_at, user_id";

const TENANT_LIST_SELECT = `${TENANT_SELECT}, properties(name), units(unit_number, property_id)`;

type TenantRow = {
  id: string;
  organization_id: string;
  property_id: string | null;
  unit_id: string | null;
  first_name: string;
  last_name: string;
  preferred_name: string | null;
  email: string;
  avatar_url: string | null;
  phone: string | null;
  date_of_birth: string | null;
  move_in_date: string | null;
  move_out_date: string | null;
  documents_placeholder: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  notes: string | null;
  status: TenantRecord["status"];
  lifecycle_status: TenantRecord["lifecycleStatus"];
  metadata: Json | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  deleted_at: string | null;
  user_id?: string | null;
};

type TenantRelationRow = TenantRow & {
  properties: { name: string } | null;
  units: { unit_number: string; property_id: string } | null;
};

export type TenantListItem = TenantRecord & {
  propertyName: string | null;
  unitNumber: string | null;
};

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
    .select(TENANT_LIST_SELECT)
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

  return ((data ?? []) as TenantRelationRow[]).map(toTenantListItem);
}

export async function getTenantForOrganization(
  organizationId: string,
  tenantId: string,
  client?: SupabaseClientType
): Promise<TenantListItem | null> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("tenants")
    .select(TENANT_LIST_SELECT)
    .eq("organization_id", organizationId)
    .eq("id", tenantId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? toTenantListItem(data as TenantRelationRow) : null;
}

export async function createTenant(
  organizationId: string,
  userId: string,
  input: CreateTenantInput,
  client?: SupabaseClientType
): Promise<TenantRecord> {
  const supabase = await resolveClient(client);
  if (input.moveInDate && input.moveOutDate && input.moveOutDate < input.moveInDate) {
    throw new Error("Move-out date must be on or after move-in date.");
  }
  await assertTenantAssignment({
    organizationId,
    propertyId: input.propertyId,
    unitId: input.unitId,
    client: supabase
  });

  const metadata = {
    ...input.metadata,
    ...(input.avatarMediaAssetId ? { avatarMediaAssetId: input.avatarMediaAssetId } : {})
  };
  if (!input.avatarMediaAssetId && "avatarMediaAssetId" in metadata) {
    delete (metadata as Record<string, unknown>)["avatarMediaAssetId"];
  }

  const { data, error } = await supabase
    .from("tenants")
    .insert({
      organization_id: organizationId,
      property_id: input.propertyId,
      unit_id: input.unitId,
      first_name: input.firstName,
      last_name: input.lastName,
      preferred_name: input.preferredName,
      email: input.email,
      avatar_url: null,
      phone: input.phone,
      date_of_birth: input.dateOfBirth,
      move_in_date: input.moveInDate,
      move_out_date: input.moveOutDate,
      documents_placeholder: input.documentsPlaceholder,
      emergency_contact_name: input.emergencyContactName,
      emergency_contact_phone: input.emergencyContactPhone,
      notes: input.notes,
      status: input.status,
      lifecycle_status: input.lifecycleStatus ?? "awaiting_move_in",
      metadata: metadata as Json,
      created_by: userId,
      updated_by: userId
    })
    .select(TENANT_SELECT)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Tenant creation failed");
  }

  await syncUnitOccupancyForTenantChange({
    organizationId,
    previousUnitId: null,
    nextUnitId: input.unitId,
    actorUserId: userId,
    client: supabase
  });

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
  const { data: existing, error: existingError } = await supabase
    .from("tenants")
    .select("id, property_id, unit_id, move_in_date, move_out_date, metadata")
    .eq("organization_id", organizationId)
    .eq("id", tenantId)
    .is("deleted_at", null)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }
  if (!existing) {
    return null;
  }

  const nextPropertyId = updates.propertyId !== undefined ? updates.propertyId : existing.property_id;
  const nextUnitId = updates.unitId !== undefined ? updates.unitId : existing.unit_id;
  const nextMoveInDate = updates.moveInDate !== undefined ? updates.moveInDate : existing.move_in_date;
  const nextMoveOutDate = updates.moveOutDate !== undefined ? updates.moveOutDate : existing.move_out_date;
  if (nextMoveInDate && nextMoveOutDate && nextMoveOutDate < nextMoveInDate) {
    throw new Error("Move-out date must be on or after move-in date.");
  }
  await assertTenantAssignment({
    organizationId,
    propertyId: nextPropertyId,
    unitId: nextUnitId,
    client: supabase
  });

  const patch: TenantUpdate = { updated_by: userId };

  if (updates.propertyId !== undefined) patch.property_id = updates.propertyId;
  if (updates.unitId !== undefined) patch.unit_id = updates.unitId;
  if (updates.firstName !== undefined) patch.first_name = updates.firstName;
  if (updates.lastName !== undefined) patch.last_name = updates.lastName;
  if (updates.preferredName !== undefined) patch.preferred_name = updates.preferredName;
  if (updates.email !== undefined) patch.email = updates.email;
  if (updates.avatarUrl !== undefined) patch.avatar_url = updates.avatarUrl;
  if (updates.phone !== undefined) patch.phone = updates.phone;
  if (updates.dateOfBirth !== undefined) patch.date_of_birth = updates.dateOfBirth;
  if (updates.moveInDate !== undefined) patch.move_in_date = updates.moveInDate;
  if (updates.moveOutDate !== undefined) patch.move_out_date = updates.moveOutDate;
  if (updates.documentsPlaceholder !== undefined) patch.documents_placeholder = updates.documentsPlaceholder;
  if (updates.emergencyContactName !== undefined) patch.emergency_contact_name = updates.emergencyContactName;
  if (updates.emergencyContactPhone !== undefined) patch.emergency_contact_phone = updates.emergencyContactPhone;
  if (updates.notes !== undefined) patch.notes = updates.notes;
  if (updates.status !== undefined) patch.status = updates.status;
  if (updates.lifecycleStatus !== undefined) patch.lifecycle_status = updates.lifecycleStatus;

  if (updates.avatarMediaAssetId !== undefined || updates.metadata !== undefined) {
    const existingMeta =
      existing.metadata && typeof existing.metadata === "object" && !Array.isArray(existing.metadata)
        ? (existing.metadata as Record<string, unknown>)
        : {};
    const nextMeta: Record<string, unknown> = {
      ...existingMeta,
      ...(updates.metadata ?? {})
    };
    if (updates.avatarMediaAssetId) {
      nextMeta["avatarMediaAssetId"] = updates.avatarMediaAssetId;
      patch.avatar_url = null;
    } else if (updates.avatarMediaAssetId === null) {
      delete nextMeta["avatarMediaAssetId"];
      patch.avatar_url = null;
    }
    patch.metadata = nextMeta as Json;
  }

  const { data, error } = await supabase
    .from("tenants")
    .update(patch)
    .eq("organization_id", organizationId)
    .eq("id", tenantId)
    .is("deleted_at", null)
    .select(TENANT_SELECT)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const updated = data ? toTenantRecord(data as TenantRow) : null;
  await syncUnitOccupancyForTenantChange({
    organizationId,
    previousUnitId: existing.unit_id,
    nextUnitId: updated?.unitId ?? nextUnitId,
    actorUserId: userId,
    client: supabase
  });

  return updated;
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
      lifecycle_status: "former",
      archived_at: new Date().toISOString(),
      archived_by: userId,
      updated_by: userId
    })
    .eq("organization_id", organizationId)
    .eq("id", tenantId)
    .is("deleted_at", null)
    .select(TENANT_SELECT)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const updated = data ? toTenantRecord(data as TenantRow) : null;
  await syncUnitOccupancyForTenantChange({
    organizationId,
    previousUnitId: updated?.unitId ?? null,
    nextUnitId: null,
    actorUserId: userId,
    client: supabase
  });
  return updated;
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
      lifecycle_status: "active",
      archived_at: null,
      archived_by: null,
      deleted_at: null,
      deleted_by: null,
      move_out_date: null,
      updated_by: userId
    })
    .eq("organization_id", organizationId)
    .eq("id", tenantId)
    .select(TENANT_SELECT)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const updated = data ? toTenantRecord(data as TenantRow) : null;
  await syncUnitOccupancyForTenantChange({
    organizationId,
    previousUnitId: null,
    nextUnitId: updated?.unitId ?? null,
    actorUserId: userId,
    client: supabase
  });
  return updated;
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
      lifecycle_status: "former",
      deleted_at: new Date().toISOString(),
      deleted_by: userId,
      updated_by: userId
    })
    .eq("organization_id", organizationId)
    .eq("id", tenantId)
    .is("deleted_at", null)
    .select(TENANT_SELECT)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const updated = data ? toTenantRecord(data as TenantRow) : null;
  await syncUnitOccupancyForTenantChange({
    organizationId,
    previousUnitId: updated?.unitId ?? null,
    nextUnitId: null,
    actorUserId: userId,
    client: supabase
  });
  return updated;
}

function readAvatarMediaAssetId(metadata: Json | null): string | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const value = (metadata as Record<string, unknown>)["avatarMediaAssetId"];
  return typeof value === "string" && value.length > 0 ? value : null;
}

function toTenantRecord(row: TenantRow): TenantRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    propertyId: row.property_id,
    unitId: row.unit_id,
    firstName: row.first_name,
    lastName: row.last_name,
    preferredName: row.preferred_name,
    email: row.email,
    avatarUrl: row.avatar_url,
    avatarMediaAssetId: readAvatarMediaAssetId(row.metadata),
    phone: row.phone,
    dateOfBirth: row.date_of_birth,
    moveInDate: row.move_in_date,
    moveOutDate: row.move_out_date,
    documentsPlaceholder: row.documents_placeholder,
    emergencyContactName: row.emergency_contact_name,
    emergencyContactPhone: row.emergency_contact_phone,
    notes: row.notes,
    status: row.status,
    lifecycleStatus: row.lifecycle_status ?? "awaiting_move_in",
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

function toTenantListItem(row: TenantRelationRow): TenantListItem {
  return {
    ...toTenantRecord(row),
    propertyName: row.properties?.name ?? null,
    unitNumber: row.units?.unit_number ?? null
  };
}

async function assertTenantAssignment({
  organizationId,
  propertyId,
  unitId,
  client
}: {
  organizationId: string;
  propertyId: string | null;
  unitId: string | null;
  client: SupabaseClientType;
}) {
  if (unitId && !propertyId) {
    throw new Error("A property must be selected when assigning a unit.");
  }

  if (propertyId) {
    const { data: property, error: propertyError } = await client
      .from("properties")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("id", propertyId)
      .is("deleted_at", null)
      .maybeSingle();
    if (propertyError) {
      throw new Error(propertyError.message);
    }
    if (!property) {
      throw new Error("Selected property is not available in this organization.");
    }
  }

  if (unitId) {
    const { data: unit, error: unitError } = await client
      .from("units")
      .select("id, property_id")
      .eq("organization_id", organizationId)
      .eq("id", unitId)
      .is("deleted_at", null)
      .maybeSingle();
    if (unitError) {
      throw new Error(unitError.message);
    }
    if (!unit) {
      throw new Error("Selected unit is not available in this organization.");
    }
    if (propertyId && unit.property_id !== propertyId) {
      throw new Error("Selected unit does not belong to the selected property.");
    }
  }
}

function escapeLike(value: string): string {
  return value.replaceAll("%", "\\%").replaceAll("_", "\\_");
}

async function syncUnitOccupancyForTenantChange({
  organizationId,
  previousUnitId,
  nextUnitId,
  actorUserId,
  client
}: {
  organizationId: string;
  previousUnitId: string | null;
  nextUnitId: string | null;
  actorUserId: string;
  client: SupabaseClientType;
}) {
  const unitIds = Array.from(new Set([previousUnitId, nextUnitId].filter((value): value is string => Boolean(value))));
  if (unitIds.length === 0) {
    return;
  }

  for (const unitId of unitIds) {
    const [{ count: activeTenantCount, error: activeTenantCountError }, { data: unit, error: unitError }] =
      await Promise.all([
        client
          .from("tenants")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", organizationId)
          .eq("unit_id", unitId)
          .is("deleted_at", null)
          .eq("status", "active"),
        client
          .from("units")
          .select("id, occupancy_status")
          .eq("organization_id", organizationId)
          .eq("id", unitId)
          .is("deleted_at", null)
          .maybeSingle()
      ]);

    if (activeTenantCountError) {
      throw new Error(activeTenantCountError.message);
    }
    if (unitError) {
      throw new Error(unitError.message);
    }
    if (!unit) {
      continue;
    }

    const hasActiveTenant = (activeTenantCount ?? 0) > 0;
    const nextOccupancyStatus = hasActiveTenant
      ? "occupied"
      : unit.occupancy_status === "occupied"
        ? "vacant_ready"
        : unit.occupancy_status;

    if (nextOccupancyStatus !== unit.occupancy_status) {
      const { error: updateError } = await client
        .from("units")
        .update({
          occupancy_status: nextOccupancyStatus,
          updated_by: actorUserId
        })
        .eq("organization_id", organizationId)
        .eq("id", unitId)
        .is("deleted_at", null);
      if (updateError) {
        throw new Error(updateError.message);
      }
    }
  }
}

async function resolveClient(client?: SupabaseClientType): Promise<SupabaseClientType> {
  return client ?? (await createAuthServerComponentClient());
}
