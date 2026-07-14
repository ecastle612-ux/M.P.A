import { createAuthServerComponentClient } from "../auth/server";

export type DashboardTask = {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  href: string;
};

export type DashboardActivity = {
  id: string;
  type: "property" | "unit";
  title: string;
  timestamp: string;
  status: string;
};

export type DashboardSnapshot = {
  propertiesTotal: number;
  unitsTotal: number;
  occupiedUnits: number;
  tenantsTotal: number;
  occupancyRate: number;
  vacanciesTotal: number;
  expiringLeasesTotal: number;
  recentActivity: DashboardActivity[];
  upcomingTasks: DashboardTask[];
};

type SupabaseClientType = Awaited<ReturnType<typeof createAuthServerComponentClient>>;

export async function getDashboardSnapshot(
  organizationId: string,
  client?: SupabaseClientType
): Promise<DashboardSnapshot> {
  const supabase = await resolveClient(client);

  const [
    { count: propertiesTotal, error: propertiesCountError },
    { count: unitsTotalCount, error: unitsTotalError },
    { count: activeUnitsCount, error: activeUnitsError },
    { count: occupiedUnitsCount, error: occupiedUnitsError },
    { count: vacanciesTotalCount, error: vacanciesTotalError },
    { count: tenantsTotalCount, error: tenantsTotalError }
  ] = await Promise.all([
    supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .is("deleted_at", null),
    supabase
      .from("units")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .is("deleted_at", null),
    supabase
      .from("units")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .eq("status", "active"),
    supabase
      .from("units")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .eq("status", "active")
      .eq("occupancy_status", "occupied"),
    supabase
      .from("units")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .eq("status", "active")
      .in("occupancy_status", ["vacant_ready", "vacant_not_ready"]),
    supabase
      .from("tenants")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
  ]);

  if (propertiesCountError) {
    throw new Error(propertiesCountError.message);
  }
  if (unitsTotalError) {
    throw new Error(unitsTotalError.message);
  }
  if (activeUnitsError) {
    throw new Error(activeUnitsError.message);
  }
  if (occupiedUnitsError) {
    throw new Error(occupiedUnitsError.message);
  }
  if (vacanciesTotalError) {
    throw new Error(vacanciesTotalError.message);
  }
  if (tenantsTotalError) {
    throw new Error(tenantsTotalError.message);
  }

  const unitsTotal = unitsTotalCount ?? 0;
  const activeUnits = activeUnitsCount ?? 0;
  const occupiedUnits = occupiedUnitsCount ?? 0;
  const vacanciesTotal = vacanciesTotalCount ?? 0;
  const tenantsTotal = tenantsTotalCount ?? 0;
  const occupancyRate = activeUnits === 0 ? 0 : occupiedUnits / activeUnits;

  const recentActivity = await getRecentActivity(organizationId, supabase);
  const upcomingTasks = buildTasks({
    propertiesTotal: propertiesTotal ?? 0,
    unitsTotal,
    vacanciesTotal,
    occupancyRate
  });

  return {
    propertiesTotal: propertiesTotal ?? 0,
    unitsTotal,
    occupiedUnits,
    tenantsTotal,
    occupancyRate,
    vacanciesTotal,
    expiringLeasesTotal: 0,
    recentActivity,
    upcomingTasks
  };
}

async function getRecentActivity(
  organizationId: string,
  client?: SupabaseClientType
): Promise<DashboardActivity[]> {
  const supabase = await resolveClient(client);
  const [{ data: properties, error: propertiesError }, { data: units, error: unitsError }] = await Promise.all([
    supabase
      .from("properties")
      .select("id, name, updated_at, status")
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(6),
    supabase
      .from("units")
      .select("id, unit_number, updated_at, status")
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(6)
  ]);

  if (propertiesError) {
    throw new Error(propertiesError.message);
  }
  if (unitsError) {
    throw new Error(unitsError.message);
  }

  const propertyActivity = (
    (properties ?? []) as Array<{ id: string; name: string; updated_at: string; status: string }>
  ).map(
    (property): DashboardActivity => ({
      id: `property:${property.id}`,
      type: "property",
      title: property.name,
      timestamp: property.updated_at,
      status: property.status
    })
  );
  const unitActivity = ((units ?? []) as Array<{ id: string; unit_number: string; updated_at: string; status: string }>).map(
    (unit): DashboardActivity => ({
      id: `unit:${unit.id}`,
      type: "unit",
      title: `Unit ${unit.unit_number}`,
      timestamp: unit.updated_at,
      status: unit.status
    })
  );
  const activity: DashboardActivity[] = [...propertyActivity, ...unitActivity];

  return activity
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 8);
}

function buildTasks({
  propertiesTotal,
  unitsTotal,
  vacanciesTotal,
  occupancyRate
}: {
  propertiesTotal: number;
  unitsTotal: number;
  vacanciesTotal: number;
  occupancyRate: number;
}): DashboardTask[] {
  const tasks: DashboardTask[] = [];

  if (propertiesTotal === 0) {
    tasks.push({
      id: "create-first-property",
      title: "Create your first property",
      description: "Start your portfolio foundation by adding your first managed property.",
      priority: "high",
      href: "/properties/new"
    });
  }

  if (propertiesTotal > 0 && unitsTotal === 0) {
    tasks.push({
      id: "create-first-unit",
      title: "Add your first unit",
      description: "Define at least one unit to begin occupancy tracking and operational reporting.",
      priority: "high",
      href: "/units/new"
    });
  }

  if (vacanciesTotal > 0) {
    tasks.push({
      id: "review-vacancies",
      title: "Review vacant units",
      description: `There are ${vacanciesTotal} vacant units requiring leasing readiness review.`,
      priority: "medium",
      href: "/units"
    });
  }

  if (unitsTotal > 0 && occupancyRate < 0.8) {
    tasks.push({
      id: "improve-occupancy",
      title: "Improve occupancy coverage",
      description: "Occupancy is below 80%. Review unit statuses and readiness to reduce vacancy.",
      priority: "medium",
      href: "/units"
    });
  }

  if (tasks.length === 0) {
    tasks.push({
      id: "baseline-healthy",
      title: "Core foundation is healthy",
      description: "Properties and units are configured with no immediate setup blockers.",
      priority: "low",
      href: "/dashboard"
    });
  }

  return tasks;
}

async function resolveClient(client?: SupabaseClientType): Promise<SupabaseClientType> {
  return client ?? (await createAuthServerComponentClient());
}
