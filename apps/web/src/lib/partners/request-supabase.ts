import type { PartnerRequestEvent, PartnerRequestStore, PartnerServiceRequest } from "./request-types";
import { createServiceRoleClient } from "../supabase/service-role";

type Db = ReturnType<typeof createServiceRoleClient>;

function mapRequest(row: Record<string, unknown>): PartnerServiceRequest {
  return {
    id: String(row["id"]),
    partnerId: String(row["partner_id"]),
    organizationId: String(row["organization_id"]),
    publicRef: String(row["public_ref"]),
    statusTokenHash: typeof row["status_token_hash"] === "string" ? row["status_token_hash"] : null,
    slugSnapshot: String(row["slug_snapshot"] ?? ""),
    propertySlug: typeof row["property_slug"] === "string" ? row["property_slug"] : null,
    propertyPortalId: typeof row["property_portal_id"] === "string" ? row["property_portal_id"] : null,
    propertyId: typeof row["property_id"] === "string" ? row["property_id"] : null,
    intakeSource: row["intake_source"] === "property_portal" ? "property_portal" : "generic_portal",
    status: row["status"] as PartnerServiceRequest["status"],
    requesterName: String(row["requester_name"] ?? ""),
    requesterEmail: typeof row["requester_email"] === "string" ? row["requester_email"] : null,
    requesterPhone: typeof row["requester_phone"] === "string" ? row["requester_phone"] : null,
    propertyAddress: String(row["property_address"] ?? ""),
    unitLabel: typeof row["unit_label"] === "string" ? row["unit_label"] : null,
    category: row["category"] as PartnerServiceRequest["category"],
    description: String(row["description"] ?? ""),
    urgency: row["urgency"] as PartnerServiceRequest["urgency"],
    convertedWorkOrderId: typeof row["converted_work_order_id"] === "string" ? row["converted_work_order_id"] : null,
    convertedWorkSurface:
      row["converted_work_surface"] === "facility" || row["converted_work_surface"] === "residential"
        ? row["converted_work_surface"]
        : null,
    convertedBy: typeof row["converted_by"] === "string" ? row["converted_by"] : null,
    convertedAt: typeof row["converted_at"] === "string" ? row["converted_at"] : null,
    declinedReason: typeof row["declined_reason"] === "string" ? row["declined_reason"] : null,
    createdAt: String(row["created_at"] ?? new Date().toISOString()),
    updatedAt: String(row["updated_at"] ?? new Date().toISOString())
  };
}

function requestColumns(row: PartnerServiceRequest): Record<string, unknown> {
  return {
    id: row.id,
    partner_id: row.partnerId,
    organization_id: row.organizationId,
    public_ref: row.publicRef,
    status_token_hash: row.statusTokenHash,
    slug_snapshot: row.slugSnapshot,
    property_slug: row.propertySlug,
    property_portal_id: row.propertyPortalId,
    property_id: row.propertyId,
    intake_source: row.intakeSource,
    status: row.status,
    requester_name: row.requesterName,
    requester_email: row.requesterEmail,
    requester_phone: row.requesterPhone,
    property_address: row.propertyAddress,
    unit_label: row.unitLabel,
    category: row.category,
    description: row.description,
    urgency: row.urgency,
    converted_work_order_id: row.convertedWorkOrderId,
    converted_work_surface: row.convertedWorkSurface,
    converted_by: row.convertedBy,
    converted_at: row.convertedAt,
    declined_reason: row.declinedReason,
    created_at: row.createdAt,
    updated_at: row.updatedAt
  };
}

function mapEvent(row: Record<string, unknown>): PartnerRequestEvent {
  return {
    id: String(row["id"]),
    requestId: String(row["request_id"]),
    partnerId: String(row["partner_id"]),
    action: String(row["action"] ?? ""),
    actorUserId: typeof row["actor_user_id"] === "string" ? row["actor_user_id"] : null,
    payload:
      row["payload"] && typeof row["payload"] === "object" ? (row["payload"] as Record<string, unknown>) : {},
    createdAt: String(row["created_at"] ?? new Date().toISOString())
  };
}

