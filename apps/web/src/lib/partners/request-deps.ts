import type { WorkOrderCategory } from "@mpa/shared";
import { createServiceRoleClient } from "../supabase/service-role";
import { sendOperationalNoticeEmail } from "../communications/email";
import { createFacilityWorkOrder, createStaffResidentialWorkOrder } from "../maintenance/maintenance-service";
import { loadPartnerDeps } from "./runtime";
import { getMemoryPartnerRequestStore } from "./request-store";
import { createSupabasePartnerRequestStore } from "./request-supabase";
import type { PartnerRequestServiceDeps } from "./request-service";

let cached: PartnerRequestServiceDeps | null = null;

async function listOrgManagers(organizationId: string): Promise<Array<{ userId: string; email: string | null }>> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("organization_memberships")
    .select("user_id, roles")
    .eq("organization_id", organizationId)
    .eq("status", "active");
  const managers = (data ?? [])
    .filter((row) => {
      const roles = (row.roles as string[]) ?? [];
      return roles.includes("organization_admin") || roles.includes("property_manager");
    })
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

export async function loadPartnerRequestDeps(): Promise<PartnerRequestServiceDeps & { durable: boolean }> {
  if (process.env["VITEST"]) {
    const partners = await loadPartnerDeps();
    return { store: partners.store, requests: getMemoryPartnerRequestStore(), durable: partners.durable };
  }
  if (cached) {
    return { ...cached, durable: true };
  }
  const partners = await loadPartnerDeps();
  let requests;
  let durable = partners.durable;
  try {
    requests = createSupabasePartnerRequestStore();
  } catch {
    requests = getMemoryPartnerRequestStore();
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
    requests,
    async notifyNewRequest(input) {
      if (!supabase) return;
      const managers = await listOrgManagers(input.organizationId);
      for (const manager of managers) {
        await supabase.from("comms_notifications").insert({
          organization_id: input.organizationId,
          user_id: manager.userId,
          notification_key: "partner.service_request.submitted",
          title: `New service request ${input.publicRef}`,
          body: `${input.partnerName} received a customer service request. Open Partner Services to review it.`,
          href: "/partner/services"
        });
        if (manager.email) {
          await sendOperationalNoticeEmail({
            to: manager.email,
            subject: `New service request ${input.publicRef}`,
            body: `${input.partnerName} received a customer service request. Review it in Partner Services. Do not treat this as an emergency dispatch.`,
            audienceLabel: "partner staff",
            ctaUrl: "/partner/services",
            ctaLabel: "Open Partner Services",
            idempotencyKey: `partner-request:${input.publicRef}:${manager.userId}`.slice(0, 256)
          });
        }
      }
    },
    async convertWorkOrder(input) {
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
    async rebindMedia(input) {
      if (!supabase) return;
      await supabase
        .from("media_attachments")
        .update({
          related_entity_type: "maintenance",
          related_entity_id: input.workOrderId,
          updated_at: new Date().toISOString()
        })
        .eq("organization_id", input.organizationId)
        .eq("related_entity_type", "partner_service_request")
        .eq("related_entity_id", input.requestId);
    },
    async attachMedia(input) {
      if (!supabase || input.mediaIds.length === 0) return 0;
      const { data } = await supabase
        .from("media_attachments")
        .update({
          related_entity_id: input.requestId,
          updated_at: new Date().toISOString()
        })
        .eq("organization_id", input.organizationId)
        .eq("related_entity_type", "partner_service_request")
        .in("id", input.mediaIds)
        .is("related_entity_id", null)
        .select("id");
      const attached = data?.length ?? 0;
      if (attached > 0) {
        await supabase
          .from("platform_partner_request_media_grants")
          .update({ request_id: input.requestId })
          .eq("organization_id", input.organizationId)
          .in("media_id", input.mediaIds);
      }
      return attached;
    }
  };
  return { ...cached, durable };
}

export function resetPartnerRequestDepsCache() {
  cached = null;
}
