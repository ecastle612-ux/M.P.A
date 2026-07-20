import type { SupabaseClient } from "@supabase/supabase-js";

export type MasterAdminHealthCheck = {
  table: string;
  ok: boolean;
  count: number | null;
  error: string | null;
};

async function countTable(
  client: SupabaseClient,
  table: string,
  organizationId: string
): Promise<MasterAdminHealthCheck> {
  const { count, error } = await client
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  if (error) {
    return { table, ok: false, count: null, error: error.message };
  }

  return { table, ok: true, count: count ?? 0, error: null };
}

export async function getMasterAdminHealthChecks(
  client: SupabaseClient,
  organizationId: string
): Promise<MasterAdminHealthCheck[]> {
  const tables = [
    "organizations",
    "properties",
    "units",
    "tenants",
    "leases",
    "maintenance_work_orders",
    "vendors"
  ] as const;

  const results: MasterAdminHealthCheck[] = [];

  for (const table of tables) {
    if (table === "organizations") {
      const { count, error } = await client
        .from("organizations")
        .select("id", { count: "exact", head: true })
        .eq("id", organizationId);
      results.push(
        error
          ? { table, ok: false, count: null, error: error.message }
          : { table, ok: true, count: count ?? 0, error: null }
      );
      continue;
    }
    results.push(await countTable(client, table, organizationId));
  }

  return results;
}
