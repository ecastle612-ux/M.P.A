import { createAuthServerComponentClient } from "../auth/server";
import type { Database, Json } from "@mpa/supabase";
import type { CreateUnitInput, UnitRecord, UpdateUnitInput } from "./contracts";

type UnitRow = {
  id: string;
  organization_id: string;
  property_id: string;
  unit_number: string;
  unit_label: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
  floor: string | null;
  rent_amount: number | null;
  deposit_amount: number | null;
  currency_code: string;
  occupancy_status: UnitRecord["occupancyStatus"];
  status: UnitRecord["status"];
  metadata: Json | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  deleted_at: string | null;
};

export type UnitListItem = UnitRecord & {
  propertyName: string | null;
  assignedTenantName: string | null;
};

type SupabaseClientType = Awaited<ReturnType<typeof createAuthServerComponentClient>>;
type UnitUpdate = Database["public"]["Tables"]["units"]["Update"];
type PaginationOptions = {
  limit?: number;
  offset?: number;
};

export async function getUnitsForOrganization(
  organizationId: string,
  propertyId: string | null = null,
  client?: SupabaseClientType,
  pagination?: PaginationOptions
): Promise<UnitListItem[]> {
  const supabase = await resolveClient(client);
  let query = supabase
    .from("units")
    .select(
      "id, organization_id, property_id, unit_number, unit_label, bedrooms, bathrooms, square_feet, floor, rent_amount, deposit_amount, currency_code, occupancy_status, status, metadata, created_at, updated_at, archived_at, deleted_at, properties(name)"
    )
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (propertyId) {
    query = query.eq("property_id", propertyId);
  }

  if (pagination?.limit !== undefined) {
    const from = pagination.offset ?? 0;
    query = query.range(from, from + pagination.limit - 1);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as Array<UnitRow & { properties: { name: string } | null }>;
  const assignedTenants = await getAssignedTenantNamesByUnitId(
    organizationId,
    rows.map((row) => row.id),
    supabase
  );
  return rows.map((row) => ({
    ...toUnitRecord(row),
    propertyName: row.properties?.name ?? null,
    assignedTenantName: assignedTenants.get(row.id) ?? null
  }));
}

export async function getUnitForOrganization(
  organizationId: string,
  unitId: string,
  client?: SupabaseClientType
): Promise<UnitRecord | null> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("units")
    .select(
      "id, organization_id, property_id, unit_number, unit_label, bedrooms, bathrooms, square_feet, floor, rent_amount, deposit_amount, currency_code, occupancy_status, status, metadata, created_at, updated_at, archived_at, deleted_at"
    )
    .eq("organization_id", organizationId)
    .eq("id", unitId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return data ? toUnitRecord(data as UnitRow) : null;
}

export async function createUnit(
  organizationId: string,
  userId: string,
  input: CreateUnitInput,
  client?: SupabaseClientType
): Promise<UnitRecord> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("units")
    .insert({
      organization_id: organizationId,
      property_id: input.propertyId,
      unit_number: input.unitNumber,
      unit_label: input.unitLabel,
      bedrooms: input.bedrooms,
      bathrooms: input.bathrooms,
      square_feet: input.squareFeet,
      floor: input.floor,
      rent_amount: input.rentAmount,
      deposit_amount: input.depositAmount,
      currency_code: input.currencyCode,
      occupancy_status: input.occupancyStatus,
      status: input.status,
      metadata: input.metadata as Json,
      created_by: userId,
      updated_by: userId
    })
    .select(
      "id, organization_id, property_id, unit_number, unit_label, bedrooms, bathrooms, square_feet, floor, rent_amount, deposit_amount, currency_code, occupancy_status, status, metadata, created_at, updated_at, archived_at, deleted_at"
    )
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? "Unit creation failed");
  }
  return toUnitRecord(data as UnitRow);
}

export async function createUnitsBulk(
  organizationId: string,
  userId: string,
  inputs: CreateUnitInput[],
  client?: SupabaseClientType
): Promise<UnitRecord[]> {
  if (inputs.length === 0) {
    return [];
  }
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("units")
    .insert(
      inputs.map((input) => ({
        organization_id: organizationId,
        property_id: input.propertyId,
        unit_number: input.unitNumber,
        unit_label: input.unitLabel,
        bedrooms: input.bedrooms,
        bathrooms: input.bathrooms,
        square_feet: input.squareFeet,
        floor: input.floor,
        rent_amount: input.rentAmount,
        deposit_amount: input.depositAmount,
        currency_code: input.currencyCode,
        occupancy_status: input.occupancyStatus,
        status: input.status,
        metadata: input.metadata as Json,
        created_by: userId,
        updated_by: userId
      }))
    )
    .select(
      "id, organization_id, property_id, unit_number, unit_label, bedrooms, bathrooms, square_feet, floor, rent_amount, deposit_amount, currency_code, occupancy_status, status, metadata, created_at, updated_at, archived_at, deleted_at"
    );
  if (error || !data) {
    throw new Error(error?.message ?? "Bulk unit creation failed");
  }
  return (data as UnitRow[]).map(toUnitRecord);
}

