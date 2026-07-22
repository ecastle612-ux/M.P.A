import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@mpa/supabase";

export type SaasUsageSnapshot = {
  organizations: number;
  properties: number;
  units: number;
  residents: number;
  storage: string;
  aiUsage: string;
  apiUsage: string;
  planLimitsNote: string;
};

export async function getOrgUsageSnapshot(
  organizationId: string,
  client: SupabaseClient<Database>
): Promise<SaasUsageSnapshot> {
  const [properties, units, tenants] = await Promise.all([
    client
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId),
    client.from("units").select("id", { count: "exact", head: true }).eq("organization_id", organizationId),
    client.from("tenants").select("id", { count: "exact", head: true }).eq("organization_id", organizationId)
  ]);

  return {
    organizations: 1,
    properties: properties.count ?? 0,
    units: units.count ?? 0,
    residents: tenants.count ?? 0,
    storage: "—",
    aiUsage: "—",
    apiUsage: "—",
    planLimitsNote: "Usage tracking enabled. Enforcement coming in a future release."
  };
}
