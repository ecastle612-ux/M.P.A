import { createAuthServerComponentClient } from "../auth/server";
import type { Database, Json } from "@mpa/supabase";
import type { CreatePropertyInput, PropertyRecord, UpdatePropertyInput } from "./contracts";

type PropertyRow = {
  id: string;
  organization_id: string;
  name: string;
  code: string | null;
  property_type: PropertyRecord["propertyType"];
  status: PropertyRecord["status"];
  description: string | null;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  state_region: string;
  postal_code: string;
  country_code: string;
  timezone: string | null;
  latitude: number | null;
  longitude: number | null;
  ownership_entity_name: string | null;
  owner_contact_name: string | null;
  owner_contact_email: string | null;
  owner_contact_phone: string | null;
  cover_image_url: string | null;
  metadata: Json | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  deleted_at: string | null;
};

export type PropertyListItem = PropertyRecord & {
  unitCount: number;
};

type SupabaseClientType = Awaited<ReturnType<typeof createAuthServerComponentClient>>;
type PropertyUpdate = Database["public"]["Tables"]["properties"]["Update"];
type PaginationOptions = {
  limit?: number;
  offset?: number;
};

export async function getPropertiesForOrganization(
  organizationId: string,
  client?: SupabaseClientType,
  pagination?: PaginationOptions
): Promise<PropertyListItem[]> {
  const supabase = await resolveClient(client);
  let query = supabase
    .from("properties")
    .select(
      "id, organization_id, name, code, property_type, status, description, address_line_1, address_line_2, city, state_region, postal_code, country_code, timezone, latitude, longitude, ownership_entity_name, owner_contact_name, owner_contact_email, owner_contact_phone, cover_image_url, metadata, created_at, updated_at, archived_at, deleted_at"
    )
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (pagination?.limit !== undefined) {
    const from = pagination.offset ?? 0;
    query = query.range(from, from + pagination.limit - 1);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const propertyRows = (data ?? []) as PropertyRow[];
  const unitCounts = await getUnitCountsByPropertyId(organizationId, propertyRows.map((row) => row.id), supabase);
  return propertyRows.map((row) => ({
    ...toPropertyRecord(row),
    unitCount: unitCounts.get(row.id) ?? 0
  }));
}

export async function getPropertyForOrganization(
  organizationId: string,
  propertyId: string,
  client?: SupabaseClientType
): Promise<PropertyRecord | null> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("properties")
    .select(
      "id, organization_id, name, code, property_type, status, description, address_line_1, address_line_2, city, state_region, postal_code, country_code, timezone, latitude, longitude, ownership_entity_name, owner_contact_name, owner_contact_email, owner_contact_phone, cover_image_url, metadata, created_at, updated_at, archived_at, deleted_at"
    )
    .eq("organization_id", organizationId)
    .eq("id", propertyId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    return null;
  }
  return toPropertyRecord(data as PropertyRow);
}

export async function createProperty(
  organizationId: string,
  userId: string,
  input: CreatePropertyInput,
  client?: SupabaseClientType
): Promise<PropertyRecord> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("properties")
    .insert({
      organization_id: organizationId,
      name: input.name,
      code: input.code,
      property_type: input.propertyType,
      status: input.status,
      description: input.description,
      address_line_1: input.addressLine1,
      address_line_2: input.addressLine2,
      city: input.city,
      state_region: input.stateRegion,
      postal_code: input.postalCode,
      country_code: input.countryCode,
      timezone: input.timezone,
      latitude: input.latitude,
      longitude: input.longitude,
      ownership_entity_name: input.ownershipEntityName,
      owner_contact_name: input.ownerContactName,
      owner_contact_email: input.ownerContactEmail,
      owner_contact_phone: input.ownerContactPhone,
      cover_image_url: input.coverImageUrl,
      metadata: input.metadata as Json,
      created_by: userId,
      updated_by: userId
    })
    .select(
      "id, organization_id, name, code, property_type, status, description, address_line_1, address_line_2, city, state_region, postal_code, country_code, timezone, latitude, longitude, ownership_entity_name, owner_contact_name, owner_contact_email, owner_contact_phone, cover_image_url, metadata, created_at, updated_at, archived_at, deleted_at"
    )
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Property creation failed");
  }

  return toPropertyRecord(data as PropertyRow);
}

