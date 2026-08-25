import { createServiceRoleClient } from "../supabase/service-role";
import type {
  PartnerOpportunityEvent,
  PartnerOpportunityRoute,
  PartnerOpportunityStore,
  PartnerServiceOpportunity,
  PartnerUnmetDemand
} from "./opportunity-types";

type Db = ReturnType<typeof createServiceRoleClient>;

function mapOpportunity(row: Record<string, unknown>): PartnerServiceOpportunity {
  return {
    id: String(row["id"]),
    organizationId: String(row["organization_id"]),
    requestedByUserId: String(row["requested_by_user_id"]),
    propertyId: String(row["property_id"]),
    unitLabel: typeof row["unit_label"] === "string" ? row["unit_label"] : null,
    workOrderId: typeof row["work_order_id"] === "string" ? row["work_order_id"] : null,
    propertyType: row["property_type"] === "facility" ? "facility" : "residential",
    category: row["category"] as PartnerServiceOpportunity["category"],
    description: String(row["description"] ?? ""),
    urgency: row["urgency"] as PartnerServiceOpportunity["urgency"],
    preferredTiming: typeof row["preferred_timing"] === "string" ? row["preferred_timing"] : null,
    city: typeof row["city"] === "string" ? row["city"] : null,
    region: typeof row["region"] === "string" ? row["region"] : null,
    postalCode: typeof row["postal_code"] === "string" ? row["postal_code"] : null,
    status: row["status"] as PartnerServiceOpportunity["status"],
    selectedPartnerId: typeof row["selected_partner_id"] === "string" ? row["selected_partner_id"] : null,
    selectedBy: typeof row["selected_by"] === "string" ? row["selected_by"] : null,
    selectedAt: typeof row["selected_at"] === "string" ? row["selected_at"] : null,
    closeReason: (row["close_reason"] as PartnerServiceOpportunity["closeReason"]) ?? null,
    expiresAt: String(row["expires_at"]),
    createdAt: String(row["created_at"]),
    updatedAt: String(row["updated_at"])
  };
}

function opportunityColumns(row: PartnerServiceOpportunity): Record<string, unknown> {
  return {
    id: row.id,
    organization_id: row.organizationId,
    requested_by_user_id: row.requestedByUserId,
    property_id: row.propertyId,
    unit_label: row.unitLabel,
    work_order_id: row.workOrderId,
    property_type: row.propertyType,
    category: row.category,
    description: row.description,
    urgency: row.urgency,
    preferred_timing: row.preferredTiming,
    city: row.city,
    region: row.region,
    postal_code: row.postalCode,
    status: row.status,
    selected_partner_id: row.selectedPartnerId,
    selected_by: row.selectedBy,
    selected_at: row.selectedAt,
    close_reason: row.closeReason,
    expires_at: row.expiresAt,
    created_at: row.createdAt,
    updated_at: row.updatedAt
  };
}

function mapRoute(row: Record<string, unknown>): PartnerOpportunityRoute {
  return {
    id: String(row["id"]),
    opportunityId: String(row["opportunity_id"]),
    partnerId: String(row["partner_id"]),
    routedAt: String(row["routed_at"]),
    viewedAt: typeof row["viewed_at"] === "string" ? row["viewed_at"] : null,
    response: (row["response"] as PartnerOpportunityRoute["response"]) ?? null,
    responseAt: typeof row["response_at"] === "string" ? row["response_at"] : null,
    declineReason: (row["decline_reason"] as PartnerOpportunityRoute["declineReason"]) ?? null,
    selected: Boolean(row["selected"]),
    createdAt: String(row["created_at"]),
    updatedAt: String(row["updated_at"])
  };
}

function routeColumns(row: PartnerOpportunityRoute): Record<string, unknown> {
  return {
    id: row.id,
    opportunity_id: row.opportunityId,
    partner_id: row.partnerId,
    routed_at: row.routedAt,
    viewed_at: row.viewedAt,
    response: row.response,
    response_at: row.responseAt,
    decline_reason: row.declineReason,
    selected: row.selected,
    created_at: row.createdAt,
    updated_at: row.updatedAt
  };
}

