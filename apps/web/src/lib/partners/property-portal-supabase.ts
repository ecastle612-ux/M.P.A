import { createServiceRoleClient } from "../supabase/service-role";
import type {
  CanonicalPropertyRecord,
  PartnerPropertyPortal,
  PartnerPropertyPortalStore,
  PropertyCatalog
} from "./property-portal-types";

type Db = ReturnType<typeof createServiceRoleClient>;

function mapPortal(row: Record<string, unknown>): PartnerPropertyPortal {
  return {
    id: String(row["id"]),
    partnerId: String(row["partner_id"]),
    organizationId: String(row["organization_id"]),
    propertyId: String(row["property_id"]),
    publicSlug: String(row["public_slug"] ?? ""),
    enabled: Boolean(row["enabled"]),
    publicDisplayName: typeof row["public_display_name"] === "string" ? row["public_display_name"] : null,
    publicInstructions: typeof row["public_instructions"] === "string" ? row["public_instructions"] : null,
    createdAt: String(row["created_at"] ?? new Date().toISOString()),
    updatedAt: String(row["updated_at"] ?? new Date().toISOString())
  };
}

function portalColumns(row: PartnerPropertyPortal): Record<string, unknown> {
  return {
    id: row.id,
    partner_id: row.partnerId,
    organization_id: row.organizationId,
    property_id: row.propertyId,
    public_slug: row.publicSlug,
    enabled: row.enabled,
    public_display_name: row.publicDisplayName,
    public_instructions: row.publicInstructions,
    created_at: row.createdAt,
    updated_at: row.updatedAt
  };
}

function mapProperty(row: Record<string, unknown>): CanonicalPropertyRecord {
  return {
    id: String(row["id"]),
    organizationId: String(row["organization_id"]),
    name: String(row["name"] ?? ""),
    addressLine1: typeof row["address_line1"] === "string" ? row["address_line1"] : null,
    city: typeof row["city"] === "string" ? row["city"] : null,
    region: typeof row["region"] === "string" ? row["region"] : null,
    postalCode: typeof row["postal_code"] === "string" ? row["postal_code"] : null,
    status: typeof row["status"] === "string" ? row["status"] : null
  };
}

export class SupabasePartnerPropertyPortalStore implements PartnerPropertyPortalStore {
  constructor(private readonly db: Db) {}

  async insertPortal(row: PartnerPropertyPortal): Promise<PartnerPropertyPortal> {
    const { error } = await this.db.from("platform_partner_property_portals").insert(portalColumns(row));
    if (error) throw new Error(error.message);
    return row;
  }

  async updatePortal(row: PartnerPropertyPortal): Promise<PartnerPropertyPortal> {
    const { error } = await this.db
      .from("platform_partner_property_portals")
      .update(portalColumns(row))
      .eq("id", row.id);
    if (error) throw new Error(error.message);
    return row;
  }

  async getPortal(id: string): Promise<PartnerPropertyPortal | null> {
    const { data, error } = await this.db
      .from("platform_partner_property_portals")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return mapPortal(data as Record<string, unknown>);
  }

  async getPortalByPartnerAndSlug(partnerId: string, slug: string): Promise<PartnerPropertyPortal | null> {
    const { data, error } = await this.db
      .from("platform_partner_property_portals")
      .select("*")
      .eq("partner_id", partnerId)
      .ilike("public_slug", slug)
      .maybeSingle();
    if (error || !data) return null;
    return mapPortal(data as Record<string, unknown>);
  }

  async getPortalByPartnerAndProperty(partnerId: string, propertyId: string): Promise<PartnerPropertyPortal | null> {
    const { data, error } = await this.db
      .from("platform_partner_property_portals")
      .select("*")
      .eq("partner_id", partnerId)
      .eq("property_id", propertyId)
      .maybeSingle();
    if (error || !data) return null;
    return mapPortal(data as Record<string, unknown>);
  }

  async listPortals(partnerId: string): Promise<PartnerPropertyPortal[]> {
    const { data, error } = await this.db
      .from("platform_partner_property_portals")
      .select("*")
      .eq("partner_id", partnerId)
      .order("public_slug", { ascending: true });
    if (error || !data) return [];
    return data.map((row) => mapPortal(row as Record<string, unknown>));
  }
}

export class SupabasePropertyCatalog implements PropertyCatalog {
  constructor(private readonly db: Db) {}

  async getProperty(id: string): Promise<CanonicalPropertyRecord | null> {
    const { data, error } = await this.db
      .from("property_properties")
      .select("id, organization_id, name, address_line1, city, region, postal_code, status")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return mapProperty(data as Record<string, unknown>);
  }

  async listProperties(organizationId: string): Promise<CanonicalPropertyRecord[]> {
    const { data, error } = await this.db
      .from("property_properties")
      .select("id, organization_id, name, address_line1, city, region, postal_code, status")
      .eq("organization_id", organizationId)
      .order("name");
    if (error || !data) return [];
    return data.map((row) => mapProperty(row as Record<string, unknown>));
  }
}

export function createSupabasePartnerPropertyPortalStore(): PartnerPropertyPortalStore {
  return new SupabasePartnerPropertyPortalStore(createServiceRoleClient());
}

export function createSupabasePropertyCatalog(): PropertyCatalog {
  return new SupabasePropertyCatalog(createServiceRoleClient());
}
