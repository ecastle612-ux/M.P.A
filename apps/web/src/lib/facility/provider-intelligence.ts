import { createAuthServerComponentClient } from "../auth/server";
import { getVaultDocumentsForEntity } from "../vault/server";
import { listFacilityRecords } from "./server";
import { listFacilityTimelineEvents } from "./timeline";
import type { ServiceProviderIntelligence } from "./contracts";

type SupabaseClientType = Awaited<ReturnType<typeof createAuthServerComponentClient>>;

async function resolveClient(client?: SupabaseClientType): Promise<SupabaseClientType> {
  return client ?? (await createAuthServerComponentClient());
}

/**
 * Computed Service Provider Intelligence over the Vendor bridge.
 * No ratings, no AI, no workflow redesign.
 */
export async function getServiceProviderIntelligence(
  organizationId: string,
  vendorId: string,
  client?: SupabaseClientType
): Promise<ServiceProviderIntelligence | null> {
  const supabase = await resolveClient(client);

  const { data: vendor, error: vendorError } = await supabase
    .from("vendors")
    .select("id, business_name, email, phone, status")
    .eq("organization_id", organizationId)
    .eq("id", vendorId)
    .is("deleted_at", null)
    .maybeSingle();

  if (vendorError) throw new Error(vendorError.message);
  if (!vendor) return null;

  const { data: assignments, error: assignmentError } = await supabase
    .from("maintenance_vendor_assignments")
    .select("id, work_order_id, assignment_status, assigned_at, completed_at, is_current")
    .eq("organization_id", organizationId)
    .eq("vendor_id", vendorId)
    .order("assigned_at", { ascending: false });

  if (assignmentError) throw new Error(assignmentError.message);

  const rows = (assignments ?? []) as Array<{
    id: string;
    work_order_id: string;
    assignment_status: string;
    assigned_at: string;
    completed_at: string | null;
    is_current: boolean;
  }>;

  const jobsCompleted = rows.filter((row) => row.assignment_status === "completed").length;
  const jobsOpen = rows.filter(
    (row) =>
      row.is_current &&
      row.assignment_status !== "completed" &&
      row.assignment_status !== "cancelled"
  ).length;

  const completionDurations = rows
    .filter((row) => row.completed_at)
    .map((row) => {
      const start = new Date(row.assigned_at).getTime();
      const end = new Date(row.completed_at as string).getTime();
      return (end - start) / (1000 * 60 * 60);
    })
    .filter((hours) => Number.isFinite(hours) && hours >= 0);

  const averageCompletionHours =
    completionDurations.length > 0
      ? Math.round(
          (completionDurations.reduce((sum, hours) => sum + hours, 0) / completionDurations.length) *
            10
        ) / 10
      : null;

  const [recentRepairs, timeline, vaultDocs] = await Promise.all([
    listFacilityRecords(organizationId, { vendorId, limit: 12 }, supabase),
    listFacilityTimelineEvents(organizationId, { vendorId, limit: 20 }, supabase),
    getVaultDocumentsForEntity(organizationId, "vendor", vendorId, supabase)
  ]);

  const propertyMap = new Map<string, string>();
  const unitMap = new Map<string, { id: string; unitNumber: string; propertyId: string }>();
  const issueKeys = new Map<string, number>();

  for (const repair of recentRepairs) {
    if (repair.propertyId && repair.propertyName) {
      propertyMap.set(repair.propertyId, repair.propertyName);
    }
    if (repair.unitId && repair.unitNumber) {
      unitMap.set(repair.unitId, {
        id: repair.unitId,
        unitNumber: repair.unitNumber,
        propertyId: repair.propertyId
      });
    }
    const key = `${repair.propertyId}:${repair.unitId ?? "property"}:${repair.issue
      .trim()
      .toLowerCase()}`;
    issueKeys.set(key, (issueKeys.get(key) ?? 0) + 1);
  }

  let repeatRepairCount = 0;
  for (const count of issueKeys.values()) {
    if (count > 1) repeatRepairCount += count - 1;
  }

  const warrantyPlaceholderCount = recentRepairs.filter((repair) =>
    Boolean(repair.warrantyPlaceholder)
  ).length;

  return {
    vendorId,
    displayName: (vendor as { business_name: string }).business_name,
    providerType: "vendor",
    contactEmail: (vendor as { email: string | null }).email,
    contactPhone: (vendor as { phone: string | null }).phone,
    jobsCompleted,
    jobsOpen,
    averageCompletionHours,
    lastAssignmentAt: rows[0]?.assigned_at ?? null,
    propertiesServed: Array.from(propertyMap.entries()).map(([id, name]) => ({ id, name })),
    unitsServed: Array.from(unitMap.values()),
    repeatRepairCount,
    recentRepairs,
    timeline,
    documentCount: vaultDocs.length,
    warrantyPlaceholderCount,
    futureHooks: {
      ratings: "planned",
      aiRecommendations: "planned",
      preventiveMaintenance: "planned",
      assetPassport: "planned",
      propertyHealth: "planned",
      capitalPlanning: "planned",
      compliance: "planned"
    }
  };
}