export function createSupabasePartnerOpportunityStore(): PartnerOpportunityStore {
  const db: Db = createServiceRoleClient();
  return {
    async insertOpportunity(row) {
      const { data, error } = await db
        .from("platform_partner_service_opportunities")
        .insert(opportunityColumns(row))
        .select("*")
        .single();
      if (error || !data) throw new Error(error?.message ?? "Failed to create opportunity.");
      return mapOpportunity(data);
    },
    async updateOpportunity(row) {
      const { data, error } = await db
        .from("platform_partner_service_opportunities")
        .update(opportunityColumns(row))
        .eq("id", row.id)
        .select("*")
        .single();
      if (error || !data) throw new Error(error?.message ?? "Failed to update opportunity.");
      return mapOpportunity(data);
    },
    async getOpportunity(id) {
      const { data, error } = await db
        .from("platform_partner_service_opportunities")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data ? mapOpportunity(data) : null;
    },
    async listOpportunities(organizationId) {
      let query = db.from("platform_partner_service_opportunities").select("*").order("created_at", { ascending: false });
      if (organizationId) query = query.eq("organization_id", organizationId);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return (data ?? []).map(mapOpportunity);
    },
    async listOpenForWorkOrder(organizationId, workOrderId) {
      const { data, error } = await db
        .from("platform_partner_service_opportunities")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("work_order_id", workOrderId)
        .in("status", ["open", "routed", "partner_interested"]);
      if (error) throw new Error(error.message);
      return (data ?? []).map(mapOpportunity);
    },
    async insertRoute(row) {
      const { data, error } = await db
        .from("platform_partner_opportunity_routes")
        .insert(routeColumns(row))
        .select("*")
        .single();
      if (error || !data) throw new Error(error?.message ?? "Failed to route opportunity.");
      return mapRoute(data);
    },
    async updateRoute(row) {
      const { data, error } = await db
        .from("platform_partner_opportunity_routes")
        .update(routeColumns(row))
        .eq("id", row.id)
        .select("*")
        .single();
      if (error || !data) throw new Error(error?.message ?? "Failed to update route.");
      return mapRoute(data);
    },
    async getRoute(id) {
      const { data, error } = await db.from("platform_partner_opportunity_routes").select("*").eq("id", id).maybeSingle();
      if (error) throw new Error(error.message);
      return data ? mapRoute(data) : null;
    },
    async listRoutes(opportunityId) {
      const { data, error } = await db
        .from("platform_partner_opportunity_routes")
        .select("*")
        .eq("opportunity_id", opportunityId)
        .order("routed_at", { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []).map(mapRoute);
    },
    async listRoutesForPartner(partnerId) {
      const { data, error } = await db
        .from("platform_partner_opportunity_routes")
        .select("*")
        .eq("partner_id", partnerId)
        .order("routed_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []).map(mapRoute);
    },
    async insertEvent(row) {
      const { error } = await db.from("platform_partner_opportunity_events").insert({
        id: row.id,
        opportunity_id: row.opportunityId,
        partner_id: row.partnerId,
        action: row.action,
        actor_user_id: row.actorUserId,
        payload: row.payload,
        created_at: row.createdAt
      });
      if (error) throw new Error(error.message);
    },
    async listEvents(opportunityId) {
      const { data, error } = await db
        .from("platform_partner_opportunity_events")
        .select("*")
        .eq("opportunity_id", opportunityId)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => ({
        id: String(row["id"]),
        opportunityId: String(row["opportunity_id"]),
        partnerId: typeof row["partner_id"] === "string" ? row["partner_id"] : null,
        action: String(row["action"] ?? ""),
        actorUserId: typeof row["actor_user_id"] === "string" ? row["actor_user_id"] : null,
        payload:
          row["payload"] && typeof row["payload"] === "object" ? (row["payload"] as Record<string, unknown>) : {},
        createdAt: String(row["created_at"])
      }));
    },
    async insertUnmetDemand(row) {
      const { error } = await db.from("platform_partner_unmet_demand").insert({
        id: row.id,
        service_category: row.serviceCategory,
        city: row.city,
        region: row.region,
        created_at: row.createdAt
      });
      if (error) throw new Error(error.message);
    },
    async listUnmetDemand() {
      const { data, error } = await db
        .from("platform_partner_unmet_demand")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => ({
        id: String(row["id"]),
        serviceCategory: row["service_category"] as PartnerUnmetDemand["serviceCategory"],
        city: typeof row["city"] === "string" ? row["city"] : null,
        region: typeof row["region"] === "string" ? row["region"] : null,
        createdAt: String(row["created_at"])
      }));
    }
  };
}
