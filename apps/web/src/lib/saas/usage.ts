import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@mpa/supabase";
import { getEntitlementSnapshot } from "../auth/entitlements";
import {
  countOrganizationUsage,
  loadOrganizationEntitlementContext,
  subscriptionAllowsResourceCreates
} from "./entitlement-gate";

export type SaasUsageSnapshot = {
  organizations: number;
  properties: number;
  units: number;
  residents: number;
  seats: number;
  pendingInvites: number;
  maxProperties: number | null;
  maxUsers: number | null;
  planCode: string | null;
  canCreateResources: boolean;
  storage: string;
  aiUsage: string;
  apiUsage: string;
  planLimitsNote: string;
  propertiesDisplay: string;
  seatsDisplay: string;
  enforcementLabel: string;
};

export async function getOrgUsageSnapshot(
  organizationId: string,
  client: SupabaseClient<Database>
): Promise<SaasUsageSnapshot> {
  const [units, tenants, context, snapshot] = await Promise.all([
    client.from("units").select("id", { count: "exact", head: true }).eq("organization_id", organizationId),
    client.from("tenants").select("id", { count: "exact", head: true }).eq("organization_id", organizationId),
    loadOrganizationEntitlementContext(organizationId, client).catch(async () => {
      const usage = await countOrganizationUsage(organizationId, client).catch(() => ({
        properties: 0,
        activeSeats: 0,
        pendingInvites: 0,
        seatUsage: 0
      }));
      return {
        organizationId,
        snapshot: null,
        subscriptionStatus: null,
        commercialStatus: null,
        usage,
        canCreateResources: subscriptionAllowsResourceCreates(null)
      };
    }),
    getEntitlementSnapshot(organizationId, client).catch(() => null)
  ]);

  const limits = snapshot?.limits ?? context.snapshot?.limits ?? null;
  const maxProperties = limits?.maxProperties ?? null;
  const maxUsers = limits?.maxUsers ?? null;
  const properties = context.usage.properties;
  const seats = context.usage.seatUsage;
  const canCreate = context.canCreateResources;

  const propertiesDisplay =
    maxProperties != null ? `${properties} / ${maxProperties}` : String(properties);
  const seatsDisplay = maxUsers != null ? `${seats} / ${maxUsers}` : String(seats);

  let planLimitsNote =
    "Seat and property limits are enforced on create. Upgrade in Billing if you need more capacity.";
  if (!snapshot && !context.snapshot) {
    planLimitsNote =
      "No entitlement snapshot yet. Complete checkout or provisioning before creating properties or inviting seats.";
  } else if (!canCreate) {
    planLimitsNote =
      "Subscription is not in good standing for new creates. Update billing to restore property and seat capacity.";
  }

  return {
    organizations: 1,
    properties,
    units: units.count ?? 0,
    residents: tenants.count ?? 0,
    seats,
    pendingInvites: context.usage.pendingInvites,
    maxProperties,
    maxUsers,
    planCode: snapshot?.planCode ?? context.snapshot?.planCode ?? null,
    canCreateResources: canCreate,
    storage: limits ? `${limits.storageGb} GB included` : "—",
    aiUsage: limits?.aiUsage ?? "—",
    apiUsage: "—",
    planLimitsNote,
    propertiesDisplay,
    seatsDisplay,
    enforcementLabel: canCreate ? "Enforced" : "Creates blocked"
  };
}
