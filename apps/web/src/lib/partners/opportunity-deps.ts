import { NextResponse } from "next/server";
import { isManagerClassRole, type WorkOrderCategory } from "@mpa/shared";
import { requireAuthorizedAction } from "../auth/require-authorized-action";
import { createServiceRoleClient } from "../supabase/service-role";
import { sendOperationalNoticeEmail } from "../communications/email";
import { createFacilityWorkOrder, createStaffResidentialWorkOrder, getWorkOrder } from "../maintenance/maintenance-service";
import { loadPartnerDeps } from "./runtime";
import { getMemoryPartnerOpportunityStore } from "./opportunity-store";
import { createSupabasePartnerOpportunityStore } from "./opportunity-supabase";
import { getMemoryPartnerPropertyPortalStore, getMemoryPropertyCatalog } from "./property-portal-store";
import { createSupabasePartnerPropertyPortalStore, createSupabasePropertyCatalog } from "./property-portal-supabase";
import { notifyPartnerStaff } from "./partner-notifications";
import type { OpportunityServiceDeps } from "./opportunity-service";

let cached: OpportunityServiceDeps | null = null;

async function listOrgManagers(organizationId: string): Promise<Array<{ userId: string; email: string | null }>> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("organization_memberships")
    .select("user_id, roles")
    .eq("organization_id", organizationId)
    .eq("status", "active");
  const managers = (data ?? [])
    .filter((row) => isManagerClassRole((row.roles as string[]) ?? []))
    .map((row) => String(row.user_id));
  const unique = Array.from(new Set(managers));
  const resolved: Array<{ userId: string; email: string | null }> = [];
  for (const userId of unique) {
    try {
      const { data: userData } = await supabase.auth.admin.getUserById(userId);
      resolved.push({ userId, email: userData.user?.email ?? null });
    } catch {
      resolved.push({ userId, email: null });
    }
  }
  return resolved;
}

export async function loadOpportunityDeps(): Promise<OpportunityServiceDeps & { durable: boolean }> {
  if (process.env["VITEST"]) {
    const partners = await loadPartnerDeps();
    const properties = getMemoryPropertyCatalog();
    const portals = getMemoryPartnerPropertyPortalStore();
    return {
      store: partners.store,
      opportunities: getMemoryPartnerOpportunityStore(),
      getProperty: (id) => properties.getProperty(id),
      listProperties: (organizationId) => properties.listProperties(organizationId),
      listPropertyPortalCount: async (partnerId) => (await portals.listPortals(partnerId)).length,
      durable: partners.durable
    };
  }
  if (cached) return { ...cached, durable: true };

  const partners = await loadPartnerDeps();
  let opportunities;
  let properties;
  let portals;
  let durable = partners.durable;
  try {
    opportunities = createSupabasePartnerOpportunityStore();
    properties = createSupabasePropertyCatalog();
    portals = createSupabasePartnerPropertyPortalStore();
  } catch {
    opportunities = getMemoryPartnerOpportunityStore();
    properties = getMemoryPropertyCatalog();
    portals = getMemoryPartnerPropertyPortalStore();
    durable = false;
  }

  const supabase = (() => {
    try {
      return createServiceRoleClient();
    } catch {
      return null;
    }
  })();

  cached = {
    store: partners.store,
    opportunities,
    getProperty: (id) => properties.getProperty(id),
    listProperties: (organizationId) => properties.listProperties(organizationId),
    listPropertyPortalCount: async (partnerId) => (await portals.listPortals(partnerId)).length,
    async getWorkOrder(organizationId, workOrderId) {
      if (!supabase) return null;
      const row = await getWorkOrder(supabase, organizationId, workOrderId);
      if (!row) return null;
      return {
        id: row.id,
        organizationId: row.organization_id,
        propertyId: row.property_id,
        title: row.title,
        description: row.description,
        category: row.category,
        priority: row.priority,
        workSurface: row.work_surface,
        facilityAssetLabel: row.facility_asset_label
      };
    },
    async createWorkOrder(input) {
      if (!supabase) throw new Error("Work-order conversion is unavailable.");
      const category = input.category as WorkOrderCategory;
      if (input.surface === "facility") {
        const created = await createFacilityWorkOrder(supabase, input.organizationId, input.actorUserId, {
          title: input.title,
          description: input.description,
          category,
          priority: input.priority,
          propertyId: input.propertyId,
          ...(input.locationLabel ? { facilityAssetLabel: input.locationLabel } : {})
        });
        return { id: created.id, workSurface: "facility" };
      }
      const created = await createStaffResidentialWorkOrder(supabase, input.organizationId, input.actorUserId, {
        title: input.title,
        description: input.description,
        category,
        priority: input.priority,
        propertyId: input.propertyId
      });
      return { id: created.id, workSurface: "residential" };
    },
    async notifyPartnerEvent(input) {
      await notifyPartnerStaff({
        organizationId: input.organizationId,
        partnerName: input.partnerName,
        kind: input.kind === "opportunity_routed" ? "opportunity_routed" : "ready",
        title: input.title,
        body: input.body,
        href: input.href
      });
    },
    async notifyCustomerEvent(input) {
      if (!supabase) return;
      const managers = await listOrgManagers(input.organizationId);
      for (const manager of managers) {
        await supabase.from("comms_notifications").insert({
          organization_id: input.organizationId,
          user_id: manager.userId,
          notification_key: `partner.${input.kind}`,
          title: input.title,
          body: input.body,
          href: input.href
        });
        if (manager.email && (input.kind === "opportunity_interested" || input.kind === "opportunity_selected")) {
          await sendOperationalNoticeEmail({
            to: manager.email,
            subject: input.title,
            body: input.body,
            audienceLabel: "organization staff",
            ctaUrl: input.href,
            ctaLabel: "Open service network",
            idempotencyKey: `partner-opportunity:${input.kind}:${input.organizationId}:${manager.userId}`.slice(0, 256)
          });
        }
      }
    }
  };
  return { ...cached, durable };
}

export function resetOpportunityDepsCache() {
  cached = null;
}

export async function requireServiceNetworkRead(surface: "residential" | "facility") {
  return requireAuthorizedAction({
    capability: "pm.maintenance:read",
    entitlement: surface === "facility" ? "facility.operations" : "pm.maintenance"
  });
}

export async function requireServiceNetworkWrite(surface: "residential" | "facility") {
  const auth = await requireAuthorizedAction({
    capability: "pm.maintenance:write",
    entitlement: surface === "facility" ? "facility.operations" : "pm.maintenance"
  });
  if ("error" in auth) return auth;
  if (!isManagerClassRole(auth.roles)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return auth;
}