export async function updateProperty(
  organizationId: string,
  propertyId: string,
  userId: string,
  updates: UpdatePropertyInput,
  client?: SupabaseClientType
): Promise<PropertyRecord | null> {
  const supabase = await resolveClient(client);
  const patch: PropertyUpdate = { updated_by: userId };
  if (updates.name !== undefined) patch.name = updates.name;
  if (updates.code !== undefined) patch.code = updates.code;
  if (updates.propertyType !== undefined) patch.property_type = updates.propertyType;
  if (updates.status !== undefined) patch.status = updates.status;
  if (updates.description !== undefined) patch.description = updates.description;
  if (updates.addressLine1 !== undefined) patch.address_line_1 = updates.addressLine1;
  if (updates.addressLine2 !== undefined) patch.address_line_2 = updates.addressLine2;
  if (updates.city !== undefined) patch.city = updates.city;
  if (updates.stateRegion !== undefined) patch.state_region = updates.stateRegion;
  if (updates.postalCode !== undefined) patch.postal_code = updates.postalCode;
  if (updates.countryCode !== undefined) patch.country_code = updates.countryCode;
  if (updates.timezone !== undefined) patch.timezone = updates.timezone;
  if (updates.latitude !== undefined) patch.latitude = updates.latitude;
  if (updates.longitude !== undefined) patch.longitude = updates.longitude;
  if (updates.ownershipEntityName !== undefined) patch.ownership_entity_name = updates.ownershipEntityName;
  if (updates.ownerContactName !== undefined) patch.owner_contact_name = updates.ownerContactName;
  if (updates.ownerContactEmail !== undefined) patch.owner_contact_email = updates.ownerContactEmail;
  if (updates.ownerContactPhone !== undefined) patch.owner_contact_phone = updates.ownerContactPhone;
  if (updates.coverImageUrl !== undefined) patch.cover_image_url = updates.coverImageUrl;
  if (updates.metadata !== undefined) patch.metadata = updates.metadata as Json;

  const { data, error } = await supabase
    .from("properties")
    .update(patch)
    .eq("organization_id", organizationId)
    .eq("id", propertyId)
    .is("deleted_at", null)
    .select(
      "id, organization_id, name, code, property_type, status, description, address_line_1, address_line_2, city, state_region, postal_code, country_code, timezone, latitude, longitude, ownership_entity_name, owner_contact_name, owner_contact_email, owner_contact_phone, cover_image_url, metadata, created_at, updated_at, archived_at, deleted_at"
    )
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  return data ? toPropertyRecord(data as PropertyRow) : null;
}

export async function archiveProperty(
  organizationId: string,
  propertyId: string,
  userId: string,
  client?: SupabaseClientType
): Promise<PropertyRecord | null> {
  const supabase = await resolveClient(client);
  return updateProperty(organizationId, propertyId, userId, { status: "archived" }, supabase).then(async (updated) => {
    if (!updated) return null;
    const { data, error } = await supabase
      .from("properties")
      .update({
        archived_at: new Date().toISOString(),
        archived_by: userId,
        updated_by: userId
      })
      .eq("organization_id", organizationId)
      .eq("id", propertyId)
      .is("deleted_at", null)
      .select(
        "id, organization_id, name, code, property_type, status, description, address_line_1, address_line_2, city, state_region, postal_code, country_code, timezone, latitude, longitude, ownership_entity_name, owner_contact_name, owner_contact_email, owner_contact_phone, cover_image_url, metadata, created_at, updated_at, archived_at, deleted_at"
      )
      .maybeSingle();
    if (error) {
      throw new Error(error.message);
    }
    return data ? toPropertyRecord(data as PropertyRow) : null;
  });
}

export async function restoreProperty(
  organizationId: string,
  propertyId: string,
  userId: string,
  client?: SupabaseClientType
): Promise<PropertyRecord | null> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("properties")
    .update({
      status: "active",
      archived_at: null,
      archived_by: null,
      deleted_at: null,
      deleted_by: null,
      updated_by: userId
    })
    .eq("organization_id", organizationId)
    .eq("id", propertyId)
    .select(
      "id, organization_id, name, code, property_type, status, description, address_line_1, address_line_2, city, state_region, postal_code, country_code, timezone, latitude, longitude, ownership_entity_name, owner_contact_name, owner_contact_email, owner_contact_phone, cover_image_url, metadata, created_at, updated_at, archived_at, deleted_at"
    )
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return data ? toPropertyRecord(data as PropertyRow) : null;
}

export async function softDeleteProperty(
  organizationId: string,
  propertyId: string,
  userId: string,
  client?: SupabaseClientType
): Promise<PropertyRecord | null> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("properties")
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: userId,
      updated_by: userId,
      status: "archived"
    })
    .eq("organization_id", organizationId)
    .eq("id", propertyId)
    .is("deleted_at", null)
    .select(
      "id, organization_id, name, code, property_type, status, description, address_line_1, address_line_2, city, state_region, postal_code, country_code, timezone, latitude, longitude, ownership_entity_name, owner_contact_name, owner_contact_email, owner_contact_phone, cover_image_url, metadata, created_at, updated_at, archived_at, deleted_at"
    )
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  return data ? toPropertyRecord(data as PropertyRow) : null;
}

async function getUnitCountsByPropertyId(
  organizationId: string,
  propertyIds: string[],
  client?: SupabaseClientType
): Promise<Map<string, number>> {
  if (propertyIds.length === 0) {
    return new Map();
  }

  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("units")
    .select("property_id")
    .eq("organization_id", organizationId)
    .in("property_id", propertyIds)
    .is("deleted_at", null);

  if (error) {
    throw new Error(error.message);
  }

  const counts = new Map<string, number>();
  ((data ?? []) as Array<{ property_id: string }>).forEach((row) => {
    counts.set(row.property_id, (counts.get(row.property_id) ?? 0) + 1);
  });
  return counts;
}

function toPropertyRecord(row: PropertyRow): PropertyRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    code: row.code,
    propertyType: row.property_type,
    status: row.status,
    description: row.description,
    addressLine1: row.address_line_1,
    addressLine2: row.address_line_2,
    city: row.city,
    stateRegion: row.state_region,
    postalCode: row.postal_code,
    countryCode: row.country_code,
    timezone: row.timezone,
    latitude: row.latitude,
    longitude: row.longitude,
    ownershipEntityName: row.ownership_entity_name,
    ownerContactName: row.owner_contact_name,
    ownerContactEmail: row.owner_contact_email,
    ownerContactPhone: row.owner_contact_phone,
    coverImageUrl: row.cover_image_url,
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