export class SupabasePartnerRequestStore implements PartnerRequestStore {
  constructor(private readonly db: Db) {}

  async nextPublicRef(): Promise<string> {
    const year = new Date().getUTCFullYear();
    const { data, error } = await this.db.rpc("increment_partner_request_ref", { p_year: year });
    if (error || typeof data !== "number") {
      const { data: existing } = await this.db
        .from("platform_partner_request_ref_counters")
        .select("last_value")
        .eq("year", year)
        .maybeSingle();
      const next = Number(existing?.last_value ?? 0) + 1;
      await this.db.from("platform_partner_request_ref_counters").upsert({ year, last_value: next });
      return `PSR-${year}-${String(next).padStart(5, "0")}`;
    }
    return `PSR-${year}-${String(data).padStart(5, "0")}`;
  }

  async insertRequest(row: PartnerServiceRequest): Promise<PartnerServiceRequest> {
    const { error } = await this.db.from("platform_partner_service_requests").insert(requestColumns(row));
    if (error) throw new Error(error.message);
    return row;
  }

  async updateRequest(row: PartnerServiceRequest): Promise<PartnerServiceRequest> {
    const { error } = await this.db
      .from("platform_partner_service_requests")
      .update(requestColumns(row))
      .eq("id", row.id);
    if (error) throw new Error(error.message);
    return row;
  }

  async getRequest(id: string): Promise<PartnerServiceRequest | null> {
    const { data, error } = await this.db
      .from("platform_partner_service_requests")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return mapRequest(data as Record<string, unknown>);
  }

  async getRequestByStatusHash(hash: string): Promise<PartnerServiceRequest | null> {
    const { data, error } = await this.db
      .from("platform_partner_service_requests")
      .select("*")
      .eq("status_token_hash", hash)
      .maybeSingle();
    if (error || !data) return null;
    return mapRequest(data as Record<string, unknown>);
  }

  async listRequests(partnerId: string): Promise<PartnerServiceRequest[]> {
    const { data, error } = await this.db
      .from("platform_partner_service_requests")
      .select("*")
      .eq("partner_id", partnerId)
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return data.map((row) => mapRequest(row as Record<string, unknown>));
  }

  async listRequestSummaries(partnerId: string) {
    const { data, error } = await this.db
      .from("platform_partner_service_requests")
      .select("partner_id, property_portal_id, status, created_at")
      .eq("partner_id", partnerId);
    if (error || !data) return [];
    return data.map((row) => ({
      partnerId: String(row.partner_id),
      propertyPortalId: typeof row.property_portal_id === "string" ? row.property_portal_id : null,
      status: String(row.status ?? ""),
      createdAt: String(row.created_at ?? "")
    }));
  }

  async insertEvent(row: PartnerRequestEvent): Promise<void> {
    const { error } = await this.db.from("platform_partner_service_request_events").insert({
      id: row.id,
      request_id: row.requestId,
      partner_id: row.partnerId,
      action: row.action,
      actor_user_id: row.actorUserId,
      payload: row.payload,
      created_at: row.createdAt
    });
    if (error) throw new Error(error.message);
  }

  async listEvents(requestId: string): Promise<PartnerRequestEvent[]> {
    const { data, error } = await this.db
      .from("platform_partner_service_request_events")
      .select("*")
      .eq("request_id", requestId)
      .order("created_at", { ascending: true });
    if (error || !data) return [];
    return data.map((row) => mapEvent(row as Record<string, unknown>));
  }

  async countForPartner(partnerId: string): Promise<number> {
    const { count, error } = await this.db
      .from("platform_partner_service_requests")
      .select("id", { count: "exact", head: true })
      .eq("partner_id", partnerId);
    if (error) return 0;
    return count ?? 0;
  }
}

export function createSupabasePartnerRequestStore(): PartnerRequestStore {
  return new SupabasePartnerRequestStore(createServiceRoleClient());
}
