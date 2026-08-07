import type { SupabaseClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any>;

/**
 * Leaf readiness helper for LAUNCH journey J4.
 * Isolated from lease activation / SignWell / billing side effects.
 */
export async function getLeaseReadiness(supabase: Db, organizationId: string) {
  const { count, error } = await supabase
    .from("lease_agreements")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .in("status", ["signed", "active"]);
  if (error) {
    throw new Error(error.message);
  }
  const leaseCount = count ?? 0;
  return { leaseCount, leaseReady: leaseCount > 0 };
}