export async function updateUnit(
  organizationId: string,
  unitId: string,
  userId: string,
  updates: UpdateUnitInput,
  client?: SupabaseClientType
): Promise<UnitRecord | null> {
  const supabase = await resolveClient(client);
  const patch: UnitUpdate = { updated_by: userId };
  if (updates.propertyId !== undefined) patch.property_id = updates.propertyId;
  if (updates.unitNumber !== undefined) patch.unit_number = updates.unitNumber;
  if (updates.unitLabel !== undefined) patch.unit_label = updates.unitLabel;
  if (updates.bedrooms !== undefined) patch.bedrooms = updates.bedrooms;
  if (updates.bathrooms !== undefined) patch.bathrooms = updates.bathrooms;
  if (updates.squareFeet !== undefined) patch.square_feet = updates.squareFeet;
  if (updates.floor !== undefined) patch.floor = updates.floor;
  if (updates.rentAmount !== undefined) patch.rent_amount = updates.rentAmount;
  if (updates.depositAmount !== undefined) patch.deposit_amount = updates.depositAmount;
  if (updates.currencyCode !== undefined) patch.currency_code = updates.currencyCode;
  if (updates.occupancyStatus !== undefined) patch.occupancy_status = updates.occupancyStatus;
  if (updates.status !== undefined) patch.status = updates.status;
  if (updates.metadata !== undefined) patch.metadata = updates.metadata as Json;

  const { data, error } = await supabase
    .from("units")
    .update(patch)
    .eq("organization_id", organizationId)
    .eq("id", unitId)
    .is("deleted_at", null)
    .select(
      "id, organization_id, property_id, unit_number, unit_label, bedrooms, bathrooms, square_feet, floor, rent_amount, deposit_amount, currency_code, occupancy_status, status, metadata, created_at, updated_at, archived_at, deleted_at"
    )
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  return data ? toUnitRecord(data as UnitRow) : null;
}

export async function archiveUnit(
  organizationId: string,
  unitId: string,
  userId: string,
  client?: SupabaseClientType
): Promise<UnitRecord | null> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("units")
    .update({
      status: "archived",
      archived_at: new Date().toISOString(),
      archived_by: userId,
      updated_by: userId
    })
    .eq("organization_id", organizationId)
    .eq("id", unitId)
    .is("deleted_at", null)
    .select(
      "id, organization_id, property_id, unit_number, unit_label, bedrooms, bathrooms, square_feet, floor, rent_amount, deposit_amount, currency_code, occupancy_status, status, metadata, created_at, updated_at, archived_at, deleted_at"
    )
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  return data ? toUnitRecord(data as UnitRow) : null;
}

export async function softDeleteUnit(
  organizationId: string,
  unitId: string,
  userId: string,
  client?: SupabaseClientType
): Promise<UnitRecord | null> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("units")
    .update({
      status: "archived",
      deleted_at: new Date().toISOString(),
      deleted_by: userId,
      updated_by: userId
    })
    .eq("organization_id", organizationId)
    .eq("id", unitId)
    .is("deleted_at", null)
    .select(
      "id, organization_id, property_id, unit_number, unit_label, bedrooms, bathrooms, square_feet, floor, rent_amount, deposit_amount, currency_code, occupancy_status, status, metadata, created_at, updated_at, archived_at, deleted_at"
    )
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return data ? toUnitRecord(data as UnitRow) : null;
}

export async function restoreUnit(
  organizationId: string,
  unitId: string,
  userId: string,
  client?: SupabaseClientType
): Promise<UnitRecord | null> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("units")
    .update({
      status: "active",
      archived_at: null,
      archived_by: null,
      deleted_at: null,
      deleted_by: null,
      updated_by: userId
    })
    .eq("organization_id", organizationId)
    .eq("id", unitId)
    .select(
      "id, organization_id, property_id, unit_number, unit_label, bedrooms, bathrooms, square_feet, floor, rent_amount, deposit_amount, currency_code, occupancy_status, status, metadata, created_at, updated_at, archived_at, deleted_at"
    )
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return data ? toUnitRecord(data as UnitRow) : null;
}

function toUnitRecord(row: UnitRow): UnitRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    propertyId: row.property_id,
    unitNumber: row.unit_number,
    unitLabel: row.unit_label,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    squareFeet: row.square_feet,
    floor: row.floor,
    rentAmount: row.rent_amount,
    depositAmount: row.deposit_amount,
    currencyCode: row.currency_code,
    occupancyStatus: row.occupancy_status,
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

async function resolveClient(client?: SupabaseClientType): Promise<SupabaseClientType> {
  return client ?? (await createAuthServerComponentClient());
}

async function getAssignedTenantNamesByUnitId(
  organizationId: string,
  unitIds: string[],
  client?: SupabaseClientType
): Promise<Map<string, string>> {
  if (unitIds.length === 0) {
    return new Map();
  }
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("tenants")
    .select("unit_id, first_name, last_name, preferred_name, status")
    .eq("organization_id", organizationId)
    .in("unit_id", unitIds)
    .is("deleted_at", null);

  if (error) {
    throw new Error(error.message);
  }

  const assigned = new Map<string, string>();
  ((data ?? []) as Array<{
    unit_id: string | null;
    first_name: string;
    last_name: string;
    preferred_name: string | null;
    status: string;
  }>).forEach((tenant) => {
    if (!tenant.unit_id) return;
    if (tenant.status !== "active") return;
    if (assigned.has(tenant.unit_id)) return;
    assigned.set(tenant.unit_id, tenant.preferred_name || `${tenant.first_name} ${tenant.last_name}`);
  });
  return assigned;
}
