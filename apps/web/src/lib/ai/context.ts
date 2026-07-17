import { createAuthServerComponentClient } from "../auth/server";
import { getDashboardSnapshot, type DashboardSnapshot } from "../dashboard/server";
import type { PortfolioContext } from "./provider-types";

type SupabaseClientType = Awaited<ReturnType<typeof createAuthServerComponentClient>>;

export async function buildPortfolioContext(
  organizationId: string,
  client?: SupabaseClientType
): Promise<PortfolioContext> {
  const supabase = client ?? (await createAuthServerComponentClient());
  const [snapshot, vacantUnitsResult] = await Promise.all([
    getDashboardSnapshot(organizationId, supabase),
    supabase
      .from("units")
      .select("id, unit_number, occupancy_status, properties(name)")
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .eq("status", "active")
      .in("occupancy_status", ["vacant_ready", "vacant_not_ready"])
      .order("updated_at", { ascending: false })
      .limit(20)
  ]);

  if (vacantUnitsResult.error) throw new Error(vacantUnitsResult.error.message);

  const vacantUnits = ((vacantUnitsResult.data ?? []) as Array<{
    id: string;
    unit_number: string;
    occupancy_status: string;
    properties: { name: string } | null;
  }>).map((row) => ({
    id: row.id,
    unitNumber: row.unit_number,
    propertyName: row.properties?.name ?? null,
    occupancyStatus: row.occupancy_status
  }));

  return {
    snapshot,
    vacantUnits,
    generatedAt: new Date().toISOString()
  };
}

export function formatOccupancySummary(snapshot: DashboardSnapshot): string {
  const pct = Math.round(snapshot.occupancyRate * 100);
  return `Portfolio has ${snapshot.propertiesTotal} propert${snapshot.propertiesTotal === 1 ? "y" : "ies"}, ${snapshot.unitsTotal} unit${snapshot.unitsTotal === 1 ? "" : "s"}, and ${pct}% occupancy (${snapshot.occupiedUnits} occupied, ${snapshot.vacanciesTotal} vacant).`;
}
